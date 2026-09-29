// js/criador.js — tela do criador de personagem (modo aplicativo): etapas, catálogos com filtros, validação e salvar.
// A lógica de pontos, NH e validação fica em criador-ficha.js.
(function () {
  var G = window.GURPS;
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
    var semSalvar = !ficha.id_salvo || !arquivo || JSON.stringify(arquivo.obter(ficha.id_salvo)) !== JSON.stringify(ficha);
    if (arquivo && semSalvar && JSON.stringify(ficha) !== vazio) arquivo.salvar(ficha);
    ficha = criador.fichaNova();
    try { localStorage.setItem(ARMAZENAMENTO_ETAPA, '0'); history.replaceState(null, '', location.pathname); } catch (e) { /* sem armazenamento */ }
  }
  function versaoSalvaDe(f) { return f.id_salvo && arquivo && arquivo.obter(f.id_salvo) ? JSON.stringify(arquivo.obter(f.id_salvo)) : null; }
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
    voltar.disabled = i === 0;
    seguir.hidden = i === etapas.length - 1;
    try { localStorage.setItem(ARMAZENAMENTO_ETAPA, String(i)); } catch (e) { /* sem armazenamento */ }
    if (etapas[i].getAttribute('data-id') === 'revisao') mostrarIncompletos = true;
    atualizar();
    var corpo = etapas[i].querySelector('.app-corpo');
    if (corpo) corpo.scrollTop = 0;
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

  // ---------- coluna lateral ----------
  atualizadores.push(function (r) {
    document.getElementById('lado-nome').textContent = ficha.nome || 'Sem nome';
    var total = document.getElementById('lado-total');
    total.textContent = String(r.restante);
    total.className = r.restante < 0 ? 'tem-erro' : '';
    document.getElementById('lado-orcamento').textContent = 'de saldo';
    var rest = document.getElementById('lado-restante');
    rest.textContent = r.restante < 0 ? 'Saldo negativo' : 'de ' + ficha.orcamento + ' · gastou ' + r.pontos_gastos + (r.pontos_devolvidos ? ' · voltou ' + r.pontos_devolvidos : '');
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
    document.getElementById('c-derivadas').textContent = 'Esquiva ' + r.esquiva + ' · Base de Carga ' + num(r.base_carga) + ' kg' +
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
      lista.textContent = '';
      achados.forEach(function (it) {
        var jaTem = opcoes.jaTem(it);
        var li = el('li', 'app-cat-item' + (jaTem ? ' ja-tem' : ''));
        var texto = el('button', 'app-cat-texto');
        texto.type = 'button';
        texto.setAttribute('aria-expanded', 'false');
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
        texto.addEventListener('click', function () {
          var aberto = li.classList.toggle('aberto');
          texto.setAttribute('aria-expanded', String(aberto));
        });
        li.appendChild(texto);
        li.appendChild(el('span', 'app-cat-selo', opcoes.selo(it)));
        var b = el('button', 'app-adicionar', jaTem ? '✓' : '+');
        b.type = 'button';
        b.disabled = !!jaTem;
        b.title = jaTem ? 'Já está na ficha' : 'Adicionar à ficha';
        b.setAttribute('aria-label', (jaTem ? 'Já na ficha: ' : 'Adicionar ') + it.nome);
        b.addEventListener('click', function () {
          opcoes.adicionar(it);
          mudou();
          desenhar();
        });
        li.appendChild(b);
        lista.appendChild(li);
      });
      if (!achados.length) lista.appendChild(el('li', 'pericia-vazio', ocultos ? 'Só há itens raros com esses filtros. Marque "Mostrar também os raros".' : 'Nada com esses filtros.'));
    }
    busca.addEventListener('input', desenhar);
    desenhar();
    return { desenhar: desenhar };
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
        var nome = el('strong', 'app-item-nome', t.nome);
        nome.title = t.resumo;
        nome.addEventListener('click', function () { card.botao.click(); });
        topo.appendChild(nome);
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
      adicionar: function (t) {
        var sel = { id: t.id, escolha: {} };
        ficha.tracos.push(sel);
        // abre sozinho só quando há algo a escolher
        var c = t.custo_estruturado || {};
        if (c.tipo !== 'fixo' || c.autocontrole) abertos.add(sel);
        desenhar();
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
      var nome = el('strong', 'app-item-nome', p.nome);
      nome.title = p.resumo;
      topo.appendChild(nome);
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
        nh.textContent = item.nh == null ? 'NH —' : 'NH ' + item.nh;
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
    selo: function (p) { return p.atributo + '/' + p.dificuldade; },
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
    adicionar: function (p) { ficha.pericias.push({ id: p.id, pontos: 1, especializacao: '' }); desenharPericias(); }
  });

  // ---------- 7. equipamento ----------
  var infosEquip = [];
  function desenharEquipamento() {
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
      topo.appendChild(el('strong', 'app-item-nome', it.nome));
      topo.appendChild(el('span', 'app-item-cat', textoPreco(it)));
      var custoItem = el('span', 'criador-custo');
      topo.appendChild(custoItem);
      topo.appendChild(botaoRemover(it.nome, function () { ficha.equipamento.splice(i, 1); desenharEquipamento(); catalogoEquip.desenhar(); mudou(); }));
      row.appendChild(topo);
      var campos = el('div', 'criador-campos');
      campos.appendChild(campoRotulado('Quantidade', inteiro(sel.quantidade || 1, 1, 999, function (v) { sel.quantidade = v; })));
      row.appendChild(campos);
      infosEquip.push(function (r) {
        var x = r.equipamento[i];
        custoItem.textContent = x && x.preco != null ? moeda(x.preco) : '—';
      });
      box.appendChild(row);
    });
    if (!box.children.length) box.appendChild(el('p', 'pericia-vazio', 'Nada na mochila ainda.'));
  }
  function precoDe(i) { return i.preco ? i.preco.valor : null; }
  var catalogoEquip = criarCatalogo(document.getElementById('c-equipamento-catalogo'), {
    itens: function () { return (G.equipamento || []).filter(function (i) { return i.adamar !== 'nao'; }); },
    texto: function (i) { return i.nome + ' ' + (i.subcategoria || '') + ' ' + (i.resumo || ''); },
    selo: textoPreco,
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
    adicionar: function (i) { ficha.equipamento.push({ id: i.id, quantidade: 1 }); desenharEquipamento(); }
  });
  atualizadores.push(function (r) {
    infosEquip.forEach(function (f) { f(r); });
    var d = document.getElementById('c-dinheiro');
    d.textContent = 'Dinheiro inicial ' + moeda(r.recursos) + ' · gasto ' + moeda(r.gasto_equipamento) + ' · ' +
      (r.dinheiro_restante >= 0 ? 'sobram ' + moeda(r.dinheiro_restante) : 'faltam ' + moeda(-r.dinheiro_restante)) +
      '. Peso fica com o narrador.';
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

  // salvar: só salva como pronta se não houver pendências; rascunho só de forma explícita
  var botaoSalvar = document.getElementById('c-salvar');
  var statusSalvo = document.getElementById('c-salvo');
  var pedindoRascunho = false;
  if (!arquivo) botaoSalvar.hidden = true;
  function gravar() {
    var id = arquivo.salvar(ficha);
    if (!id) { statusSalvo.textContent = 'Não deu para salvar (navegador sem espaço ou bloqueado).'; return; }
    ficha.id_salvo = id;
    versaoSalva = JSON.stringify(arquivo.obter(id));
    pedindoRascunho = false;
    guardarRascunho();
    atualizar();
  }
  botaoSalvar.addEventListener('click', function () {
    if (ultimo.valida || pedindoRascunho) { gravar(); return; }
    pedindoRascunho = true;
    mostrarIncompletos = true;
    atualizar();
  });
  atualizadores.push(function (r) {
    if (!arquivo) return;
    statusSalvo.textContent = '';
    statusSalvo.className = 'app-status';
    var salvaIgual = ficha.id_salvo && versaoSalva === JSON.stringify(ficha);
    if (pedindoRascunho && !r.valida) {
      botaoSalvar.textContent = 'Salvar como rascunho';
      statusSalvo.appendChild(document.createTextNode(r.erros.length + (r.erros.length === 1 ? ' pendência' : ' pendências') + ': a ficha ainda não está pronta. '));
      var ver = el('button', 'btn-link', 'Ver pendências');
      ver.type = 'button';
      ver.addEventListener('click', function () { irParaEtapa('revisao'); });
      statusSalvo.appendChild(ver);
      statusSalvo.classList.add('tem-erro');
      return;
    }
    pedindoRascunho = false;
    botaoSalvar.textContent = ficha.id_salvo && versaoSalva ? 'Salvar alterações' : 'Salvar';
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
})();
