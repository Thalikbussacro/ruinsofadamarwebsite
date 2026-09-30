// js/boneco.js — o boneco do personagem: o corpo com a proteção de cada parte e, em volta, o que está nas mãos,
// nas costas e no cinto. Boneco.desenhar({ resumo, lugares, aoPor(uid, lugar), aoTirar(uid) }) devolve o elemento.
// Sem aoPor/aoTirar, fica só para ver.
(function () {
  var SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  // partes do corpo (desenho próprio, 200×380): nome, chaves da proteção que valem ali, forma
  var PARTES = [
    ['Crânio', ['crânio'], 'path', { d: 'M78 40 C78 14 122 14 122 40 L122 44 L78 44 Z' }],
    ['Rosto', ['rosto'], 'path', { d: 'M78 44 L122 44 C122 62 112 72 100 72 C88 72 78 62 78 44 Z' }],
    ['Pescoço', ['pescoço'], 'rect', { x: 91, y: 71, width: 18, height: 11, rx: 3 }],
    ['Tronco', ['tronco', 'corpo'], 'path', { d: 'M66 84 C66 80 76 80 86 80 L114 80 C124 80 134 80 134 84 L130 160 L70 160 Z' }],
    ['Virilha', ['virilha', 'corpo'], 'path', { d: 'M70 160 L130 160 L126 186 L100 190 L74 186 Z' }],
    ['Braço direito', ['braços', 'membros'], 'path', { d: 'M64 86 L52 90 L40 170 L54 172 L66 110 Z' }],
    ['Braço esquerdo', ['braços', 'membros'], 'path', { d: 'M136 86 L148 90 L160 170 L146 172 L134 110 Z' }],
    ['Mão direita', ['mãos'], 'ellipse', { cx: 46, cy: 184, rx: 9, ry: 12 }],
    ['Mão esquerda', ['mãos'], 'ellipse', { cx: 154, cy: 184, rx: 9, ry: 12 }],
    ['Perna direita', ['pernas', 'membros'], 'path', { d: 'M75 188 L99 191 L96 340 L80 340 Z' }],
    ['Perna esquerda', ['pernas', 'membros'], 'path', { d: 'M101 191 L125 188 L120 340 L104 340 Z' }],
    ['Pé direito', ['pés'], 'path', { d: 'M78 340 L97 340 L98 356 L70 356 C70 348 74 344 78 340 Z' }],
    ['Pé esquerdo', ['pés'], 'path', { d: 'M103 340 L122 340 C126 344 130 348 130 356 L102 356 Z' }]
  ];

  // onde desenhar o ícone de cada coisa sobre o corpo
  var PONTO_MAO = { mao_d: [40, 200], mao_e: [160, 200] };
  var PONTO_PARTE = {
    'crânio': [100, 27], rosto: [100, 57], 'pescoço': [100, 77], tronco: [100, 116], corpo: [100, 116], virilha: [100, 173],
    'braços': [53, 128], membros: [53, 128], 'mãos': [46, 184], pernas: [88, 262], pés: [87, 349]
  };
  function icone(grupo, x, tam, cx, cy, classe) {
    var g = svg('g', { class: 'boneco-item' + (classe ? ' ' + classe : '') });
    g.appendChild(svg('circle', { cx: cx, cy: cy, r: tam / 2 + 3 }));
    var ic = window.iconeSvg && window.iconeSvg(x.item.icone);
    if (ic) {
      ic.setAttribute('x', cx - tam / 2);
      ic.setAttribute('y', cy - tam / 2);
      ic.setAttribute('width', tam);
      ic.setAttribute('height', tam);
      g.appendChild(ic);
    }
    var t = svg('title', {});
    t.textContent = x.item.nome;
    g.appendChild(t);
    grupo.appendChild(g);
  }

  function corpo(protecao, equipados) {
    var s = svg('svg', { viewBox: '24 4 152 364', class: 'boneco-corpo', role: 'img', 'aria-label': 'Proteção por parte do corpo e o que o personagem leva' });
    function doLugar(l) { return equipados.filter(function (x) { return x.sel.lugar === l; }); }
    // costas: atrás do corpo, aparecendo por cima dos ombros
    doLugar('costas').forEach(function (x, k) { icone(s, x, 20, k === 0 ? 62 : 138, 70, 'atras'); });
    PARTES.forEach(function (p) {
      var rd = 0, pecas = [];
      p[1].forEach(function (k) {
        var x = protecao[k];
        if (x) { rd += x.rd || 0; pecas = pecas.concat(x.itens || []); }
      });
      var forma = svg(p[2], p[3]);
      forma.setAttribute('class', 'boneco-parte' + (rd ? ' protegida' : ''));
      if (rd) forma.style.fillOpacity = String(Math.min(0.85, 0.25 + rd * 0.1));
      var t = svg('title', {});
      t.textContent = p[0] + (rd ? ': RD ' + rd + ' (' + pecas.join(', ') + ')' : ': sem proteção');
      forma.appendChild(t);
      s.appendChild(forma);
    });
    // vestido: o ícone de cada peça na primeira parte que ela cobre
    var usados = {};
    doLugar('corpo').forEach(function (x) {
      var local = x.item.protecao ? String(x.item.protecao.local || '').split(/,\s*/)[0] : 'tronco';
      var p = PONTO_PARTE[local] || PONTO_PARTE.tronco;
      var n = usados[local] = (usados[local] || 0) + 1;
      var desvio = [0, 16, -16, 32, -32][Math.min(n - 1, 4)];
      icone(s, x, 14, p[0] + desvio, p[1], 'vestido');
    });
    // cinto: na cintura, lado a lado
    doLugar('cinto').forEach(function (x, k) { icone(s, x, 13, 76 + k * 16, 160, 'cinto'); });
    // mãos (duas mãos: o mesmo ícone nas duas)
    ['mao_d', 'mao_e'].forEach(function (m) {
      equipados.filter(function (x) { return x.sel.lugar === m || x.sel.lugar === 'maos'; }).slice(0, 1).forEach(function (x) {
        icone(s, x, 24, PONTO_MAO[m][0], PONTO_MAO[m][1], 'na-mao');
      });
    });
    return s;
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
      var s = el('select', 'boneco-por');
      s.setAttribute('aria-label', 'Pôr em ' + titulo);
      var vazio = el('option', null, '+ pôr aqui…');
      vazio.value = '';
      s.appendChild(vazio);
      livres.forEach(function (x) {
        var o = el('option', null, x.item.nome);
        o.value = x.sel.uid;
        s.appendChild(o);
      });
      s.addEventListener('change', function () { if (s.value) opcoes.aoPor(s.value, lugar); });
      c.appendChild(s);
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
    meio.appendChild(corpo(r.combate.protecao || {}, equipados));
    var vestido = em('corpo');
    if (vestido.length) meio.appendChild(el('p', 'boneco-vestido', 'Vestido: ' + vestido.map(function (x) { return x.item.nome; }).join(', ')));
    b.appendChild(meio);
    b.appendChild(dir);
    return b;
  }

  window.Boneco = { desenhar: desenhar };
})();
