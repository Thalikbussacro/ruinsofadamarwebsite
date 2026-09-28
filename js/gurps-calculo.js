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

    function calcularFicha(ficha) {
      var atr = ficha.atributos;
      var aj = ficha.ajustes || {};
      var valores = secundarias(atr, aj);
      Object.keys(atr).forEach(function (k) { valores[k] = atr[k]; });
      var custoAtr = Object.keys(atr).reduce(function (t, k) { return t + custoAtributo(k, atr[k]); }, 0);
      var custoSec = Object.keys(aj).reduce(function (t, k) { return t + custoSecundaria(k, aj[k]); }, 0);
      return { valores: valores, custos: { atributos: custoAtr, secundarias: custoSec }, total: custoAtr + custoSec };
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
      calcularFicha: calcularFicha
    };
  }

  root.criarCalculo = criarCalculo;
  if (typeof module !== 'undefined' && module.exports) module.exports = { criarCalculo: criarCalculo };
})(typeof window !== 'undefined' ? window : globalThis);
