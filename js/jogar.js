// js/jogar.js — formulário "Quero jogar": guia a criação do personagem e envia ao narrador pelo WhatsApp.
(function (root) {
  // Monta o texto enviado ao narrador. Recebe rótulos já resolvidos; campos vazios são omitidos.
  function buildCharacterMessage(d) {
    var linhas = [];
    function add(rotulo, valor) {
      var v = String(valor == null ? '' : valor).trim();
      if (v) linhas.push('*' + rotulo + ':* ' + v);
    }
    function secao(titulo) {
      if (linhas.length) linhas.push('');
      linhas.push('— ' + titulo + ' —');
    }

    linhas.push('Olá! Quero jogar Ruínas de Adamar.');
    add('Jogador', d.jogador);

    secao('A Era');
    add('Era', d.era);

    secao('O mundo e o personagem');
    add('A magia', d.magia);
    add('Os deuses', d.deus ? d.fe + ' (' + d.deus + ')' : d.fe);
    add('O que o move', d.motivacao);

    secao('Origem');
    add('De onde vem', d.origem);
    add('Detalhes', d.origemDetalhe);

    secao('O personagem');
    add('Nome', d.nome);
    add('Idade', d.idade);
    add('Ofício', d.oficio);
    add('O que sabe fazer', d.habilidades);
    add('Como é', d.aparencia);
    add('Uma marca ou um medo', d.marca);

    return linhas.join('\n');
  }

  root.buildCharacterMessage = buildCharacterMessage;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildCharacterMessage: buildCharacterMessage };
  }
  if (typeof document === 'undefined') return;

  // ---------- formulário ----------
  var STORAGE_KEY = 'adamar-ficha';
  var form = document.getElementById('ficha');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.step'));
  var progress = Array.prototype.slice.call(document.querySelectorAll('.wizard-progress li'));
  var btnVoltar = form.querySelector('[data-voltar]');
  var btnSeguir = form.querySelector('[data-seguir]');
  var btnEnviar = form.querySelector('[data-enviar]');
  var resumo = form.querySelector('.resumo');
  var enviado = document.getElementById('enviado');
  var atual = 0;

  function config() {
    return (root.SITE_CONFIG && root.SITE_CONFIG.whatsapp) || { numero: '', mensagem: '' };
  }
  function whatsUrl(texto) {
    var numero = config().numero;
    if (typeof root.buildWhatsAppUrl === 'function') return root.buildWhatsAppUrl(numero, texto);
    return 'https://wa.me/' + String(numero || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(texto);
  }

  // link "falar direto", sem formulário
  Array.prototype.forEach.call(document.querySelectorAll('[data-whats-direto]'), function (a) {
    a.href = whatsUrl(config().mensagem);
  });

  form.classList.add('is-wizard');

  // todo rádio de um grupo obrigatório carrega "required": opções escondidas pela era ficam desabilitadas
  Array.prototype.forEach.call(form.querySelectorAll('input[type="radio"][required]'), function (r) {
    Array.prototype.forEach.call(form.querySelectorAll('input[name="' + r.name + '"]'), function (x) { x.required = true; });
  });

  // ---------- rascunho no navegador ----------
  function salvar() {
    var dados = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === 'submit' || el.type === 'button') return;
      if ((el.type === 'radio' || el.type === 'checkbox')) {
        if (el.checked) dados[el.name] = el.value;
      } else {
        dados[el.name] = el.value;
      }
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dados)); } catch (e) { /* sem armazenamento */ }
  }
  function restaurar() {
    var dados;
    try { dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { dados = null; }
    if (!dados) return;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || !(el.name in dados)) return;
      if (el.type === 'radio' || el.type === 'checkbox') el.checked = el.value === dados[el.name];
      else el.value = dados[el.name];
    });
  }

  // ---------- opções que dependem da era ----------
  function eraAtual() {
    var marcada = form.querySelector('input[name="era"]:checked');
    return marcada ? marcada.value : '';
  }
  function aplicarEra() {
    var era = eraAtual();
    Array.prototype.forEach.call(form.querySelectorAll('[data-eras]'), function (node) {
      var eras = node.getAttribute('data-eras').split(' ');
      var visivel = !era ? eras.indexOf('novo-mundo') !== -1 : eras.indexOf(era) !== -1;
      node.hidden = !visivel;
      Array.prototype.forEach.call(node.querySelectorAll('input'), function (input) {
        input.disabled = !visivel;
        if (!visivel) input.checked = false;
      });
    });
  }
  function aplicarFe() {
    var devoto = form.querySelector('input[name="fe"][value="devoto"]');
    var campo = form.querySelector('.campo-deus');
    var mostrar = devoto && devoto.checked;
    campo.hidden = !mostrar;
    campo.querySelector('select').required = !!mostrar;
  }

  // ---------- etapas ----------
  function mostrar(indice, focar) {
    atual = indice;
    steps.forEach(function (step, i) { step.classList.toggle('is-current', i === indice); });
    progress.forEach(function (li, i) {
      li.classList.toggle('is-current', i === indice);
      li.classList.toggle('is-done', i < indice);
      if (i === indice) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    btnVoltar.hidden = indice === 0;
    btnSeguir.hidden = indice === steps.length - 1;
    btnEnviar.hidden = indice !== steps.length - 1;
    if (indice === steps.length - 1) resumo.textContent = buildCharacterMessage(coletar());
    if (focar) {
      var legend = steps[indice].querySelector('legend');
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (legend) { legend.setAttribute('tabindex', '-1'); legend.focus({ preventScroll: true }); }
    }
  }

  function validar(step) {
    var erro = step.querySelector('.form-error');
    var invalidos = Array.prototype.filter.call(
      step.querySelectorAll('input, select, textarea'),
      function (el) { return !el.disabled && !el.checkValidity(); }
    );
    if (!invalidos.length) { erro.hidden = true; erro.textContent = ''; return true; }
    erro.textContent = 'Falta responder: ' + invalidos.map(function (el) {
      return el.getAttribute('data-rotulo') || el.name;
    }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + '.';
    erro.hidden = false;
    invalidos[0].focus();
    return false;
  }

  // ---------- coleta ----------
  function rotuloMarcado(nome) {
    var input = form.querySelector('input[name="' + nome + '"]:checked');
    if (!input) return '';
    var titulo = input.parentNode.querySelector('.choice-title');
    return (titulo ? titulo.textContent : input.value).trim();
  }
  function valor(nome) {
    var el = form.elements[nome];
    return el ? String(el.value || '').trim() : '';
  }
  function coletar() {
    var devoto = form.querySelector('input[name="fe"][value="devoto"]');
    return {
      jogador: valor('jogador'),
      era: rotuloMarcado('era'),
      magia: rotuloMarcado('magia'),
      fe: rotuloMarcado('fe'),
      deus: devoto && devoto.checked ? valor('deus').split(' — ')[0] : '',
      motivacao: rotuloMarcado('motivacao'),
      origem: rotuloMarcado('origem'),
      origemDetalhe: valor('origemDetalhe'),
      nome: valor('nome'),
      idade: valor('idade'),
      oficio: valor('oficio'),
      habilidades: valor('habilidades'),
      aparencia: valor('aparencia'),
      marca: valor('marca')
    };
  }

  // ---------- eventos ----------
  btnSeguir.addEventListener('click', function () {
    if (validar(steps[atual])) mostrar(atual + 1, true);
  });
  btnVoltar.addEventListener('click', function () { mostrar(atual - 1, true); });

  form.addEventListener('change', function (e) {
    if (e.target.name === 'era') aplicarEra();
    if (e.target.name === 'fe') aplicarFe();
    salvar();
  });
  form.addEventListener('input', salvar);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    for (var i = 0; i < steps.length; i++) {
      if (!validar(steps[i])) { mostrar(i, false); validar(steps[i]); return; }
    }
    var texto = buildCharacterMessage(coletar());
    var url = whatsUrl(texto);
    enviado.querySelector('a').href = url;
    enviado.hidden = false;
    var janela = window.open(url, '_blank', 'noopener');
    if (!janela) window.location.href = url;
  });

  var btnCopiar = form.querySelector('[data-copiar]');
  btnCopiar.addEventListener('click', function () {
    var texto = resumo.textContent;
    var aviso = form.querySelector('.copiado');
    function ok() { aviso.hidden = false; setTimeout(function () { aviso.hidden = true; }, 2500); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, function () {});
    }
  });

  form.querySelector('[data-limpar]').addEventListener('click', function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* sem armazenamento */ }
    form.reset();
    aplicarEra();
    aplicarFe();
    enviado.hidden = true;
    mostrar(0, true);
  });

  restaurar();
  aplicarEra();
  aplicarFe();
  mostrar(0, false);
})(typeof window !== 'undefined' ? window : globalThis);
