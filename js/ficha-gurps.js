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
  var PONTOS = (R.campanha && R.campanha.pontos_iniciais) || { padrao: 80, sugestoes: [80] };
  var estado = { orcamento: PONTOS.padrao, atributos: { st: 10, dx: 10, iq: 10, ht: 10 }, ajustes: {} };
  try {
    var salvo = JSON.parse(localStorage.getItem(ARMAZENAMENTO) || 'null');
    if (salvo && salvo.atributos) estado = salvo;
  } catch (e) { /* sem armazenamento */ }
  if (typeof estado.orcamento !== 'number') estado.orcamento = PONTOS.padrao;
  var SOCIAL_PADRAO = { aparencia: 'comum', status: 0, riqueza: 'medio', multimilionario: 0, alfabetizacao: 'alfabetizado', analfabetismoRegra: true, culturas: 0 };
  estado.social = Object.assign({}, SOCIAL_PADRAO, estado.social || {});
  var LIMITE = (R.campanha && R.campanha.limite_desvantagens) || { percentual_padrao: 0.5 };

  // ---------- orçamento de pontos ----------
  var selOrc = document.getElementById('calc-orcamento');
  var campoLivre = document.getElementById('campo-orcamento-livre');
  var inputLivre = document.getElementById('calc-orcamento-livre');
  PONTOS.sugestoes.forEach(function (v) {
    var o = el('option', null, v + ' pontos' + (v === PONTOS.padrao ? ' (padrão de Adamar)' : ''));
    o.value = String(v);
    selOrc.appendChild(o);
  });
  var outro = el('option', null, 'Outro valor…');
  outro.value = 'outro';
  selOrc.appendChild(outro);
  document.getElementById('calc-orcamento-nota').textContent = PONTOS.nota || '';
  function mostrarOrcamento() {
    var sugerido = PONTOS.sugestoes.indexOf(estado.orcamento) !== -1;
    selOrc.value = sugerido ? String(estado.orcamento) : 'outro';
    campoLivre.hidden = sugerido;
    inputLivre.value = estado.orcamento;
  }
  selOrc.addEventListener('change', function () {
    if (selOrc.value === 'outro') {
      campoLivre.hidden = false;
      inputLivre.focus();
    } else {
      estado.orcamento = parseInt(selOrc.value, 10);
      campoLivre.hidden = true;
      atualizar();
    }
  });
  inputLivre.addEventListener('input', function () {
    var v = parseInt(inputLivre.value, 10);
    if (!isNaN(v) && v >= 0) { estado.orcamento = v; atualizar(); }
  });

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

  // ---------- sociedade ----------
  function opcoes(sel, itens) {
    itens.forEach(function (it) {
      var o = el('option', null, it[1]);
      o.value = it[0];
      sel.appendChild(o);
    });
  }
  opcoes(document.getElementById('soc-aparencia'), R.aparencia.niveis
    .filter(function (n) { return n.adamar !== 'nao'; })
    .map(function (n) { return [n.id, n.nome + ' (' + sinal(n.custo) + ')' + (n.adamar === 'narrador' ? ' — com o narrador' : '')]; }));
  var niveisStatus = [];
  for (var st = R.status.minimo; st <= R.status.maximo; st++) {
    niveisStatus.push([String(st), sinal(st) + (R.status.exemplos[String(st)] ? ' — ' + R.status.exemplos[String(st)] : '') + ' (' + sinal(calc.custoStatus(st)) + ')']);
  }
  opcoes(document.getElementById('soc-status'), niveisStatus);
  opcoes(document.getElementById('soc-riqueza'), R.riqueza.niveis
    .map(function (n) { return [n.id, n.nome + ' (' + sinal(n.custo) + ')']; })
    .concat([1, 2, 3].map(function (m) { return ['multi-' + m, 'Multimilionário ' + m + ' (' + sinal(calc.custoRiqueza('podre-de-rico', m)) + ')']; })));
  opcoes(document.getElementById('soc-alfabetizacao'), R.idiomas.alfabetizacao_materna
    .map(function (n) { return [n.id, n.nome + ' (' + sinal(n.custo) + ')']; }));

  function mostrarSocial() {
    var so = estado.social;
    document.getElementById('soc-aparencia').value = so.aparencia;
    document.getElementById('soc-status').value = String(so.status);
    document.getElementById('soc-riqueza').value = so.multimilionario ? 'multi-' + so.multimilionario : so.riqueza;
    document.getElementById('soc-alfabetizacao').value = so.alfabetizacao;
    document.getElementById('soc-culturas').value = so.culturas;
    document.getElementById('soc-analfabetismo').checked = !!so.analfabetismoRegra;
  }

  function mudarSocial(alvo) {
    var chave = alvo.getAttribute('data-soc');
    var so = estado.social;
    if (chave === 'riqueza') {
      var m = /^multi-(\d)$/.exec(alvo.value);
      so.riqueza = m ? 'podre-de-rico' : alvo.value;
      so.multimilionario = m ? parseInt(m[1], 10) : 0;
    } else if (chave === 'status' || chave === 'culturas') {
      var n = parseInt(alvo.value, 10);
      so[chave] = isNaN(n) ? 0 : Math.max(chave === 'culturas' ? 0 : R.status.minimo, n);
    } else if (chave === 'analfabetismoRegra') {
      so.analfabetismoRegra = alvo.checked;
    } else {
      so[chave] = alvo.value;
    }
    atualizar();
  }

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
    document.getElementById('calc-total').textContent = String(ficha.total);
    var restam = estado.orcamento - ficha.total;
    var restante = document.getElementById('calc-restante');
    restante.textContent = 'de ' + estado.orcamento + ' pontos · ' +
      (restam >= 0 ? 'restam ' + restam : 'passou ' + (-restam));
    restante.className = restam < 0 ? 'calc-estourou' : '';
    if (restam < 0) avisos.unshift('Gastou ' + (-restam) + ' pontos além do orçamento. Tire pontos ou pegue desvantagens.');
    document.getElementById('calc-detalhe').textContent =
      'Atributos ' + sinal(ficha.custos.atributos) + ' · Secundárias ' + sinal(ficha.custos.secundarias) +
      ' · Sociedade ' + sinal(ficha.custos.social);
    var so = estado.social;
    var bonusStatus = calc.statusPorRiqueza(so.riqueza, so.multimilionario);
    document.getElementById('soc-info-aparencia').textContent = sinal(calc.custoAparencia(so.aparencia)) + ' pts · reação ' +
      R.aparencia.niveis.filter(function (n) { return n.id === so.aparencia; })[0].reacao;
    document.getElementById('soc-info-status').textContent = sinal(calc.custoStatus(so.status)) + ' pts' +
      (bonusStatus ? ' · +' + bonusStatus + ' grátis pela riqueza (Status ' + sinal(so.status + bonusStatus) + ')' : '');
    document.getElementById('soc-info-riqueza').textContent = sinal(calc.custoRiqueza(so.riqueza, so.multimilionario)) + ' pts · $' +
      ficha.recursos.toLocaleString('pt-BR') + ' iniciais';
    document.getElementById('soc-info-alfabetizacao').textContent = sinal(calc.custoAlfabetizacao(so.alfabetizacao)) + ' pts' +
      (so.alfabetizacao !== 'alfabetizado' && so.analfabetismoRegra ? ' · fora do limite' : '');
    document.getElementById('soc-info-culturas').textContent = sinal(so.culturas * R.familiaridade_cultural.custo_mesma_raca) + ' pts';
    var limite = calc.limiteDesvantagens(estado.orcamento, LIMITE.percentual_padrao);
    var desv = document.getElementById('calc-desvantagens');
    desv.textContent = 'Desvantagens: ' + ficha.desvantagens + ' de um limite de ' + limite +
      ' (fora as peculiaridades) · Dinheiro inicial $' + ficha.recursos.toLocaleString('pt-BR') + ' em NT' + R.nivel_tecnologico.nt_campanha;
    desv.className = 'calc-detalhe' + (ficha.desvantagens < limite ? ' calc-estourou' : '');
    if (ficha.desvantagens < limite) avisos.push('As desvantagens (' + ficha.desvantagens + ') passaram do limite de ' + limite + '. Só com o narrador.');
    if (so.aparencia === 'lindo') avisos.push('Aparência Lindo: o livro sugere reservar para anjos e divindades. Com o narrador.');
    document.getElementById('calc-derivadas').textContent =
      'Esquiva ' + calc.esquiva(v.velocidade) + ' · Base de Carga ' + num(calc.baseDeCarga(v.st)) + ' kg';
    var ul = document.getElementById('calc-avisos');
    ul.textContent = '';
    avisos.forEach(function (a) { ul.appendChild(el('li', null, a)); });
    desenharCarga(v);
    try { localStorage.setItem(ARMAZENAMENTO, JSON.stringify(estado)); } catch (e) { /* sem armazenamento */ }
  }

  function aoMudar(e) {
    if (e.target.hasAttribute('data-soc')) { mudarSocial(e.target); return; }
    if (e.type === 'change') return;
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
  }
  document.getElementById('calc-ficha').addEventListener('input', aoMudar);
  document.getElementById('calc-ficha').addEventListener('change', aoMudar);

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

  // ---------- tabelas de referência: sociedade ----------
  function tabela(id, cabecalho, linhas) {
    document.getElementById(id).innerHTML = '<thead><tr>' + cabecalho.map(function (c) { return '<th>' + c + '</th>'; }).join('') +
      '</tr></thead><tbody>' + linhas.map(function (l) {
        return '<tr>' + l.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody>';
  }
  var ADAMAR_ROTULO = { livre: 'Livre', narrador: 'Com o narrador', nao: 'Não existe em Adamar' };
  document.getElementById('sociedade-intro').textContent = R.status.resumo + ' Cada nível custa ' + R.status.custo_por_nivel +
    ' pontos (pág. ' + R.status.ref.pagina + '). ' + R.limite_desvantagens.resumo + ' (pág. ' + R.limite_desvantagens.ref.pagina + ')';
  tabela('tabela-aparencia', ['Nível', 'Pontos', 'Reação', 'Em Adamar'], R.aparencia.niveis.map(function (n) {
    return [n.nome + '<br><small>' + n.resumo + '</small>', sinal(n.custo), n.reacao, ADAMAR_ROTULO[n.adamar]];
  }));
  var baseNT = R.nivel_tecnologico.recursos_iniciais.por_nt[String(R.nivel_tecnologico.nt_campanha)];
  document.getElementById('riqueza-intro').textContent = R.riqueza.resumo + ' Em NT' + R.nivel_tecnologico.nt_campanha +
    ', a média é $' + baseNT.toLocaleString('pt-BR') + ' (pág. ' + R.nivel_tecnologico.recursos_iniciais.ref.pagina + '). ' +
    R.riqueza.pontos_por_dinheiro.resumo;
  tabela('tabela-riqueza', ['Nível', 'Pontos', 'Dinheiro inicial'], R.riqueza.niveis.map(function (n) {
    return [n.nome + '<br><small>' + n.resumo + (n.nota ? ' ' + n.nota : '') + '</small>', sinal(n.custo), '$' + calc.recursosIniciais(n.id).toLocaleString('pt-BR')];
  }).concat([['Multimilionário (por nível)', '+' + R.riqueza.multimilionario.custo_por_nivel, '×' + R.riqueza.multimilionario.fator_por_nivel]]));
  document.getElementById('idiomas-intro').textContent = R.idiomas.resumo + ' (pág. ' + R.idiomas.ref.pagina + ') ' + R.idiomas.nota_nt;
  tabela('tabela-idiomas', ['Nível de compreensão', 'Pontos (fala e escrita iguais)'], R.idiomas.niveis.map(function (n) {
    return [n.nome, sinal(n.custo)];
  }));
  document.getElementById('culturas-intro').textContent = R.familiaridade_cultural.resumo + ' Custa ' +
    R.familiaridade_cultural.custo_mesma_raca + ' ponto por cultura (pág. ' + R.familiaridade_cultural.ref.pagina + ').';

  mostrarOrcamento();
  mostrarSocial();
  preencherSecundarias();
  atualizar();
  calcularPericia();
})();
