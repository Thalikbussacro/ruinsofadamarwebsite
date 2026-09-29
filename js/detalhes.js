// js/detalhes.js — "Mais sobre": descrição, exemplos, Adamar e dica de mesa de um item (campos de data/gurps/enriquecimento/).
// window.detalhesItem(item) devolve um <details> pronto, ou null quando o item ainda não foi enriquecido.
(function () {
  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function nomeDe(id) {
    var G = window.GURPS || {};
    var listas = [G.pericias, G.vantagens, G.desvantagens, G.equipamento];
    for (var k = 0; k < listas.length; k++) {
      var achou = (listas[k] || []).filter(function (x) { return x.id === id; })[0];
      if (achou) return achou.nome;
    }
    return null;
  }
  window.detalhesItem = function (item, aberto) {
    if (!item || !item.descricao) return null;
    var d = el('details', 'detalhes-item');
    if (aberto) d.open = true;
    d.appendChild(el('summary', null, 'Mais sobre ' + item.nome));
    item.descricao.split(/\n\n+/).forEach(function (par) { d.appendChild(el('p', null, par)); });
    if (item.exemplos && item.exemplos.length) {
      d.appendChild(el('h4', null, 'Na mesa'));
      var ul = el('ul', 'detalhes-exemplos');
      item.exemplos.forEach(function (x) { ul.appendChild(el('li', null, x)); });
      d.appendChild(ul);
    }
    if (item.em_adamar) {
      d.appendChild(el('h4', null, 'Em Adamar'));
      d.appendChild(el('p', null, item.em_adamar));
    }
    if (item.dica_mesa) d.appendChild(el('p', 'detalhes-dica', 'Dica: ' + item.dica_mesa));
    var rel = (item.relacionados || []).map(nomeDe).filter(Boolean);
    if (rel.length) d.appendChild(el('p', 'detalhes-rel', 'Veja também: ' + rel.join(', ') + '.'));
    return d;
  };
})();
