// js/gurps-efeitos.js — descreve os efeitos dos traços em texto e diz de que tipo cada um é.
// Tipos: 'aplicado' (a ficha já soma), 'sempre' (vale sempre, mas na hora do teste/reação),
// 'condicional' (só em certa situação: olhar com atenção) e 'regra' (descrição sem número).
(function (root) {
  var ETIQUETAS = { aplicado: 'Aplicado', sempre: 'Sempre', condicional: 'Condicional', regra: 'Regra' };
  var NOMES = {
    st: 'ST', dx: 'DX', iq: 'IQ', ht: 'HT',
    pv: 'PV', pf: 'PF', per: 'Percepção', vontade: 'Vontade', velocidade: 'Velocidade', deslocamento: 'Deslocamento',
    esquiva: 'Esquiva', aparar: 'Aparar', bloqueio: 'Bloqueio', todas: 'todas as defesas',
    gdp: 'dano GdP', geb: 'dano GeB', todos: 'dano'
  };

  function sinal(v) { return v > 0 ? '+' + v : String(v); }

  // A ficha soma sozinha: perícias e grupos de perícias, atributos, secundárias e Esquiva/todas as defesas.
  function tipoEfeito(e) {
    if (e.alvo === 'regra' || typeof e.valor !== 'number') return 'regra';
    if (e.condicao) return 'condicional';
    if (['pericia', 'grupo_pericias', 'atributo', 'secundaria'].indexOf(e.alvo) !== -1) return 'aplicado';
    if (e.alvo === 'defesa' && (e.ref === 'esquiva' || e.ref === 'todas')) return 'aplicado';
    return 'sempre';
  }

  // G: window.GURPS (para nomes de perícias e do catálogo de testes). nivel: multiplica efeitos "por nível".
  function textoEfeito(e, G, nivel) {
    if (e.alvo === 'regra' || typeof e.valor !== 'number') return e.descricao || '';
    var valor = e.por_nivel ? e.valor * (nivel == null ? 1 : nivel) : e.valor;
    var porNivel = e.por_nivel && nivel == null ? ' por nível' : '';
    function nomePericia(id) {
      var p = (G.pericias || []).filter(function (x) { return x.id === id; })[0];
      return p ? p.nome : id;
    }
    var alvo;
    if (e.alvo === 'pericia') alvo = 'em ' + nomePericia(e.ref) + (e.especializacao ? ' (' + e.especializacao + ')' : '');
    else if (e.alvo === 'grupo_pericias') alvo = 'em ' + [].concat(e.ref).map(nomePericia).join(', ');
    else if (e.alvo === 'reacao') alvo = 'na reação dos outros';
    else if (e.alvo === 'teste') {
      var t = G.regras && G.regras.catalogo_testes && G.regras.catalogo_testes[e.ref];
      alvo = 'em ' + (t ? t.descricao : e.ref);
    } else if (e.alvo === 'custo_vida') alvo = 'no custo de vida';
    else alvo = 'em ' + (NOMES[e.ref] || e.ref);
    var texto = sinal(valor) + porNivel + ' ' + alvo;
    if (e.condicao && !(e.alvo === 'teste' && G.regras && G.regras.catalogo_testes && G.regras.catalogo_testes[e.ref] &&
        G.regras.catalogo_testes[e.ref].descricao === e.condicao)) texto += ' — ' + e.condicao;
    return texto;
  }

  // Preenche uma <ul> com os efeitos ({ tipo, texto }), cada um com sua etiqueta. As regras vêm por último.
  function desenharEfeitos(ul, efeitos) {
    ul.textContent = '';
    var ordem = { aplicado: 0, sempre: 1, condicional: 2, regra: 3 };
    efeitos.slice().sort(function (a, b) { return ordem[a.tipo] - ordem[b.tipo]; }).forEach(function (e) {
      var li = document.createElement('li');
      var tag = document.createElement('span');
      tag.className = 'efeito-tag tag-' + e.tipo;
      tag.textContent = ETIQUETAS[e.tipo];
      li.appendChild(tag);
      li.appendChild(document.createTextNode(' ' + e.texto));
      ul.appendChild(li);
    });
    ul.hidden = !efeitos.length;
  }

  var api = { tipoEfeito: tipoEfeito, textoEfeito: textoEfeito, desenharEfeitos: desenharEfeitos, ETIQUETAS: ETIQUETAS };
  root.GurpsEfeitos = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
