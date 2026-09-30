// js/boneco.js — o boneco do personagem: um corpo de frente, com o que ele veste, leva nas costas, no cinto e
// segura nas mãos desenhado no lugar (desenho próprio em SVG). Em volta, os cartões de cada lugar para pôr e tirar.
// Boneco.desenhar({ resumo, lugaresPossiveis(id), aoPor(uid, lugar), aoTirar(uid) }) devolve o elemento.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function s(tag, attrs, pai) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (pai) pai.appendChild(n);
    return n;
  }
  function semAcento(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function espelhar(d) { // espelha um caminho em torno de x = 120 (lado direito do personagem → lado esquerdo)
    return d.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, function (m, x, y) { return (240 - parseFloat(x)) + ' ' + y; });
  }

  // ---------- o corpo (viewBox 0 0 240 430; o personagem olha para quem vê: a mão direita dele fica à esquerda) ----------
  var CORPO = {
    cabeca: 'M120 26 C104 26 97 40 98 56 C99 70 108 80 120 80 C132 80 141 70 142 56 C143 40 136 26 120 26 Z',
    pescoco: 'M111 76 L112 92 L128 92 L129 76 Z',
    tronco: 'M86 96 C98 88 142 88 154 96 C160 110 156 132 152 150 C149 166 148 182 150 200 L90 200 C92 182 91 166 88 150 C84 132 80 110 86 96 Z',
    quadril: 'M90 198 L150 198 C152 212 150 222 146 230 L120 236 L94 230 C90 222 88 212 90 198 Z',
    braco: 'M88 96 C76 98 70 110 68 128 C66 146 64 160 62 176 C60 196 56 214 52 232 L64 236 C68 218 72 200 76 182 C80 164 84 148 86 130 C88 118 92 106 96 100 Z',
    mao: 'M52 230 C46 236 45 248 48 256 C51 262 58 264 63 258 C66 252 66 242 64 234 Z',
    perna: 'M94 228 C92 262 94 296 98 330 C99 350 100 368 101 388 L117 388 C117 366 118 346 118 326 C119 296 119 264 120 236 Z',
    pe: 'M100 386 C94 392 90 402 92 408 L120 408 L118 386 Z'
  };
  var PONTO_MAO = { mao_d: [57, 248], mao_e: [183, 248] };

  // ---------- como desenhar cada tipo de item ----------
  function formaDoItem(it) {
    var n = semAcento(it.nome);
    if (it.escudo) return 'escudo';
    if (/aljava/.test(n)) return 'aljava';
    if (/mochila/.test(n)) return 'mochila';
    if (/algibeira|bolsa|bornal|saco|alforje/.test(n)) return 'bolsa';
    if (/bainha/.test(n)) return 'bainha';
    if (/tocha|lanterna|lampiao|vela/.test(n)) return 'tocha';
    if (/besta/.test(n)) return 'besta';
    if (/\barco\b/.test(n)) return 'arco';
    if (/lanca|alabarda|haste|tridente|glaive|forcado|cajado|pique|bardiche|naginata|bastao longo/.test(n)) return 'haste';
    if (/machad/.test(n)) return 'machado';
    if (/maca|mangual|martelo|porrete|clava|picareta|cassetete|bastao/.test(n)) return 'maca';
    if (/adaga|faca|punhal|estilete|main|kukri/.test(n)) return 'faca';
    if (/espada|sabre|rapieira|tercado|cimitarra|montante|katana|gladio|florete|cutelo|alfanje/.test(n)) return 'espada';
    var p = semAcento(it.pericia);
    if (/arco/.test(p)) return 'arco';
    if (/besta/.test(p)) return 'besta';
    if (/espada|tercado|sabre|rapieira/.test(p)) return 'espada';
    if (/faca/.test(p)) return 'faca';
    if (/haste|lanca/.test(p)) return 'haste';
    if (/machado|maca/.test(p)) return 'maca';
    return 'outro';
  }

  // cada desenho é feito com o ponto de pega em (0,0), apontando para baixo (+y); quem chama gira e posiciona
  var METAL = 'boneco-metal', MADEIRA = 'boneco-madeira', COURO = 'boneco-couro';
  var DESENHO = {
    espada: function (g, tam) {
      var L = tam === 'grande' ? 120 : 92;
      s('path', { d: 'M-3 6 L-3 ' + L + ' L0 ' + (L + 10) + ' L3 ' + L + ' L3 6 Z', class: METAL }, g);
      s('line', { x1: 0, y1: 8, x2: 0, y2: L - 4, class: 'boneco-fio' }, g);
      s('rect', { x: -13, y: 2, width: 26, height: 5, rx: 2, class: METAL }, g);
      s('rect', { x: -2.5, y: -16, width: 5, height: 18, rx: 1.5, class: COURO }, g);
      s('circle', { cx: 0, cy: -18, r: 4, class: METAL }, g);
    },
    faca: function (g) {
      s('path', { d: 'M-2.5 5 L-2.5 34 L0 42 L2.5 34 L2.5 5 Z', class: METAL }, g);
      s('rect', { x: -7, y: 2, width: 14, height: 4, rx: 1.5, class: METAL }, g);
      s('rect', { x: -2.5, y: -11, width: 5, height: 13, rx: 1.5, class: COURO }, g);
    },
    machado: function (g) {
      s('rect', { x: -2.5, y: -60, width: 5, height: 80, rx: 2, class: MADEIRA }, g);
      s('path', { d: 'M2 -60 C14 -66 24 -62 26 -52 C28 -42 24 -36 22 -34 C16 -40 8 -42 2 -40 Z', class: METAL }, g);
    },
    maca: function (g) {
      s('rect', { x: -2.5, y: -52, width: 5, height: 72, rx: 2, class: MADEIRA }, g);
      s('ellipse', { cx: 0, cy: -58, rx: 9, ry: 11, class: METAL }, g);
      [[-9, -58], [9, -58], [0, -70], [-6, -66], [6, -66]].forEach(function (p) { s('circle', { cx: p[0], cy: p[1], r: 2.2, class: METAL }, g); });
    },
    haste: function (g) {
      s('rect', { x: -2.5, y: -150, width: 5, height: 280, rx: 2, class: MADEIRA }, g);
      s('path', { d: 'M-5 -150 L0 -178 L5 -150 Z', class: METAL }, g);
      s('path', { d: 'M3 -150 C12 -152 20 -146 20 -138 C14 -140 8 -140 3 -140 Z', class: METAL }, g);
    },
    arco: function (g, tam, lado) {
      var k = lado === 'd' ? -1 : 1; // a barriga do arco fica para fora do corpo
      s('path', { d: 'M0 -78 C' + (22 * k) + ' -50 ' + (22 * k) + ' 50 0 78', class: MADEIRA + ' boneco-arco' }, g);
      s('line', { x1: 0, y1: -76, x2: 0, y2: 76, class: 'boneco-corda' }, g);
      s('rect', { x: -2.5, y: -7, width: 5, height: 14, rx: 2, class: COURO }, g);
    },
    besta: function (g) {
      s('rect', { x: -3, y: -10, width: 6, height: 58, rx: 2, class: MADEIRA }, g);
      s('path', { d: 'M-26 44 C-12 36 12 36 26 44', class: METAL + ' boneco-arco' }, g);
      s('line', { x1: -24, y1: 44, x2: 24, y2: 44, class: 'boneco-corda' }, g);
    },
    escudo: function (g, tam) {
      var r = tam === 'grande' ? 34 : tam === 'pequeno' ? 20 : 27;
      s('circle', { cx: 0, cy: 0, r: r, class: MADEIRA + ' boneco-escudo' }, g);
      s('circle', { cx: 0, cy: 0, r: r - 4, class: 'boneco-escudo-face' }, g);
      s('circle', { cx: 0, cy: 0, r: r * 0.25, class: METAL }, g);
    },
    tocha: function (g) {
      s('rect', { x: -2.5, y: -40, width: 5, height: 54, rx: 2, class: MADEIRA }, g);
      s('path', { d: 'M0 -62 C8 -54 7 -46 4 -42 L-4 -42 C-7 -46 -8 -54 0 -62 Z', class: 'boneco-fogo' }, g);
    },
    bolsa: function (g) {
      s('path', { d: 'M-9 -2 L9 -2 C11 6 11 14 7 17 L-7 17 C-11 14 -11 6 -9 -2 Z', class: COURO }, g);
      s('path', { d: 'M-9 -2 C-4 4 4 4 9 -2', class: 'boneco-costura' }, g);
    },
    aljava: function (g) {
      s('rect', { x: -6, y: -8, width: 12, height: 46, rx: 3, class: COURO }, g);
      [-4, 0, 4].forEach(function (x) {
        s('line', { x1: x, y1: -8, x2: x, y2: -22, class: 'boneco-haste-flecha' }, g);
        s('path', { d: 'M' + (x - 2) + ' -24 L' + x + ' -30 L' + (x + 2) + ' -24 Z', class: 'boneco-pena' }, g);
      });
    },
    bainha: function (g) {
      s('path', { d: 'M-3.5 0 L-3.5 70 L0 78 L3.5 70 L3.5 0 Z', class: COURO }, g);
    },
    outro: function (g, tam, lado, item) {
      s('circle', { cx: 0, cy: 8, r: 10, class: 'boneco-fundo-icone' }, g);
      var ic = window.iconeSvg && window.iconeSvg(item.icone);
      if (ic) { ic.setAttribute('x', -8); ic.setAttribute('y', 0); ic.setAttribute('width', 16); ic.setAttribute('height', 16); g.appendChild(ic); }
    }
  };
  function tamanho(it) {
    var n = semAcento(it.nome);
    if (it.escudo) return it.escudo.bd >= 3 ? 'grande' : it.escudo.bd <= 1 ? 'pequeno' : 'medio';
    if (/montante|duas maos|bastarda|grande/.test(n)) return 'grande';
    return 'medio';
  }
  function item(pai, x, forma, transform, lado) {
    var g = s('g', { class: 'boneco-item', transform: transform }, pai);
    (DESENHO[forma] || DESENHO.outro)(g, tamanho(x.item), lado, x.item);
    s('title', {}, g).textContent = x.item.nome;
    return g;
  }

  // ---------- roupas e armaduras: textura pelo material, por parte do corpo ----------
  function material(it) {
    var n = semAcento(it.nome);
    if (/malha|cota|anel/.test(n)) return 'malha';
    if (/couro|pele|gibao|jaqueta|acolchoad|sandal|sapato/.test(n)) return 'couro'; // "Elmo de Couro" é couro
    if (/placa|escama|lamel|brigant|segment|peitoral|elmo|capacete|manopla|greva|bracal|gorjal/.test(n)) return 'placas';
    if (/bota|luva/.test(n)) return 'couro';
    return 'tecido';
  }
  var PARTES_DE = {
    'crânio': ['cranio'], rosto: ['rosto'], 'pescoço': ['pescoco'], tronco: ['tronco'], corpo: ['tronco', 'quadril'],
    virilha: ['quadril'], 'braços': ['bracos'], membros: ['bracos', 'pernas'], 'mãos': ['maos'], pernas: ['pernas'], 'pés': ['pes']
  };
  var PERNA_ATE_BOTA = CORPO.perna.replace('L101 388 L117 388', 'L100 372 L118 372');
  function vestir(pai, x) {
    var mat = material(x.item);
    var locais = x.item.protecao ? String(x.item.protecao.local || '').split(/,\s*/) : ['tronco'];
    var partes = {};
    locais.forEach(function (l) { (PARTES_DE[l] || []).forEach(function (p) { partes[p] = true; }); });
    var g = s('g', { class: 'boneco-roupa mat-' + mat }, pai);
    function camada(d, extra) { s('path', { d: d, class: 'boneco-camada' + (extra ? ' ' + extra : ''), fill: 'url(#bn-' + mat + ')' }, g); }
    if (partes.tronco) camada('M88 100 C100 93 140 93 152 100 C157 114 153 134 150 150 C147 166 146 182 148 199 L92 199 C94 182 93 166 90 150 C87 134 83 114 88 100 Z');
    if (partes.quadril) camada('M91 199 L149 199 C151 214 149 226 146 240 L94 240 C91 226 89 214 91 199 Z');
    if (partes.bracos) { var b = 'M88 98 C77 100 72 112 70 128 C68 146 66 160 64 176 C62 194 58 210 55 226 L63 229 C67 212 71 196 74 180 C78 162 82 146 84 130 C86 118 90 108 94 101 Z'; camada(b); camada(espelhar(b)); }
    if (partes.pernas) { camada(PERNA_ATE_BOTA); camada(espelhar(PERNA_ATE_BOTA)); }
    if (partes.pes) { var p = 'M100 364 L118 364 L118 386 L120 408 L92 408 C90 402 94 392 99 386 Z'; camada(p); camada(espelhar(p)); }
    if (partes.maos) { camada(CORPO.mao); camada(espelhar(CORPO.mao)); }
    if (partes.pescoco) camada('M108 84 L132 84 L134 96 L106 96 Z');
    if (partes.cranio) camada('M98 54 C97 36 106 22 120 22 C134 22 143 36 142 54 L142 58 L98 58 Z', 'boneco-elmo');
    // rosto: só elmo de metal fecha o rosto com viseira; couro e tecido ficam com proteção nas bochechas
    if (partes.rosto && (mat === 'placas' || mat === 'malha')) { camada('M99 56 L141 56 C141 70 132 80 120 80 C108 80 99 70 99 56 Z', 'boneco-viseira'); s('path', { d: 'M104 62 L136 62', class: 'boneco-fenda' }, g); }
    else if (partes.rosto) { camada('M99 56 L106 56 L106 72 C102 68 99 62 99 56 Z'); camada('M141 56 L134 56 L134 72 C138 68 141 62 141 56 Z'); }
    s('title', {}, g).textContent = x.item.nome + (x.item.protecao ? ' (RD ' + (x.item.protecao.texto || x.item.protecao.rd) + ')' : '');
  }

  function padroes(svg) {
    var defs = s('defs', {}, svg);
    var malha = s('pattern', { id: 'bn-malha', width: 4, height: 4, patternUnits: 'userSpaceOnUse' }, defs);
    s('rect', { width: 4, height: 4, class: 'bn-malha-fundo' }, malha);
    s('circle', { cx: 2, cy: 2, r: 1.3, class: 'bn-malha-anel' }, malha);
    var placas = s('pattern', { id: 'bn-placas', width: 12, height: 9, patternUnits: 'userSpaceOnUse' }, defs);
    s('rect', { width: 12, height: 9, class: 'bn-placas-fundo' }, placas);
    s('path', { d: 'M0 8.5 L12 8.5', class: 'bn-placas-junta' }, placas);
    s('circle', { cx: 2, cy: 2, r: 0.8, class: 'bn-placas-rebite' }, placas);
    var couro = s('pattern', { id: 'bn-couro', width: 10, height: 10, patternUnits: 'userSpaceOnUse' }, defs);
    s('rect', { width: 10, height: 10, class: 'bn-couro-fundo' }, couro);
    s('path', { d: 'M0 5 L3 5 M6 5 L9 5', class: 'bn-couro-ponto' }, couro);
    var tecido = s('pattern', { id: 'bn-tecido', width: 6, height: 6, patternUnits: 'userSpaceOnUse' }, defs);
    s('rect', { width: 6, height: 6, class: 'bn-tecido-fundo' }, tecido);
    s('path', { d: 'M0 6 L6 0', class: 'bn-tecido-fio' }, tecido);
  }

  // ---------- o desenho inteiro ----------
  function figura(equipados) {
    var svg = s('svg', { viewBox: '0 -20 240 440', class: 'boneco-corpo', role: 'img', 'aria-label': 'O personagem com o que veste e leva' });
    padroes(svg);
    function doLugar(l) { return equipados.filter(function (x) { return x.sel.lugar === l; }); }
    var costas = doLugar('costas'), cinto = doLugar('cinto'), vestido = doLugar('corpo');

    // 1. costas (atrás do corpo): mochila aparece acima dos ombros; armas e aljava cruzam as costas
    var atras = s('g', { class: 'boneco-atras' }, svg);
    costas.forEach(function (x, k) {
      var f = formaDoItem(x.item);
      if (f === 'mochila' || f === 'bolsa' || f === 'outro') {
        var g = s('g', { class: 'boneco-item' }, atras);
        s('path', { d: 'M84 84 C84 64 156 64 156 84 L158 156 L82 156 Z', class: COURO + ' boneco-mochila' }, g);
        s('path', { d: 'M90 78 C102 70 138 70 150 78', class: 'boneco-costura' }, g);
        s('title', {}, g).textContent = x.item.nome;
      } else if (f === 'aljava') item(atras, x, 'aljava', 'translate(86 88) rotate(-28)');
      else if (f === 'escudo') item(atras, x, 'escudo', 'translate(' + (k ? 92 : 150) + ' 128)');
      else if (f === 'arco') item(atras, x, 'arco', 'translate(120 150) rotate(40)', 'e');
      // arma nas costas: o cabo por cima do ombro, a lâmina ou o cabo longo descendo atrás do corpo
      else item(atras, x, f, 'translate(' + (k ? 150 : 90) + ' 66) rotate(' + (k ? 30 : -30) + ')');
    });

    // 2. o corpo
    var corpo = s('g', { class: 'boneco-pele' }, svg);
    ['perna', 'pe', 'braco', 'mao'].forEach(function (p) {
      s('path', { d: CORPO[p] }, corpo);
      s('path', { d: espelhar(CORPO[p]) }, corpo);
    });
    ['quadril', 'tronco', 'pescoco', 'cabeca'].forEach(function (p) { s('path', { d: CORPO[p] }, corpo); });

    // 3. roupas e armaduras (da mais leve para a mais pesada, que fica por cima)
    var roupas = s('g', {}, svg);
    vestido.slice().sort(function (a, b) {
      return ((a.item.protecao && a.item.protecao.rd) || 0) - ((b.item.protecao && b.item.protecao.rd) || 0);
    }).forEach(function (x) { vestir(roupas, x); });

    // alças do que vai nas costas (mochila: duas alças; arma, arco ou aljava: uma faixa cruzando o peito)
    var alcas = s('g', { class: 'boneco-alcas' }, svg);
    costas.forEach(function (x) {
      var f = formaDoItem(x.item);
      if (f === 'mochila' || f === 'bolsa' || f === 'outro') {
        s('path', { d: 'M100 94 C100 120 98 140 96 160' }, alcas);
        s('path', { d: 'M140 94 C140 120 142 140 144 160' }, alcas);
      } else s('path', { d: 'M96 96 L150 196' }, alcas);
    });

    // 4. cinto e o que está pendurado nele: armas nos quadris, bolsas e facas na frente
    if (cinto.length || vestido.length) s('path', { d: 'M90 194 C104 199 136 199 150 194 L150 202 C136 207 104 207 90 202 Z', class: COURO + ' boneco-cinto' }, svg);
    var quadris = [[150, 200, 14], [90, 200, -14]], frente = [[108, 206, 0], [132, 206, 0]];
    cinto.forEach(function (x) {
      var f = formaDoItem(x.item);
      var grande = f === 'espada' || f === 'machado' || f === 'maca' || f === 'haste' || f === 'arco' || f === 'besta' || f === 'aljava';
      var p = (grande ? quadris.shift() || frente.shift() : frente.shift() || quadris.shift());
      if (!p) return;
      if (f === 'espada') { // na bainha: só o cabo aparece acima do cinto
        var g = s('g', { class: 'boneco-item', transform: 'translate(' + p[0] + ' ' + p[1] + ') rotate(' + p[2] + ')' }, svg);
        DESENHO.bainha(g);
        s('rect', { x: -10, y: -3, width: 20, height: 4, rx: 1.5, class: METAL }, g);
        s('rect', { x: -2.5, y: -18, width: 5, height: 15, rx: 1.5, class: COURO }, g);
        s('circle', { cx: 0, cy: -20, r: 3.5, class: METAL }, g);
        s('title', {}, g).textContent = x.item.nome;
      } else if (f === 'machado' || f === 'maca') item(svg, x, f, 'translate(' + p[0] + ' ' + (p[1] - 12) + ') rotate(' + (180 + p[2]) + ')');
      else if (f === 'aljava') item(svg, x, 'aljava', 'translate(' + p[0] + ' ' + (p[1] + 4) + ') rotate(' + p[2] + ')');
      else if (f === 'faca') item(svg, x, 'faca', 'translate(' + p[0] + ' ' + (p[1] + 8) + ')');
      else item(svg, x, f, 'translate(' + p[0] + ' ' + (p[1] + 4) + ')');
    });

    // 5. nas mãos, com os dedos por cima do cabo
    var luvas = vestido.some(function (v) { return /luva|manopla/.test(semAcento(v.item.nome)); });
    ['mao_d', 'mao_e'].forEach(function (m) {
      var x = equipados.filter(function (y) {
        if (y.sel.lugar === m) return true;
        if (y.sel.lugar !== 'maos') return false;
        var fy = formaDoItem(y.item);
        return m === (fy === 'arco' || fy === 'besta' ? 'mao_e' : 'mao_d');
      })[0];
      if (!x) return;
      var f = formaDoItem(x.item);
      var pt = PONTO_MAO[m], lado = m === 'mao_d' ? 'd' : 'e', sinal = lado === 'd' ? 1 : -1;
      var t;
      if (f === 'escudo') t = 'translate(' + (pt[0] - 6 * sinal) + ' ' + (pt[1] - 22) + ')';
      else if (f === 'haste') t = 'translate(' + pt[0] + ' ' + pt[1] + ') rotate(' + (3 * sinal) + ')';
      else if (f === 'arco' || f === 'besta') t = 'translate(' + pt[0] + ' ' + pt[1] + ')';
      else if (f === 'machado' || f === 'maca' || f === 'tocha') t = 'translate(' + pt[0] + ' ' + pt[1] + ') rotate(' + (-14 * sinal) + ')';
      else t = 'translate(' + pt[0] + ' ' + pt[1] + ') rotate(' + (16 * sinal) + ')';
      item(svg, x, f, t, lado);
      if (f !== 'escudo') s('ellipse', { cx: pt[0], cy: pt[1], rx: 6.5, ry: 5.5, class: 'boneco-dedos' + (luvas ? ' com-luva' : '') }, svg);
    });
    return svg;
  }

  function cartao(lugar, titulo, dentro, opcoes, livres) {
    var c = el('div', 'boneco-lugar boneco-' + lugar);
    c.appendChild(el('span', 'boneco-lugar-nome', titulo));
    var ul = el('ul');
    if (!dentro.length) ul.appendChild(el('li', 'boneco-vazio', 'vazio'));
    dentro.forEach(function (x) {
      var li = el('li');
      var ic = window.iconeSvg && window.iconeSvg(x.item.icone, 'icone-item');
      if (ic) li.appendChild(ic);
      var nome = el('button', 'app-item-nome-btn', x.item.nome + (x.sel.lugar === 'maos' ? ' (duas mãos)' : ''));
      nome.type = 'button';
      nome.addEventListener('click', function () { if (window.ItemUI) window.ItemUI.abrir(x.item, { link: false }); });
      li.appendChild(nome);
      if (opcoes.aoTirar) {
        var tira = el('button', 'boneco-tira', '×');
        tira.type = 'button';
        tira.title = 'Guardar na mochila (levado)';
        tira.setAttribute('aria-label', 'Tirar ' + x.item.nome + ' de ' + titulo);
        tira.addEventListener('click', function () { opcoes.aoTirar(x.sel.uid); });
        li.appendChild(tira);
      }
      ul.appendChild(li);
    });
    c.appendChild(ul);
    // pôr outro item aqui (o que estava na mão sai sozinho)
    if (opcoes.aoPor && livres.length) {
      var sel = el('select', 'boneco-por');
      sel.setAttribute('aria-label', 'Pôr em ' + titulo);
      var vazio = el('option', null, '+ pôr aqui…');
      vazio.value = '';
      sel.appendChild(vazio);
      livres.forEach(function (x) {
        var o = el('option', null, x.item.nome);
        o.value = x.sel.uid;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () { if (sel.value) opcoes.aoPor(sel.value, lugar); });
      c.appendChild(sel);
    }
    return c;
  }

  // opcoes: { resumo, lugaresPossiveis(id) → [lugar], aoPor(uid, lugar), aoTirar(uid) }
  function desenhar(opcoes) {
    var r = opcoes.resumo;
    var itens = r.equipamento.filter(function (x) { return x.item && x.local !== 'guardado'; });
    var equipados = itens.filter(function (x) { return x.local === 'equipado' && !x.sel.dentro; });
    function em(lugar) {
      return equipados.filter(function (x) { return x.sel.lugar === lugar || (x.sel.lugar === 'maos' && (lugar === 'mao_d' || lugar === 'mao_e')); });
    }
    function podemIr(lugar) {
      return itens.filter(function (x) {
        if (em(lugar).indexOf(x) !== -1) return false;
        var pode = opcoes.lugaresPossiveis ? opcoes.lugaresPossiveis(x.item.id) : [];
        return pode.indexOf(lugar) !== -1 || ((lugar === 'mao_d' || lugar === 'mao_e') && pode.indexOf('maos') !== -1);
      });
    }
    // arma só de duas mãos posta numa mão vai para "duas mãos"
    var aoPorOriginal = opcoes.aoPor;
    var porDeVerdade = aoPorOriginal && function (uid, lugar) {
      var x = itens.filter(function (y) { return y.sel.uid === uid; })[0];
      var pode = x && opcoes.lugaresPossiveis ? opcoes.lugaresPossiveis(x.item.id) : [];
      aoPorOriginal(uid, pode.indexOf(lugar) === -1 && pode.indexOf('maos') !== -1 ? 'maos' : lugar);
    };
    opcoes = Object.assign({}, opcoes, { aoPor: porDeVerdade });
    var b = el('div', 'boneco');
    var esq = el('div', 'boneco-lado');
    esq.appendChild(cartao('mao_d', 'Mão direita', em('mao_d'), opcoes, podemIr('mao_d')));
    esq.appendChild(cartao('cinto', 'Cinto', em('cinto'), opcoes, podemIr('cinto')));
    var dir = el('div', 'boneco-lado');
    dir.appendChild(cartao('mao_e', 'Mão esquerda', em('mao_e'), opcoes, podemIr('mao_e')));
    dir.appendChild(cartao('costas', 'Costas', em('costas'), opcoes, podemIr('costas')));
    b.appendChild(esq);
    var meio = el('div', 'boneco-meio');
    meio.appendChild(figura(equipados));
    var vestido = em('corpo');
    if (vestido.length) meio.appendChild(el('p', 'boneco-vestido', 'Vestido: ' + vestido.map(function (x) { return x.item.nome; }).join(', ')));
    b.appendChild(meio);
    b.appendChild(dir);
    return b;
  }

  window.Boneco = { desenhar: desenhar, formaDoItem: formaDoItem };
})();
