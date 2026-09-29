// js/criador-ficha.js — lógica do criador de personagem: custo, NH, limites e avisos de uma ficha inteira.
// Funções puras sobre (ficha, GURPS, calc): servem à página (window.criarCriador) e aos testes em Node.
(function (root) {
  // Traços que o criador trata no bloco de Sociedade, não na lista de vantagens/desvantagens.
  var TRACOS_SOCIAIS = ['aparencia', 'aparencia-desvantagem', 'riqueza', 'pobreza-riqueza-baixa', 'status', 'status-baixo', 'idiomas', 'familiaridade-cultural'];

  function fichaNova(regras) {
    var pontos = (regras.campanha && regras.campanha.pontos_iniciais) || { padrao: 80 };
    return {
      versao: 1,
      nome: '', jogador: '', conceito: '', era: '', origem: '', aparencia_fisica: '', historia: '',
      orcamento: pontos.padrao,
      atributos: { st: 10, dx: 10, iq: 10, ht: 10 },
      ajustes: {},
      social: { aparencia: 'comum', status: 0, riqueza: 'medio', multimilionario: 0, alfabetizacao: 'alfabetizado', analfabetismoRegra: true },
      idioma_materno: '',
      idiomas: [],       // { nome, fala, escrita } — além da língua materna, que é grátis
      tracos: [],        // { id, escolha: { nivel, opcao, quantidade, valor, autocontrole }, nota }
      talentos: [],      // { id, nivel }
      qualidades: [],    // textos; +1 ponto cada
      peculiaridades: [], // textos; -1 ponto cada, até 5
      pericias: [],      // { id, especializacao, pontos }
      equipamento: [],   // { id, quantidade }
      notas: ''
    };
  }

  var Efeitos = root.GurpsEfeitos || (typeof require === 'function' ? require('./gurps-efeitos.js') : null);

  function criarCriador(G, calc) {
    var R = G.regras;
    var PERICIA = {}, TRACO = {}, TALENTO = {}, ITEM = {};
    G.pericias.forEach(function (p) { PERICIA[p.id] = p; });
    G.vantagens.concat(G.desvantagens).forEach(function (t) { TRACO[t.id] = t; });
    (R.talentos || []).forEach(function (t) { TALENTO[t.id] = t; });
    (G.equipamento || []).forEach(function (i) { ITEM[i.id] = i; });
    var LIMITE_PECULIARIDADES = 5;

    function nomeVariante(t, opcao) {
      var v = t.variantes && t.variantes[opcao || 0];
      return v ? v.nome : null;
    }

    function custoDoTraco(sel) {
      var t = TRACO[sel.id];
      if (!t || !t.custo_estruturado) return 0;
      try { return calc.custoTraco(t.custo_estruturado, sel.escolha || {}); } catch (e) { return 0; }
    }

    // Nível do traço para efeitos "por nível" (1 quando o traço não tem níveis).
    function nivelDoTraco(sel) {
      var t = TRACO[sel.id];
      return t && t.custo_estruturado && t.custo_estruturado.tipo === 'niveis' ? ((sel.escolha || {}).nivel || 0) : 1;
    }

    // Efeito vale para a variante escolhida? (efeitos sem "variante" valem para todas)
    function efeitoValeParaEscolha(e, sel) {
      return e.variante == null || e.variante === ((sel.escolha || {}).opcao || 0);
    }

    function valorAtributo(ficha, valores, sigla) {
      var mapa = { DX: 'dx', IQ: 'iq', HT: 'ht', ST: 'st', Per: 'per', Vontade: 'vontade' };
      return valores[mapa[sigla]];
    }

    // Bônus de perícia vindos de traços e talentos: fixos (somados ao NH) e situacionais (só listados).
    function bonusDePericias(ficha) {
      var fixos = {}, situacionais = {};
      function somar(id, valor, origem, condicao) {
        if (condicao) (situacionais[id] = situacionais[id] || []).push({ valor: valor, origem: origem, condicao: condicao });
        else (fixos[id] = fixos[id] || []).push({ valor: valor, origem: origem });
      }
      ficha.tracos.forEach(function (sel) {
        var t = TRACO[sel.id];
        if (!t) return;
        var nivel = nivelDoTraco(sel);
        (t.efeitos || []).forEach(function (e) {
          if (e.alvo !== 'pericia' && e.alvo !== 'grupo_pericias') return;
          if (typeof e.valor !== 'number' || !efeitoValeParaEscolha(e, sel)) return;
          var valor = e.por_nivel ? e.valor * nivel : e.valor;
          if (!valor) return;
          var origem = nomeVariante(t, (sel.escolha || {}).opcao) || t.nome;
          [].concat(e.ref).forEach(function (id) { somar(id, valor, origem, e.condicao); });
        });
      });
      ficha.talentos.forEach(function (sel) {
        var t = TALENTO[sel.id];
        if (!t || !sel.nivel) return;
        t.pericias.forEach(function (id) { somar(id, sel.nivel, t.nome); });
      });
      return { fixos: fixos, situacionais: situacionais };
    }

    // Efeitos sem condição em atributos, secundárias e defesas (ex.: Reflexos em Combate, Nanismo).
    // Os com condição valem só em certas situações e ficam na descrição do traço.
    function efeitosFixos(ficha) {
      var r = { atributos: {}, secundarias: {}, esquiva: 0, origens: [] };
      ficha.tracos.forEach(function (sel) {
        var t = TRACO[sel.id];
        if (!t) return;
        var nivel = nivelDoTraco(sel);
        (t.efeitos || []).forEach(function (e) {
          if (e.condicao || typeof e.valor !== 'number' || !efeitoValeParaEscolha(e, sel)) return;
          var valor = e.por_nivel ? e.valor * nivel : e.valor;
          if (!valor) return;
          if (e.alvo === 'atributo') r.atributos[e.ref] = (r.atributos[e.ref] || 0) + valor;
          else if (e.alvo === 'secundaria') r.secundarias[e.ref] = (r.secundarias[e.ref] || 0) + valor;
          else if (e.alvo === 'defesa' && (e.ref === 'esquiva' || e.ref === 'todas')) r.esquiva += valor;
          else return;
          r.origens.push({ traco: t.nome, alvo: e.alvo, ref: e.ref, valor: valor });
        });
      });
      return r;
    }

    // Efeitos do traço já com a versão e o nível escolhidos, cada um com seu tipo (aplicado, sempre, condicional, regra).
    function efeitosDoTraco(sel) {
      var t = TRACO[sel.id];
      if (!t) return [];
      var nivel = nivelDoTraco(sel);
      return (t.efeitos || []).filter(function (e) { return efeitoValeParaEscolha(e, sel); })
        .filter(function (e) { return !(e.por_nivel && typeof e.valor === 'number' && !nivel); })
        .map(function (e) { return { tipo: Efeitos.tipoEfeito(e), texto: Efeitos.textoEfeito(e, G, nivel) }; })
        .filter(function (x) { return x.texto; });
    }

    function custoIdiomas(ficha) {
      return ficha.idiomas.reduce(function (s, i) { return s + calc.custoIdioma(i.fala, i.escrita); }, 0);
    }

    function resumir(ficha) {
      var base = calc.calcularFicha({ atributos: ficha.atributos, ajustes: ficha.ajustes, social: ficha.social });
      var fixos = efeitosFixos(ficha);
      var atrEfetivo = {};
      Object.keys(ficha.atributos).forEach(function (k) { atrEfetivo[k] = ficha.atributos[k] + (fixos.atributos[k] || 0); });
      var valores = calc.secundarias(atrEfetivo, ficha.ajustes);
      Object.keys(atrEfetivo).forEach(function (k) { valores[k] = atrEfetivo[k]; });
      Object.keys(fixos.secundarias).forEach(function (k) { valores[k] += fixos.secundarias[k]; });
      var avisos = [];

      // traços
      var vant = 0, desv = 0;
      var tracos = ficha.tracos.map(function (sel) {
        var t = TRACO[sel.id];
        var custo = custoDoTraco(sel);
        if (custo >= 0) vant += custo; else desv += custo;
        if (!t) { avisos.push('Traço desconhecido: ' + sel.id + '.'); return { sel: sel, custo: 0 }; }
        if (t.adamar === 'nao') avisos.push(t.nome + ' não existe em Adamar.');
        if (t.adamar === 'narrador') avisos.push(t.nome + ': só com o narrador.');
        var c = t.custo_estruturado || {};
        var e = sel.escolha || {};
        if (c.tipo === 'niveis' && t.nivel_max != null && e.nivel > t.nivel_max) avisos.push(t.nome + ': nível máximo ' + t.nivel_max + ' em Adamar.');
        if (c.tipo === 'niveis' && !e.nivel) avisos.push(t.nome + ': escolha o nível.');
        if ((c.tipo === 'variavel' || c.tipo === 'minimo') && !e.valor) avisos.push(t.nome + ': combine o custo com o narrador e anote aqui.');
        if (c.tipo === 'minimo' && e.valor && Math.abs(e.valor) < Math.abs(c.valor)) avisos.push(t.nome + ': custa no mínimo ' + c.valor + '.');
        (t.prerequisitos || []).forEach(function (p) {
          var msg = prerequisitoFalho(p, ficha, valores);
          if (msg) avisos.push(t.nome + ': ' + msg);
        });
        return { sel: sel, traco: t, custo: custo };
      });

      // talentos (vantagens)
      var talentos = ficha.talentos.map(function (sel) {
        var t = TALENTO[sel.id];
        var custo = t ? t.custo_por_nivel * (sel.nivel || 0) : 0;
        vant += custo;
        if (t && sel.nivel > (t.nivel_max || 4)) avisos.push('Talento ' + t.nome + ': no máximo ' + (t.nivel_max || 4) + ' níveis.');
        return { sel: sel, talento: t, custo: custo };
      });

      var qualidades = ficha.qualidades.filter(Boolean).length;
      var peculiaridades = -ficha.peculiaridades.filter(Boolean).length;
      if (-peculiaridades > LIMITE_PECULIARIDADES) avisos.push('No máximo ' + LIMITE_PECULIARIDADES + ' peculiaridades (-' + LIMITE_PECULIARIDADES + ' pontos).');
      var idiomas = custoIdiomas(ficha);

      // perícias
      var bonus = bonusDePericias(ficha);
      var custoPericias = 0;
      var pericias = ficha.pericias.map(function (sel) {
        var p = PERICIA[sel.id];
        if (!p) { avisos.push('Perícia desconhecida: ' + sel.id + '.'); return { sel: sel, nh: null }; }
        custoPericias += sel.pontos || 0;
        if (p.adamar === 'nao') avisos.push(p.nome + ' não existe em Adamar.');
        if (p.adamar === 'narrador') avisos.push(p.nome + ': só com o narrador.');
        if (p.especializacao && !sel.especializacao) avisos.push(p.nome + ': escolha a especialização.');
        var esp = (p.especializacoes || []).filter(function (x) { return x.nome === sel.especializacao; })[0];
        if (esp && esp.adamar === 'narrador') avisos.push(p.nome + ' (' + esp.nome + '): só com o narrador.');
        if (esp && esp.adamar === 'nao') avisos.push(p.nome + ' (' + esp.nome + ') não existe em Adamar.');
        var rel = sel.pontos ? calc.nivelPorPontos(p.dificuldade, sel.pontos) : null;
        var atributo = valorAtributo(ficha, valores, p.atributo);
        var extra = (bonus.fixos[p.id] || []).reduce(function (s, b) { return s + b.valor; }, 0);
        var nh = rel == null ? null : atributo + rel + extra;
        if (sel.pontos && rel == null) avisos.push(p.nome + ': pontos insuficientes para o primeiro nível.');
        return {
          sel: sel, pericia: p, relativo: rel, nh: nh, atributo: p.atributo,
          bonus: bonus.fixos[p.id] || [], situacional: bonus.situacionais[p.id] || []
        };
      });

      // limites
      var social = base.custos.social;
      var desvantagens = base.desvantagens + desv; // atributos/secundárias/sociedade negativos + desvantagens
      var limite = calc.limiteDesvantagens(ficha.orcamento, ((R.campanha || {}).limite_desvantagens || {}).percentual_padrao);
      if (desvantagens < limite) avisos.push('As desvantagens (' + desvantagens + ') passaram do limite de ' + limite + '. Só com o narrador.');

      var custos = {
        atributos: base.custos.atributos,
        secundarias: base.custos.secundarias,
        social: social + idiomas,
        vantagens: vant,
        desvantagens: desv,
        qualidades: qualidades,
        peculiaridades: peculiaridades,
        pericias: custoPericias
      };
      var total = Object.keys(custos).reduce(function (s, k) { return s + custos[k]; }, 0);
      var restante = ficha.orcamento - total;
      if (restante < 0) avisos.unshift('Gastou ' + (-restante) + ' pontos além do orçamento.');
      if (!ficha.nome) avisos.push('Falta o nome do personagem.');

      // equipamento: preço em coroas (1 coroa = $1 do GURPS)
      var gasto = 0;
      var equipamento = ficha.equipamento.map(function (sel) {
        var it = ITEM[sel.id];
        var preco = it && it.preco ? it.preco.valor * (sel.quantidade || 1) : null;
        if (preco != null) gasto += preco;
        return { sel: sel, item: it, preco: preco };
      });
      gasto = Math.round(gasto * 100) / 100;
      if (gasto > base.recursos) avisos.push('O equipamento custa ' + gasto + ' coroas, mais que o dinheiro inicial (' + base.recursos + ').');

      return {
        valores: valores,
        custos: custos,
        total: total,
        restante: restante,
        desvantagens: desvantagens,
        limite: limite,
        recursos: base.recursos,
        gasto_equipamento: gasto,
        dinheiro_restante: Math.round((base.recursos - gasto) * 100) / 100,
        equipamento: equipamento,
        efeitos_fixos: fixos.origens,
        tracos: tracos,
        talentos: talentos,
        pericias: pericias,
        esquiva: calc.esquiva(valores.velocidade) + fixos.esquiva,
        base_carga: calc.baseDeCarga(valores.st),
        avisos: avisos
      };
    }

    function prerequisitoFalho(p, ficha, valores) {
      if (p.tipo === 'traco') {
        var tem = ficha.tracos.filter(function (s) { return s.id === p.id; })[0];
        if (!tem) return 'precisa de ' + ((TRACO[p.id] || {}).nome || p.id) + '.';
        if (p.nivel_min && ((tem.escolha || {}).nivel || 0) < p.nivel_min) return 'precisa de ' + TRACO[p.id].nome + ' ' + p.nivel_min + ' ou mais.';
        return null;
      }
      if (p.tipo === 'exclui') {
        return ficha.tracos.some(function (s) { return s.id === p.id; }) ? 'não combina com ' + ((TRACO[p.id] || {}).nome || p.id) + '.' : null;
      }
      if (p.tipo === 'pericia') {
        var s = ficha.pericias.filter(function (x) { return x.id === p.id; })[0];
        return s ? null : 'precisa da perícia ' + ((PERICIA[p.id] || {}).nome || p.id) + '.';
      }
      if (p.tipo === 'atributo') {
        var v = valores[p.ref];
        if (p.min != null && v < p.min) return 'precisa de ' + p.ref.toUpperCase() + ' ' + p.min + ' ou mais.';
        if (p.max != null && v > p.max) return 'precisa de ' + p.ref.toUpperCase() + ' ' + p.max + ' ou menos.';
        return null;
      }
      return null; // pré-requisitos em texto ficam só na descrição
    }

    function sinal(v) { return v > 0 ? '+' + v : String(v); }
    function num(v) { return String(v).replace('.', ','); }

    function descricaoTraco(item) {
      var t = item.traco, e = item.sel.escolha || {};
      if (!t) return item.sel.id;
      var c = t.custo_estruturado || {};
      var nome = t.nome;
      if (c.tipo === 'niveis') nome += ' ' + (e.nivel || 0);
      if (c.tipo === 'opcoes' && nomeVariante(t, e.opcao) && nomeVariante(t, e.opcao) !== t.nome) nome += ' (' + nomeVariante(t, e.opcao) + ')';
      if (c.unidade && (e.quantidade || 1) > 1) nome += ' ×' + e.quantidade;
      if (e.autocontrole && e.autocontrole !== R.autocontrole.padrao) nome += ' (' + e.autocontrole + ')';
      if (item.sel.nota) nome += ' — ' + item.sel.nota;
      return nome + ' [' + item.custo + ']';
    }

    // Texto da ficha para WhatsApp ou para copiar.
    function textoFicha(ficha, r) {
      var v = r.valores, L = [];
      L.push('*' + (ficha.nome || 'Personagem sem nome') + '*' + (ficha.jogador ? ' (jogador: ' + ficha.jogador + ')' : ''));
      if (ficha.conceito) L.push(ficha.conceito);
      if (ficha.era || ficha.origem) L.push([ficha.era, ficha.origem].filter(Boolean).join(' · '));
      L.push('');
      L.push('Pontos: ' + r.total + ' de ' + ficha.orcamento + (r.restante ? ' (' + (r.restante > 0 ? 'sobram ' + r.restante : 'passou ' + (-r.restante)) + ')' : ''));
      L.push('ST ' + v.st + ' · DX ' + v.dx + ' · IQ ' + v.iq + ' · HT ' + v.ht);
      L.push('PV ' + v.pv + ' · Vontade ' + v.vontade + ' · Per ' + v.per + ' · PF ' + v.pf + ' · Velocidade ' + num(v.velocidade) + ' · Deslocamento ' + v.deslocamento + ' · Esquiva ' + r.esquiva);
      var so = ficha.social;
      var ap = R.aparencia.niveis.filter(function (n) { return n.id === so.aparencia; })[0];
      var rq = R.riqueza.niveis.filter(function (n) { return n.id === so.riqueza; })[0];
      var alf = R.idiomas.alfabetizacao_materna.filter(function (n) { return n.id === so.alfabetizacao; })[0];
      L.push('Aparência ' + (ap ? ap.nome : so.aparencia) + ' · Status ' + sinal(so.status) + ' · Riqueza ' + (so.multimilionario ? 'Multimilionário ' + so.multimilionario : (rq ? rq.nome : so.riqueza)) + ' · ' + (alf ? alf.nome : so.alfabetizacao));
      var idiomas = [ficha.idioma_materno ? ficha.idioma_materno + ' (materna)' : null].concat(ficha.idiomas.map(function (i) {
        return i.nome + ' (fala ' + i.fala + ', escrita ' + i.escrita + ')';
      })).filter(Boolean);
      if (idiomas.length) L.push('Idiomas: ' + idiomas.join(', '));
      var vs = r.tracos.filter(function (x) { return x.custo >= 0; }).map(descricaoTraco)
        .concat(r.talentos.filter(function (x) { return x.talento; }).map(function (x) { return 'Talento ' + x.talento.nome + ' ' + x.sel.nivel + ' [' + x.custo + ']'; }));
      var ds = r.tracos.filter(function (x) { return x.custo < 0; }).map(descricaoTraco);
      if (vs.length) { L.push(''); L.push('*Vantagens:* ' + vs.join('; ')); }
      if (ds.length) { L.push(''); L.push('*Desvantagens:* ' + ds.join('; ')); }
      var q = ficha.qualidades.filter(Boolean), pq = ficha.peculiaridades.filter(Boolean);
      if (q.length) L.push('*Qualidades:* ' + q.join('; '));
      if (pq.length) L.push('*Peculiaridades:* ' + pq.join('; '));
      var ps = r.pericias.filter(function (x) { return x.pericia; }).map(function (x) {
        var nome = x.pericia.nome + (x.sel.especializacao ? ' (' + x.sel.especializacao + ')' : '');
        return nome + ' ' + (x.nh == null ? '—' : x.nh) + ' [' + (x.sel.pontos || 0) + ']';
      });
      if (ps.length) { L.push(''); L.push('*Perícias:* ' + ps.join('; ')); }
      var eq = ficha.equipamento.map(function (e) {
        var it = ITEM[e.id];
        return (it ? it.nome : e.id) + (e.quantidade > 1 ? ' ×' + e.quantidade : '');
      });
      if (eq.length) {
        L.push('');
        L.push('*Equipamento:* ' + eq.join(', '));
        var fmt = function (v) { return v.toLocaleString('pt-BR'); };
        L.push('Gasto: ' + fmt(r.gasto_equipamento) + ' de ' + fmt(r.recursos) + ' coroas (' + (r.dinheiro_restante >= 0 ? 'sobram ' + fmt(r.dinheiro_restante) : 'faltam ' + fmt(-r.dinheiro_restante)) + ')');
      }
      if (ficha.aparencia_fisica) { L.push(''); L.push('*Aparência:* ' + ficha.aparencia_fisica); }
      if (ficha.historia) { L.push(''); L.push('*História:* ' + ficha.historia); }
      if (ficha.notas) { L.push(''); L.push('*Notas:* ' + ficha.notas); }
      var lembrar = [];
      r.tracos.forEach(function (x) {
        if (!x.traco) return;
        efeitosDoTraco(x.sel).forEach(function (e) {
          if (e.tipo === 'condicional' || e.tipo === 'sempre') lembrar.push(x.traco.nome + ': ' + e.texto + (e.tipo === 'condicional' ? ' [CONDICIONAL]' : ''));
        });
      });
      if (lembrar.length) { L.push(''); L.push('*Lembrar na mesa:*'); lembrar.forEach(function (a) { L.push('- ' + a); }); }
      if (r.avisos.length) { L.push(''); L.push('*Para conversar com o narrador:*'); r.avisos.forEach(function (a) { L.push('- ' + a); }); }
      return L.join('\n');
    }

    // Normaliza uma ficha importada (JSON de outra versão ou incompleto).
    function carregar(obj) {
      var f = fichaNova(R);
      if (!obj || typeof obj !== 'object') return f;
      Object.keys(f).forEach(function (k) {
        if (obj[k] == null) return;
        if (Array.isArray(f[k])) f[k] = Array.isArray(obj[k]) ? obj[k] : f[k];
        else if (typeof f[k] === 'object') f[k] = Object.assign({}, f[k], obj[k]);
        else f[k] = obj[k];
      });
      f.versao = 1;
      return f;
    }

    return {
      fichaNova: function () { return fichaNova(R); },
      carregar: carregar,
      resumir: resumir,
      textoFicha: textoFicha,
      custoDoTraco: custoDoTraco,
      efeitosDoTraco: efeitosDoTraco,
      nomeVariante: nomeVariante,
      tracoSocial: function (id) { return TRACOS_SOCIAIS.indexOf(id) !== -1; },
      LIMITE_PECULIARIDADES: LIMITE_PECULIARIDADES
    };
  }

  root.criarCriador = criarCriador;
  if (typeof module !== 'undefined' && module.exports) module.exports = { criarCriador: criarCriador, TRACOS_SOCIAIS: TRACOS_SOCIAIS };
})(typeof window !== 'undefined' ? window : globalThis);
