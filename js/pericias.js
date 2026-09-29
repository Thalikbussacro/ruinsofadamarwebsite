// js/pericias.js — listas filtráveis do GURPS para Adamar: perícias, vantagens, desvantagens e equipamento.
// A página indica qual lista mostrar em #lista-gurps[data-lista]; os dados vêm de js/dados-gurps.js
// (gerado a partir de data/gurps/*.json por tools/gerar-dados.mjs). Cada item é um card compacto
// (js/detalhes.js) que abre a janela com os detalhes; o endereço #id abre o item direto.
(function () {
  var lista = document.getElementById('lista-gurps');
  if (!lista || !window.ItemUI) return;
  var UI = window.ItemUI;
  var busca = document.getElementById('busca-gurps');
  var filtro = document.getElementById('filtro-gurps');
  var contagem = document.getElementById('contagem-gurps');
  var botoesStatus = Array.prototype.slice.call(document.querySelectorAll('[data-status]'));
  var GURPS = window.GURPS || { pericias: [], vantagens: [], desvantagens: [], livros: {} };

  function opcoesTraco(extra) {
    return Object.keys(UI.TIPOS_TRACO).map(function (k) { return [k, UI.TIPOS_TRACO[k]]; }).concat([extra]);
  }
  function filtraTraco(p, v) {
    return v === p.categoria || p.tipo.indexOf(v) !== -1;
  }

  var LISTAS = {
    pericias: {
      dados: GURPS.pericias,
      unidade: ['perícia', 'perícias'],
      opcoes: Object.keys(UI.GRUPOS).map(function (k) { return [k, UI.GRUPOS[k]]; }),
      filtra: function (p, v) { return p.grupo === v; }
    },
    vantagens: {
      dados: GURPS.vantagens,
      unidade: ['vantagem', 'vantagens'],
      opcoes: opcoesTraco(['qualidade', 'Qualidades (1 ponto)']),
      filtra: filtraTraco
    },
    desvantagens: {
      dados: GURPS.desvantagens,
      unidade: ['desvantagem', 'desvantagens'],
      opcoes: opcoesTraco(['peculiaridade', 'Peculiaridades (-1 ponto)']),
      filtra: filtraTraco
    },
    equipamento: {
      dados: GURPS.equipamento || [],
      unidade: ['item', 'itens'],
      opcoes: Object.keys(UI.CATEGORIAS_EQUIP).map(function (k) { return [k, UI.CATEGORIAS_EQUIP[k]]; }),
      filtra: function (p, v) { return p.categoria === v; }
    }
  };

  var tipo = LISTAS[lista.getAttribute('data-lista')] || LISTAS.pericias;
  var statusAtual = 'livre';

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function semAcento(t) {
    return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function render() {
    var q = semAcento(busca.value.trim());
    var v = filtro.value;
    var filtrados = tipo.dados.filter(function (p) {
      if (statusAtual !== 'todas' && p.adamar !== statusAtual) return false;
      if (v && !tipo.filtra(p, v)) return false;
      if (q && semAcento(p.nome + ' ' + p.resumo + ' ' + (p.subcategoria || '') + ' ' + (p.descricao || '') + ' ' + (p.gcs ? p.gcs.nome : '')).indexOf(q) === -1) return false;
      return true;
    });
    lista.textContent = '';
    filtrados.forEach(function (p) { lista.appendChild(UI.card(p)); });
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

  // link direto para um item: abre a janela dele
  var id = decodeURIComponent(location.hash.slice(1));
  var alvo = id && tipo.dados.filter(function (p) { return p.id === id; })[0];
  if (alvo) UI.abrir(alvo);
})();
