// js/pericias.js — lista filtrável de perícias do GURPS para Adamar (dados em js/dados-pericias-gurps.js).
(function () {
  var dados = window.PERICIAS_GURPS || [];
  var lista = document.getElementById('lista-pericias');
  var busca = document.getElementById('busca-pericia');
  var grupo = document.getElementById('grupo-pericia');
  var contagem = document.getElementById('contagem-pericias');
  var botoesStatus = Array.prototype.slice.call(document.querySelectorAll('[data-status]'));
  if (!lista) return;

  var GRUPOS = {
    combate: 'Combate', corpo: 'Corpo e movimento', natureza: 'Natureza e viagem',
    oficio: 'Ofícios', social: 'Social', saber: 'Saberes', ladino: 'Ladinagem',
    misterio: 'Mistério e cinematográfico', tecnologia: 'Tecnologia moderna'
  };
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
    var nome = el('h3', 'pericia-nome', p.n + (p.nt ? '/NT' : ''));
    if (p.esp) {
      var adaga = el('span', 'pericia-esp', '†');
      adaga.title = 'Exige especialização';
      nome.appendChild(adaga);
    }
    topo.appendChild(nome);
    topo.appendChild(el('span', 'pericia-dif', p.a + '/' + p.d));
    art.appendChild(topo);
    art.appendChild(el('p', 'pericia-resumo', p.r));
    var meta = el('p', 'pericia-meta');
    meta.appendChild(el('span', 'pericia-status', STATUS[p.s].rotulo));
    meta.appendChild(el('span', null, GRUPOS[p.g]));
    meta.appendChild(el('span', null, 'pág. ' + p.p));
    if (p.pd) meta.appendChild(el('span', null, 'Pré-definido: ' + p.pd));
    art.appendChild(meta);
    return art;
  }

  function render() {
    var q = semAcento(busca.value.trim());
    var g = grupo.value;
    var filtrados = dados.filter(function (p) {
      if (statusAtual !== 'todas' && p.s !== statusAtual) return false;
      if (g && p.g !== g) return false;
      if (q && semAcento(p.n + ' ' + p.r).indexOf(q) === -1) return false;
      return true;
    });
    lista.textContent = '';
    filtrados.forEach(function (p) { lista.appendChild(item(p)); });
    contagem.textContent = filtrados.length === 1 ? '1 perícia' : filtrados.length + ' perícias';
    if (!filtrados.length) lista.appendChild(el('p', 'pericia-vazio', 'Nenhuma perícia encontrada com esses filtros.'));
  }

  Object.keys(GRUPOS).forEach(function (k) {
    var o = document.createElement('option');
    o.value = k;
    o.textContent = GRUPOS[k];
    grupo.appendChild(o);
  });

  botoesStatus.forEach(function (b) {
    b.addEventListener('click', function () {
      statusAtual = b.getAttribute('data-status');
      botoesStatus.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
  });
  busca.addEventListener('input', render);
  grupo.addEventListener('change', render);

  render();
})();
