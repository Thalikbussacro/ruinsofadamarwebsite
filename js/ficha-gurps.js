// js/ficha-gurps.js — página de atributos e pontos: lista, calculadora, carga e custo de perícias.
(function () {
  var GURPS = window.GURPS;
  if (!GURPS || !GURPS.regras || !window.criarCalculo) return;
  var R = GURPS.regras;
  var calc = window.criarCalculo(R);
  var ARMAZENAMENTO = 'adamar-calc-ficha';

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function num(v) { return String(v).replace('.', ','); }
  function sinal(v) { return v > 0 ? '+' + v : String(v); }
  function faixa(valor) {
    var f = R.faixas_atributo.itens.filter(function (x) { return valor >= x.min && valor <= x.max; })[0];
    return f ? f.rotulo : '';
  }

  // ---------- cartões dos atributos ----------
  var lista = document.getElementById('lista-atributos');
  R.atributos.forEach(function (a) {
    var card = el('article', 'card');
    card.appendChild(el('h3', null, a.nome + ' (' + a.sigla + ')'));
    card.appendChild(el('p', null, a.resumo));
    card.appendChild(el('p', 'card-more', '±' + a.custo_por_nivel + ' pontos por nível · pág. ' + a.ref.pagina));
    lista.appendChild(card);
  });

  // ---------- calculadora ----------
  var estado = { atributos: { st: 10, dx: 10, iq: 10, ht: 10 }, ajustes: {} };
  try {
    var salvo = JSON.parse(localStorage.getItem(ARMAZENAMENTO) || 'null');
    if (salvo && salvo.atributos) estado = salvo;
  } catch (e) { /* sem armazenamento */ }

  function campo(id, rotulo, valor, passo, dica) {
    var wrap = el('div', 'field calc-campo');
    var label = el('label', null, rotulo);
    label.htmlFor = 'calc-' + id;
    var input = el('input');
    input.type = 'number';
    input.id = 'calc-' + id;
    input.step = passo;
    input.value = valor;
    input.setAttribute('data-id', id);
    wrap.appendChild(label);
    wrap.appendChild(input);
    var info = el('span', 'calc-info', dica || '');
    info.id = 'calc-info-' + id;
    wrap.appendChild(info);
    return wrap;
  }

  var boxAtr = document.getElementById('calc-atributos');
  R.atributos.forEach(function (a) {
    boxAtr.appendChild(campo(a.id, a.sigla + ' — ' + a.nome, estado.atributos[a.id], 1));
  });
  var boxSec = document.getElementById('calc-secundarias');
  R.secundarias.forEach(function (s) {
    boxSec.appendChild(campo(s.id, s.sigla + ' — ' + s.nome, 0, s.passo));
  });

  function preencherSecundarias() {
    var v = calc.secundarias(estado.atributos, estado.ajustes);
    R.secundarias.forEach(function (s) {
      document.getElementById('calc-' + s.id).value = v[s.id];
    });
  }

  function atualizar() {
    var ficha = calc.calcularFicha(estado);
    var v = ficha.valores;
    R.atributos.forEach(function (a) {
      var custo = calc.custoAtributo(a.id, estado.atributos[a.id]);
      document.getElementById('calc-info-' + a.id).textContent = faixa(estado.atributos[a.id]) + ' · ' + sinal(custo) + ' pts';
    });
    var avisos = [];
    R.secundarias.forEach(function (s) {
      var aj = estado.ajustes[s.id] || 0;
      var custo = calc.custoSecundaria(s.id, aj);
      var base = v[s.id] - aj;
      document.getElementById('calc-info-' + s.id).textContent = aj
        ? 'base ' + num(base) + ' · ' + sinal(custo) + ' pts'
        : 'base, sem custo';
      var lim = calc.limitesSecundaria(s.id, estado.atributos);
      if (v[s.id] < lim.min || v[s.id] > lim.max) {
        avisos.push(s.nome + ' ' + num(v[s.id]) + ' está fora da faixa de campanha realista (' + num(lim.min) + ' a ' + num(lim.max) + '). Só com o narrador.');
      }
    });
    R.atributos.forEach(function (a) {
      var x = estado.atributos[a.id];
      if (x < 8) avisos.push(a.nome + ' ' + x + ': o livro sugere que o narrador pode proibir valores abaixo de 8 para aventureiros.');
      if (x > 20) avisos.push(a.nome + ' ' + x + ': acima de 20 é coisa de criaturas lendárias, não de humanos de Adamar.');
    });
    document.getElementById('calc-total').textContent = sinal(ficha.total);
    document.getElementById('calc-detalhe').textContent =
      'Atributos ' + sinal(ficha.custos.atributos) + ' · Secundárias ' + sinal(ficha.custos.secundarias);
    document.getElementById('calc-derivadas').textContent =
      'Esquiva ' + calc.esquiva(v.velocidade) + ' · Base de Carga ' + num(calc.baseDeCarga(v.st)) + ' kg';
    var ul = document.getElementById('calc-avisos');
    ul.textContent = '';
    avisos.forEach(function (a) { ul.appendChild(el('li', null, a)); });
    desenharCarga(v);
    try { localStorage.setItem(ARMAZENAMENTO, JSON.stringify(estado)); } catch (e) { /* sem armazenamento */ }
  }

  document.getElementById('calc-ficha').addEventListener('input', function (e) {
    var id = e.target.getAttribute('data-id');
    var valor = parseFloat(String(e.target.value).replace(',', '.'));
    if (!id || isNaN(valor)) return;
    if (estado.atributos[id] != null) {
      estado.atributos[id] = Math.max(1, Math.round(valor));
      preencherSecundarias();
    } else {
      var semEste = Object.assign({}, estado.ajustes);
      semEste[id] = 0;
      var semAjuste = calc.secundarias(estado.atributos, semEste)[id];
      var passo = R.secundarias.filter(function (s) { return s.id === id; })[0].passo;
      estado.ajustes[id] = Math.round((valor - semAjuste) / passo) * passo;
      if (id === 'velocidade') preencherSecundarias();
    }
    atualizar();
  });

  // ---------- carga ----------
  function desenharCarga(v) {
    var t = document.getElementById('tabela-carga');
    var bc = calc.baseDeCarga(v.st);
    var linhas = '<thead><tr><th>Carga</th><th>Peso até</th><th>Deslocamento</th><th>Esquiva</th></tr></thead><tbody>';
    R.carga.niveis.forEach(function (n) {
      linhas += '<tr><td>' + n.nivel + ' — ' + n.nome + '</td><td>' + num(Math.round(bc * n.peso_max_bc * 10) / 10) + ' kg</td><td>' +
        calc.deslocamentoComCarga(v.deslocamento, n.nivel) + '</td><td>' + calc.esquiva(v.velocidade, n.nivel) + '</td></tr>';
    });
    t.innerHTML = linhas + '</tbody>';
    document.getElementById('carga-intro').textContent =
      'Quanto o personagem carrega muda o deslocamento e a esquiva. Com ST ' + v.st + ' (Base de Carga ' + num(bc) +
      ' kg), Deslocamento ' + v.deslocamento + ' e Velocidade ' + num(v.velocidade) + ' (pág. ' + R.carga.ref.pagina + '):';
  }

  // ---------- custo de perícias ----------
  var CP = R.custo_pericias;
  document.getElementById('custo-intro').textContent = CP.resumo + ' (pág. ' + CP.ref.pagina + ')';
  var DIFS = ['Fácil', 'Média', 'Difícil', 'Muito Difícil'];
  var tc = '<thead><tr><th>NH desejado</th>' + DIFS.map(function (d) { return '<th>' + d + '</th>'; }).join('') + '</tr></thead><tbody>';
  for (var rel = -3; rel <= 5; rel++) {
    tc += '<tr><td>Atributo' + (rel === 0 ? '+0' : sinal(rel)) + '</td>' + DIFS.map(function (d) {
      var c = calc.custoPericia(d, rel);
      return '<td>' + (c == null ? '—' : c) + '</td>';
    }).join('') + '</tr>';
  }
  document.getElementById('tabela-custo').innerHTML = tc + '<tr><td>Cada +1 além</td><td colspan="4">+' + CP.acrescimo_por_nivel + ' pontos</td></tr></tbody>';

  function calcularPericia() {
    var dif = document.getElementById('cp-dificuldade').value;
    var atr = parseInt(document.getElementById('cp-atributo').value, 10);
    var nh = parseInt(document.getElementById('cp-nh').value, 10);
    var out = document.getElementById('cp-resultado');
    if (isNaN(atr) || isNaN(nh)) { out.textContent = ''; return; }
    var custo = calc.custoPericia(dif, nh - atr);
    out.textContent = custo == null
      ? 'NH ' + nh + ' fica abaixo do mínimo comprável numa perícia ' + dif + ' com atributo ' + atr + ' (use o valor pré-definido).'
      : 'NH ' + nh + ' = atributo' + (nh - atr === 0 ? '+0' : sinal(nh - atr)) + ' numa perícia ' + dif + ': ' + custo + (custo === 1 ? ' ponto.' : ' pontos.');
  }
  ['cp-dificuldade', 'cp-atributo', 'cp-nh'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', calcularPericia);
  });

  preencherSecundarias();
  atualizar();
  calcularPericia();
})();
