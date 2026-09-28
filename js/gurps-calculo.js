// js/gurps-calculo.js — cálculos de ficha do GURPS 4e a partir de data/gurps/regras.json.
// Funções puras: servem ao site (window.criarCalculo) e aos testes em Node (module.exports).
(function (root) {
  function criarCalculo(regras) {
    var ATRIBUTOS = {};
    regras.atributos.forEach(function (a) { ATRIBUTOS[a.id] = a; });
    var SECUNDARIAS = {};
    regras.secundarias.forEach(function (s) { SECUNDARIAS[s.id] = s; });
    var CUSTO = regras.custo_pericias;
    var NIVEIS_CARGA = regras.carga.niveis;

    function custoAtributo(id, valor) {
      var a = ATRIBUTOS[id];
      return (valor - a.base) * a.custo_por_nivel;
    }

    // Valores das secundárias: base vinda dos atributos, mais os ajustes comprados.
    function secundarias(atr, ajustes) {
      var aj = ajustes || {};
      var velocidade = (atr.ht + atr.dx) / 4 + (aj.velocidade || 0);
      return {
        pv: atr.st + (aj.pv || 0),
        vontade: atr.iq + (aj.vontade || 0),
        per: atr.iq + (aj.per || 0),
        pf: atr.ht + (aj.pf || 0),
        velocidade: velocidade,
        deslocamento: Math.floor(velocidade) + (aj.deslocamento || 0)
      };
    }

    function custoSecundaria(id, ajuste) {
      var s = SECUNDARIAS[id];
      return Math.round(ajuste / s.passo) * s.custo_por_passo;
    }

    // Faixa permitida numa campanha realista, em valores finais (não em ajustes).
    function limitesSecundaria(id, atr) {
      var s = SECUNDARIAS[id];
      var base = secundarias(atr)[id];
      var l = s.limite;
      if (l.tipo === 'percentual') {
        var folga = Math.floor(atr[l.de] * l.valor);
        return { min: base - folga, max: base + folga };
      }
      if (l.tipo === 'maximo') {
        return { min: l.reducao_maxima != null ? base - l.reducao_maxima : 1, max: l.valor };
      }
      return { min: base - l.valor, max: base + l.valor };
    }

    function esquiva(velocidade, nivelCarga) {
      var mod = nivelCarga ? NIVEIS_CARGA[nivelCarga].esquiva : 0;
      return Math.max(1, Math.floor(velocidade) + 3 + mod);
    }

    function baseDeCarga(st) {
      return Math.round((st * st) / 10 / 0.5) * 0.5;
    }

    // 0 a 4 como no livro; 5 = peso acima de 10×BC (não consegue se mover).
    function nivelDeCarga(st, peso) {
      var bc = baseDeCarga(st);
      for (var i = 0; i < NIVEIS_CARGA.length; i++) {
        if (peso <= NIVEIS_CARGA[i].peso_max_bc * bc) return NIVEIS_CARGA[i].nivel;
      }
      return NIVEIS_CARGA.length;
    }

    function deslocamentoComCarga(deslocamento, nivelCarga) {
      return Math.max(1, Math.floor(deslocamento * NIVEIS_CARGA[nivelCarga].deslocamento));
    }

    // nivelRelativo: NH desejado menos o atributo (ex.: DX+3 → 3). null se abaixo do mínimo comprável.
    function custoPericia(dificuldade, nivelRelativo) {
      var passo = nivelRelativo - CUSTO.nivel_relativo_minimo[dificuldade];
      if (passo < 0) return null;
      if (passo < CUSTO.custos.length) return CUSTO.custos[passo];
      var ultimo = CUSTO.custos[CUSTO.custos.length - 1];
      return ultimo + (passo - CUSTO.custos.length + 1) * CUSTO.acrescimo_por_nivel;
    }

    // Maior nível relativo que os pontos pagam; null se não pagam nem o primeiro.
    function nivelPorPontos(dificuldade, pontos) {
      var nivel = CUSTO.nivel_relativo_minimo[dificuldade];
      if (pontos < custoPericia(dificuldade, nivel)) return null;
      while (custoPericia(dificuldade, nivel + 1) <= pontos) nivel++;
      return nivel;
    }

    // Dano básico por ST (pág. 16). A tabela não é publicada: vem de data-local/gurps/tabela-dano.json.
    function danoBasico(st, tabela) {
      if (!tabela || !tabela.linhas || !tabela.linhas.length) return null;
      function somarDados(expr, extra) {
        if (!extra) return expr;
        var m = /^(\d+)d(.*)$/.exec(expr);
        return (parseInt(m[1], 10) + extra) + 'd' + m[2];
      }
      if (st > 100) {
        var topo = tabela.linhas.filter(function (l) { return l.st === 100; })[0];
        var extra = Math.floor((st - 100) / 10);
        return { gdp: somarDados(topo.gdp, extra), geb: somarDados(topo.geb, extra) };
      }
      var linha = null;
      tabela.linhas.forEach(function (l) { if (l.st <= st && (!linha || l.st > linha.st)) linha = l; });
      return linha ? { gdp: linha.gdp, geb: linha.geb } : null;
    }

    // Custo de um traço: custo estruturado (data/gurps) + escolha do jogador { nivel, opcao, quantidade, valor, autocontrole }.
    function custoTraco(custo, escolha) {
      var e = escolha || {};
      var base;
      if (custo.tipo === 'fixo') base = custo.valor;
      else if (custo.tipo === 'niveis') base = (custo.base || 0) + (e.nivel || 0) * custo.por_nivel;
      else if (custo.tipo === 'opcoes') base = custo.valores[e.opcao || 0] * (custo.unidade ? (e.quantidade || 1) : 1);
      else if (custo.tipo === 'faixa') {
        if (e.valor < custo.min || e.valor > custo.max) throw new Error('custo ' + e.valor + ' fora da faixa ' + custo.min + ' a ' + custo.max);
        base = e.valor;
      } else base = e.valor || 0; // minimo e variavel: o jogador informa
      if (custo.autocontrole && e.autocontrole && e.autocontrole !== regras.autocontrole.padrao) {
        var nivel = regras.autocontrole.niveis.filter(function (x) { return x.numero === e.autocontrole; })[0];
        if (!nivel) throw new Error('autocontrole inválido: ' + e.autocontrole);
        base = emDirecaoAoZero(base * nivel.multiplicador);
      }
      return base;
    }

    // ---------- sociedade (págs. 11 e 21–29) ----------
    function porId(lista, id) {
      for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
      throw new Error('id desconhecido: ' + id);
    }
    // Frações do livro arredondam "para baixo"; aqui, em direção ao zero, para uma desvantagem nunca render pontos a mais.
    function emDirecaoAoZero(v) {
      return v >= 0 ? Math.floor(v + 1e-9) : Math.ceil(v - 1e-9);
    }

    function custoAparencia(id) { return porId(regras.aparencia.niveis, id).custo; }
    function custoStatus(nivel) { return nivel * regras.status.custo_por_nivel; }
    function custoAlfabetizacao(id) { return porId(regras.idiomas.alfabetizacao_materna, id).custo; }

    function custoIdioma(fala, escrita) {
      var f = porId(regras.idiomas.niveis, fala).custo;
      var e = porId(regras.idiomas.niveis, escrita).custo;
      return fala === escrita ? f : (f + e) / 2;
    }

    function custoRiqueza(id, multimilionario) {
      var M = regras.riqueza.multimilionario;
      if (multimilionario) return M.custo_base + multimilionario * M.custo_por_nivel;
      return porId(regras.riqueza.niveis, id).custo;
    }

    function recursosIniciais(id, multimilionario, nt) {
      var NT = regras.nivel_tecnologico;
      var base = NT.recursos_iniciais.por_nt[String(nt == null ? NT.nt_campanha : nt)];
      var mult = porId(regras.riqueza.niveis, id).multiplicador;
      if (multimilionario) mult *= Math.pow(regras.riqueza.multimilionario.fator_por_nivel, multimilionario);
      return Math.round(base * mult);
    }

    function statusPorRiqueza(id, multimilionario) {
      var G = regras.riqueza.status_gratis;
      if (multimilionario >= 2) return G.multimilionario_2;
      if (multimilionario === 1) return G.multimilionario_1;
      var ordem = regras.riqueza.niveis.map(function (n) { return n.id; });
      return ordem.indexOf(id) >= ordem.indexOf('rico') ? G.rico_ou_mais : 0;
    }

    function custoReputacao(modificador, pessoas, frequencia) {
      var R = regras.reputacao;
      var mod = Math.max(-R.maximo, Math.min(R.maximo, modificador));
      var v = emDirecaoAoZero(mod * R.custo_por_nivel * porId(R.pessoas, pessoas).fator);
      return emDirecaoAoZero(v * porId(R.frequencia, frequencia).fator);
    }

    function limiteDesvantagens(pontosIniciais, percentual) {
      var p = percentual == null ? regras.limite_desvantagens.percentual_sugerido : percentual;
      return -Math.floor(pontosIniciais * p);
    }

    // social: { aparencia, status, riqueza, multimilionario, alfabetizacao, analfabetismoRegra, culturas }
    function calcularFicha(ficha) {
      var atr = ficha.atributos;
      var aj = ficha.ajustes || {};
      var soc = ficha.social || {};
      var valores = secundarias(atr, aj);
      Object.keys(atr).forEach(function (k) { valores[k] = atr[k]; });

      var partes = [];
      Object.keys(atr).forEach(function (k) { partes.push({ grupo: 'atributos', custo: custoAtributo(k, atr[k]) }); });
      Object.keys(aj).forEach(function (k) { partes.push({ grupo: 'secundarias', custo: custoSecundaria(k, aj[k]) }); });
      if (soc.aparencia) partes.push({ grupo: 'social', custo: custoAparencia(soc.aparencia) });
      if (soc.status) partes.push({ grupo: 'social', custo: custoStatus(soc.status) });
      if (soc.riqueza) partes.push({ grupo: 'social', custo: custoRiqueza(soc.riqueza, soc.multimilionario) });
      if (soc.alfabetizacao) {
        partes.push({ grupo: 'social', custo: custoAlfabetizacao(soc.alfabetizacao), foraDoLimite: !!soc.analfabetismoRegra });
      }
      if (soc.culturas) partes.push({ grupo: 'social', custo: soc.culturas * regras.familiaridade_cultural.custo_mesma_raca });

      var custos = { atributos: 0, secundarias: 0, social: 0 };
      var desvantagens = 0;
      partes.forEach(function (p) {
        custos[p.grupo] += p.custo;
        if (p.custo < 0 && !p.foraDoLimite) desvantagens += p.custo;
      });
      return {
        valores: valores,
        custos: custos,
        total: custos.atributos + custos.secundarias + custos.social,
        desvantagens: desvantagens,
        recursos: soc.riqueza ? recursosIniciais(soc.riqueza, soc.multimilionario) : recursosIniciais('medio')
      };
    }

    return {
      custoAtributo: custoAtributo,
      secundarias: secundarias,
      custoSecundaria: custoSecundaria,
      limitesSecundaria: limitesSecundaria,
      esquiva: esquiva,
      baseDeCarga: baseDeCarga,
      nivelDeCarga: nivelDeCarga,
      deslocamentoComCarga: deslocamentoComCarga,
      custoPericia: custoPericia,
      nivelPorPontos: nivelPorPontos,
      danoBasico: danoBasico,
      custoTraco: custoTraco,
      custoAparencia: custoAparencia,
      custoStatus: custoStatus,
      custoIdioma: custoIdioma,
      custoAlfabetizacao: custoAlfabetizacao,
      custoRiqueza: custoRiqueza,
      recursosIniciais: recursosIniciais,
      statusPorRiqueza: statusPorRiqueza,
      custoReputacao: custoReputacao,
      limiteDesvantagens: limiteDesvantagens,
      calcularFicha: calcularFicha
    };
  }

  root.criarCalculo = criarCalculo;
  if (typeof module !== 'undefined' && module.exports) module.exports = { criarCalculo: criarCalculo };
})(typeof window !== 'undefined' ? window : globalThis);
