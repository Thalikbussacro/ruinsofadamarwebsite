// js/pericias.js — listas filtráveis do GURPS para Adamar: perícias, vantagens e desvantagens.
// A página indica qual lista mostrar em #lista-gurps[data-lista]; os dados vêm de js/dados-*-gurps.js.
(function () {
  var lista = document.getElementById('lista-gurps');
  if (!lista) return;
  var busca = document.getElementById('busca-gurps');
  var filtro = document.getElementById('filtro-gurps');
  var contagem = document.getElementById('contagem-gurps');
  var botoesStatus = Array.prototype.slice.call(document.querySelectorAll('[data-status]'));

  var GRUPOS_PERICIA = {
    combate: 'Combate', corpo: 'Corpo e movimento', natureza: 'Natureza e viagem',
    oficio: 'Ofícios', social: 'Social', saber: 'Saberes', ladino: 'Ladinagem',
    misterio: 'Mistério e cinematográfico', tecnologia: 'Tecnologia moderna'
  };
  var TIPOS_TRACO = ['Mental', 'Física', 'Social', 'Exótica', 'Sobrenatural'];

  // "Variável" e custos por nível ("5/nível") ficam sem unidade; "1" e "-1" levam "pt"; o resto, "pts".
  function unidadePontos(c) {
    if (!/^[-+]?\d/.test(c) || c.indexOf('/') !== -1) return '';
    return /^-?1$/.test(c) ? ' pt' : ' pts';
  }

  var TIPOS = {
    pericias: {
      dados: window.PERICIAS_GURPS || [],
      unidade: ['perícia', 'perícias'],
      opcoes: Object.keys(GRUPOS_PERICIA).map(function (k) { return [k, GRUPOS_PERICIA[k]]; }),
      filtra: function (p, v) { return p.g === v; },
      titulo: function (p) { return p.n + (p.nt ? '/NT' : ''); },
      selo: function (p) { return p.a + '/' + p.d; },
      meta: function (p) {
        var m = [GRUPOS_PERICIA[p.g], 'pág. ' + p.p];
        if (p.pd) m.push('Pré-definido: ' + p.pd);
        return m;
      }
    },
    vantagens: {
      dados: window.VANTAGENS_GURPS || [],
      unidade: ['vantagem', 'vantagens'],
      opcoes: TIPOS_TRACO.map(function (t) { return [t, t]; }),
      filtra: function (p, v) { return p.t.indexOf(v) !== -1; },
      titulo: function (p) { return p.n; },
      selo: function (p) { return p.c + unidadePontos(p.c); },
      meta: function (p) { return [p.t, 'pág. ' + p.p]; }
    }
  };
  TIPOS.vantagens.opcoes = TIPOS.vantagens.opcoes.concat([['Qualidade', 'Qualidades (1 ponto)']]);
  TIPOS.desvantagens = Object.create(TIPOS.vantagens);
  TIPOS.desvantagens.dados = window.DESVANTAGENS_GURPS || [];
  TIPOS.desvantagens.opcoes = TIPOS_TRACO.map(function (t) { return [t, t]; })
    .concat([['Peculiaridade', 'Peculiaridades (-1 ponto)']]);
  TIPOS.desvantagens.unidade = ['desvantagem', 'desvantagens'];
  
  var tipo = TIPOS[lista.getAttribute('data-lista')] || TIPOS.pericias;
  var STATUS = {
    L: { rotulo: 'Livre', classe: 'st-livre' },
    N: { rotulo: 'Com o narrador', classe: 'st-narrador' },
    X: { rotulo: 'Não existe em Adamar', classe: 'st-nao' }
  };
  var statusAtual = 'L';

  function semAcento(t) {
    return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function item(p) {
    var art = el('article', 'pericia ' + STATUS[p.s].classe);
    var topo = el('div', 'pericia-topo');
    var nome = el('h3', 'pericia-nome', tipo.titulo(p));
    if (p.esp) {
      var adaga = el('span', 'pericia-esp', '†');
      adaga.title = 'Exige especialização';
      nome.appendChild(adaga);
    }
    topo.appendChild(nome);
    topo.appendChild(el('span', 'pericia-dif', tipo.selo(p)));
    art.appendChild(topo);
    art.appendChild(el('p', 'pericia-resumo', p.r));
    var meta = el('p', 'pericia-meta');
    meta.appendChild(el('span', 'pericia-status', STATUS[p.s].rotulo));
    tipo.meta(p).forEach(function (m) { meta.appendChild(el('span', null, m)); });
    art.appendChild(meta);
    return art;
  }

  function render() {
    var q = semAcento(busca.value.trim());
    var v = filtro.value;
    var filtrados = tipo.dados.filter(function (p) {
      if (statusAtual !== 'todas' && p.s !== statusAtual) return false;
      if (v && !tipo.filtra(p, v)) return false;
      if (q && semAcento(p.n + ' ' + p.r).indexOf(q) === -1) return false;
      return true;
    });
    lista.textContent = '';
    filtrados.forEach(function (p) { lista.appendChild(item(p)); });
    contagem.textContent = filtrados.length + ' ' + tipo.unidade[filtrados.length === 1 ? 0 : 1];
    if (!filtrados.length) lista.appendChild(el('p', 'pericia-vazio', 'Nada encontrado com esses filtros.'));
  }

  tipo.opcoes.forEach(function (op) {
    var o = document.createElement('option');
    o.value = op[0];
    o.textContent = op[1];
    filtro.appendChild(o);
  });

  botoesStatus.forEach(function (b) {
    b.addEventListener('click', function () {
      statusAtual = b.getAttribute('data-status');
      botoesStatus.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
  });
  busca.addEventListener('input', render);
  filtro.addEventListener('change', render);

  render();
})();
