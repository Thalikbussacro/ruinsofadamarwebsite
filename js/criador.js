// js/criador.js — tela do criador de personagem (modo aplicativo): etapas, catálogos com filtros, validação e salvar.
// A lógica de pontos, NH e validação fica em criador-ficha.js.
(function () {
  // o sistema de regras vem da ficha que vai abrir: ?editar=, ?sistema=, ou o rascunho guardado
  function sistemaDaVez() {
    try {
      var ed = /[?&]editar=([^&]+)/.exec(location.search);
      if (ed && window.criarArquivo) {
        var sv = window.criarArquivo(window.localStorage).obter(decodeURIComponent(ed[1]));
        if (sv) return sv.sistema || 'gurps';
      }
      var pedido = /[?&]sistema=([a-z-]+)/.exec(location.search);
      if (pedido) return pedido[1];
      if (/[?&]novo=1/.test(location.search)) return 'gurps';
      var rasc = JSON.parse(window.localStorage.getItem('adamar-criador') || 'null');
      return (rasc && rasc.sistema) || 'gurps';
    } catch (e) { return 'gurps'; }
  }
  var SISTEMA = sistemaDaVez();
  var G = window.Sistemas ? window.Sistemas.obter(SISTEMA) : window.GURPS;
  var raiz = document.getElementById('criador');
  if (!G || !G.regras || !window.criarCalculo || !window.criarCriador || !raiz) return;
  var R = G.regras;
  var calc = window.criarCalculo(R);
  var criador = window.criarCriador(G, calc);
  var Efeitos = window.GurpsEfeitos;
  var ARMAZENAMENTO = 'adamar-criador';
  var ARMAZENAMENTO_ETAPA = 'adamar-criador-etapa';
  var ADAMAR = { livre: 'Livre', narrador: 'Com o narrador', nao: 'Não existe' };
  var PONTOS_PERICIA = [1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
  var TALENTO_TRACO = 'talento'; // Talentos têm lista própria (regras.json)
  var TIPOS = { mental: 'Mental', fisica: 'Física', social: 'Social', exotica: 'Exótica', sobrenatural: 'Sobrenatural' };
  var GRUPOS = {
    combate: 'Combate', corpo: 'Corpo e movimento', natureza: 'Natureza e viagem', oficio: 'Ofícios',
    social: 'Social', saber: 'Saberes', ladinagem: 'Ladinagem', misterio: 'Mistério'
  };
  var CATEGORIAS_EQUIP = {
    'arma-corpo-a-corpo': 'Corpo a corpo', 'arma-distancia': 'À distância', 'arma-pesada': 'Pesadas',
    armadura: 'Armaduras', 'armadura-cavalo': 'De cavalo', escudo: 'Escudos', equipamento: 'Variado'
  };
  var DIFICULDADES = ['Fácil', 'Média', 'Difícil', 'Muito Difícil'];

  // ---------- utilidades ----------
  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function sinal(v) { return v > 0 ? '+' + v : String(v); }
  function num(v) { return typeof v === 'number' ? v.toLocaleString('pt-BR') : String(v); }
  function semAcento(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function porId(lista, id) { return lista.filter(function (x) { return x.id === id; })[0]; }
  function limitar(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function moeda(valor) {
    var m = (R.campanha && R.campanha.moeda) || { nome: 'coroa', plural: 'coroas', por_dolar_gurps: 1 };
    var v = valor * m.por_dolar_gurps;
    return num(v) + ' ' + (v === 1 ? m.nome : m.plural);
  }
  function textoPreco(it) {
    if (!it.preco) return 'preço com o narrador';
    return (it.preco.adicional ? '+' : '') + moeda(it.preco.valor) + (it.preco.por ? ' (' + it.preco.por + ')' : '');
  }
  // Linguagem de saldo: o que custa tira pontos, desvantagem devolve.
  function custoTexto(c) {
    if (!c) return 'grátis';
    return c > 0 ? 'custa ' + c : 'devolve ' + (-c);
  }
  function selo(adamar) { return el('span', 'pericia-status st-' + adamar, ADAMAR[adamar] || adamar); }
  function selectCom(opcoes, valor, rotulo) {
    var s = el('select');
    if (rotulo) s.setAttribute('aria-label', rotulo);
    opcoes.forEach(function (o) {
      var op = el('option', null, o[1]);
      op.value = String(o[0]);
      s.appendChild(op);
    });
    if (valor != null) s.value = String(valor);
    return s;
  }
  function botaoRemover(rotulo, aoClicar) {
    var b = el('button', 'app-remover', '×');
    b.type = 'button';
    b.title = 'Remover';
    b.setAttribute('aria-label', 'Remover ' + rotulo);
    b.addEventListener('click', aoClicar);
    return b;
  }
  function campoRotulado(rotulo, controle) {
    var w = el('label', 'criador-campo');
    w.appendChild(el('span', null, rotulo));
    w.appendChild(controle);
    return w;
  }
  // Número inteiro com limites: corrige ao sair do campo, sem brigar com a digitação.
  function inteiro(valor, min, max, aoMudar) {
    var i = el('input');
    i.type = 'number';
    i.inputMode = 'numeric';
    if (min != null) i.min = min;
    if (max != null) i.max = max;
    i.value = valor == null ? '' : valor;
    function ler() {
      var v = parseInt(i.value, 10);
      if (isNaN(v)) return null;
      if (min != null && v < min) v = min;
      if (max != null && v > max) v = max;
      return v;
    }
    i.addEventListener('input', function () { var v = ler(); if (v != null) { aoMudar(v); mudou(); } });
    i.addEventListener('change', function () { var v = ler(); i.value = v == null ? (min != null ? min : '') : v; aoMudar(v == null ? min : v); mudou(); });
    return i;
  }

  // ---------- estado ----------
  var arquivo = window.criarArquivo ? window.criarArquivo(window.localStorage) : null;
  var ficha;
  try { ficha = criador.carregar(JSON.parse(localStorage.getItem(ARMAZENAMENTO) || 'null')); } catch (e) { ficha = criador.fichaNova(); }
  var editar = /[?&]editar=([^&]+)/.exec(location.search);
  if (editar && arquivo) {
    var salvoAntes = arquivo.obter(decodeURIComponent(editar[1]));
    if (salvoAntes) ficha = criador.carregar(salvoAntes);
    try { localStorage.setItem(ARMAZENAMENTO_ETAPA, '0'); history.replaceState(null, '', location.pathname); } catch (e) { /* sem history */ }
  }
  // ?novo=1: ficha em branco; um rascunho com conteúdo e sem salvar vai antes para Meus personagens
  if (/[?&]novo=1/.test(location.search)) {
    var vazio = JSON.stringify(criador.fichaNova());
    var semSalvar = !ficha.id_salvo || !arquivo || !arquivo.obter(ficha.id_salvo) || assinatura(arquivo.obter(ficha.id_salvo)) !== assinatura(ficha);
    if (arquivo && semSalvar && JSON.stringify(ficha) !== vazio) arquivo.salvar(ficha);
    ficha = criador.fichaNova();
    try { localStorage.setItem(ARMAZENAMENTO_ETAPA, '0'); history.replaceState(null, '', location.pathname); } catch (e) { /* sem armazenamento */ }
  }
  ficha.sistema = SISTEMA;
  // compara fichas sem o estado "em jogo" (PV/PF atuais mudam no cofre durante a sessão, não são edição da ficha)
  function assinatura(f) { var c = Object.assign({}, f); delete c.em_jogo; return JSON.stringify(c); }
  // o painel "Em jogo" do cofre pode ter mudado pontos ganhos, PV e PF depois que a ficha foi aberta aqui
  if (ficha.id_salvo && arquivo && arquivo.obter(ficha.id_salvo)) ficha.em_jogo = arquivo.obter(ficha.id_salvo).em_jogo || ficha.em_jogo;
  function versaoSalvaDe(f) { return f.id_salvo && arquivo && arquivo.obter(f.id_salvo) ? assinatura(arquivo.obter(f.id_salvo)) : null; }
  var versaoSalva = versaoSalvaDe(ficha);
  var atualizadores = [];
  var ultimo = null; // último resumo calculado
  function guardarRascunho() {
    try { localStorage.setItem(ARMAZENAMENTO, JSON.stringify(ficha)); } catch (e) { /* sem armazenamento */ }
  }
  function mudou() { guardarRascunho(); atualizar(); }
  function atualizar() {
    ultimo = criador.resumir(ficha);
    atualizadores.forEach(function (f) { f(ultimo); });
  }

  // ---------- etapas ----------
  var etapas = Array.prototype.slice.call(raiz.querySelectorAll('.app-etapa'));
  var navEtapas = document.getElementById('criador-etapas');
  var botoesEtapa = [];
  var atual = 0;
  try { atual = limitar(parseInt(localStorage.getItem(ARMAZENAMENTO_ETAPA), 10) || 0, 0, etapas.length - 1); } catch (e) { atual = 0; }
  etapas.forEach(function (s, i) {
    var b = el('button', 'app-etapa-botao');
    b.type = 'button';
    b.appendChild(el('span', 'app-etapa-num', String(i + 1)));
    b.appendChild(el('span', 'app-etapa-nome', s.getAttribute('data-etapa')));
    var marca = el('span', 'app-etapa-marca');
    b.appendChild(marca);
    b.addEventListener('click', function () { irPara(i); });
    navEtapas.appendChild(b);
    botoesEtapa.push({ botao: b, marca: marca, id: s.getAttribute('data-id') });
  });
  var voltar = document.querySelector('[data-voltar]');
  var seguir = document.querySelector('[data-seguir]');
  function irPara(i) {
    atual = i;
    etapas.forEach(function (s, k) { s.classList.toggle('is-current', k === i); });
    botoesEtapa.forEach(function (b, k) {
      b.botao.classList.toggle('is-current', k === i);
      b.botao.setAttribute('aria-current', k === i ? 'step' : 'false');
    });
    centralizarEtapa(i, true);
    voltar.disabled = i === 0;
    seguir.hidden = i === etapas.length - 1;
    try { localStorage.setItem(ARMAZENAMENTO_ETAPA, String(i)); } catch (e) { /* sem armazenamento */ }
    if (etapas[i].getAttribute('data-id') === 'revisao') mostrarIncompletos = true;
    atualizar();
    var corpo = etapas[i].querySelector('.app-corpo');
    if (corpo) corpo.scrollTop = 0;
  }
  // no celular a faixa de etapas rola na horizontal: mantém a etapa atual no meio
  function centralizarEtapa(i, suave) {
    var faixa = navEtapas;
    if (faixa.scrollWidth <= faixa.clientWidth) return;
    var b = botoesEtapa[i].botao;
    var pos = b.getBoundingClientRect().left - faixa.getBoundingClientRect().left + faixa.scrollLeft;
    faixa.scrollTo({ left: pos - (faixa.clientWidth - b.offsetWidth) / 2, behavior: suave ? 'smooth' : 'auto' });
  }
  voltar.addEventListener('click', function () { irPara(Math.max(0, atual - 1)); });
  seguir.addEventListener('click', function () { irPara(Math.min(etapas.length - 1, atual + 1)); });
  function irParaEtapa(id) {
    for (var i = 0; i < etapas.length; i++) if (etapas[i].getAttribute('data-id') === id) return irPara(i);
  }

  // Marcas nas etapas. Erro (contra as regras) aparece sempre, com número; o que só falta preencher
  // vira "○" até a pessoa tentar salvar ou abrir a revisão, e aí passa a mostrar o número.
  var mostrarIncompletos = false;
  function daEtapa(lista, id) {
    return lista.filter(function (e) { return e.etapa === id || (id === 'revisao' && e.etapa === 'geral'); });
  }
  atualizadores.push(function (r) {
    botoesEtapa.forEach(function (b) {
      var n = daEtapa(r.problemas, b.id).length;
      var inc = daEtapa(r.incompletos, b.id).length;
      var a = daEtapa(r.avisos, b.id).length;
      if (n) { b.marca.textContent = String(n); b.marca.className = 'app-etapa-marca tem-erro'; b.marca.title = n + ' problema(s)'; }
      else if (inc && mostrarIncompletos) { b.marca.textContent = String(inc); b.marca.className = 'app-etapa-marca tem-pendente'; b.marca.title = inc + ' coisa(s) a preencher'; }
      else if (inc) { b.marca.textContent = '○'; b.marca.className = 'app-etapa-marca em-andamento'; b.marca.title = 'falta preencher'; }
      else if (a) { b.marca.textContent = '!'; b.marca.className = 'app-etapa-marca tem-aviso'; b.marca.title = a + ' aviso(s)'; }
      else { b.marca.textContent = '✓'; b.marca.className = 'app-etapa-marca ok'; b.marca.title = 'tudo certo'; }
    });
    var id = botoesEtapa[atual].id;
    var n = daEtapa(r.problemas, id).length;
    var inc = mostrarIncompletos ? daEtapa(r.incompletos, id).length : 0;
    var rod = document.getElementById('c-rodape-status');
    rod.textContent = id === 'revisao' ? '' : [n ? n + (n === 1 ? ' problema' : ' problemas') : '', inc ? inc + ' a preencher' : ''].filter(Boolean).join(' · ') + (n || inc ? ' nesta etapa' : '');
    rod.className = 'app-rodape-status' + (n ? ' tem-erro' : inc ? ' tem-aviso' : '');
    raiz.classList.toggle('mostrar-incompletos', mostrarIncompletos);
  });

  // ---------- ficha viva (coluna da esquerda) ----------
  var app = document.querySelector('main.app');
  var lado = document.getElementById('c-lado');
  var arrastando = null; // o que fazer quando um item do catálogo cai na ficha
  function fimDoArraste() {
    arrastando = null;
    document.body.classList.remove('arrastando');
    lado.classList.remove('recebe');
  }
  lado.addEventListener('dragover', function (ev) {
    if (!arrastando) return;
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'copy';
    lado.classList.add('recebe');
  });
  lado.addEventListener('dragleave', function (ev) { if (!lado.contains(ev.relatedTarget)) lado.classList.remove('recebe'); });
  lado.addEventListener('drop', function (ev) {
    if (!arrastando) return;
    ev.preventDefault();
    var fazer = arrastando;
    fimDoArraste();
    fazer();
  });
  // celular: "Ficha" mostra a coluna da esquerda; "Montar", as etapas com os catálogos
  var botoesLado = Array.prototype.slice.call(document.querySelectorAll('.app-alterna [data-lado]'));
  function mostrarLado(qual) {
    app.setAttribute('data-lado', qual);
    botoesLado.forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-lado') === qual)); });
    if (qual === 'ficha') lado.scrollTop = 0;
  }
  botoesLado.forEach(function (b) { b.addEventListener('click', function () { mostrarLado(b.getAttribute('data-lado')); }); });
  mostrarLado('montar');
  // no celular, um aviso rápido no botão "Ficha" quando algo entra nela
  function avisarFicha() {
    var b = document.querySelector('.app-alterna [data-lado="ficha"]');
    if (!b) return;
    b.classList.remove('pulsa');
    void b.offsetWidth;
    b.classList.add('pulsa');
  }
  // os títulos das seções da ficha levam ao catálogo da etapa
  Array.prototype.forEach.call(document.querySelectorAll('.fv-ir'), function (b) {
    b.addEventListener('click', function () { irParaEtapa(b.getAttribute('data-ir')); mostrarLado('montar'); });
  });
  // o boneco: o corpo com a proteção e o que está nas mãos, nas costas e no cinto (pôr numa mão ocupada tira quem estava)
  var avisoCorpo = '';
  function porNoCorpo(uid, lugar) {
    var saiu = criador.equipar(ficha, uid, lugar);
    avisoCorpo = criador.avisoDeTroca(saiu, lugar);
    desenharEquipamento();
    mudou();
  }
  atualizadores.push(function (r) {
    var caixa = document.getElementById('c-ficha-boneco');
    if (!caixa || !window.Boneco) return;
    caixa.textContent = '';
    if (!ficha.equipamento.length) return;
    var cab = el('div', 'painel-cab');
    var h = el('h2');
    var ir = el('button', 'fv-ir', 'Corpo');
    ir.type = 'button';
    ir.addEventListener('click', function () { irParaEtapa('equipamento'); mostrarLado('montar'); });
    h.appendChild(ir);
    cab.appendChild(h);
    caixa.appendChild(cab);
    if (avisoCorpo) { caixa.appendChild(el('p', 'fv-vazio tem-aviso', avisoCorpo)); avisoCorpo = ''; }
    caixa.appendChild(window.Boneco.desenhar({
      resumo: r,
      lugaresPossiveis: criador.lugaresPossiveis,
      aoPor: porNoCorpo,
      aoTirar: function (uid) {
        ficha.equipamento.forEach(function (x) { if (x.uid === uid) { x.local = 'levado'; delete x.lugar; } });
        desenharEquipamento();
        mudou();
      }
    }));
  });

  // topo da ficha: atributos e armas (com o NH de agora e, se faltar, a perícia para comprar)
  atualizadores.push(function (r) {
    var box = document.getElementById('c-ficha-resumo');
    if (!box) return;
    box.textContent = '';
    document.getElementById('c-alterna-pontos').textContent = '· ' + r.restante;
    var v = r.valores;
    var atr = el('button', 'fv-atributos');
    atr.type = 'button';
    atr.title = 'Mudar atributos';
    [['ST', v.st], ['DX', v.dx], ['IQ', v.iq], ['HT', v.ht], ['PV', v.pv], ['Vont', v.vontade], ['Per', v.per], ['PF', v.pf]].forEach(function (x) {
      var c = el('span', 'fv-atr');
      c.appendChild(el('small', null, x[0]));
      c.appendChild(el('strong', null, String(x[1])));
      atr.appendChild(c);
    });
    atr.addEventListener('click', function () { irParaEtapa('atributos'); mostrarLado('montar'); });
    box.appendChild(atr);
    var cb = r.combate;
    var armas = cb.armas.filter(function (a) { return !a.natural; });
    var cab = el('div', 'painel-cab');
    var h = el('h2');
    var irEq = el('button', 'fv-ir', 'Armas');
    irEq.type = 'button';
    irEq.addEventListener('click', function () { irParaEtapa('equipamento'); mostrarLado('montar'); });
    h.appendChild(irEq);
    cab.appendChild(h);
    cab.appendChild(el('span', 'painel-conta', 'Esquiva ' + cb.defesas.esquiva + (cb.defesas.aparar != null ? ' · Aparar ' + cb.defesas.aparar : '') + (cb.defesas.bloqueio != null ? ' · Bloqueio ' + cb.defesas.bloqueio : '')));
    box.appendChild(cab);
    if (!armas.length) { box.appendChild(el('p', 'fv-vazio', 'Nenhuma arma. Arraste uma do Equipamento, ou use o +.')); return; }
    var ul = el('ul', 'fv-armas');
    var vistas = {};
    armas.forEach(function (a) {
      var chave = a.item.id + '|' + a.pericia;
      if (vistas[chave]) return; // um item com dois modos (golpe e estocada) mostra uma linha
      vistas[chave] = true;
      var li = el('li');
      li.appendChild(el('span', 'fv-arma-nome', a.nome));
      li.appendChild(el('span', 'fv-arma-nh', a.nh == null ? 'NH —' : 'NH ' + a.nh));
      li.appendChild(el('span', 'fv-arma-dano', a.dano));
      // a perícia da arma ainda não está na ficha: oferece comprar (e os pontos dela sobem o NH da arma)
      var ids = ((a.item.combate && a.item.combate.pericias) || []).filter(function (x) { return x.tipo === 'pericia'; }).map(function (x) { return x.id; });
      var tem = ficha.pericias.some(function (s) { return ids.indexOf(s.id) !== -1; });
      var alvo = ids.length && porId(G.pericias, ids[0]);
      if (!tem && alvo) {
        var comprar = el('button', 'btn-link fv-comprar', 'sem treino · comprar ' + alvo.nome);
        comprar.type = 'button';
        comprar.addEventListener('click', function () {
          if (catalogoPericias.adicionarItem(alvo)) mudou();
        });
        li.appendChild(comprar);
      } else if (tem) {
        li.appendChild(el('span', 'fv-arma-per', a.pericia));
      }
      ul.appendChild(li);
    });
    box.appendChild(ul);
  });

  // ---------- coluna lateral ----------
  atualizadores.push(function (r) {
    document.getElementById('lado-nome').textContent = ficha.nome || 'Sem nome';
    var total = document.getElementById('lado-total');
    total.textContent = String(r.restante);
    total.className = r.restante < 0 ? 'tem-erro' : '';
    document.getElementById('lado-orcamento').textContent = 'de saldo';
    var rest = document.getElementById('lado-restante');
    rest.textContent = r.restante < 0 ? 'Saldo negativo' : 'de ' + ficha.orcamento + (r.pontos_ganhos ? ' + ' + r.pontos_ganhos + ' ganhos' : '') + ' · gastou ' + r.pontos_gastos + (r.pontos_devolvidos ? ' · voltou ' + r.pontos_devolvidos : '');
    rest.className = r.restante < 0 ? 'tem-erro' : '';
    var d = document.getElementById('lado-desv');
    d.textContent = (-r.desvantagens) + ' / ' + (-r.limite);
    d.className = r.desvantagens < r.limite ? 'tem-erro' : '';
    var p = document.getElementById('lado-pec');
    p.textContent = r.peculiaridades + ' / ' + criador.LIMITE_PECULIARIDADES;
    p.className = r.peculiaridades > criador.LIMITE_PECULIARIDADES ? 'tem-erro' : '';
    var m = document.getElementById('lado-dinheiro');
    m.textContent = moeda(r.dinheiro_restante);
    m.className = r.dinheiro_restante < 0 ? 'tem-erro' : '';
  });

  // ---------- 1. conceito: ponto de partida (modelos em data/adamar/modelos.json) ----------
  var MODELOS = ((G.adamar || {}).modelos || {}).itens || [];
  var boxModelos = document.getElementById('c-modelos');
  var avisoModelo = document.getElementById('c-modelo-aviso');
  var modeloPendente = null;
  function fichaTemMecanica(f) {
    return f.tracos.length || f.pericias.length || f.equipamento.length || f.talentos.length ||
      Object.keys(f.atributos).some(function (k) { return f.atributos[k] !== 10; });
  }
  function desenharModelos() {
    boxModelos.textContent = '';
    MODELOS.concat([{ id: 'zero', nome: 'Do zero', resumo: 'Ficha em branco: você monta tudo.', icone: 'pencil' }]).forEach(function (m) {
      var b = el('button', 'modelo' + (modeloPendente === m.id ? ' confirmar' : ''));
      b.type = 'button';
      var ic = window.iconeSvg && window.iconeSvg(m.icone, 'modelo-icone');
      if (ic) b.appendChild(ic);
      b.appendChild(el('strong', null, modeloPendente === m.id ? 'Clique de novo para trocar' : m.nome));
      b.appendChild(el('span', null, modeloPendente === m.id ? 'A ficha atual será substituída (nome, era e história ficam).' : m.resumo));
      b.addEventListener('click', function () { escolherModelo(m); });
      boxModelos.appendChild(b);
    });
  }
  function escolherModelo(m) {
    // se já há uma ficha montada, pede um segundo clique para não apagar sem querer
    if (fichaTemMecanica(ficha) && modeloPendente !== m.id) {
      modeloPendente = m.id;
      desenharModelos();
      setTimeout(function () { if (modeloPendente === m.id) { modeloPendente = null; desenharModelos(); } }, 5000);
      return;
    }
    modeloPendente = null;
    if (m.id === 'zero') {
      var limpa = criador.fichaNova();
      ['id_salvo', 'nome', 'jogador', 'conceito', 'era', 'origem', 'aparencia_fisica', 'historia', 'notas', 'orcamento', 'idade', 'altura', 'peso_corporal'].forEach(function (k) { limpa[k] = ficha[k]; });
      ficha = limpa;
      avisoModelo.textContent = 'Ficha limpa. Monte do seu jeito nas próximas etapas.';
    } else {
      // conceito que veio de outro modelo é trocado; o que a pessoa escreveu fica
      var deModelo = MODELOS.some(function (x) { return x.ficha && x.ficha.conceito === ficha.conceito; });
      if (deModelo) ficha.conceito = '';
      ficha = criador.aplicarModelo(ficha, m);
      avisoModelo.textContent = 'Modelo ' + m.nome + ' aplicado: atributos, vantagens, perícias e equipamento já estão prontos. Dê um nome e ajuste o que quiser.';
    }
    desenharTudo();
    mudou();
  }
  if (!MODELOS.length) { boxModelos.hidden = true; }

  // ---------- 1. conceito ----------
  var PONTOS = (R.campanha && R.campanha.pontos_iniciais) || { padrao: 80, sugestoes: [80] };
  var selOrc = document.getElementById('c-orcamento');
  var campoLivre = document.getElementById('campo-orcamento-livre');
  var inputLivre = document.getElementById('c-orcamento-livre');
  PONTOS.sugestoes.forEach(function (v) {
    var o = el('option', null, v + ' pontos' + (v === PONTOS.padrao ? ' (padrão)' : ''));
    o.value = String(v);
    selOrc.appendChild(o);
  });
  var outro = el('option', null, 'Outro…');
  outro.value = 'outro';
  selOrc.appendChild(outro);
  function mostrarOrcamento() {
    var sugerido = PONTOS.sugestoes.indexOf(ficha.orcamento) !== -1;
    selOrc.value = sugerido ? String(ficha.orcamento) : 'outro';
    campoLivre.hidden = sugerido;
    inputLivre.value = ficha.orcamento;
  }
  selOrc.addEventListener('change', function () {
    if (selOrc.value === 'outro') { campoLivre.hidden = false; inputLivre.focus(); return; }
    ficha.orcamento = parseInt(selOrc.value, 10);
    campoLivre.hidden = true;
    mudou();
  });
  inputLivre.addEventListener('input', function () {
    var v = parseInt(inputLivre.value, 10);
    if (!isNaN(v) && v >= 0 && v <= 1000) { ficha.orcamento = v; mudou(); }
  });
  // retrato: a imagem escolhida é reduzida (lado maior 256 px) e guardada na ficha como data URL
  var caixaRetrato = document.getElementById('c-retrato');
  var tirarRetrato = document.getElementById('c-retrato-tirar');
  function mostrarRetrato() {
    caixaRetrato.style.backgroundImage = ficha.retrato ? 'url("' + ficha.retrato + '")' : '';
    caixaRetrato.classList.toggle('vazio', !ficha.retrato);
    tirarRetrato.hidden = !ficha.retrato;
  }
  document.getElementById('c-retrato-arquivo').addEventListener('change', function (ev) {
    var arq = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!arq) return;
    var img = new Image();
    var url = URL.createObjectURL(arq);
    img.onload = function () {
      var lado = 256, esc = Math.min(1, lado / Math.max(img.width, img.height));
      var cv = document.createElement('canvas');
      cv.width = Math.round(img.width * esc);
      cv.height = Math.round(img.height * esc);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      ficha.retrato = cv.toDataURL('image/jpeg', 0.82);
      URL.revokeObjectURL(url);
      mostrarRetrato();
      mudou();
    };
    img.onerror = function () { URL.revokeObjectURL(url); };
    img.src = url;
  });
  tirarRetrato.addEventListener('click', function () { ficha.retrato = ''; mostrarRetrato(); mudou(); });
  atualizadores.push(function () { if ((caixaRetrato.style.backgroundImage !== '') !== !!ficha.retrato) mostrarRetrato(); });
  mostrarRetrato();

  // sistema de regras: trocar recarrega o criador com o outro conjunto (a ficha e o que já foi escolhido vão junto)
  var seletorSistema = document.getElementById('c-sistema');
  if (seletorSistema && window.Sistemas) {
    window.Sistemas.LISTA.forEach(function (x) { var o = el('option', null, x.nome); o.value = x.id; seletorSistema.appendChild(o); });
    seletorSistema.value = SISTEMA;
    seletorSistema.addEventListener('change', function () {
      ficha.sistema = seletorSistema.value;
      guardarRascunho();
      location.href = 'criador.html';
    });
    var dicaSistema = document.getElementById('c-sistema-dica');
    if (dicaSistema) dicaSistema.textContent = window.Sistemas.LISTA.filter(function (x) { return x.id === SISTEMA; })[0].resumo;
  }
  var seloSistema = document.getElementById('lado-sistema');
  if (seloSistema) seloSistema.textContent = G.nome_sistema || 'GURPS';
  var camposTexto = Array.prototype.slice.call(document.querySelectorAll('[data-campo]'));
  camposTexto.forEach(function (c) {
    c.addEventListener('input', function () { ficha[c.getAttribute('data-campo')] = c.value; mudou(); });
  });
  atualizadores.push(function (r) {
    var semNome = !String(ficha.nome || '').trim();
    document.getElementById('c-nome').classList.toggle('campo-falta', semNome);
  });

  // ---------- 2. atributos ----------
  function campoNumero(id, rotulo, passo, min, max, aoMudar) {
    var wrap = el('div', 'field calc-campo');
    var label = el('label', null, rotulo);
    label.htmlFor = 'c-' + id;
    var input = el('input');
    input.type = 'number';
    input.id = 'c-' + id;
    input.step = passo;
    input.min = min;
    input.max = max;
    function ler() {
      var v = parseFloat(String(input.value).replace(',', '.'));
      return isNaN(v) ? null : limitar(v, min, max);
    }
    input.addEventListener('input', function () { var v = ler(); if (v != null) aoMudar(v); });
    input.addEventListener('change', function () { var v = ler(); if (v == null) v = min; aoMudar(v); mostrarAtributos(); });
    var info = el('span', 'calc-info');
    wrap.appendChild(label); wrap.appendChild(input); wrap.appendChild(info);
    return { wrap: wrap, input: input, info: info };
  }
  var camposAtr = {}, camposSec = {};
  R.atributos.forEach(function (a) {
    var c = campoNumero(a.id, a.sigla + ' — ' + a.nome, 1, 1, 30, function (v) {
      ficha.atributos[a.id] = Math.round(v);
      mudou();
      mostrarSecundarias();
    });
    camposAtr[a.id] = c;
    document.getElementById('c-atributos').appendChild(c.wrap);
  });
  R.secundarias.forEach(function (s) {
    var c = campoNumero(s.id, s.sigla + ' — ' + s.nome, s.passo, 0, 60, function (v) {
      var base = calc.secundarias(ficha.atributos)[s.id];
      var aj = Math.round((v - base) / s.passo) * s.passo;
      if (aj) ficha.ajustes[s.id] = aj; else delete ficha.ajustes[s.id];
      mudou();
    });
    camposSec[s.id] = c;
    document.getElementById('c-secundarias').appendChild(c.wrap);
  });
  function mostrarAtributos() {
    R.atributos.forEach(function (a) { camposAtr[a.id].input.value = ficha.atributos[a.id]; });
    mostrarSecundarias(true);
  }
  function mostrarSecundarias(todas) {
    var v = calc.secundarias(ficha.atributos, ficha.ajustes);
    R.secundarias.forEach(function (s) {
      if (todas || document.activeElement !== camposSec[s.id].input) camposSec[s.id].input.value = v[s.id];
    });
  }
  atualizadores.push(function (r) {
    R.atributos.forEach(function (a) {
      camposAtr[a.id].info.textContent = custoTexto(calc.custoAtributo(a.id, ficha.atributos[a.id]));
    });
    R.secundarias.forEach(function (s) {
      var aj = ficha.ajustes[s.id] || 0;
      var lim = calc.limitesSecundaria(s.id, ficha.atributos);
      camposSec[s.id].info.textContent = custoTexto(aj ? calc.custoSecundaria(s.id, aj) : 0) +
        ' · faixa ' + num(lim.min) + ' a ' + num(lim.max);
      var fora = calc.secundarias(ficha.atributos, ficha.ajustes)[s.id];
      camposSec[s.id].input.classList.toggle('campo-erro', fora < lim.min || fora > lim.max);
    });
    R.atributos.forEach(function (a) {
      camposAtr[a.id].input.classList.toggle('campo-erro', ficha.atributos[a.id] > 20);
    });
    var ALVO = { esquiva: 'Esquiva', todas: 'defesas', deslocamento: 'Deslocamento' };
    var vindos = r.efeitos_fixos.map(function (e) { return sinal(e.valor) + ' ' + (ALVO[e.ref] || e.ref) + ' de ' + e.traco; });
    document.getElementById('c-derivadas').textContent = 'Esquiva ' + r.combate.defesas.esquiva + ' (com carga e escudo) · Base de Carga ' + num(r.base_carga) + ' kg' +
      (vindos.length ? ' · já contando ' + vindos.join(', ') : '');
  });

  // ---------- 3. sociedade e idiomas ----------
  var socAparencia = document.getElementById('c-soc-aparencia');
  var socStatus = document.getElementById('c-soc-status');
  var socRiqueza = document.getElementById('c-soc-riqueza');
  var socAlf = document.getElementById('c-soc-alfabetizacao');
  var socAnalf = document.getElementById('c-soc-analfabetismo');
  function preencher(sel, itens) {
    itens.forEach(function (o) { var op = el('option', null, o[1]); op.value = o[0]; sel.appendChild(op); });
  }
  preencher(socAparencia, R.aparencia.niveis.filter(function (n) { return n.adamar !== 'nao'; }).map(function (n) {
    return [n.id, n.nome + ' (' + sinal(n.custo) + ')' + (n.adamar === 'narrador' ? ' — com o narrador' : '')];
  }));
  var niveisStatus = [];
  for (var st = R.status.minimo; st <= R.status.maximo; st++) {
    niveisStatus.push([String(st), sinal(st) + (R.status.exemplos[String(st)] ? ' — ' + R.status.exemplos[String(st)] : '') + ' (' + sinal(calc.custoStatus(st)) + ')']);
  }
  preencher(socStatus, niveisStatus);
  preencher(socRiqueza, R.riqueza.niveis.map(function (n) { return [n.id, n.nome + ' (' + sinal(n.custo) + ')']; })
    .concat([1, 2, 3].map(function (m) { return ['multi-' + m, 'Multimilionário ' + m + ' (' + sinal(calc.custoRiqueza('podre-de-rico', m)) + ')']; })));
  preencher(socAlf, R.idiomas.alfabetizacao_materna.map(function (n) { return [n.id, n.nome + ' (' + sinal(n.custo) + ')']; }));
  function mostrarSocial() {
    var so = ficha.social;
    socAparencia.value = so.aparencia;
    socStatus.value = String(so.status);
    socRiqueza.value = so.multimilionario ? 'multi-' + so.multimilionario : so.riqueza;
    socAlf.value = so.alfabetizacao;
    socAnalf.checked = !!so.analfabetismoRegra;
  }
  [socAparencia, socStatus, socRiqueza, socAlf, socAnalf].forEach(function (c) {
    c.addEventListener('change', function () {
      var so = ficha.social;
      var chave = c.getAttribute('data-soc');
      if (chave === 'riqueza') {
        var m = /^multi-(\d)$/.exec(c.value);
        so.riqueza = m ? 'podre-de-rico' : c.value;
        so.multimilionario = m ? parseInt(m[1], 10) : 0;
      } else if (chave === 'status') so.status = parseInt(c.value, 10) || 0;
      else if (chave === 'analfabetismoRegra') so.analfabetismoRegra = c.checked;
      else so[chave] = c.value;
      mudou();
    });
  });
  atualizadores.push(function (r) {
    var so = ficha.social;
    var ap = porId(R.aparencia.niveis, so.aparencia);
    document.getElementById('c-info-aparencia').textContent = custoTexto(calc.custoAparencia(so.aparencia)) + ' · reação ' + (ap ? ap.reacao : '');
    var gratis = calc.statusPorRiqueza(so.riqueza, so.multimilionario);
    document.getElementById('c-info-status').textContent = custoTexto(calc.custoStatus(so.status)) + (gratis ? ' · +' + gratis + ' grátis pela riqueza' : '');
    document.getElementById('c-info-riqueza').textContent = custoTexto(calc.custoRiqueza(so.riqueza, so.multimilionario)) + ' · ' + moeda(r.recursos);
    document.getElementById('c-info-alfabetizacao').textContent = custoTexto(calc.custoAlfabetizacao(so.alfabetizacao)) +
      (so.alfabetizacao !== 'alfabetizado' && so.analfabetismoRegra ? ' · fora do limite' : '');
  });

  var NIVEIS_IDIOMA = R.idiomas.niveis.map(function (n) { return [n.id, n.nome]; });
  var infosIdioma = [];
  function desenharIdiomas() {
    var box = document.getElementById('c-idiomas');
    box.textContent = '';
    infosIdioma = [];
    ficha.idiomas.forEach(function (idioma, i) {
      var row = el('div', 'app-item');
      var topo = el('div', 'app-item-topo');
      var nome = el('input', 'app-item-nome-input');
      nome.value = idioma.nome || '';
      nome.placeholder = 'Nome do idioma';
      nome.maxLength = 60;
      nome.setAttribute('aria-label', 'Nome do idioma');
      nome.addEventListener('input', function () { idioma.nome = nome.value; mudou(); });
      var custo = el('span', 'criador-custo');
      topo.appendChild(nome);
      topo.appendChild(custo);
      topo.appendChild(botaoRemover(idioma.nome || 'idioma', function () { ficha.idiomas.splice(i, 1); desenharIdiomas(); mudou(); }));
      row.appendChild(topo);
      var campos = el('div', 'criador-campos');
      var fala = selectCom(NIVEIS_IDIOMA, idioma.fala, 'Fala');
      var escrita = selectCom(NIVEIS_IDIOMA, idioma.escrita, 'Escrita');
      fala.addEventListener('change', function () { idioma.fala = fala.value; mudou(); });
      escrita.addEventListener('change', function () { idioma.escrita = escrita.value; mudou(); });
      campos.appendChild(campoRotulado('Fala', fala));
      campos.appendChild(campoRotulado('Escrita', escrita));
      row.appendChild(campos);
      infosIdioma.push(function () {
        custo.textContent = custoTexto(calc.custoIdioma(idioma.fala, idioma.escrita));
        nome.classList.toggle('campo-falta', !String(idioma.nome || '').trim());
      });
      box.appendChild(row);
    });
  }
  atualizadores.push(function () { infosIdioma.forEach(function (f) { f(); }); });
  document.getElementById('c-add-idioma').addEventListener('click', function () {
    ficha.idiomas.push({ nome: '', fala: 'rudimentar', escrita: 'nenhum' });
    desenharIdiomas();
    mudou();
    var campos = document.querySelectorAll('#c-idiomas .app-item-nome-input');
    if (campos.length) campos[campos.length - 1].focus();
  });

  // ---------- catálogo com busca, filtros e ordenação ----------
  // opcoes: { itens(), texto(it), selo(it), filtros: [{ rotulo, opcoes: [[valor, rótulo]], testa(it, valor) }],
  //           ordens: [[id, rótulo, comparar]], jaTem(it), adicionar(it) }
  function criarCatalogo(caixa, opcoes) {
    caixa.textContent = '';
    var cab = el('div', 'painel-cab painel-filtros');
    var linha = el('div', 'filtros-linha');
    var busca = el('input', 'criador-busca');
    busca.type = 'search';
    busca.placeholder = 'Buscar…';
    busca.setAttribute('aria-label', 'Buscar no catálogo');
    linha.appendChild(busca);
    var ordem = selectCom(opcoes.ordens.map(function (o) { return [o[0], 'Ordem: ' + o[1]]; }), opcoes.ordens[0][0], 'Ordenar por');
    ordem.className = 'filtro-ordem';
    ordem.addEventListener('change', desenhar);
    linha.appendChild(ordem);
    var abreFiltros = el('button', 'btn-link filtro-toggle', 'Filtros');
    abreFiltros.type = 'button';
    abreFiltros.setAttribute('aria-expanded', 'false');
    abreFiltros.addEventListener('click', function () {
      var aberto = cab.classList.toggle('filtros-abertos');
      abreFiltros.setAttribute('aria-expanded', String(aberto));
    });
    linha.appendChild(abreFiltros);
    cab.appendChild(linha);

    // cada filtro vira uma fileira de chips; clicar no chip ativo desliga o filtro
    var escolhidos = opcoes.filtros.map(function () { return ''; });
    var chipsPorFiltro = opcoes.filtros.map(function (f, k) {
      var grupo = el('div', 'filtro-chips');
      grupo.setAttribute('role', 'group');
      grupo.setAttribute('aria-label', f.rotulo);
      grupo.appendChild(el('span', 'filtro-rotulo', f.rotulo));
      var chips = f.opcoes.map(function (o) {
        var c = el('button', 'chip chip-p', o[1]);
        c.type = 'button';
        c.setAttribute('aria-pressed', 'false');
        c.addEventListener('click', function () {
          escolhidos[k] = escolhidos[k] === o[0] ? '' : o[0];
          chips.forEach(function (x, j) { x.setAttribute('aria-pressed', String(escolhidos[k] === f.opcoes[j][0])); });
          desenhar();
        });
        grupo.appendChild(c);
        return c;
      });
      cab.appendChild(grupo);
      return chips;
    });
    // "com o narrador" fica escondido por padrão: é exceção, não o normal
    var comNarrador = false;
    var rodape = el('div', 'filtros-pe');
    var toggle = el('label', 'check filtro-narrador');
    var caixaNarr = el('input');
    caixaNarr.type = 'checkbox';
    caixaNarr.addEventListener('change', function () { comNarrador = caixaNarr.checked; desenhar(); });
    toggle.appendChild(caixaNarr);
    toggle.appendChild(el('span', null, 'Mostrar também os raros (com o narrador)'));
    rodape.appendChild(toggle);
    var contagem = el('span', 'painel-conta-catalogo');
    rodape.appendChild(contagem);
    var limpar = el('button', 'btn-link', 'Limpar filtros');
    limpar.type = 'button';
    limpar.addEventListener('click', function () {
      busca.value = '';
      escolhidos = escolhidos.map(function () { return ''; });
      chipsPorFiltro.forEach(function (chips) { chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); }); });
      ordem.value = opcoes.ordens[0][0];
      desenhar();
    });
    rodape.appendChild(limpar);
    cab.appendChild(rodape);
    var lista = el('ul', 'app-catalogo painel-rolagem');
    caixa.appendChild(cab);
    caixa.appendChild(lista);

    function desenhar() {
      var q = semAcento(busca.value.trim());
      var ocultos = 0;
      var achados = opcoes.itens().filter(function (it) {
        if (q && semAcento(opcoes.texto(it)).indexOf(q) === -1) return false;
        for (var i = 0; i < escolhidos.length; i++) {
          if (escolhidos[i] && !opcoes.filtros[i].testa(it, escolhidos[i])) return false;
        }
        if (it.adamar === 'narrador' && !comNarrador && !opcoes.jaTem(it)) { ocultos++; return false; }
        return true;
      });
      var cmp = opcoes.ordens.filter(function (o) { return o[0] === ordem.value; })[0][2];
      achados.sort(function (a, b) {
        if (q) { // com busca, quem tem o termo no nome vem antes
          var pa = semAcento(a.nome).indexOf(q) === -1 ? 1 : 0, pb = semAcento(b.nome).indexOf(q) === -1 ? 1 : 0;
          if (pa !== pb) return pa - pb;
        }
        return cmp(a, b) || a.nome.localeCompare(b.nome, 'pt-BR');
      });
      contagem.textContent = achados.length + (achados.length === 1 ? ' item' : ' itens') + (ocultos ? ' (+' + ocultos + ' raros ocultos)' : '');
      var ligados = escolhidos.filter(Boolean).length + (comNarrador ? 1 : 0);
      abreFiltros.textContent = 'Filtros' + (ligados ? ' (' + ligados + ')' : '');
      lista.textContent = '';
      achados.forEach(function (it) {
        var jaTem = opcoes.jaTem(it);
        var li = el('li', 'app-cat-item' + (jaTem ? ' ja-tem' : ''));
        var texto = el('button', 'app-cat-texto');
        texto.type = 'button';
        texto.setAttribute('aria-haspopup', 'dialog');
        var topo = el('span', 'app-cat-topo');
        var icCat = window.iconeSvg && window.iconeSvg(it.icone, 'icone-item');
        if (icCat) topo.appendChild(icCat);
        topo.appendChild(el('strong', null, it.nome));
        if (it.adamar === 'narrador') {
          var m = el('span', 'marca-narrador', '◆');
          m.title = 'Com o narrador: raro, combine antes';
          topo.appendChild(m);
        }
        texto.appendChild(topo);
        texto.appendChild(el('span', 'app-cat-resumo', it.resumo || ''));
        li.appendChild(texto);
        li.appendChild(el('span', 'app-cat-selo', opcoes.selo(it)));
        var b = el('button', 'app-adicionar', jaTem ? '✓' : '+');
        b.type = 'button';
        b.disabled = !!jaTem;
        b.title = jaTem ? 'Já está na ficha' : 'Adicionar à ficha';
        b.setAttribute('aria-label', (jaTem ? 'Já na ficha: ' : 'Adicionar ') + it.nome);
        b.addEventListener('click', function () {
          if (opcoes.adicionar(it, function () { mudou(); desenhar(); }) === false) return;
          mudou();
          desenhar();
        });
        li.appendChild(b);
        if (!jaTem) {
          li.draggable = true;
          li.addEventListener('dragstart', function (ev) {
            arrastando = function () { b.click(); };
            ev.dataTransfer.effectAllowed = 'copy';
            ev.dataTransfer.setData('text/plain', it.nome);
            document.body.classList.add('arrastando');
          });
          li.addEventListener('dragend', fimDoArraste);
        }
        b.addEventListener('click', avisarFicha);
        texto.addEventListener('click', function () {
          verDetalhes(it, jaTem ? { rotulo: 'Já está na ficha', desabilitado: true, fazer: function () {} } : { rotulo: 'Adicionar à ficha', fazer: function () { b.click(); } });
        });
        lista.appendChild(li);
      });
      if (!achados.length) lista.appendChild(el('li', 'pericia-vazio', ocultos ? 'Só há itens raros com esses filtros. Marque "Mostrar também os raros".' : 'Nada com esses filtros.'));
    }
    busca.addEventListener('input', desenhar);
    desenhar();
    // adiciona um item como o botão "+" faria (usado pela ficha viva, ex.: comprar a perícia de uma arma)
    function adicionarItem(it) {
      if (opcoes.jaTem(it)) return false;
      if (opcoes.adicionar(it, function () { mudou(); desenhar(); }) === false) return false;
      desenhar();
      return true;
    }
    return { desenhar: desenhar, adicionarItem: adicionarItem };
  }

  // custo "típico" de um traço, para ordenar e filtrar (variável fica por último)
  function custoTipico(t) {
    var c = t.custo_estruturado || {};
    if (c.tipo === 'fixo') return c.valor;
    if (c.tipo === 'niveis') return (c.base || 0) + c.por_nivel;
    if (c.tipo === 'opcoes') return c.valores[0];
    if (c.tipo === 'faixa') return Math.abs(c.min) < Math.abs(c.max) ? c.min : c.max;
    if (c.tipo === 'minimo') return c.valor;
    return null;
  }
  function comparaCusto(dir) {
    return function (a, b) {
      var x = custoTipico(a), y = custoTipico(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return dir * (Math.abs(x) - Math.abs(y));
    };
  }
  var FILTRO_CUSTO = {
    rotulo: 'Custo',
    opcoes: [['1', 'até 5'], ['2', '6 a 15'], ['3', '16+'], ['v', 'a combinar']],
    testa: function (t, v) {
      var x = custoTipico(t);
      if (v === 'v') return x == null;
      if (x == null) return false;
      x = Math.abs(x);
      return v === '1' ? x <= 5 : v === '2' ? x > 5 && x <= 15 : x > 15;
    }
  };
  var ORDENS_TRACO = [
    ['nome', 'nome', function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); }],
    ['custo', 'custo menor', comparaCusto(1)],
    ['custo-desc', 'custo maior', comparaCusto(-1)],
    ['pagina', 'página do livro', function (a, b) { return a.ref.pagina - b.ref.pagina; }]
  ];

  // ---------- 4 e 5. vantagens e desvantagens ----------
  function tracoEscolhivel(t) {
    return t.adamar !== 'nao' && !criador.tracoSocial(t.id) && t.id !== TALENTO_TRACO;
  }
  function ehNegativo(t) { return t.categoria === 'desvantagem' || t.categoria === 'peculiaridade'; }

  function controlesDoTraco(sel, t, negativo) {
    var c = t.custo_estruturado || { tipo: 'variavel' };
    var e = sel.escolha = sel.escolha || {};
    var campos = el('div', 'criador-campos');
    var mostrarVariante = null;
    if (c.tipo === 'niveis') {
      if (!e.nivel) e.nivel = 1;
      campos.appendChild(campoRotulado('Nível' + (t.nivel_max ? ' (máx. ' + t.nivel_max + ')' : ''),
        inteiro(e.nivel, 1, t.nivel_max || 20, function (v) { e.nivel = v; })));
    } else if (c.tipo === 'opcoes') {
      var ops = c.valores.map(function (v, k) {
        var nome = criador.nomeVariante(t, k);
        return [k, (nome ? nome + ' ' : '') + '(' + sinal(v) + (c.unidade ? '/' + c.unidade : '') + ')'];
      });
      var s = selectCom(ops, e.opcao || 0, 'Versão');
      campos.appendChild(campoRotulado('Versão', s));
      if (t.variantes) {
        var explica = el('p', 'criador-variante');
        mostrarVariante = function () { explica.textContent = t.variantes[e.opcao || 0].resumo; };
        mostrarVariante();
        campos.appendChild(explica);
      }
      s.addEventListener('change', function () { e.opcao = parseInt(s.value, 10); if (mostrarVariante) mostrarVariante(); mudou(); });
      if (c.unidade) {
        if (!e.quantidade) e.quantidade = 1;
        campos.appendChild(campoRotulado('Quantas (' + c.unidade + ')', inteiro(e.quantidade, 1, 20, function (v) { e.quantidade = v; })));
      }
    } else if (c.tipo === 'faixa') {
      var lo = Math.min(c.min, c.max), hi = Math.max(c.min, c.max);
      if (e.valor == null) e.valor = Math.abs(c.min) < Math.abs(c.max) ? c.min : c.max;
      campos.appendChild(campoRotulado('Pontos (' + c.min + ' a ' + c.max + ')', inteiro(e.valor, lo, hi, function (v) { e.valor = v; })));
    } else if (c.tipo === 'minimo') {
      if (e.valor == null) e.valor = c.valor;
      campos.appendChild(campoRotulado('Pontos (mín. ' + c.valor + ')', inteiro(Math.abs(e.valor), Math.abs(c.valor), 300, function (v) {
        e.valor = (negativo ? -1 : 1) * Math.abs(v);
      })));
    } else if (c.tipo === 'variavel') {
      // custo que depende de vários fatores: fica "a combinar" até o jogador anotar o que acertou com o narrador
      if (c.como_calcular) campos.appendChild(el('p', 'criador-variante', c.como_calcular));
      // limites em módulo: numa desvantagem o "máximo" (-5) é o mais perto de zero e o "mínimo" (-45) o mais longe
      var perto = negativo ? c.maximo : c.minimo, longe = negativo ? c.minimo : c.maximo;
      var campoPts = inteiro(e.valor == null ? null : Math.abs(e.valor), perto != null ? Math.abs(perto) : 1, longe != null ? Math.abs(longe) : 300, function (v) {
        e.valor = v == null ? null : (negativo ? -1 : 1) * Math.abs(v);
      });
      campoPts.placeholder = 'a combinar';
      campos.appendChild(campoRotulado('Pontos combinados com o narrador', campoPts));
      if (c.exemplos && c.exemplos.length) {
        var ex = el('div', 'exemplos-custo');
        ex.appendChild(el('span', 'filtro-rotulo', 'Exemplos'));
        c.exemplos.forEach(function (x) {
          var b = el('button', 'chip chip-p', x.descricao + ' (' + sinal(x.custo) + ')');
          b.type = 'button';
          b.addEventListener('click', function () { e.valor = x.custo; campoPts.value = Math.abs(x.custo); mudou(); });
          ex.appendChild(b);
        });
        campos.appendChild(ex);
      }
    }
    if (c.autocontrole) {
      var auto = selectCom(R.autocontrole.niveis.map(function (n) {
        return [n.numero, n.numero + ' — ' + n.rotulo + ' (×' + num(n.multiplicador) + ')'];
      }), e.autocontrole || R.autocontrole.padrao, 'Autocontrole');
      auto.addEventListener('change', function () { e.autocontrole = parseInt(auto.value, 10); mudou(); });
      campos.appendChild(campoRotulado('Autocontrole', auto));
    }
    var nota = el('input');
    nota.value = sel.nota || '';
    nota.placeholder = 'ex.: de quê, de quem';
    nota.maxLength = 120;
    nota.addEventListener('input', function () { sel.nota = nota.value; mudou(); });
    campos.appendChild(campoRotulado('Detalhe', nota));
    return campos;
  }

  // ---------- janela de escolha: antes de entrar na ficha, o que tem opções pede a escolha ----------
  // Traços com versões, níveis, faixa, custo a combinar ou autocontrole; perícias com especialização.
  var dialogoConfig = null;
  function janelaConfig() {
    if (dialogoConfig) return dialogoConfig;
    var d = el('dialog', 'config-dialogo');
    d.setAttribute('aria-labelledby', 'config-titulo');
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    document.body.appendChild(d);
    dialogoConfig = d;
    return d;
  }
  function precisaEscolha(t) {
    var c = t.custo_estruturado || {};
    return (c.tipo && c.tipo !== 'fixo') || !!c.autocontrole;
  }
  // monta a janela: cabeçalho, corpo (preenchido por quem chama), rodapé com custo ao vivo e botões
  function abrirJanela(titulo, icone, resumo, montarCorpo, custoAgora, aoConfirmar, rotuloConfirmar, item) {
    var d = janelaConfig();
    d.textContent = '';
    var fechar = el('button', 'jogar-fechar', '×');
    fechar.type = 'button';
    fechar.setAttribute('aria-label', 'Fechar');
    fechar.addEventListener('click', function () { d.close(); });
    d.appendChild(fechar);
    var cab = el('div', 'config-cab');
    var ic = window.iconeSvg && window.iconeSvg(icone, 'config-icone');
    if (ic) cab.appendChild(ic);
    var h = el('h2', null, titulo);
    h.id = 'config-titulo';
    cab.appendChild(h);
    d.appendChild(cab);
    if (resumo) d.appendChild(el('p', 'config-resumo', resumo));
    var mais = item && window.detalhesItem && window.detalhesItem(item);
    if (mais) d.appendChild(mais);
    var corpo = el('div', 'config-corpo');
    d.appendChild(corpo);
    var pe = el('div', 'config-pe');
    var custo = el('strong', 'config-custo');
    var cancelar = el('button', 'btn btn-ghost', 'Cancelar');
    cancelar.type = 'button';
    cancelar.addEventListener('click', function () { d.close(); });
    var ok = el('button', 'btn btn-primary', rotuloConfirmar || 'Adicionar à ficha');
    ok.type = 'button';
    ok.addEventListener('click', function () { d.close(); aoConfirmar(); });
    pe.appendChild(custo);
    pe.appendChild(cancelar);
    pe.appendChild(ok);
    d.appendChild(pe);
    function atualizarCusto() { custo.textContent = custoAgora(); }
    montarCorpo(corpo, atualizarCusto);
    atualizarCusto();
    d.showModal();
    var primeiro = corpo.querySelector('input, select, button');
    if (primeiro) primeiro.focus();
  }
  // grupo de opções em cartões (um só marcado)
  function cartoes(nome, itens, marcado, aoMudar) {
    var g = el('div', 'config-opcoes');
    g.setAttribute('role', 'radiogroup');
    itens.forEach(function (it, k) {
      var lab = el('label', 'config-opcao');
      var r = el('input');
      r.type = 'radio';
      r.name = nome;
      r.checked = k === marcado;
      r.addEventListener('change', function () { if (r.checked) aoMudar(k); });
      lab.appendChild(r);
      var txt = el('span', 'config-opcao-texto');
      txt.appendChild(el('strong', null, it.titulo));
      if (it.valor) txt.appendChild(el('span', 'config-opcao-valor', it.valor));
      if (it.texto) txt.appendChild(el('span', 'config-opcao-desc', it.texto));
      lab.appendChild(txt);
      g.appendChild(lab);
    });
    return g;
  }

  function configurarTraco(t, aoConfirmar) {
    var c = t.custo_estruturado || {};
    var negativo = ehNegativo(t);
    var sel = { id: t.id, escolha: {} };
    var e = sel.escolha;
    if (c.tipo === 'niveis') e.nivel = 1;
    if (c.tipo === 'opcoes') e.opcao = 0;
    if (c.tipo === 'faixa') e.valor = Math.abs(c.min) < Math.abs(c.max) ? c.min : c.max;
    if (c.tipo === 'minimo') e.valor = c.valor;
    if (c.unidade) e.quantidade = 1;
    if (c.autocontrole) e.autocontrole = R.autocontrole.padrao;
    function custoAgora() {
      if (c.tipo === 'variavel' && e.valor == null) return 'Custo a combinar com o narrador';
      var v = criador.custoDoTraco(sel);
      return v === 0 ? 'Grátis' : v > 0 ? 'Custa ' + v + ' pontos' : 'Devolve ' + (-v) + ' pontos';
    }
    abrirJanela(t.nome, t.icone, t.resumo, function (corpo, atualizar) {
      if (c.tipo === 'opcoes') {
        corpo.appendChild(el('h3', null, 'Qual versão?'));
        corpo.appendChild(cartoes('versao', c.valores.map(function (v, k) {
          var va = t.variantes && t.variantes[k];
          return { titulo: va ? va.nome : 'Opção ' + (k + 1), valor: custoTexto(v) + (c.unidade ? ' por ' + c.unidade : ''), texto: va ? va.resumo : '' };
        }), 0, function (k) { e.opcao = k; atualizar(); }));
        if (c.unidade) {
          corpo.appendChild(el('h3', null, 'Quantas (' + c.unidade + ')?'));
          corpo.appendChild(inteiro(1, 1, 20, function (v) { e.quantidade = v; atualizar(); }));
        }
      } else if (c.tipo === 'niveis') {
        var max = t.nivel_max || 10;
        corpo.appendChild(el('h3', null, 'Qual nível?' + (t.nivel_max ? ' (máximo ' + t.nivel_max + ' em Adamar)' : '')));
        var passo = el('div', 'config-passo');
        var menos = el('button', 'btn btn-ghost', '−');
        var mais = el('button', 'btn btn-ghost', '+');
        var valor = el('strong', 'config-nivel', '1');
        menos.type = mais.type = 'button';
        menos.setAttribute('aria-label', 'Diminuir nível');
        mais.setAttribute('aria-label', 'Aumentar nível');
        function mostrar() { valor.textContent = String(e.nivel); menos.disabled = e.nivel <= 1; mais.disabled = e.nivel >= max; atualizar(); }
        menos.addEventListener('click', function () { e.nivel = Math.max(1, e.nivel - 1); mostrar(); });
        mais.addEventListener('click', function () { e.nivel = Math.min(max, e.nivel + 1); mostrar(); });
        passo.appendChild(menos); passo.appendChild(valor); passo.appendChild(mais);
        corpo.appendChild(passo);
        if (c.rotulo_nivel) corpo.appendChild(el('p', 'config-dica', 'Cada nível: ' + c.rotulo_nivel + '.'));
        setTimeout(mostrar, 0);
      } else if (c.tipo === 'faixa') {
        var lo = Math.min(c.min, c.max), hi = Math.max(c.min, c.max);
        corpo.appendChild(el('h3', null, 'Quantos pontos? (' + c.min + ' a ' + c.max + ')'));
        var r = el('input', 'config-faixa');
        r.type = 'range'; r.min = lo; r.max = hi; r.step = 1; r.value = e.valor;
        var mostra = el('strong', 'config-nivel', String(e.valor));
        r.addEventListener('input', function () { e.valor = parseInt(r.value, 10); mostra.textContent = String(e.valor); atualizar(); });
        corpo.appendChild(r);
        corpo.appendChild(mostra);
      } else if (c.tipo === 'minimo') {
        corpo.appendChild(el('h3', null, 'Quantos pontos? (mínimo ' + c.valor + ')'));
        corpo.appendChild(inteiro(Math.abs(c.valor), Math.abs(c.valor), 300, function (v) { e.valor = (negativo ? -1 : 1) * v; atualizar(); }));
      } else if (c.tipo === 'variavel' && (R.formulas || {})[t.id] && R.formulas[t.id].entradas) {
        // calculadora: um seletor por fator da fórmula do livro, e os modificadores
        var fo = R.formulas[t.id];
        e.formula = { modificadores: [] };
        var recalcular = function () {
          var v = calc.custoFormula(t.id, e.formula);
          e.valor = v == null ? null : v;
          atualizar();
        };
        corpo.appendChild(el('p', 'config-dica', 'Escolha cada fator: o custo sai pela fórmula do livro (pág. ' + (fo.ref ? fo.ref.pagina : t.ref.pagina) + '). Combine os detalhes com o narrador.'));
        fo.entradas.forEach(function (ent) {
          var titulo = (ent.descricao ? ent.descricao.charAt(0).toUpperCase() + ent.descricao.slice(1) : ent.id.charAt(0).toUpperCase() + ent.id.slice(1).replace(/_/g, ' '));
          if (ent.tipo === 'booleano') {
            var lb = el('label', 'check filtro-narrador config-mod');
            var cb = el('input');
            cb.type = 'checkbox';
            cb.addEventListener('change', function () { e.formula[ent.id] = cb.checked; recalcular(); });
            lb.appendChild(cb);
            lb.appendChild(el('span', null, titulo + ' (+' + (ent.custo_adicional || 0) + ')'));
            corpo.appendChild(lb);
            return;
          }
          corpo.appendChild(el('h3', null, titulo + (ent.opcional ? ' (opcional)' : '')));
          if (ent.tipo === 'numero') {
            var n = inteiro(null, 1, 300, function (v) { if (v == null) delete e.formula[ent.id]; else e.formula[ent.id] = v; recalcular(); });
            n.className = 'config-texto';
            corpo.appendChild(n);
            return;
          }
          var ops = [['', ent.opcional ? 'Não se aplica' : 'Escolha…']].concat(ent.opcoes.map(function (o, k) {
            var rot = o.rotulo || (o.nh != null ? 'NH ' + o.nh : null) || (o.ate != null ? 'até ' + Math.round(o.ate * 100) + '% dos seus pontos' : o.pontos_absolutos_max != null ? 'até ' + o.pontos_absolutos_max + ' pontos' : o.de != null ? o.de + ' a ' + o.ate : 'opção ' + (k + 1));
            var efeito = o.custo != null ? ' (' + sinal(o.custo) + ')' : o.multiplicador != null ? ' (×' + num(o.multiplicador) + ')' : o.ajuste != null ? ' (' + sinal(o.ajuste) + ')' : '';
            return [k, rot + efeito];
          }));
          var s = selectCom(ops, '', ent.id);
          s.className = 'config-texto';
          s.addEventListener('change', function () {
            if (s.value === '') delete e.formula[ent.id]; else e.formula[ent.id] = parseInt(s.value, 10);
            recalcular();
          });
          corpo.appendChild(s);
        });
        if (fo.modificadores && fo.modificadores.length) {
          corpo.appendChild(el('h3', null, 'Modificadores (opcional)'));
          fo.modificadores.forEach(function (m) {
            var lab = el('label', 'check filtro-narrador config-mod');
            var cx = el('input');
            cx.type = 'checkbox';
            cx.addEventListener('change', function () {
              var lista = e.formula.modificadores;
              if (cx.checked) {
                // do mesmo grupo, só um
                if (m.exclusivo_grupo) fo.modificadores.forEach(function (o) { if (o.exclusivo_grupo === m.exclusivo_grupo && o.nome !== m.nome) { var i = lista.indexOf(o.nome); if (i !== -1) lista.splice(i, 1); } });
                lista.push(m.nome);
              } else lista.splice(lista.indexOf(m.nome), 1);
              Array.prototype.forEach.call(corpo.querySelectorAll('.config-mod input'), function (x) { x.checked = lista.indexOf(x.getAttribute('data-nome')) !== -1; });
              recalcular();
            });
            cx.setAttribute('data-nome', m.nome);
            lab.appendChild(cx);
            lab.appendChild(el('span', null, m.nome + ' (' + (m.percentual > 0 ? '+' : '') + m.percentual + '%)'));
            corpo.appendChild(lab);
          });
        }
      } else if (c.tipo === 'variavel') {
        corpo.appendChild(el('h3', null, 'Como se calcula'));
        corpo.appendChild(el('p', 'config-dica', c.como_calcular || 'O custo depende de vários fatores. Combine com o narrador.'));
        var campo = inteiro(null, 1, 300, function (v) { e.valor = v == null ? null : (negativo ? -1 : 1) * v; atualizar(); });
        campo.placeholder = 'a combinar';
        if (c.exemplos && c.exemplos.length) {
          corpo.appendChild(el('h3', null, 'Exemplos (clique para usar)'));
          var ex = el('div', 'exemplos-custo');
          c.exemplos.forEach(function (x) {
            var b = el('button', 'chip chip-p', x.descricao + ' (' + sinal(x.custo) + ')');
            b.type = 'button';
            b.addEventListener('click', function () { e.valor = x.custo; campo.value = Math.abs(x.custo); atualizar(); });
            ex.appendChild(b);
          });
          corpo.appendChild(ex);
        }
        corpo.appendChild(el('h3', null, 'Pontos combinados'));
        corpo.appendChild(campo);
        corpo.appendChild(el('p', 'config-dica', 'Pode deixar em branco e combinar depois: a ficha fica com esta pendência até você anotar.'));
      }
      if (c.autocontrole) {
        corpo.appendChild(el('h3', null, 'Autocontrole: com que frequência resiste?'));
        var niveis = R.autocontrole.niveis;
        corpo.appendChild(cartoes('auto', niveis.map(function (n) {
          return { titulo: n.numero + ' — ' + n.rotulo, valor: '×' + num(n.multiplicador) };
        }), niveis.map(function (n) { return n.numero; }).indexOf(R.autocontrole.padrao), function (k) { e.autocontrole = niveis[k].numero; atualizar(); }));
      }
      corpo.appendChild(el('h3', null, 'Detalhe (opcional)'));
      var nota = el('input', 'config-texto');
      nota.placeholder = 'ex.: de quê, de quem, como se manifesta';
      nota.maxLength = 120;
      nota.addEventListener('input', function () { sel.nota = nota.value; });
      corpo.appendChild(nota);
    }, custoAgora, function () { aoConfirmar(sel); }, null, t);
  }

  function configurarPericia(p, aoConfirmar) {
    var sel = { id: p.id, pontos: 1, especializacao: '' };
    function nhAgora() {
      var rel = calc.nivelPorPontos(p.dificuldade, sel.pontos);
      var base = (ultimo || criador.resumir(ficha)).valores;
      var mapa = { DX: 'dx', IQ: 'iq', HT: 'ht', Per: 'per', Vontade: 'vontade' };
      return 'Custa ' + sel.pontos + (sel.pontos === 1 ? ' ponto' : ' pontos') + (rel == null ? '' : ' · NH ' + (base[mapa[p.atributo]] + rel) + ' (antes de bônus)');
    }
    abrirJanela(p.nome, p.icone, p.resumo + ' ' + p.atributo + '/' + p.dificuldade + '.', function (corpo, atualizar) {
      var lista = (p.especializacoes || []).filter(function (x) { return x.adamar !== 'nao'; });
      corpo.appendChild(el('h3', null, 'Qual especialização?'));
      if (lista.length && !p.livre_escolha) {
        sel.especializacao = lista[0].nome;
        corpo.appendChild(cartoes('esp', lista.map(function (x) {
          return { titulo: x.nome, valor: x.adamar === 'narrador' ? 'com o narrador' : '' };
        }), 0, function (k) { sel.especializacao = lista[k].nome; }));
      } else {
        var t = el('input', 'config-texto');
        t.placeholder = 'escreva qual';
        t.maxLength = 60;
        t.addEventListener('input', function () { sel.especializacao = t.value; });
        corpo.appendChild(t);
      }
      corpo.appendChild(el('h3', null, 'Quantos pontos?'));
      var pts = selectCom(PONTOS_PERICIA.map(function (v) { return [v, v + (v === 1 ? ' ponto' : ' pontos')]; }), 1, 'Pontos');
      pts.className = 'config-texto';
      pts.addEventListener('change', function () { sel.pontos = parseInt(pts.value, 10); atualizar(); });
      corpo.appendChild(pts);
    }, nhAgora, function () { aoConfirmar(sel); }, null, p);
  }

  // efeitos recolhidos: o resumo mostra quantos de cada tipo; abrir mostra a lista com etiquetas
  function blocoEfeitos(sel) {
    var det = el('details', 'app-efeitos');
    var resumo = el('summary');
    var ul = el('ul', 'efeitos');
    det.appendChild(resumo);
    det.appendChild(ul);
    return {
      no: det,
      atualizar: function () {
        var lista = criador.efeitosDoTraco(sel);
        det.hidden = !lista.length;
        var conta = {};
        lista.forEach(function (x) { conta[x.tipo] = (conta[x.tipo] || 0) + 1; });
        resumo.textContent = '';
        resumo.appendChild(document.createTextNode('Efeitos '));
        ['aplicado', 'sempre', 'condicional', 'regra'].forEach(function (tipo) {
          if (!conta[tipo]) return;
          resumo.appendChild(el('span', 'efeito-tag tag-' + tipo, conta[tipo] + ' ' + Efeitos.ETIQUETAS[tipo]));
        });
        Efeitos.desenharEfeitos(ul, lista);
      }
    };
  }

  // Cards da ficha ficam fechados numa linha; abrem ao clicar, ao serem adicionados ou quando têm problema.
  var abertos = typeof WeakSet === 'function' ? new WeakSet() : { has: function () { return true; }, add: function () {}, delete: function () {} };
  function resumoDaEscolha(sel, t) {
    var c = t.custo_estruturado || {};
    var e = sel.escolha || {};
    var partes = [];
    if (c.tipo === 'niveis') partes.push('nível ' + (e.nivel || 0));
    if (c.tipo === 'opcoes') {
      var v = criador.nomeVariante(t, e.opcao);
      partes.push(v && v !== t.nome ? v : sinal(c.valores[e.opcao || 0]));
      if (c.unidade && (e.quantidade || 1) > 1) partes.push('×' + e.quantidade);
    }
    if (c.tipo === 'variavel' && e.valor == null) partes.push('a combinar');
    if (c.autocontrole && e.autocontrole && e.autocontrole !== R.autocontrole.padrao) partes.push('autocontrole ' + e.autocontrole);
    if (sel.nota) partes.push(sel.nota);
    return partes.join(' · ');
  }
  // janela de detalhes do item (js/detalhes.js); sem mexer no endereço da página
  function verDetalhes(item, acao) {
    if (window.ItemUI) window.ItemUI.abrir(item, { link: false, acao: acao });
  }
  function nomeComDetalhes(item) {
    var b = el('button', 'app-item-nome app-item-nome-btn', item.nome);
    b.type = 'button';
    b.title = 'Ver detalhes de ' + item.nome;
    b.setAttribute('aria-haspopup', 'dialog');
    b.addEventListener('click', function () { verDetalhes(item); });
    return b;
  }
  function cardRetratil(row, sel, conteudo) {
    var botao = el('button', 'app-abrir', '▸');
    botao.type = 'button';
    botao.setAttribute('aria-label', 'Mostrar detalhes');
    var corpo = el('div', 'app-item-corpo');
    conteudo.forEach(function (n) { corpo.appendChild(n); });
    function aplicar() {
      var aberto = abertos.has(sel);
      corpo.hidden = !aberto;
      botao.textContent = aberto ? '▾' : '▸';
      botao.setAttribute('aria-expanded', String(aberto));
      row.classList.toggle('aberto', aberto);
    }
    botao.addEventListener('click', function () {
      if (abertos.has(sel)) abertos.delete(sel); else abertos.add(sel);
      aplicar();
    });
    aplicar();
    return { botao: botao, corpo: corpo };
  }
  function problemasDoItem(r, nome) {
    var lista = r.problemas.concat(mostrarIncompletos ? r.incompletos : []);
    return lista.filter(function (e) {
      return e.texto.indexOf(nome + ':') === 0 || e.texto.indexOf(nome + ' não') === 0 ||
        e.texto.indexOf(nome + ' (') === 0 || e.texto.indexOf(nome + ' aparece') === 0;
    });
  }

  function listaDeTracos(prefixo, negativo) {
    var box = document.getElementById('c-' + prefixo + '-escolhidas');
    var conta = document.getElementById('c-' + prefixo + '-conta');
    var infos = [];
    function desenhar() {
      box.textContent = '';
      infos = [];
      ficha.tracos.forEach(function (sel, i) {
        var t = porId(G.vantagens.concat(G.desvantagens), sel.id);
        if (!t || ehNegativo(t) !== negativo) return;
        var row = el('div', 'app-item st-' + t.adamar);
        var topo = el('div', 'app-item-topo');
        var ef = blocoEfeitos(sel);
        var card = cardRetratil(row, sel, [el('p', 'app-item-meta', t.resumo), controlesDoTraco(sel, t, negativo), ef.no]);
        topo.appendChild(card.botao);
        var icT = window.iconeSvg && window.iconeSvg(t.icone, 'icone-item');
        if (icT) topo.appendChild(icT);
        topo.appendChild(nomeComDetalhes(t));
        if (t.adamar === 'narrador') { var m = el('span', 'marca-narrador', '◆'); m.title = 'Com o narrador'; topo.appendChild(m); }
        if (t.categoria === 'qualidade' || t.categoria === 'peculiaridade') topo.appendChild(el('span', 'app-item-cat', t.categoria));
        var escolha = el('span', 'app-item-escolha');
        topo.appendChild(escolha);
        var custo = el('span', 'criador-custo');
        topo.appendChild(custo);
        topo.appendChild(botaoRemover(t.nome, function () { ficha.tracos.splice(i, 1); desenhar(); catalogo.desenhar(); mudou(); }));
        row.appendChild(topo);
        row.appendChild(card.corpo);
        var erroEl = el('p', 'app-item-erro');
        row.appendChild(erroEl);
        infos.push(function (r) {
          var c = t.custo_estruturado || {};
          var aCombinar = c.tipo === 'variavel' && (sel.escolha || {}).valor == null;
          custo.textContent = aCombinar ? 'a combinar' : custoTexto(criador.custoDoTraco(sel));
          custo.classList.toggle('devolve', !aCombinar && criador.custoDoTraco(sel) < 0);
          escolha.textContent = resumoDaEscolha(sel, t);
          ef.atualizar();
          var meus = problemasDoItem(r, t.nome);
          erroEl.textContent = meus.map(function (e) { return e.texto.replace(t.nome + ': ', ''); }).join(' · ');
          row.classList.toggle('com-erro', meus.some(function (e) { return e.tipo === 'erro'; }));
        });
        box.appendChild(row);
      });
      if (!box.children.length) box.appendChild(el('p', 'pericia-vazio', 'Nada ainda. Escolha no catálogo.'));
    }
    var catalogo = criarCatalogo(document.getElementById('c-' + prefixo + '-catalogo'), {
      itens: function () { return (negativo ? G.desvantagens : G.vantagens).filter(tracoEscolhivel); },
      texto: function (t) { return t.nome + ' ' + t.resumo; },
      selo: function (t) { return t.custo; },
      filtros: [
        {
          rotulo: 'Tipo',
          opcoes: Object.keys(TIPOS).map(function (k) { return [k, TIPOS[k]]; })
            .concat([[negativo ? 'peculiaridade' : 'qualidade', negativo ? 'Peculiaridade (-1)' : 'Qualidade (+1)']]),
          testa: function (t, v) { return t.categoria === v || (t.tipo || []).indexOf(v) !== -1; }
        },
        FILTRO_CUSTO
      ],
      ordens: ORDENS_TRACO,
      jaTem: function (t) { return ficha.tracos.some(function (s) { return s.id === t.id; }); },
      adicionar: function (t, depois) {
        if (!precisaEscolha(t) || typeof HTMLDialogElement === 'undefined') {
          ficha.tracos.push({ id: t.id, escolha: {} });
          desenhar();
          return true;
        }
        configurarTraco(t, function (sel) {
          ficha.tracos.push(sel);
          desenhar();
          depois();
        });
        return false;
      }
    });
    atualizadores.push(function (r) {
      infos.forEach(function (f) { f(r); });
      var meus = r.tracos.filter(function (x) { return x.traco && ehNegativo(x.traco) === negativo; });
      var soma = meus.reduce(function (s, x) { return s + x.custo; }, 0);
      conta.textContent = meus.length + (meus.length === 1 ? ' item · ' : ' itens · ') + (soma < 0 ? 'devolvem ' + (-soma) : 'custam ' + soma);
    });
    return { desenhar: function () { desenhar(); catalogo.desenhar(); } };
  }
  var listaVantagens = listaDeTracos('vantagens', false);
  var listaDesvantagens = listaDeTracos('desvantagens', true);
  atualizadores.push(function (r) {
    var d = document.getElementById('c-desv-limite');
    d.textContent = 'Desvantagens devolvem pontos ao saldo, até ' + (-r.limite) + ' no total (contando atributos baixos e sociedade). Já devolveram ' + (-r.desvantagens) + '. Peculiaridades devolvem 1 cada, até ' + criador.LIMITE_PECULIARIDADES + '.';
    d.className = r.desvantagens < r.limite ? 'tem-erro' : '';
  });

  // talentos
  var selTalento = document.getElementById('c-talento-novo');
  (R.talentos || []).forEach(function (t) {
    var o = el('option', null, t.nome + ' (' + t.custo_por_nivel + '/nível)');
    o.value = t.id;
    selTalento.appendChild(o);
  });
  var infosTalento = [];
  function desenharTalentos() {
    var box = document.getElementById('c-talentos');
    box.textContent = '';
    infosTalento = [];
    ficha.talentos.forEach(function (sel, i) {
      var t = porId(R.talentos, sel.id);
      if (!t) return;
      var row = el('div', 'app-item');
      var topo = el('div', 'app-item-topo');
      topo.appendChild(el('strong', 'app-item-nome', 'Talento: ' + t.nome));
      var custo = el('span', 'criador-custo');
      topo.appendChild(custo);
      topo.appendChild(botaoRemover(t.nome, function () { ficha.talentos.splice(i, 1); desenharTalentos(); mudou(); }));
      row.appendChild(topo);
      var nomes = t.pericias.map(function (id) { var p = porId(G.pericias, id); return p ? p.nome : id; });
      row.appendChild(el('p', 'app-item-meta', 'Soma em: ' + nomes.join(', ') + '.'));
      var campos = el('div', 'criador-campos');
      campos.appendChild(campoRotulado('Nível (1 a ' + (t.nivel_max || 4) + ')', inteiro(sel.nivel || 1, 1, t.nivel_max || 4, function (v) { sel.nivel = v; })));
      row.appendChild(campos);
      infosTalento.push(function () { custo.textContent = custoTexto(t.custo_por_nivel * (sel.nivel || 0)); });
      box.appendChild(row);
    });
    Array.prototype.forEach.call(selTalento.options, function (o) {
      o.disabled = ficha.talentos.some(function (s) { return s.id === o.value; });
    });
  }
  atualizadores.push(function () { infosTalento.forEach(function (f) { f(); }); });
  document.getElementById('c-add-talento').addEventListener('click', function () {
    if (ficha.talentos.some(function (s) { return s.id === selTalento.value; })) return;
    ficha.talentos.push({ id: selTalento.value, nivel: 1 });
    desenharTalentos();
    mudou();
  });

  // qualidades e peculiaridades escritas pelo jogador
  function listaDeTextos(chave, boxId, botaoId, placeholder, limite) {
    var box = document.getElementById(boxId);
    var botao = document.getElementById(botaoId);
    var entradas = [];
    function desenhar() {
      box.textContent = '';
      entradas = [];
      ficha[chave].forEach(function (texto, i) {
        var row = el('div', 'app-item app-item-texto');
        var input = el('input');
        input.value = texto;
        input.placeholder = placeholder;
        input.maxLength = 120;
        input.setAttribute('aria-label', placeholder);
        input.addEventListener('input', function () { ficha[chave][i] = input.value; mudou(); });
        entradas.push(input);
        row.appendChild(input);
        row.appendChild(botaoRemover(texto || 'item', function () { ficha[chave].splice(i, 1); desenhar(); mudou(); }));
        box.appendChild(row);
      });
    }
    botao.addEventListener('click', function () {
      ficha[chave].push('');
      desenhar();
      mudou();
      if (entradas.length) entradas[entradas.length - 1].focus();
    });
    atualizadores.push(function (r) {
      entradas.forEach(function (i) { i.classList.toggle('campo-falta', !i.value.trim()); });
      if (limite) botao.disabled = r.peculiaridades >= limite;
    });
    return { desenhar: desenhar };
  }
  var listaQualidades = listaDeTextos('qualidades', 'c-qualidades', 'c-add-qualidade', 'Qualidade (+1)', null);
  var listaPeculiaridades = listaDeTextos('peculiaridades', 'c-peculiaridades', 'c-add-peculiaridade', 'Peculiaridade (-1)', criador.LIMITE_PECULIARIDADES);

  // ---------- 6. perícias ----------
  var infosPericia = [];
  function desenharPericias() {
    var box = document.getElementById('c-pericias-escolhidas');
    box.textContent = '';
    infosPericia = [];
    ficha.pericias.forEach(function (sel, i) {
      var p = porId(G.pericias, sel.id);
      if (!p) return;
      var row = el('div', 'app-item st-' + p.adamar);
      var topo = el('div', 'app-item-topo');
      var icP = window.iconeSvg && window.iconeSvg(p.icone, 'icone-item');
      if (icP) topo.appendChild(icP);
      topo.appendChild(nomeComDetalhes(p));
      topo.appendChild(el('span', 'app-item-cat', p.atributo + '/' + p.dificuldade));
      if (p.adamar === 'narrador') { var m = el('span', 'marca-narrador', '◆'); m.title = 'Com o narrador'; topo.appendChild(m); }
      // pontos na mesma linha do nome: é o que mais se mexe
      var pts = selectCom(PONTOS_PERICIA.map(function (v) { return [v, v + ' pt' + (v === 1 ? '' : 's')]; }), sel.pontos || 1, 'Pontos em ' + p.nome);
      pts.className = 'app-pontos-pericia';
      pts.addEventListener('change', function () { sel.pontos = parseInt(pts.value, 10); mudou(); });
      topo.appendChild(pts);
      var nh = el('span', 'criador-custo app-nh');
      topo.appendChild(nh);
      topo.appendChild(botaoRemover(p.nome, function () { ficha.pericias.splice(i, 1); desenharPericias(); catalogoPericias.desenhar(); mudou(); }));
      row.appendChild(topo);
      var campos = el('div', 'criador-campos');
      var controleEsp = null;
      if (p.especializacao) {
        var lista = (p.especializacoes || []).filter(function (x) { return x.adamar !== 'nao'; });
        if (lista.length && !p.livre_escolha) {
          controleEsp = selectCom([['', 'Escolha…']].concat(lista.map(function (x) {
            return [x.nome, x.nome + (x.adamar === 'narrador' ? ' (com o narrador)' : '')];
          })), sel.especializacao || '', 'Especialização');
          controleEsp.addEventListener('change', function () { sel.especializacao = controleEsp.value; mudou(); });
        } else {
          controleEsp = el('input');
          controleEsp.value = sel.especializacao || '';
          controleEsp.maxLength = 60;
          controleEsp.placeholder = 'qual?';
          controleEsp.addEventListener('input', function () { sel.especializacao = controleEsp.value; mudou(); });
        }
        campos.appendChild(campoRotulado('Especialização', controleEsp));
      }
      if (campos.children.length) row.appendChild(campos);
      var bonus = el('ul', 'efeitos');
      row.appendChild(bonus);
      var erroEl = el('p', 'app-item-erro');
      row.appendChild(erroEl);
      infosPericia.push(function (r) {
        var item = r.pericias[i];
        if (!item) return;
        nh.textContent = item.nh == null ? 'NH —' : 'NH ' + item.nh + ' · ' + item.nivel_relativo;
        nh.title = item.nh == null ? '' : p.atributo + (item.relativo ? sinal(item.relativo) : '') + (item.bonus.length ? ' com bônus' : '');
        Efeitos.desenharEfeitos(bonus, item.bonus.map(function (b) {
          return { tipo: 'aplicado', texto: sinal(b.valor) + ' de ' + b.origem };
        }).concat(item.situacional.map(function (b) {
          return { tipo: 'condicional', texto: sinal(b.valor) + ' de ' + b.origem + ' — ' + b.condicao };
        })));
        if (controleEsp) controleEsp.classList.toggle('campo-falta', !String(sel.especializacao || '').trim());
        var meus = problemasDoItem(r, p.nome).filter(function (e) { return !/escolha a especialização/.test(e.texto); });
        erroEl.textContent = meus.map(function (e) { return e.texto; }).join(' · ');
        row.classList.toggle('com-erro', meus.some(function (e) { return e.tipo === 'erro'; }));
      });
      box.appendChild(row);
    });
    if (!box.children.length) box.appendChild(el('p', 'pericia-vazio', 'Nenhuma perícia ainda. Escolha no catálogo.'));
  }
  atualizadores.push(function (r) {
    infosPericia.forEach(function (f) { f(r); });
    document.getElementById('c-pericias-conta').textContent = ficha.pericias.length + (ficha.pericias.length === 1 ? ' perícia · ' : ' perícias · ') + 'custam ' + r.custos.pericias;
  });
  var ATRIBUTOS_PERICIA = [['DX', 'DX'], ['IQ', 'IQ'], ['HT', 'HT'], ['Per', 'Percepção'], ['Vontade', 'Vontade']];
  var catalogoPericias = criarCatalogo(document.getElementById('c-pericias-catalogo'), {
    itens: function () { return G.pericias.filter(function (p) { return p.adamar !== 'nao'; }); },
    texto: function (p) { return p.nome + ' ' + p.resumo; },
    selo: function (p) {
      var st = ultimo && ultimo.combate ? ultimo.combate.sem_treino(p) : null;
      return p.atributo + '/' + p.dificuldade + (st != null ? ' · sem treino ' + st : '');
    },
    filtros: [
      { rotulo: 'Atributo', opcoes: ATRIBUTOS_PERICIA, testa: function (p, v) { return p.atributo === v; } },
      { rotulo: 'Dificuldade', opcoes: DIFICULDADES.map(function (d) { return [d, d]; }), testa: function (p, v) { return p.dificuldade === v; } },
      { rotulo: 'Grupo', opcoes: Object.keys(GRUPOS).map(function (k) { return [k, GRUPOS[k]]; }), testa: function (p, v) { return p.grupo === v; } }
    ],
    ordens: [
      ['nome', 'nome', function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); }],
      ['dificuldade', 'dificuldade', function (a, b) { return DIFICULDADES.indexOf(a.dificuldade) - DIFICULDADES.indexOf(b.dificuldade); }],
      ['atributo', 'atributo', function (a, b) { return a.atributo.localeCompare(b.atributo); }]
    ],
    jaTem: function (p) { return !p.especializacao && ficha.pericias.some(function (s) { return s.id === p.id; }); },
    adicionar: function (p, depois) {
      if (!p.especializacao || typeof HTMLDialogElement === 'undefined') {
        ficha.pericias.push({ id: p.id, pontos: 1, especializacao: '' });
        desenharPericias();
        return true;
      }
      configurarPericia(p, function (sel) {
        ficha.pericias.push(sel);
        desenharPericias();
        depois();
      });
      return false;
    }
  });

  // ---------- 7. equipamento ----------
  var infosEquip = [];
  function desenharEquipamento() {
    criador.arrumarEquipamento(ficha); // uid, local e lugar do corpo antes de montar os seletores
    var box = document.getElementById('c-equipamento-escolhido');
    box.textContent = '';
    infosEquip = [];
    ficha.equipamento.forEach(function (sel, i) {
      var it = porId(G.equipamento, sel.id);
      if (!it) return;
      var row = el('div', 'app-item st-' + it.adamar);
      var topo = el('div', 'app-item-topo');
      var icE = window.iconeSvg && window.iconeSvg(it.icone, 'icone-item');
      if (icE) topo.appendChild(icE);
      topo.appendChild(nomeComDetalhes(it));
      topo.appendChild(el('span', 'app-item-cat', textoPreco(it)));
      var custoItem = el('span', 'criador-custo');
      topo.appendChild(custoItem);
      topo.appendChild(botaoRemover(it.nome, function () {
        ficha.equipamento.splice(i, 1);
        ficha.equipamento.forEach(function (x) { if (x.dentro === sel.uid) delete x.dentro; }); // o que estava dentro fica solto
        desenharEquipamento(); catalogoEquip.desenhar(); mudou();
      }));
      row.appendChild(topo);
      var campos = el('div', 'criador-campos');
      campos.appendChild(campoRotulado('Quantidade', inteiro(sel.quantidade || 1, 1, 999, function (v) { sel.quantidade = v; })));
      // qualidade: 0 é o normal; abaixo, pior e mais barato; acima, melhor e mais caro
      var tabelaQ = (R.qualidade_itens || {})[classeEquip(it)] || [];
      if (tabelaQ.length) {
        var qual = selectCom(tabelaQ.map(function (q) {
          return [q.nivel, (q.nivel > 0 ? '+' : '') + q.nivel + ' ' + q.nome + (q.preco !== 1 ? ' (×' + num(q.preco) + ')' : '')];
        }), sel.qualidade || 0, 'Qualidade de ' + it.nome);
        qual.addEventListener('change', function () { sel.qualidade = parseInt(qual.value, 10) || 0; mudou(); });
        campos.appendChild(campoRotulado('Qualidade', qual));
      }
      // onde está: equipado (pronto para usar), levado (na mochila) ou guardado em casa; ou dentro de outro item
      var recipientes = ficha.equipamento.filter(function (x) {
        var ix = porId(G.equipamento, x.id);
        return x !== sel && ix && RECIPIENTE.test(ix.nome) && x.dentro !== sel.uid;
      });
      var onde = selectCom(criador.lugaresPossiveis(it.id).map(function (l) { return ['lugar:' + l, criador.LUGARES[l].nome]; })
        .concat([['levado', 'Levado']]).concat(recipientes.map(function (x) {
          return ['dentro:' + x.uid, 'Dentro de: ' + porId(G.equipamento, x.id).nome];
        })).concat([['guardado', 'Guardado em casa']]),
      sel.dentro ? 'dentro:' + sel.dentro : sel.local === 'equipado' ? 'lugar:' + sel.lugar : (sel.local || 'levado'), 'Onde está ' + it.nome);
      onde.addEventListener('change', function () {
        if (onde.value.indexOf('lugar:') === 0) { porNoCorpo(sel.uid, onde.value.slice(6)); return; }
        if (onde.value.indexOf('dentro:') === 0) { sel.dentro = onde.value.slice(7); sel.local = 'levado'; delete sel.lugar; }
        else { delete sel.dentro; delete sel.lugar; sel.local = onde.value; }
        mudou();
      });
      campos.appendChild(campoRotulado('Onde', onde));
      row.appendChild(campos);
      var notaQ = el('p', 'app-item-meta');
      row.appendChild(notaQ);
      infosEquip.push(function (r) {
        var x = r.equipamento[i];
        custoItem.textContent = x && x.preco != null ? moeda(x.preco) : '—';
        notaQ.textContent = x && x.qualidade && x.qualidade.nivel && x.qualidade.nota ? x.qualidade.nome + ': ' + x.qualidade.nota + '.' : '';
        notaQ.hidden = !notaQ.textContent;
        row.classList.toggle('item-guardado', !!x && x.local === 'guardado');
      });
      box.appendChild(row);
    });
    if (!box.children.length) box.appendChild(el('p', 'pericia-vazio', 'Nada na mochila ainda.'));
  }
  function precoDe(i) { return i.preco ? i.preco.valor : null; }
  var RECIPIENTE = /mochila|bolsa|algibeira|aljava|saco|bainha|bornal|cesto|caixa|baú|alforje/i;
  function classeEquip(it) {
    if (it.combate && it.combate.modos && it.combate.modos.length) return 'armas';
    if (it.protecao || it.escudo) return 'armaduras';
    return 'equipamento';
  }
  var catalogoEquip = criarCatalogo(document.getElementById('c-equipamento-catalogo'), {
    itens: function () { return (G.equipamento || []).filter(function (i) { return i.adamar !== 'nao'; }); },
    texto: function (i) { return i.nome + ' ' + (i.subcategoria || '') + ' ' + (i.resumo || ''); },
    selo: function (i) { return textoPreco(i) + (i.peso ? ' · ' + num(i.peso.kg) + ' kg' : ''); },
    filtros: [
      { rotulo: 'Tipo', opcoes: Object.keys(CATEGORIAS_EQUIP).map(function (k) { return [k, CATEGORIAS_EQUIP[k]]; }), testa: function (i, v) { return i.categoria === v; } },
      {
        rotulo: 'Preço',
        opcoes: [['cabe', 'cabe no dinheiro'], ['1', 'até 50'], ['2', '51–200'], ['3', '201–1.000'], ['4', '1.000+']],
        testa: function (i, v) {
          var p = precoDe(i);
          if (p == null) return false;
          if (v === 'cabe') return !ultimo || p <= ultimo.dinheiro_restante;
          return v === '1' ? p <= 50 : v === '2' ? p > 50 && p <= 200 : v === '3' ? p > 200 && p <= 1000 : p > 1000;
        }
      }
    ],
    ordens: [
      ['nome', 'nome', function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); }],
      ['preco', 'mais barato', function (a, b) { return (precoDe(a) == null ? 1e12 : precoDe(a)) - (precoDe(b) == null ? 1e12 : precoDe(b)); }],
      ['preco-desc', 'mais caro', function (a, b) { return (precoDe(b) || 0) - (precoDe(a) || 0); }]
    ],
    jaTem: function (i) { return ficha.equipamento.some(function (s) { return s.id === i.id; }); },
    adicionar: function (i) { ficha.equipamento.push(criador.novoItem(i.id)); desenharEquipamento(); }
  });
  atualizadores.push(function (r) {
    infosEquip.forEach(function (f) { f(r); });
    var d = document.getElementById('c-dinheiro');
    var cb = r.combate;
    d.textContent = 'Dinheiro inicial ' + moeda(r.recursos) + ' · gasto ' + moeda(r.gasto_equipamento) + ' · ' +
      (r.dinheiro_restante >= 0 ? 'sobram ' + moeda(r.dinheiro_restante) : 'faltam ' + moeda(-r.dinheiro_restante)) +
      ' · peso ' + num(cb.peso_total) + ' kg, carga ' + cb.carga.nome + ' (Base de Carga ' + num(r.base_carga) + ' kg)';
    d.className = r.dinheiro_restante < 0 ? 'tem-erro' : '';
    document.getElementById('c-equipamento-conta').textContent = ficha.equipamento.length + (ficha.equipamento.length === 1 ? ' item · ' : ' itens · ') + moeda(r.gasto_equipamento);
  });

  // ---------- 8. revisão, salvar e envio ----------
  var NOMES_ETAPA = {};
  botoesEtapa.forEach(function (b, i) { NOMES_ETAPA[b.id] = etapas[i].getAttribute('data-etapa'); });
  function listaPendencias(ul, itens, classe) {
    ul.textContent = '';
    itens.forEach(function (e) {
      var li = el('li', classe || (e.tipo === 'erro' ? 'tem-erro' : 'tem-pendente'));
      var destino = e.etapa === 'geral' ? null : e.etapa;
      if (destino) {
        var b = el('button', 'app-ir', NOMES_ETAPA[destino] || destino);
        b.type = 'button';
        b.addEventListener('click', function () { irParaEtapa(destino); });
        li.appendChild(b);
      }
      li.appendChild(document.createTextNode(' ' + e.texto));
      ul.appendChild(li);
    });
  }
  // resumo de combate (revisão): dano, defesas, carga, armas e proteção
  function desenharCombate(box, r) {
    var cb = r.combate;
    box.textContent = '';
    var linha = el('div', 'combate-linha');
    [['GdP', cb.dano_basico ? cb.dano_basico.gdp : '—'], ['GeB', cb.dano_basico ? cb.dano_basico.geb : '—'],
      ['Esquiva', cb.defesas.esquiva], ['Aparar', cb.defesas.aparar == null ? '—' : cb.defesas.aparar],
      ['Bloqueio', cb.defesas.bloqueio == null ? '—' : cb.defesas.bloqueio], ['Carga', cb.carga.nome]].forEach(function (x) {
      var c = el('div', 'combate-caixa');
      c.appendChild(el('span', null, x[0]));
      c.appendChild(el('strong', null, String(x[1])));
      linha.appendChild(c);
    });
    box.appendChild(linha);
    box.appendChild(el('p', 'combate-nota', num(cb.peso_total) + ' kg carregados · deslocamento ' + cb.carga.deslocamento + (cb.db ? ' · escudo +' + cb.db + ' em todas as defesas' : '')));
    if (cb.armas.length) {
      var t = el('table', 'combate-armas');
      var h = el('tr');
      ['Arma', 'Dano', 'NH', 'Aparar', 'Alcance'].forEach(function (x) { h.appendChild(el('th', null, x)); });
      t.appendChild(h);
      cb.armas.forEach(function (a) {
        var tr = el('tr');
        var n = el('td');
        var ic = window.iconeSvg && window.iconeSvg(a.item.icone, 'icone-item');
        if (ic) n.appendChild(ic);
        n.appendChild(document.createTextNode(a.nome));
        n.title = a.pericia;
        tr.appendChild(n);
        [a.dano, a.nh == null ? '—' : a.nh, a.aparar == null ? '—' : a.aparar, a.alcance].forEach(function (x) { tr.appendChild(el('td', null, String(x))); });
        t.appendChild(tr);
      });
      box.appendChild(t);
    }
    var locais = Object.keys(cb.protecao);
    if (locais.length) box.appendChild(el('p', 'combate-nota', 'Proteção (RD): ' + locais.map(function (l) { return l + ' ' + cb.protecao[l].rd + (cb.protecao[l].so_frente ? ' (só frente)' : ''); }).join(' · ')));
  }
  atualizadores.push(function (r) { desenharCombate(document.getElementById('c-combate'), r); });

  var texto = document.getElementById('c-texto');
  var whats = document.getElementById('c-whats');
  var copiado = document.getElementById('c-copiado');
  atualizadores.push(function (r) {
    listaPendencias(document.getElementById('c-erros'), r.problemas.concat(r.incompletos));
    listaPendencias(document.getElementById('c-avisos'), r.avisos, 'tem-aviso');
    var st = document.getElementById('c-revisao-status');
    st.textContent = r.valida
      ? 'A ficha está completa. Salve e mande para o narrador.' + (r.avisos.length ? ' Os avisos são coisas para combinar com ele.' : '')
      : [r.problemas.length ? r.problemas.length + (r.problemas.length === 1 ? ' problema' : ' problemas') : '',
        r.incompletos.length ? r.incompletos.length + ' a preencher' : ''].filter(Boolean).join(' e ') +
        ': resolva para salvar como pronta e enviar. Clique no nome da etapa para ir até lá.';
    st.className = r.valida ? 'ok' : 'tem-erro';
    var t = criador.textoFicha(ficha, r);
    texto.textContent = t;
    var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.whatsapp) || { numero: '' };
    whats.href = window.buildWhatsAppUrl ? window.buildWhatsAppUrl(cfg.numero, 'Olá! Montei meu personagem de Adamar:\n\n' + t) : '#';
    whats.classList.toggle('is-disabled', !r.valida);
    whats.setAttribute('aria-disabled', r.valida ? 'false' : 'true');
  });
  whats.addEventListener('click', function (ev) {
    if (ultimo && !ultimo.valida) { ev.preventDefault(); avisar('Resolva as pendências antes de enviar.'); }
  });
  function avisar(msg) {
    copiado.textContent = msg;
    setTimeout(function () { if (copiado.textContent === msg) copiado.textContent = ''; }, 4000);
  }
  document.getElementById('c-copiar').addEventListener('click', function () {
    var t = texto.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { avisar('Copiado.'); }, function () { avisar('Não deu para copiar; selecione o texto.'); });
    } else avisar('Selecione o texto e copie.');
  });
  document.getElementById('c-baixar').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(ficha, null, 2)], { type: 'application/json' });
    var a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = (semAcento(ficha.nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'personagem') + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  });
  document.getElementById('c-abrir').addEventListener('change', function (ev) {
    var arq = ev.target.files && ev.target.files[0];
    if (!arq) return;
    var leitor = new FileReader();
    leitor.onload = function () {
      try {
        ficha = criador.carregar(JSON.parse(leitor.result));
        versaoSalva = versaoSalvaDe(ficha);
        desenharTudo();
        mudou();
        avisar('Ficha aberta.');
      } catch (e) { avisar('Esse arquivo não é uma ficha válida.'); }
      ev.target.value = '';
    };
    leitor.readAsText(arq);
  });
  var nova = document.getElementById('c-nova');
  var confirmando = null;
  nova.addEventListener('click', function () {
    if (!confirmando) {
      nova.textContent = 'Clique de novo para apagar a ficha atual';
      confirmando = setTimeout(function () { nova.textContent = 'Ficha nova'; confirmando = null; }, 5000);
      return;
    }
    clearTimeout(confirmando);
    confirmando = null;
    nova.textContent = 'Ficha nova';
    ficha = criador.fichaNova();
    versaoSalva = null;
    desenharTudo();
    mudou();
    irPara(0);
  });

  // salvar: só entra no cofre sem inconsistência (pontos sobrando pode); enquanto isso, o rascunho fica guardado sozinho
  var botaoSalvar = document.getElementById('c-salvar');
  var statusSalvo = document.getElementById('c-salvo');
  var tentouSalvar = false;
  if (!arquivo) botaoSalvar.hidden = true;
  var salvarMovel = document.getElementById('c-salvar-movel');
  salvarMovel.hidden = !arquivo;
  salvarMovel.addEventListener('click', function () { botaoSalvar.click(); });
  function gravar() {
    // mantém o PV/PF/anotações da sessão que estão no cofre
    var noCofre = ficha.id_salvo && arquivo.obter(ficha.id_salvo);
    if (noCofre && noCofre.em_jogo) ficha.em_jogo = noCofre.em_jogo;
    var id = arquivo.salvar(ficha);
    if (!id) { statusSalvo.textContent = 'Não deu para salvar: o navegador está sem espaço ou bloqueado. No cofre, baixe uma cópia de todos e apague personagens antigos ou retratos grandes.'; statusSalvo.className = 'app-status tem-erro'; return; }
    ficha.id_salvo = id;
    versaoSalva = assinatura(arquivo.obter(id));
    tentouSalvar = false;
    guardarRascunho();
    atualizar();
  }
  botaoSalvar.addEventListener('click', function () {
    if (ultimo.valida) { gravar(); return; }
    tentouSalvar = true;
    mostrarIncompletos = true;
    atualizar();
  });
  atualizadores.push(function (r) {
    if (!arquivo) return;
    statusSalvo.textContent = '';
    statusSalvo.className = 'app-status';
    var salvaIgual = ficha.id_salvo && versaoSalva === assinatura(ficha);
    if (tentouSalvar && !r.valida) {
      botaoSalvar.textContent = 'Salvar';
      salvarMovel.textContent = 'Salvar';
      statusSalvo.appendChild(document.createTextNode('Não dá para salvar com ' + r.erros.length + (r.erros.length === 1 ? ' pendência' : ' pendências') + ' (o rascunho continua guardado). '));
      var ver = el('button', 'btn-link', 'Ver pendências');
      ver.type = 'button';
      ver.addEventListener('click', function () { irParaEtapa('revisao'); });
      statusSalvo.appendChild(ver);
      statusSalvo.classList.add('tem-erro');
      return;
    }
    tentouSalvar = false;
    botaoSalvar.textContent = ficha.id_salvo && versaoSalva ? 'Salvar alterações' : 'Salvar';
    salvarMovel.textContent = ficha.id_salvo && versaoSalva === assinatura(ficha) ? 'Salvo ✓' : 'Salvar';
    if (salvaIgual) {
      statusSalvo.appendChild(document.createTextNode(r.valida ? 'Salvo. ' : 'Salvo como rascunho. '));
      var link = el('a', null, 'Ver ficha');
      link.href = 'personagens.html?id=' + encodeURIComponent(ficha.id_salvo);
      statusSalvo.appendChild(link);
      if (!r.valida) statusSalvo.classList.add('tem-aviso');
    } else if (ficha.id_salvo && versaoSalva) {
      statusSalvo.textContent = 'Alterações não salvas.';
      statusSalvo.classList.add('tem-aviso');
    } else {
      statusSalvo.textContent = r.valida ? 'Pronta para salvar.' : r.erros.length + (r.erros.length === 1 ? ' pendência.' : ' pendências.');
      if (!r.valida) statusSalvo.classList.add('tem-aviso');
    }
  });

  function desenharTudo() {
    desenharModelos();
    camposTexto.forEach(function (c) { c.value = ficha[c.getAttribute('data-campo')] || ''; });
    mostrarOrcamento();
    mostrarAtributos();
    mostrarSocial();
    desenharIdiomas();
    listaVantagens.desenhar();
    listaDesvantagens.desenhar();
    desenharTalentos();
    listaQualidades.desenhar();
    listaPeculiaridades.desenhar();
    desenharPericias();
    catalogoPericias.desenhar();
    desenharEquipamento();
    catalogoEquip.desenhar();
  }

  desenharTudo();
  irPara(atual);
  window.addEventListener('load', function () { centralizarEtapa(atual, false); });
})();
