// js/pericias.js — listas filtráveis do GURPS para Adamar: perícias, vantagens e desvantagens.
// A página indica qual lista mostrar em #lista-gurps[data-lista]; os dados vêm de js/dados-gurps.js
// (gerado a partir de data/gurps/*.json por tools/gerar-dados.mjs).
(function () {
  var lista = document.getElementById('lista-gurps');
  if (!lista) return;
  var busca = document.getElementById('busca-gurps');
  var filtro = document.getElementById('filtro-gurps');
  var contagem = document.getElementById('contagem-gurps');
  var botoesStatus = Array.prototype.slice.call(document.querySelectorAll('[data-status]'));
  var GURPS = window.GURPS || { pericias: [], vantagens: [], desvantagens: [], livros: {} };

  var GRUPOS = {
    combate: 'Combate', corpo: 'Corpo e movimento', natureza: 'Natureza e viagem',
    oficio: 'Ofícios', social: 'Social', saber: 'Saberes', ladinagem: 'Ladinagem',
    misterio: 'Mistério e cinematográfico', tecnologia: 'Tecnologia moderna'
  };
  var TIPOS_TRACO = {
    mental: 'Mental', fisica: 'Física', social: 'Social', exotica: 'Exótica', sobrenatural: 'Sobrenatural'
  };
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

  // "Variável" e custos por nível ("5/nível") ficam sem unidade; "1" e "-1" levam "pt"; o resto, "pts".
  function unidadePontos(c) {
    if (!/^[-+]?\d/.test(c) || c.indexOf('/') !== -1) return '';
    return /^-?1$/.test(c) ? ' pt' : ' pts';
  }

  function opcoesTraco(extra) {
    return Object.keys(TIPOS_TRACO).map(function (k) { return [k, TIPOS_TRACO[k]]; }).concat([extra]);
  }

  function filtraTraco(p, v) {
    return v === p.categoria || p.tipo.indexOf(v) !== -1;
  }

  function metaTraco(p) {
    var m = p.tipo.map(function (t) { return TIPOS_TRACO[t]; }).join(' · ');
    if (p.categoria === 'qualidade') m += ' · Qualidade';
    if (p.categoria === 'peculiaridade') m += ' · Peculiaridade';
    return [m, 'pág. ' + p.ref.pagina];
  }

  var LISTAS = {
    pericias: {
      dados: GURPS.pericias,
      unidade: ['perícia', 'perícias'],
      opcoes: Object.keys(GRUPOS).map(function (k) { return [k, GRUPOS[k]]; }),
      filtra: function (p, v) { return p.grupo === v; },
      titulo: function (p) { return p.nome + (p.nt ? '/NT' : ''); },
      selo: function (p) { return p.atributo + '/' + p.dificuldade; },
      meta: function (p) {
        var m = [GRUPOS[p.grupo], 'pág. ' + p.ref.pagina];
        if (p.predefinido) m.push('Pré-definido: ' + p.predefinido);
        return m;
      }
    },
    vantagens: {
      dados: GURPS.vantagens,
      unidade: ['vantagem', 'vantagens'],
      opcoes: opcoesTraco(['qualidade', 'Qualidades (1 ponto)']),
      filtra: filtraTraco,
      titulo: function (p) { return p.nome; },
      selo: function (p) { return p.custo + unidadePontos(p.custo); },
      meta: metaTraco
    },
    equipamento: {
      dados: GURPS.equipamento || [],
      unidade: ['item', 'itens'],
      opcoes: Object.keys(CATEGORIAS_EQUIP).map(function (k) { return [k, CATEGORIAS_EQUIP[k]]; }),
      filtra: function (p, v) { return p.categoria === v; },
      titulo: function (p) { return p.nome; },
      selo: function (p) { return p.nt === '^' ? 'Superciência' : 'NT' + p.nt; },
      meta: function (p) {
        var m = [p.subcategoria || CATEGORIAS_EQUIP[p.categoria]];
        if (p.pericia && p.pericia !== p.subcategoria) m.push('Perícia: ' + p.pericia);
        if (p.preco) {
          m.push((p.preco.adicional ? '+' : '') + p.preco.valor.toLocaleString('pt-BR') + (p.preco.valor === 1 ? ' coroa' : ' coroas') +
            (p.preco.por ? ' (' + p.preco.por + ')' : '') + (p.preco.nota ? ' ' + p.preco.nota : ''));
        }
        m.push('pág. ' + p.ref.pagina);
        return m;
      }
    },
    desvantagens: {
      dados: GURPS.desvantagens,
      unidade: ['desvantagem', 'desvantagens'],
      opcoes: opcoesTraco(['peculiaridade', 'Peculiaridades (-1 ponto)']),
      filtra: filtraTraco,
      titulo: function (p) { return p.nome; },
      selo: function (p) { return p.custo + unidadePontos(p.custo); },
      meta: metaTraco
    }
  };

  var tipo = LISTAS[lista.getAttribute('data-lista')] || LISTAS.pericias;
  var statusAtual = 'livre';

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
    var art = el('article', 'pericia ' + ADAMAR[p.adamar].classe);
    art.id = p.id;
    var topo = el('div', 'pericia-topo');
    var nome = el('h3', 'pericia-nome', tipo.titulo(p));
    if (p.especializacao) {
      var adaga = el('span', 'pericia-esp', '†');
      adaga.title = 'Exige especialização';
      nome.appendChild(adaga);
    }
    topo.appendChild(nome);
    topo.appendChild(el('span', 'pericia-dif', tipo.selo(p)));
    art.appendChild(topo);
    art.appendChild(el('p', 'pericia-resumo', p.resumo));
    if (p.variantes) {
      var versoes = el('ul', 'pericia-variantes');
      p.variantes.forEach(function (v) {
        var li = el('li');
        li.appendChild(el('strong', null, v.nome + ' (' + (v.custo > 0 ? '+' : '') + v.custo + ')'));
        li.appendChild(document.createTextNode(' ' + v.resumo));
        versoes.appendChild(li);
      });
      art.appendChild(versoes);
    }
    if (p.efeitos && p.efeitos.length && window.GurpsEfeitos) {
      var ul = el('ul', 'efeitos');
      window.GurpsEfeitos.desenharEfeitos(ul, p.efeitos.map(function (e) {
        var nomeVar = e.variante != null && p.variantes ? p.variantes[e.variante].nome + ': ' : '';
        return { tipo: window.GurpsEfeitos.tipoEfeito(e), texto: nomeVar + window.GurpsEfeitos.textoEfeito(e, GURPS) };
      }));
      art.appendChild(ul);
    }
    var meta = el('p', 'pericia-meta');
    meta.appendChild(el('span', 'pericia-status', ADAMAR[p.adamar].rotulo));
    tipo.meta(p).forEach(function (m) { meta.appendChild(el('span', null, m)); });
    art.appendChild(meta);
    return art;
  }

  function render() {
    var q = semAcento(busca.value.trim());
    var v = filtro.value;
    var filtrados = tipo.dados.filter(function (p) {
      if (statusAtual !== 'todas' && p.adamar !== statusAtual) return false;
      if (v && !tipo.filtra(p, v)) return false;
      if (q && semAcento(p.nome + ' ' + p.resumo + ' ' + (p.subcategoria || '')).indexOf(q) === -1) return false;
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
