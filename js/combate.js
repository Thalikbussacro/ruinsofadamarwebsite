// js/combate.js — página de consulta rápida de combate: preenche as manobras e a iniciativa a partir de regras.json.
(function () {
  var R = window.GURPS && window.GURPS.regras;
  if (!R) return;
  if (R.iniciativa) document.getElementById('c-iniciativa').textContent = R.iniciativa.resumo;
  var t = document.getElementById('c-manobras');
  if (!t || !R.manobras) return;
  function celula(tag, texto) { var c = document.createElement(tag); c.textContent = texto; return c; }
  var cab = document.createElement('tr');
  ['Manobra', 'O que faz', 'Movimento', 'Defesa'].forEach(function (x) { cab.appendChild(celula('th', x)); });
  var thead = document.createElement('thead');
  thead.appendChild(cab);
  t.appendChild(thead);
  var corpo = document.createElement('tbody');
  R.manobras.itens.forEach(function (m) {
    var tr = document.createElement('tr');
    var nome = celula('td', '');
    nome.appendChild(celula('strong', m.nome));
    tr.appendChild(nome);
    tr.appendChild(celula('td', m.resumo));
    tr.appendChild(celula('td', m.movimento));
    tr.appendChild(celula('td', m.defesa));
    corpo.appendChild(tr);
  });
  t.appendChild(corpo);
})();
