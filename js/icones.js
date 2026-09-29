// js/icones.js — desenha o ícone de um item (window.GURPS.icones: nome → miolo do SVG 24×24, só contorno).
(function (root) {
  var NS = 'http://www.w3.org/2000/svg';
  // iconeSvg('sword', 'classe') → <svg> pronto para inserir; null se o ícone não existir.
  function iconeSvg(nome, classe) {
    var desenhos = (root.GURPS && root.GURPS.icones) || {};
    if (!nome || !desenhos[nome]) return null;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'icone' + (classe ? ' ' + classe : ''));
    svg.innerHTML = desenhos[nome];
    return svg;
  }
  root.iconeSvg = iconeSvg;
})(typeof window !== 'undefined' ? window : globalThis);
