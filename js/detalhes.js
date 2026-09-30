// js/detalhes.js — itens do GURPS em card compacto + janela de detalhes (modal).
//   ItemUI.card(item, { aoAbrir })      card pequeno e clicável (ícone, nome, custo, status, resumo de uma linha)
//   ItemUI.abrir(item, { acao })        janela com tudo: descrição, exemplos, Adamar, versões, efeitos, página, GCS, relacionados
//   ItemUI.selo(item) / ItemUI.meta(item) / ItemUI.lista(item)   rótulos usados pelas listas
//   detalhesItem(item)                  bloco "Mais sobre" recolhido (usado dentro de outras janelas)
// Campos futuros já previstos: item.raridade (texto) e item.imagem (caminho a partir da raiz do site).
(function () {
  var G = window.GURPS || {};

  var GRUPOS = {
    combate: 'Combate', corpo: 'Corpo e movimento', natureza: 'Natureza e viagem',
    oficio: 'Ofícios', social: 'Social', saber: 'Saberes', ladinagem: 'Ladinagem',
    misterio: 'Mistério e cinematográfico', tecnologia: 'Tecnologia moderna'
  };
  var TIPOS_TRACO = { mental: 'Mental', fisica: 'Física', social: 'Social', exotica: 'Exótica', sobrenatural: 'Sobrenatural' };
  var CATEGORIAS_EQUIP = {
    'arma-corpo-a-corpo': 'Armas de combate corpo a corpo', 'arma-distancia': 'Armas de combate à distância',
    'arma-de-fogo': 'Armas de fogo', 'arma-pesada': 'Armas pesadas', 'municao': 'Munição e projéteis',
    'armadura': 'Armaduras', 'armadura-cavalo': 'Armaduras para cavalos', 'escudo': 'Escudos', 'equipamento': 'Equipamento variado'
  };
  var ADAMAR = {
    livre: { rotulo: 'Livre', classe: 'st-livre' },
    narrador: { rotulo: 'Com o narrador', classe: 'st-narrador' },
    nao: { rotulo: 'Não existe em Adamar', classe: 'st-nao' }
  };
  var NOMES_LISTA = { pericias: 'Perícia', vantagens: 'Vantagem', desvantagens: 'Desvantagem', equipamento: 'Equipamento' };

  // textos longos (descrição, exemplos, Adamar, dica) ficam em js/dados-textos.js: carregados uma vez e juntados aos itens
  var textosProntos = !G.textos_url;
  var esperando = [];
  function carregarTextos(pronto) {
    if (textosProntos) { if (pronto) pronto(); return; }
    if (pronto) esperando.push(pronto);
    if (carregarTextos.pedido) return;
    carregarTextos.pedido = true;
    var sc = document.createElement('script');
    sc.src = (document.body.getAttribute('data-root') || '') + G.textos_url;
    sc.onload = function () {
      var T = window.GURPS_TEXTOS || {};
      function juntar(g) {
        Object.keys(T).forEach(function (lista) {
          (g[lista] || []).forEach(function (it) { if (T[lista][it.id] && !it.descricao) Object.assign(it, T[lista][it.id]); });
        });
      }
      if (window.Sistemas) window.Sistemas.cada(juntar); else juntar(G);
      textosProntos = true;
      esperando.splice(0).forEach(function (f) { f(); });
    };
    sc.onerror = function () { textosProntos = true; esperando.splice(0).forEach(function (f) { f(); }); };
    document.head.appendChild(sc);
  }
  // em segundo plano, logo depois que a página abre
  if (G.textos_url) {
    var cedo = function () { carregarTextos(); };
    if (window.requestIdleCallback) window.requestIdleCallback(cedo, { timeout: 2500 }); else setTimeout(cedo, 800);
  }

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function raiz() { return document.body.getAttribute('data-root') || ''; }

  // em qual lista o item está (o mesmo objeto, ou pelo id)
  function lista(item) {
    var nomes = ['pericias', 'vantagens', 'desvantagens', 'equipamento'];
    for (var k = 0; k < nomes.length; k++) if ((G[nomes[k]] || []).indexOf(item) !== -1) return nomes[k];
    for (k = 0; k < nomes.length; k++) if ((G[nomes[k]] || []).some(function (x) { return x.id === item.id; })) return nomes[k];
    return null;
  }
  function porId(id) {
    var nomes = ['pericias', 'vantagens', 'desvantagens', 'equipamento'];
    for (var k = 0; k < nomes.length; k++) {
      var achou = (G[nomes[k]] || []).filter(function (x) { return x.id === id; })[0];
      if (achou) return achou;
    }
    return null;
  }

  // "Variável" e custos por nível ("5/nível") ficam sem unidade; "1" e "-1" levam "pt"; o resto, "pts".
  function unidadePontos(c) {
    if (!/^[-+]?\d/.test(c) || c.indexOf('/') !== -1) return '';
    return /^-?1$/.test(c) ? ' pt' : ' pts';
  }
  function preco(p) {
    if (!p) return null;
    return (p.adicional ? '+' : '') + p.valor.toLocaleString('pt-BR') + (p.valor === 1 ? ' coroa' : ' coroas') +
      (p.por ? ' (' + p.por + ')' : '') + (p.nota ? ' ' + p.nota : '');
  }

  function nt(item) {
    if (item.nt === '^') return 'Superciência';
    if (item.nt === '—' || item.nt == null) return '';
    return item.nt === 'var.' ? 'NT variável' : 'NT' + item.nt;
  }
  function titulo(item) { return item.nome + (lista(item) === 'pericias' && item.nt ? '/NT' : ''); }
  function selo(item) {
    var l = lista(item);
    if (l === 'pericias') return item.atributo + '/' + item.dificuldade;
    if (l === 'equipamento') return preco(item.preco) || nt(item);
    return item.custo + unidadePontos(String(item.custo));
  }
  // categoria curta, para o card
  function categoria(item) {
    var l = lista(item);
    if (l === 'pericias') return GRUPOS[item.grupo] || '';
    if (l === 'equipamento') return item.subcategoria || CATEGORIAS_EQUIP[item.categoria] || '';
    var m = (item.tipo || []).map(function (t) { return TIPOS_TRACO[t]; }).join(' · ');
    if (item.categoria === 'qualidade') m += (m ? ' · ' : '') + 'Qualidade';
    if (item.categoria === 'peculiaridade') m += (m ? ' · ' : '') + 'Peculiaridade';
    return m;
  }
  // ficha técnica: pares [rótulo, valor]
  function meta(item) {
    var l = lista(item);
    var m = [];
    if (l === 'pericias') {
      m.push(['Atributo e dificuldade', item.atributo + '/' + item.dificuldade]);
      m.push(['Grupo', GRUPOS[item.grupo]]);
      if (item.predefinido) m.push(['Pré-definido', item.predefinido]);
      if (item.especializacao) m.push(['Especialização', 'obrigatória']);
    } else if (l === 'equipamento') {
      m.push(['Categoria', item.subcategoria || CATEGORIAS_EQUIP[item.categoria]]);
      m.push(['Nível tecnológico', nt(item)]);
      if (item.pericia) m.push(['Perícia', item.pericia]);
      if (item.preco) m.push(['Preço', preco(item.preco)]);
    } else {
      m.push(['Custo', item.custo + unidadePontos(String(item.custo))]);
      if (categoria(item)) m.push(['Tipo', categoria(item)]);
    }
    if (item.raridade) m.push(['Raridade', item.raridade]);
    var livro = (G.livros || {})[item.ref && item.ref.livro];
    if (item.ref) m.push(['Livro', (livro ? livro.titulo + ', ' : '') + 'pág. ' + item.ref.pagina]);
    if (item.gcs) m.push(['No GCS', item.gcs.nome + (item.gcs.ref ? ' (' + item.gcs.ref + ')' : '')]);
    return m.filter(function (x) { return x[1]; });
  }

  function icone(item, classe) { return window.iconeSvg ? window.iconeSvg(item.icone, classe) : null; }

  // ---------- card compacto ----------
  function card(item, opcoes) {
    opcoes = opcoes || {};
    var st = ADAMAR[item.adamar] || ADAMAR.livre;
    var b = el('button', 'item-card ' + st.classe);
    b.type = 'button';
    b.id = item.id;
    b.setAttribute('aria-haspopup', 'dialog');
    if (item.imagem) {
      var img = el('img', 'item-card-img');
      img.src = raiz() + item.imagem;
      img.alt = '';
      img.loading = 'lazy';
      b.appendChild(img);
    }
    var topo = el('span', 'item-card-topo');
    var ic = icone(item, 'item-card-icone');
    if (ic) topo.appendChild(ic);
    var nome = el('strong', 'item-card-nome', titulo(item));
    if (item.especializacao && lista(item) === 'pericias') {
      var adaga = el('span', 'pericia-esp', '†');
      adaga.title = 'Exige especialização';
      nome.appendChild(adaga);
    }
    topo.appendChild(nome);
    topo.appendChild(el('span', 'item-card-selo', selo(item)));
    b.appendChild(topo);
    b.appendChild(el('span', 'item-card-resumo', item.resumo));
    var pe = el('span', 'item-card-pe');
    pe.appendChild(el('span', 'item-card-status', st.rotulo));
    if (item.raridade) pe.appendChild(el('span', 'item-card-raridade', item.raridade));
    var cat = categoria(item);
    if (cat) pe.appendChild(el('span', 'item-card-cat', cat));
    b.appendChild(pe);
    b.addEventListener('click', function () {
      if (opcoes.aoAbrir) opcoes.aoAbrir(item);
      else abrir(item, opcoes.janela);
    });
    return b;
  }

  // ---------- bloco "Mais sobre" (para dentro de outras janelas) ----------
  function corpoDetalhes(item, destino, aoAbrirRelacionado) {
    if (item.descricao) item.descricao.split(/\n\n+/).forEach(function (par) { destino.appendChild(el('p', null, par)); });
    if (item.exemplos && item.exemplos.length) {
      destino.appendChild(el('h4', null, 'Na mesa'));
      var ul = el('ul', 'detalhes-exemplos');
      item.exemplos.forEach(function (x) { ul.appendChild(el('li', null, x)); });
      destino.appendChild(ul);
    }
    if (item.em_adamar) {
      destino.appendChild(el('h4', null, 'Em Adamar'));
      destino.appendChild(el('p', null, item.em_adamar));
    }
    if (item.dica_mesa) destino.appendChild(el('p', 'detalhes-dica', 'Dica: ' + item.dica_mesa));
    var rel = (item.relacionados || []).map(porId).filter(Boolean);
    if (rel.length) {
      destino.appendChild(el('h4', null, 'Veja também'));
      var chips = el('div', 'item-rel');
      rel.forEach(function (r) {
        var c = el(aoAbrirRelacionado ? 'button' : 'span', 'item-rel-chip');
        if (aoAbrirRelacionado) {
          c.type = 'button';
          c.addEventListener('click', function () { aoAbrirRelacionado(r); });
        }
        var icR = icone(r, 'icone-item');
        if (icR) c.appendChild(icR);
        c.appendChild(document.createTextNode(r.nome));
        chips.appendChild(c);
      });
      destino.appendChild(chips);
    }
  }
  window.detalhesItem = function (item, aberto) {
    if (!item || !item.descricao) return null;
    var d = el('details', 'detalhes-item');
    if (aberto) d.open = true;
    d.appendChild(el('summary', null, 'Mais sobre ' + item.nome));
    corpoDetalhes(item, d, null);
    return d;
  };

  // ---------- janela de detalhes ----------
  var janela = null;
  var hashAoAbrir = null;
  function dialogo() {
    if (janela) return janela;
    janela = el('dialog', 'item-dialogo');
    janela.setAttribute('aria-labelledby', 'item-dialogo-titulo');
    janela.addEventListener('click', function (e) { if (e.target === janela) janela.close(); });
    janela.addEventListener('close', function () {
      if (hashAoAbrir !== null && history.replaceState) history.replaceState(null, '', location.pathname + location.search + hashAoAbrir);
      hashAoAbrir = null;
    });
    document.body.appendChild(janela);
    return janela;
  }

  function abrir(item, opcoes) {
    opcoes = opcoes || {};
    if (!textosProntos) { carregarTextos(function () { abrir(item, opcoes); }); return; }
    var d = dialogo();
    d.textContent = '';
    var st = ADAMAR[item.adamar] || ADAMAR.livre;
    d.className = 'item-dialogo ' + st.classe;

    var fechar = el('button', 'jogar-fechar', '×');
    fechar.type = 'button';
    fechar.setAttribute('aria-label', 'Fechar');
    fechar.addEventListener('click', function () { d.close(); });
    d.appendChild(fechar);

    if (item.imagem) {
      var img = el('img', 'item-dialogo-img');
      img.src = raiz() + item.imagem;
      img.alt = item.nome;
      d.appendChild(img);
    }
    var cab = el('div', 'item-dialogo-cab');
    var ic = icone(item, 'item-dialogo-icone');
    if (ic) cab.appendChild(ic);
    var tt = el('div', 'item-dialogo-titulos');
    tt.appendChild(el('p', 'item-dialogo-tipo', NOMES_LISTA[lista(item)] || ''));
    var h = el('h2', null, titulo(item));
    h.id = 'item-dialogo-titulo';
    tt.appendChild(h);
    cab.appendChild(tt);
    cab.appendChild(el('span', 'item-dialogo-selo', selo(item)));
    d.appendChild(cab);

    var chips = el('div', 'item-dialogo-chips');
    chips.appendChild(el('span', 'item-card-status', st.rotulo));
    if (item.raridade) chips.appendChild(el('span', 'item-card-raridade', item.raridade));
    d.appendChild(chips);

    d.appendChild(el('p', 'item-dialogo-resumo', item.resumo));

    var corpo = el('div', 'item-dialogo-corpo');
    corpoDetalhes(item, corpo, function (r) { abrir(r, opcoes.relacionados ? opcoes.relacionados(r) : {}); });

    if (item.variantes && item.variantes.length) {
      corpo.appendChild(el('h4', null, 'Versões'));
      var ul = el('ul', 'pericia-variantes');
      item.variantes.forEach(function (v) {
        var li = el('li');
        li.appendChild(el('strong', null, v.nome + ' (' + (v.custo > 0 ? '+' : '') + v.custo + ')'));
        li.appendChild(document.createTextNode(' ' + v.resumo));
        ul.appendChild(li);
      });
      corpo.appendChild(ul);
    }
    if (item.efeitos && item.efeitos.length && window.GurpsEfeitos) {
      corpo.appendChild(el('h4', null, 'Efeitos na ficha'));
      var ef = el('ul', 'efeitos');
      window.GurpsEfeitos.desenharEfeitos(ef, item.efeitos.map(function (e) {
        var nomeVar = e.variante != null && item.variantes ? item.variantes[e.variante].nome + ': ' : '';
        return { tipo: window.GurpsEfeitos.tipoEfeito(e), texto: nomeVar + window.GurpsEfeitos.textoEfeito(e, G) };
      }));
      corpo.appendChild(ef);
    }
    d.appendChild(corpo);

    var dl = el('dl', 'item-dialogo-meta');
    meta(item).forEach(function (m) {
      var linha = el('div');
      linha.appendChild(el('dt', null, m[0]));
      linha.appendChild(el('dd', null, m[1]));
      dl.appendChild(linha);
    });
    d.appendChild(dl);

    if (opcoes.acao) {
      var pe = el('div', 'item-dialogo-pe');
      var b = el('button', 'btn btn-primary', opcoes.acao.rotulo);
      b.type = 'button';
      b.disabled = !!opcoes.acao.desabilitado;
      b.addEventListener('click', function () { d.close(); opcoes.acao.fazer(item); });
      pe.appendChild(b);
      d.appendChild(pe);
    }

    // o endereço aponta para o item aberto (dá para mandar o link); ao fechar, volta ao que era
    if (opcoes.link !== false && history.replaceState) {
      if (hashAoAbrir === null) hashAoAbrir = location.hash === '#' + item.id ? '' : location.hash; // aberto por link: ao fechar, limpa
      history.replaceState(null, '', location.pathname + location.search + '#' + item.id);
    }
    if (!d.open) d.showModal();
    d.scrollTop = 0;
    fechar.focus();
  }

  window.ItemUI = {
    card: card, abrir: abrir, carregarTextos: carregarTextos, selo: selo, meta: meta, categoria: categoria, lista: lista, porId: porId,
    GRUPOS: GRUPOS, TIPOS_TRACO: TIPOS_TRACO, CATEGORIAS_EQUIP: CATEGORIAS_EQUIP, ADAMAR: ADAMAR
  };
})();
