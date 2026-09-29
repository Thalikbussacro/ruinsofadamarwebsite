// js/criador.js — página do criador de personagem: etapas, seletores e envio. A lógica fica em criador-ficha.js.
(function () {
  var G = window.GURPS;
  var raiz = document.getElementById('criador');
  if (!G || !G.regras || !window.criarCalculo || !window.criarCriador || !raiz) return;
  var R = G.regras;
  var calc = window.criarCalculo(R);
  var criador = window.criarCriador(G, calc);
  var ARMAZENAMENTO = 'adamar-criador';
  var ARMAZENAMENTO_ETAPA = 'adamar-criador-etapa';
  var ADAMAR = { livre: 'Livre', narrador: 'Com o narrador', nao: 'Não existe' };
  var PONTOS_PERICIA = [1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
  var TALENTO_TRACO = 'talento'; // Talentos têm etapa própria, com a lista de regras.json

  // ---------- utilidades ----------
  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function sinal(v) { return v > 0 ? '+' + v : String(v); }
  function num(v) { return String(v).replace('.', ','); }
  function semAcento(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function porId(lista, id) { return lista.filter(function (x) { return x.id === id; })[0]; }
  function moeda(valor) {
    var m = (R.campanha && R.campanha.moeda) || { nome: 'coroa', plural: 'coroas', por_dolar_gurps: 1 };
    var v = valor * m.por_dolar_gurps;
    return v.toLocaleString('pt-BR') + ' ' + (v === 1 ? m.nome : m.plural);
  }
  function selo(adamar) {
    return el('span', 'pericia-status st-' + adamar, ADAMAR[adamar] || adamar);
  }
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
    var b = el('button', 'btn-link criador-remover', 'Remover');
    b.type = 'button';
    b.setAttribute('aria-label', 'Remover ' + rotulo);
    b.addEventListener('click', aoClicar);
    return b;
  }

  // ---------- estado ----------
  var ficha;
  try { ficha = criador.carregar(JSON.parse(localStorage.getItem(ARMAZENAMENTO) || 'null')); } catch (e) { ficha = criador.fichaNova(); }
  var atualizadores = [];
  function salvar() {
    try { localStorage.setItem(ARMAZENAMENTO, JSON.stringify(ficha)); } catch (e) { /* sem armazenamento */ }
  }
  function mudou() { salvar(); atualizar(); }

  // ---------- etapas ----------
  var etapas = Array.prototype.slice.call(raiz.querySelectorAll('.step'));
  var progresso = document.getElementById('criador-etapas');
  var atual = 0;
  try { atual = Math.min(etapas.length - 1, Math.max(0, parseInt(localStorage.getItem(ARMAZENAMENTO_ETAPA), 10) || 0)); } catch (e) { atual = 0; }
  etapas.forEach(function (s, i) {
    var li = el('li');
    var b = el('button', 'criador-etapa', s.getAttribute('data-etapa'));
    b.type = 'button';
    b.addEventListener('click', function () { irPara(i); });
    li.appendChild(b);
    progresso.appendChild(li);
  });
  var voltar = raiz.querySelector('[data-voltar]');
  var seguir = raiz.querySelector('[data-seguir]');
  function irPara(i, rolar) {
    atual = i;
    etapas.forEach(function (s, k) { s.classList.toggle('is-current', k === i); });
    Array.prototype.forEach.call(progresso.children, function (li, k) {
      li.classList.toggle('is-current', k === i);
      li.classList.toggle('is-done', k < i);
      li.firstChild.setAttribute('aria-current', k === i ? 'step' : 'false');
    });
    voltar.hidden = i === 0;
    seguir.hidden = i === etapas.length - 1;
    try { localStorage.setItem(ARMAZENAMENTO_ETAPA, String(i)); } catch (e) { /* sem armazenamento */ }
    atualizar();
    if (rolar !== false) progresso.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  voltar.addEventListener('click', function () { irPara(Math.max(0, atual - 1)); });
  seguir.addEventListener('click', function () { irPara(Math.min(etapas.length - 1, atual + 1)); });

  // ---------- 1. conceito ----------
  var PONTOS = (R.campanha && R.campanha.pontos_iniciais) || { padrao: 80, sugestoes: [80] };
  var selOrc = document.getElementById('c-orcamento');
  var campoLivre = document.getElementById('campo-orcamento-livre');
  var inputLivre = document.getElementById('c-orcamento-livre');
  PONTOS.sugestoes.forEach(function (v) {
    var o = el('option', null, v + (v === PONTOS.padrao ? ' (padrão)' : ''));
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
    if (!isNaN(v) && v >= 0) { ficha.orcamento = v; mudou(); }
  });
  var camposTexto = Array.prototype.slice.call(document.querySelectorAll('[data-campo]'));
  camposTexto.forEach(function (c) {
    c.addEventListener('input', function () { ficha[c.getAttribute('data-campo')] = c.value; mudou(); });
  });

  // ---------- 2. atributos ----------
  function campoNumero(id, rotulo, passo, aoMudar) {
    var wrap = el('div', 'field calc-campo');
    var label = el('label', null, rotulo);
    label.htmlFor = 'c-' + id;
    var input = el('input');
    input.type = 'number';
    input.id = 'c-' + id;
    input.step = passo;
    input.addEventListener('input', function () {
      var v = parseFloat(String(input.value).replace(',', '.'));
      if (!isNaN(v)) aoMudar(v);
    });
    var info = el('span', 'calc-info');
    wrap.appendChild(label); wrap.appendChild(input); wrap.appendChild(info);
    return { wrap: wrap, input: input, info: info };
  }
  var camposAtr = {}, camposSec = {};
  R.atributos.forEach(function (a) {
    var c = campoNumero(a.id, a.sigla + ' — ' + a.nome, 1, function (v) {
      ficha.atributos[a.id] = Math.round(v);
      mudou();
      mostrarSecundarias(a.id);
    });
    camposAtr[a.id] = c;
    document.getElementById('c-atributos').appendChild(c.wrap);
  });
  R.secundarias.forEach(function (s) {
    var c = campoNumero(s.id, s.sigla + ' — ' + s.nome, s.passo, function (v) {
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
    mostrarSecundarias();
  }
  // Mantém os ajustes comprados; só reescreve os campos que não estão sendo editados.
  function mostrarSecundarias() {
    var v = calc.secundarias(ficha.atributos, ficha.ajustes);
    R.secundarias.forEach(function (s) {
      if (document.activeElement !== camposSec[s.id].input) camposSec[s.id].input.value = v[s.id];
    });
  }
  atualizadores.push(function (r) {
    R.atributos.forEach(function (a) {
      camposAtr[a.id].info.textContent = sinal(calc.custoAtributo(a.id, ficha.atributos[a.id])) + ' pts';
    });
    R.secundarias.forEach(function (s) {
      var aj = ficha.ajustes[s.id] || 0;
      camposSec[s.id].info.textContent = aj ? sinal(calc.custoSecundaria(s.id, aj)) + ' pts' : 'sem custo';
    });
    document.getElementById('c-derivadas').textContent = 'Esquiva ' + r.esquiva + ' · Base de Carga ' + num(r.base_carga) + ' kg';
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
    document.getElementById('c-info-aparencia').textContent = sinal(calc.custoAparencia(so.aparencia)) + ' pts · reação ' + (ap ? ap.reacao : '');
    var gratis = calc.statusPorRiqueza(so.riqueza, so.multimilionario);
    document.getElementById('c-info-status').textContent = sinal(calc.custoStatus(so.status)) + ' pts' + (gratis ? ' · +' + gratis + ' grátis pela riqueza' : '');
    document.getElementById('c-info-riqueza').textContent = sinal(calc.custoRiqueza(so.riqueza, so.multimilionario)) + ' pts · ' + moeda(r.recursos);
    document.getElementById('c-info-alfabetizacao').textContent = sinal(calc.custoAlfabetizacao(so.alfabetizacao)) + ' pts' +
      (so.alfabetizacao !== 'alfabetizado' && so.analfabetismoRegra ? ' · fora do limite' : '');
  });

  var NIVEIS_IDIOMA = R.idiomas.niveis.map(function (n) { return [n.id, n.nome]; });
  var infosIdioma = [];
  function desenharIdiomas() {
    var box = document.getElementById('c-idiomas');
    box.textContent = '';
    infosIdioma = [];
    ficha.idiomas.forEach(function (idioma, i) {
      var row = el('div', 'criador-item');
      var nome = el('input');
      nome.value = idioma.nome || '';
      nome.placeholder = 'Idioma';
      nome.setAttribute('aria-label', 'Nome do idioma');
      nome.addEventListener('input', function () { idioma.nome = nome.value; mudou(); });
      var fala = selectCom(NIVEIS_IDIOMA, idioma.fala, 'Fala');
      var escrita = selectCom(NIVEIS_IDIOMA, idioma.escrita, 'Escrita');
      fala.addEventListener('change', function () { idioma.fala = fala.value; mudou(); });
      escrita.addEventListener('change', function () { idioma.escrita = escrita.value; mudou(); });
      var info = el('span', 'criador-custo');
      infosIdioma.push(function () { info.textContent = sinal(calc.custoIdioma(idioma.fala, idioma.escrita)) + ' pts'; });
      var campos = el('div', 'criador-campos');
      [[nome, null], [fala, 'Fala'], [escrita, 'Escrita']].forEach(function (par) {
        var w = el('label', 'criador-campo');
        if (par[1]) w.appendChild(el('span', null, par[1]));
        w.appendChild(par[0]);
        campos.appendChild(w);
      });
      row.appendChild(campos);
      row.appendChild(info);
      row.appendChild(botaoRemover(idioma.nome || 'idioma', function () { ficha.idiomas.splice(i, 1); desenharIdiomas(); mudou(); }));
      box.appendChild(row);
    });
  }
  atualizadores.push(function () { infosIdioma.forEach(function (f) { f(); }); });
  document.getElementById('c-add-idioma').addEventListener('click', function () {
    ficha.idiomas.push({ nome: '', fala: 'rudimentar', escrita: 'nenhum' });
    desenharIdiomas();
    mudou();
    var campos = document.querySelectorAll('#c-idiomas input');
    if (campos.length) campos[campos.length - 1].focus();
  });

  // ---------- seletor genérico (busca + lista) ----------
  function criarSeletor(caixa, opcoes) {
    var busca = el('input', 'criador-busca');
    busca.type = 'search';
    busca.placeholder = opcoes.placeholder;
    busca.setAttribute('aria-label', opcoes.placeholder);
    var lista = el('ul', 'criador-resultados');
    var contagem = el('p', 'contagem');
    caixa.appendChild(busca);
    caixa.appendChild(contagem);
    caixa.appendChild(lista);
    var LIMITE = 25;
    function desenhar() {
      var q = semAcento(busca.value.trim());
      // quem tem o termo no nome vem antes (começo do nome primeiro); depois quem só tem na descrição
      function peso(it) {
        var nome = semAcento(it.nome);
        return nome.indexOf(q) === 0 ? 0 : nome.indexOf(q) !== -1 ? 1 : 2;
      }
      var achados = opcoes.itens().filter(function (it) {
        return !q || semAcento(opcoes.texto(it)).indexOf(q) !== -1;
      });
      if (q) achados = achados.map(function (it, i) { return [peso(it), i, it]; })
        .sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; })
        .map(function (x) { return x[2]; });
      lista.textContent = '';
      contagem.textContent = achados.length > LIMITE
        ? achados.length + ' encontrados; mostrando ' + LIMITE + '. Digite para filtrar.'
        : achados.length + (achados.length === 1 ? ' encontrado' : ' encontrados');
      achados.slice(0, LIMITE).forEach(function (it) {
        var li = el('li', 'criador-resultado st-' + (it.adamar || 'livre'));
        var topo = el('div', 'pericia-topo');
        topo.appendChild(el('strong', 'pericia-nome', it.nome));
        topo.appendChild(el('span', 'pericia-dif', opcoes.selo(it)));
        li.appendChild(topo);
        if (it.resumo) li.appendChild(el('p', 'pericia-resumo', it.resumo));
        var pe = el('div', 'pericia-meta');
        if (it.adamar) pe.appendChild(selo(it.adamar));
        if (it.ref && it.ref.pagina) pe.appendChild(el('span', null, 'pág. ' + it.ref.pagina));
        var jaTem = opcoes.jaTem && opcoes.jaTem(it);
        var b = el('button', 'btn btn-ghost criador-adicionar', jaTem ? 'Já na ficha' : 'Adicionar');
        b.type = 'button';
        b.disabled = !!jaTem;
        b.setAttribute('aria-label', 'Adicionar ' + it.nome);
        b.addEventListener('click', function () {
          opcoes.adicionar(it);
          desenhar();
          mudou();
        });
        pe.appendChild(b);
        li.appendChild(pe);
        lista.appendChild(li);
      });
    }
    busca.addEventListener('input', desenhar);
    desenhar();
    return { desenhar: desenhar };
  }

  // ---------- 4 e 5. vantagens e desvantagens ----------
  function tracoEscolhivel(t) {
    return t.adamar !== 'nao' && !criador.tracoSocial(t.id) && t.id !== TALENTO_TRACO;
  }
  function rotuloCusto(t) { return t.custo; }

  function controlesDoTraco(sel, t, negativo) {
    var c = t.custo_estruturado || { tipo: 'variavel' };
    var e = sel.escolha = sel.escolha || {};
    var campos = el('div', 'criador-campos');
    function campo(rotulo, controle) {
      var w = el('label', 'criador-campo');
      w.appendChild(el('span', null, rotulo));
      w.appendChild(controle);
      campos.appendChild(w);
    }
    function numero(valor, min, max, aoMudar) {
      var i = el('input');
      i.type = 'number';
      if (min != null) i.min = min;
      if (max != null) i.max = max;
      i.value = valor == null ? '' : valor;
      i.addEventListener('input', function () {
        var v = parseInt(i.value, 10);
        aoMudar(isNaN(v) ? null : v);
        mudou();
      });
      return i;
    }
    var mostrarVariante = null;
    if (c.tipo === 'niveis') {
      if (!e.nivel) e.nivel = 1;
      campo('Nível', numero(e.nivel, 1, t.nivel_max || null, function (v) { e.nivel = v || 0; }));
    } else if (c.tipo === 'opcoes') {
      var ops = c.valores.map(function (v, k) {
        var nome = criador.nomeVariante(t, k);
        return [k, (nome ? nome + ' ' : '') + '(' + sinal(v) + (c.unidade ? '/' + c.unidade : '') + ')'];
      });
      var s = selectCom(ops, e.opcao || 0, 'Versão');
      campo('Versão', s);
      if (t.variantes) {
        var explica = el('p', 'criador-variante');
        mostrarVariante = function () { explica.textContent = t.variantes[e.opcao || 0].resumo; };
        mostrarVariante();
        campos.appendChild(explica);
      }
      s.addEventListener('change', function () { e.opcao = parseInt(s.value, 10); if (mostrarVariante) mostrarVariante(); mudou(); });
      if (c.unidade) {
        if (!e.quantidade) e.quantidade = 1;
        campo('Quantas (' + c.unidade + ')', numero(e.quantidade, 1, null, function (v) { e.quantidade = v || 1; }));
      }
    } else if (c.tipo === 'faixa') {
      if (e.valor == null) e.valor = c.min;
      campo('Pontos (' + c.min + ' a ' + c.max + ')', numero(e.valor, Math.min(c.min, c.max), Math.max(c.min, c.max), function (v) {
        e.valor = v == null ? c.min : Math.max(Math.min(c.min, c.max), Math.min(Math.max(c.min, c.max), v));
      }));
    } else if (c.tipo === 'minimo' || c.tipo === 'variavel') {
      if (c.tipo === 'minimo' && e.valor == null) e.valor = c.valor;
      campo(c.tipo === 'minimo' ? 'Pontos (mín. ' + c.valor + ')' : 'Pontos (com o narrador)', numero(e.valor, null, null, function (v) {
        e.valor = v == null ? null : (negativo ? -Math.abs(v) : Math.abs(v));
      }));
    }
    if (c.autocontrole) {
      var auto = selectCom(R.autocontrole.niveis.map(function (n) {
        return [n.numero, n.numero + ' — ' + n.rotulo + ' (×' + num(n.multiplicador) + ')'];
      }), e.autocontrole || R.autocontrole.padrao, 'Autocontrole');
      auto.addEventListener('change', function () { e.autocontrole = parseInt(auto.value, 10); mudou(); });
      campo('Autocontrole', auto);
    }
    var nota = el('input');
    nota.value = sel.nota || '';
    nota.placeholder = 'detalhe (ex.: de quê, de quem)';
    nota.maxLength = 120;
    nota.addEventListener('input', function () { sel.nota = nota.value; mudou(); });
    campo('Detalhe', nota);
    return campos;
  }

  function listaDeTracos(boxId, negativo) {
    var box = document.getElementById(boxId);
    var infos = [];
    function desenhar() {
      box.textContent = '';
      infos = [];
      ficha.tracos.forEach(function (sel, i) {
        var t = porId(G.vantagens.concat(G.desvantagens), sel.id);
        if (!t || (t.categoria === 'desvantagem') !== negativo) return;
        var row = el('div', 'criador-item st-' + t.adamar);
        var topo = el('div', 'pericia-topo');
        topo.appendChild(el('strong', 'pericia-nome', t.nome));
        var custo = el('span', 'criador-custo');
        topo.appendChild(custo);
        row.appendChild(topo);
        var meta = el('div', 'pericia-meta');
        meta.appendChild(selo(t.adamar));
        meta.appendChild(el('span', null, t.resumo));
        if (t.nota_adamar) meta.appendChild(el('span', null, t.nota_adamar));
        row.appendChild(meta);
        row.appendChild(controlesDoTraco(sel, t, negativo));
        row.appendChild(botaoRemover(t.nome, function () { ficha.tracos.splice(i, 1); desenhar(); seletor.desenhar(); mudou(); }));
        infos.push(function () { custo.textContent = sinal(criador.custoDoTraco(sel)) + ' pts'; });
        box.appendChild(row);
      });
      if (!box.children.length) box.appendChild(el('p', 'pericia-vazio', negativo ? 'Nenhuma desvantagem ainda.' : 'Nenhuma vantagem ainda.'));
    }
    var seletor = criarSeletor(document.getElementById(boxId.replace('escolhidas', 'seletor')), {
      placeholder: negativo ? 'Procurar desvantagem…' : 'Procurar vantagem…',
      itens: function () { return (negativo ? G.desvantagens : G.vantagens).filter(tracoEscolhivel); },
      texto: function (t) { return t.nome + ' ' + t.resumo; },
      selo: rotuloCusto,
      jaTem: function (t) { return ficha.tracos.some(function (s) { return s.id === t.id; }); },
      adicionar: function (t) { ficha.tracos.push({ id: t.id, escolha: {} }); desenhar(); }
    });
    atualizadores.push(function () { infos.forEach(function (f) { f(); }); });
    return { desenhar: function () { desenhar(); seletor.desenhar(); } };
  }
  var listaVantagens = listaDeTracos('c-vantagens-escolhidas', false);
  var listaDesvantagens = listaDeTracos('c-desvantagens-escolhidas', true);

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
      var row = el('div', 'criador-item');
      var topo = el('div', 'pericia-topo');
      topo.appendChild(el('strong', 'pericia-nome', t.nome));
      var custo = el('span', 'criador-custo');
      topo.appendChild(custo);
      row.appendChild(topo);
      var nomes = t.pericias.map(function (id) { var p = porId(G.pericias, id); return p ? p.nome : id; });
      row.appendChild(el('p', 'pericia-meta', 'Soma em: ' + nomes.join(', ') + '.'));
      var campos = el('div', 'criador-campos');
      var w = el('label', 'criador-campo');
      w.appendChild(el('span', null, 'Nível (1 a ' + (t.nivel_max || 4) + ')'));
      var n = el('input');
      n.type = 'number'; n.min = 1; n.max = t.nivel_max || 4; n.value = sel.nivel || 1;
      n.addEventListener('input', function () { sel.nivel = Math.max(1, Math.min(t.nivel_max || 4, parseInt(n.value, 10) || 1)); mudou(); });
      w.appendChild(n);
      campos.appendChild(w);
      row.appendChild(campos);
      row.appendChild(botaoRemover(t.nome, function () { ficha.talentos.splice(i, 1); desenharTalentos(); mudou(); }));
      infosTalento.push(function () { custo.textContent = sinal(t.custo_por_nivel * (sel.nivel || 0)) + ' pts'; });
      box.appendChild(row);
    });
  }
  atualizadores.push(function () { infosTalento.forEach(function (f) { f(); }); });
  document.getElementById('c-add-talento').addEventListener('click', function () {
    if (ficha.talentos.some(function (s) { return s.id === selTalento.value; })) return;
    ficha.talentos.push({ id: selTalento.value, nivel: 1 });
    desenharTalentos();
    mudou();
  });

  // qualidades e peculiaridades: listas de texto
  function listaDeTextos(chave, boxId, botaoId, placeholder, maximo) {
    var box = document.getElementById(boxId);
    var botao = document.getElementById(botaoId);
    function desenhar() {
      box.textContent = '';
      ficha[chave].forEach(function (texto, i) {
        var row = el('div', 'criador-item criador-item-texto');
        var input = el('input');
        input.value = texto;
        input.placeholder = placeholder;
        input.maxLength = 120;
        input.setAttribute('aria-label', placeholder);
        input.addEventListener('input', function () { ficha[chave][i] = input.value; mudou(); });
        row.appendChild(input);
        row.appendChild(botaoRemover(texto || 'item', function () { ficha[chave].splice(i, 1); desenhar(); mudou(); }));
        box.appendChild(row);
      });
      botao.disabled = maximo != null && ficha[chave].length >= maximo;
    }
    botao.addEventListener('click', function () {
      ficha[chave].push('');
      desenhar();
      mudou();
      var campos = box.querySelectorAll('input');
      if (campos.length) campos[campos.length - 1].focus();
    });
    return { desenhar: desenhar };
  }
  var listaQualidades = listaDeTextos('qualidades', 'c-qualidades', 'c-add-qualidade', 'Qualidade (+1)', null);
  var listaPeculiaridades = listaDeTextos('peculiaridades', 'c-peculiaridades', 'c-add-peculiaridade', 'Peculiaridade (-1)', criador.LIMITE_PECULIARIDADES);
  atualizadores.push(function (r) {
    document.getElementById('c-desv-limite').textContent = 'Limite de ' + r.limite + ' pontos em desvantagens, contando atributos baixos e sociedade. Agora: ' + r.desvantagens + '.';
  });

  // ---------- 6. perícias ----------
  var infosPericia = [];
  function desenharPericias() {
    var box = document.getElementById('c-pericias-escolhidas');
    box.textContent = '';
    infosPericia = [];
    ficha.pericias.forEach(function (sel, i) {
      var p = porId(G.pericias, sel.id);
      if (!p) return;
      var row = el('div', 'criador-item st-' + p.adamar);
      var topo = el('div', 'pericia-topo');
      topo.appendChild(el('strong', 'pericia-nome', p.nome));
      var nh = el('span', 'criador-custo');
      topo.appendChild(nh);
      row.appendChild(topo);
      var meta = el('div', 'pericia-meta');
      meta.appendChild(selo(p.adamar));
      meta.appendChild(el('span', null, p.atributo + '/' + p.dificuldade));
      var bonus = el('span');
      meta.appendChild(bonus);
      row.appendChild(meta);
      var campos = el('div', 'criador-campos');
      if (p.especializacao) {
        var w = el('label', 'criador-campo');
        w.appendChild(el('span', null, 'Especialização'));
        var lista = (p.especializacoes || []).filter(function (x) { return x.adamar !== 'nao'; });
        var controle;
        if (lista.length && !p.livre_escolha) {
          controle = selectCom([['', 'Escolha…']].concat(lista.map(function (x) {
            return [x.nome, x.nome + (x.adamar === 'narrador' ? ' (com o narrador)' : '')];
          })), sel.especializacao || '', 'Especialização');
          controle.addEventListener('change', function () { sel.especializacao = controle.value; mudou(); });
        } else {
          controle = el('input');
          controle.value = sel.especializacao || '';
          controle.maxLength = 60;
          controle.addEventListener('input', function () { sel.especializacao = controle.value; mudou(); });
        }
        w.appendChild(controle);
        campos.appendChild(w);
      }
      var wp = el('label', 'criador-campo');
      wp.appendChild(el('span', null, 'Pontos'));
      var pts = selectCom(PONTOS_PERICIA.map(function (v) { return [v, String(v)]; }), sel.pontos || 1, 'Pontos');
      pts.addEventListener('change', function () { sel.pontos = parseInt(pts.value, 10); mudou(); });
      wp.appendChild(pts);
      campos.appendChild(wp);
      row.appendChild(campos);
      row.appendChild(botaoRemover(p.nome, function () { ficha.pericias.splice(i, 1); desenharPericias(); seletorPericias.desenhar(); mudou(); }));
      infosPericia.push(function (r) {
        var item = r.pericias[i];
        if (!item) return;
        nh.textContent = item.nh == null ? 'NH —' : 'NH ' + item.nh + ' (' + p.atributo + (item.relativo ? sinal(item.relativo) : '') + ')';
        var partes = item.bonus.map(function (b) { return sinal(b.valor) + ' de ' + b.origem; })
          .concat(item.situacional.map(function (b) { return sinal(b.valor) + ' de ' + b.origem + ' (' + b.condicao + ')'; }));
        bonus.textContent = partes.join(' · ');
      });
      box.appendChild(row);
    });
    if (!box.children.length) box.appendChild(el('p', 'pericia-vazio', 'Nenhuma perícia ainda.'));
  }
  atualizadores.push(function (r) { infosPericia.forEach(function (f) { f(r); }); });
  var seletorPericias = criarSeletor(document.getElementById('c-pericias-seletor'), {
    placeholder: 'Procurar perícia…',
    itens: function () { return G.pericias.filter(function (p) { return p.adamar !== 'nao'; }); },
    texto: function (p) { return p.nome + ' ' + p.resumo + ' ' + p.grupo; },
    selo: function (p) { return p.atributo + '/' + p.dificuldade; },
    jaTem: function (p) { return !p.especializacao && ficha.pericias.some(function (s) { return s.id === p.id; }); },
    adicionar: function (p) { ficha.pericias.push({ id: p.id, pontos: 1, especializacao: '' }); desenharPericias(); }
  });

  // ---------- 7. equipamento ----------
  function desenharEquipamento() {
    var box = document.getElementById('c-equipamento-escolhido');
    box.textContent = '';
    ficha.equipamento.forEach(function (sel, i) {
      var it = porId(G.equipamento, sel.id);
      if (!it) return;
      var row = el('div', 'criador-item st-' + it.adamar);
      var topo = el('div', 'pericia-topo');
      topo.appendChild(el('strong', 'pericia-nome', it.nome));
      topo.appendChild(el('span', 'pericia-dif', it.subcategoria || it.categoria));
      row.appendChild(topo);
      var campos = el('div', 'criador-campos');
      var w = el('label', 'criador-campo');
      w.appendChild(el('span', null, 'Quantidade'));
      var q = el('input');
      q.type = 'number'; q.min = 1; q.value = sel.quantidade || 1;
      q.addEventListener('input', function () { sel.quantidade = Math.max(1, parseInt(q.value, 10) || 1); mudou(); });
      w.appendChild(q);
      campos.appendChild(w);
      row.appendChild(campos);
      row.appendChild(botaoRemover(it.nome, function () { ficha.equipamento.splice(i, 1); desenharEquipamento(); seletorEquip.desenhar(); mudou(); }));
      box.appendChild(row);
    });
    if (!box.children.length) box.appendChild(el('p', 'pericia-vazio', 'Nada na mochila ainda.'));
  }
  var seletorEquip = criarSeletor(document.getElementById('c-equipamento-seletor'), {
    placeholder: 'Procurar item…',
    itens: function () { return (G.equipamento || []).filter(function (i) { return i.adamar !== 'nao'; }); },
    texto: function (i) { return i.nome + ' ' + (i.subcategoria || '') + ' ' + (i.resumo || ''); },
    selo: function (i) { return i.subcategoria || i.categoria; },
    jaTem: function (i) { return ficha.equipamento.some(function (s) { return s.id === i.id; }); },
    adicionar: function (i) { ficha.equipamento.push({ id: i.id, quantidade: 1 }); desenharEquipamento(); }
  });
  atualizadores.push(function (r) {
    document.getElementById('c-dinheiro').textContent = 'Dinheiro inicial: ' + moeda(r.recursos) +
      '. Preço e peso de cada item você acerta com o narrador, que tem as tabelas do livro. Escolha o que o personagem leva de verdade.';
  });

  // ---------- 8. revisão e envio ----------
  var texto = document.getElementById('c-texto');
  var whats = document.getElementById('c-whats');
  var copiado = document.getElementById('c-copiado');
  atualizadores.push(function (r) {
    var ul = document.getElementById('c-avisos');
    ul.textContent = '';
    r.avisos.forEach(function (a) { ul.appendChild(el('li', null, a)); });
    var t = criador.textoFicha(ficha, r);
    texto.textContent = t;
    var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.whatsapp) || { numero: '' };
    whats.href = window.buildWhatsAppUrl ? window.buildWhatsAppUrl(cfg.numero, 'Olá! Montei meu personagem de Adamar:\n\n' + t) : '#';
  });
  function avisar(msg) {
    copiado.textContent = msg;
    setTimeout(function () { if (copiado.textContent === msg) copiado.textContent = ''; }, 4000);
  }
  document.getElementById('c-copiar').addEventListener('click', function () {
    var t = texto.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { avisar('Copiado.'); }, function () { avisar('Não deu para copiar; selecione o texto.'); });
    } else avisar('Selecione o texto acima e copie.');
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
      nova.textContent = 'Tem certeza? Clique de novo para apagar a ficha atual.';
      confirmando = setTimeout(function () { nova.textContent = 'Começar uma ficha nova'; confirmando = null; }, 5000);
      return;
    }
    clearTimeout(confirmando);
    confirmando = null;
    nova.textContent = 'Começar uma ficha nova';
    ficha = criador.fichaNova();
    desenharTudo();
    mudou();
    irPara(0);
  });

  // ---------- barra de pontos ----------
  atualizadores.push(function (r) {
    document.getElementById('barra-total').textContent = String(r.total);
    document.getElementById('barra-orcamento').textContent = 'de ' + ficha.orcamento + ' pontos';
    var rest = document.getElementById('barra-restante');
    rest.textContent = r.restante >= 0 ? 'restam ' + r.restante : 'passou ' + (-r.restante);
    rest.className = r.restante < 0 ? 'calc-estourou' : '';
    var desv = document.getElementById('barra-desv');
    desv.textContent = 'desvantagens ' + r.desvantagens + ' / ' + r.limite;
    desv.className = r.desvantagens < r.limite ? 'calc-estourou' : '';
  });

  function atualizar() {
    var r = criador.resumir(ficha);
    atualizadores.forEach(function (f) { f(r); });
  }
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
    seletorPericias.desenhar();
    desenharEquipamento();
    seletorEquip.desenhar();
  }
  // Ao sair de um campo de secundária, mostra o valor normalizado.
  document.getElementById('c-secundarias').addEventListener('focusout', function () { setTimeout(mostrarSecundarias, 0); });

  desenharTudo();
  irPara(atual, false);
})();
