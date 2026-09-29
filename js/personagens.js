// js/personagens.js — "Meus personagens": lista dos salvos no navegador e a ficha pronta de cada um.
(function () {
  var G = window.GURPS;
  if (!G || !G.regras || !window.criarCalculo || !window.criarCriador || !window.criarArquivo) return;
  var R = G.regras;
  var calc = window.criarCalculo(R);
  var criador = window.criarCriador(G, calc);
  var arquivo = window.criarArquivo(window.localStorage);
  var Efeitos = window.GurpsEfeitos;

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function sinal(v) { return v > 0 ? '+' + v : String(v); }
  function num(v) { return typeof v === 'number' ? v.toLocaleString('pt-BR') : String(v); }
  function moeda(v) { return num(v) + (v === 1 ? ' coroa' : ' coroas'); }
  function porId(lista, id) { return lista.filter(function (x) { return x.id === id; })[0]; }
  function semAcento(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function nomeArquivo(f) { return (semAcento(f.nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'personagem') + '.json'; }
  function baixar(f) {
    var a = el('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(f, null, 2)], { type: 'application/json' }));
    a.download = nomeArquivo(f);
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }
  function quando(ms) {
    var d = new Date(ms);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function alertaInline(msg) {
    var acoes = document.querySelector('.ficha-acoes');
    var n = acoes.querySelector('.copiado') || acoes.appendChild(el('span', 'copiado'));
    n.textContent = msg;
  }


  // ---------- rolador: clicar num número rola 3d contra ele (ou o dano); quadro com as últimas rolagens ----------
  var ARMAZENAMENTO_ROLAGENS = 'adamar-rolagens';
  var diarioAlvo = null; // { registrar(entrada) } quando uma ficha completa está aberta
  var ARMAZENAMENTO_MOD = 'adamar-rolagens-mod';
  var modificador = { valor: 0, motivo: '' };
  try { modificador = JSON.parse(sessionStorage.getItem(ARMAZENAMENTO_MOD) || 'null') || modificador; } catch (e) { /* sem armazenamento */ }
  var rolagens = [];
  try { rolagens = JSON.parse(sessionStorage.getItem(ARMAZENAMENTO_ROLAGENS) || '[]'); } catch (e) { rolagens = []; }
  // sorteio com a aleatoriedade forte do navegador
  function sorteio() {
    if (window.crypto && window.crypto.getRandomValues) {
      var a = new Uint32Array(1);
      window.crypto.getRandomValues(a);
      return a[0] / 4294967296;
    }
    return Math.random();
  }
  var quadro = null;
  function quadroRolagens() {
    if (quadro) return quadro;
    quadro = el('aside', 'rolagens' + (window.matchMedia('(max-width: 699px)').matches ? ' fechado' : ''));
    quadro.setAttribute('aria-label', 'Rolagens');
    var cab = el('div', 'rolagens-cab');
    var titulo = el('button', 'rolagens-titulo', 'Rolagens');
    titulo.type = 'button';
    titulo.setAttribute('aria-expanded', String(!quadro.classList.contains('fechado')));
    titulo.addEventListener('click', function () {
      var fechado = quadro.classList.toggle('fechado');
      titulo.setAttribute('aria-expanded', String(!fechado));
    });
    cab.appendChild(titulo);
    ['3d', '1d', '2d'].forEach(function (d) {
      var b = el('button', 'btn-link', d);
      b.type = 'button';
      b.title = 'Rolar ' + d;
      b.addEventListener('click', function () { rolarDano(d, d); });
      cab.appendChild(b);
    });
    var limpar = el('button', 'btn-link', 'limpar');
    limpar.type = 'button';
    limpar.addEventListener('click', function () { rolagens = []; guardarRolagens(); desenharRolagens(); });
    cab.appendChild(limpar);
    quadro.appendChild(cab);
    // modificador de situação: vale para os próximos testes até ser zerado
    var linhaMod = el('div', 'rolagens-mod');
    var rotMod = el('label', null, 'Modificador');
    var campoMod = el('input');
    campoMod.type = 'number';
    campoMod.min = -20;
    campoMod.max = 20;
    campoMod.value = modificador.valor || 0;
    campoMod.id = 'rolagens-mod';
    rotMod.htmlFor = 'rolagens-mod';
    var motivoMod = el('input');
    motivoMod.placeholder = 'motivo (escuridão, pressa…)';
    motivoMod.maxLength = 40;
    motivoMod.value = modificador.motivo || '';
    motivoMod.setAttribute('aria-label', 'Motivo do modificador');
    var zerar = el('button', 'btn-link', 'zerar');
    zerar.type = 'button';
    function guardarMod() {
      modificador = { valor: parseInt(campoMod.value, 10) || 0, motivo: motivoMod.value };
      try { sessionStorage.setItem(ARMAZENAMENTO_MOD, JSON.stringify(modificador)); } catch (e) { /* sem armazenamento */ }
      linhaMod.classList.toggle('ativo', !!modificador.valor);
    }
    campoMod.addEventListener('input', guardarMod);
    motivoMod.addEventListener('input', guardarMod);
    zerar.addEventListener('click', function () { campoMod.value = 0; motivoMod.value = ''; guardarMod(); });
    [rotMod, campoMod, motivoMod, zerar].forEach(function (x) { linhaMod.appendChild(x); });
    quadro.appendChild(linhaMod);
    guardarMod();
    quadro.appendChild(el('ol', 'rolagens-lista'));
    quadro.setAttribute('aria-live', 'polite');
    document.body.appendChild(quadro);
    return quadro;
  }
  function guardarRolagens() {
    try { sessionStorage.setItem(ARMAZENAMENTO_ROLAGENS, JSON.stringify(rolagens.slice(0, 20))); } catch (e) { /* sem armazenamento */ }
  }
  function desenharRolagens() {
    var q = quadroRolagens();
    q.hidden = !document.querySelector('[data-rolar]') && !rolagens.length;
    var ul = q.querySelector('.rolagens-lista');
    ul.textContent = '';
    if (!rolagens.length) ul.appendChild(el('li', 'rolagem rolagem-dica', 'Clique num número da ficha (atributo, perícia, arma, defesa ou dano) para rolar.'));
    rolagens.slice(0, 8).forEach(function (x, i) {
      var li = el('li', 'rolagem ' + (x.classe || '') + (i === 0 ? ' nova' : ''));
      li.appendChild(el('strong', null, x.rotulo));
      li.appendChild(el('span', 'rolagem-conta', x.conta));
      if (x.resultado) li.appendChild(el('span', 'rolagem-resultado', x.resultado));
      if (diarioAlvo) {
        var paraDiario = el('button', 'btn-link rolagem-diario', x.noDiario ? 'no diário ✓' : '→ diário');
        paraDiario.type = 'button';
        paraDiario.disabled = !!x.noDiario;
        paraDiario.addEventListener('click', function () {
          diarioAlvo.registrar({ tipo: 'rolagem', texto: x.rotulo + ': ' + x.conta + (x.resultado ? ' → ' + x.resultado : '') });
          x.noDiario = true;
          guardarRolagens();
          desenharRolagens();
        });
        li.appendChild(paraDiario);
      }
      ul.appendChild(li);
    });
  }
  function registrar(x) {
    rolagens.unshift(x);
    rolagens = rolagens.slice(0, 20);
    guardarRolagens();
    desenharRolagens();
  }
  function rolarTeste(rotulo, nhBase) {
    quadroRolagens();
    var mod = modificador.valor || 0;
    var nh = nhBase + mod;
    var r = calc.rolarDados('3d', sorteio);
    var a = calc.avaliarTeste(nh, r.total);
    var resultado = a.critico ? 'Sucesso decisivo!' : a.falha_critica ? 'Falha crítica!' :
      a.sucesso ? 'Sucesso' + (a.margem ? ' por ' + a.margem : ' (no limite)') : 'Falha por ' + (-a.margem);
    registrar({
      rotulo: rotulo,
      conta: r.total + ' (' + r.dados.join('+') + ') contra ' + (mod ? nhBase + (mod > 0 ? '+' : '−') + Math.abs(mod) + (modificador.motivo ? ' ' + modificador.motivo : '') + ' = ' + nh : nh),
      resultado: resultado,
      classe: a.critico ? 'critico' : a.falha_critica ? 'falha-critica' : a.sucesso ? 'sucesso' : 'falha'
    });
  }
  function rolarDano(rotulo, expr) {
    var r = calc.rolarDados(expr, sorteio);
    if (!r) return;
    registrar({ rotulo: rotulo, conta: r.total + ' (' + r.dados.join('+') + (r.mod ? (r.mod > 0 ? '+' : '') + r.mod : '') + ')', resultado: expr, classe: 'dano' });
  }
  // marca um elemento como rolável: tipo "teste" (valor = NH) ou "dano" (valor = "1d+2")
  function rolavel(no, tipo, rotulo, valor) {
    if (!no || valor == null || valor === '' || valor === '—') return no;
    if (tipo === 'teste' && isNaN(parseInt(valor, 10))) return no;
    if (tipo === 'dano') {
      var m = /^(\d+d(?:[+-]\d+)?)/.exec(String(valor));
      if (!m) return no;
      valor = m[1];
    }
    no.classList.add('rolavel');
    no.setAttribute('role', 'button');
    no.setAttribute('tabindex', '0');
    no.setAttribute('data-rolar', tipo);
    no.setAttribute('data-rotulo', rotulo);
    no.setAttribute('data-valor', String(valor));
    no.title = tipo === 'teste' ? 'Rolar 3d contra ' + parseInt(valor, 10) : 'Rolar ' + valor;
    return no;
  }
  function aoRolar(ev) {
    var alvo = ev.target.closest && ev.target.closest('[data-rolar]');
    if (!alvo) return;
    if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return;
    ev.preventDefault();
    var v = alvo.getAttribute('data-valor');
    if (alvo.getAttribute('data-rolar') === 'teste') rolarTeste(alvo.getAttribute('data-rotulo'), parseInt(v, 10));
    else rolarDano(alvo.getAttribute('data-rotulo'), v);
  }
  document.addEventListener('click', aoRolar);
  document.addEventListener('keydown', aoRolar);
  // o quadro aparece quando a tela tem números roláveis (depois de montar o cofre ou a ficha)
  setTimeout(desenharRolagens, 0);

  // marca os números da ficha completa que dá para rolar
  function marcarRolaveis(raiz) {
    Array.prototype.forEach.call(raiz.querySelectorAll('.ficha-valores > div'), function (d) {
      var nome = (d.querySelector('dt') || {}).textContent;
      var alvo = { ST: 'ST', DX: 'DX', IQ: 'IQ', HT: 'HT', Vont: 'Vontade', Per: 'Percepção' }[nome];
      var dd = d.querySelector('dd');
      if (alvo && dd) rolavel(dd, 'teste', alvo, dd.textContent);
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('.ficha-bloco:not(.ficha-combate) .table-wrap tbody tr'), function (tr) {
      var tds = tr.querySelectorAll('td');
      if (tds.length >= 3 && /^\d+$/.test(tds[2].textContent.trim())) rolavel(tds[2], 'teste', (tds[0].querySelector('strong') || tds[0]).textContent, tds[2].textContent);
    });
  }

  // ---------- combate: caixas de dano/defesas, tabela de armas e proteção ----------
  function blocoCombate(r, compacto) {
    var cb = r.combate;
    var box = el('div', 'combate-resumo');
    var linha = el('div', 'combate-linha');
    [['GdP', cb.dano_basico ? cb.dano_basico.gdp : '—'], ['GeB', cb.dano_basico ? cb.dano_basico.geb : '—'],
      ['Esquiva', cb.defesas.esquiva], ['Aparar', cb.defesas.aparar == null ? '—' : cb.defesas.aparar],
      ['Bloqueio', cb.defesas.bloqueio == null ? '—' : cb.defesas.bloqueio], ['Carga', cb.carga.nome]].forEach(function (x) {
      var c = el('div', 'combate-caixa');
      c.appendChild(el('span', null, x[0]));
      c.appendChild(el('strong', null, String(x[1])));
      if (x[0] === 'GdP' || x[0] === 'GeB') rolavel(c, 'dano', 'Dano ' + x[0], x[1]);
      else if (x[0] !== 'Carga') rolavel(c, 'teste', x[0], x[1]);
      linha.appendChild(c);
    });
    box.appendChild(linha);
    box.appendChild(el('p', 'combate-nota', num(cb.peso_total) + ' kg carregados · deslocamento ' + cb.carga.deslocamento + (cb.db ? ' · escudo +' + cb.db + ' em todas as defesas' : '')));
    if (cb.armas.length) {
      var t = el('table', 'combate-armas');
      var h = el('tr');
      (compacto ? ['Arma', 'Dano', 'NH', 'Aparar'] : ['Arma', 'Dano', 'NH', 'Aparar', 'Alcance', 'ST', 'Perícia']).forEach(function (x) { h.appendChild(el('th', null, x)); });
      t.appendChild(h);
      cb.armas.forEach(function (a) {
        var tr = el('tr');
        var n = el('td');
        var ic = window.iconeSvg && window.iconeSvg(a.item.icone, 'icone-item');
        if (ic) n.appendChild(ic);
        n.appendChild(document.createTextNode(a.nome));
        tr.appendChild(n);
        var vals = [a.dano, a.nh == null ? '—' : a.nh, a.aparar == null ? '—' : a.aparar];
        if (!compacto) vals.push(a.alcance, a.st || '—', a.pericia);
        vals.forEach(function (x, k) {
          var td = el('td', null, String(x));
          if (k === 0) rolavel(td, 'dano', a.nome, x);
          if (k === 1) rolavel(td, 'teste', a.nome, x);
          if (k === 2) rolavel(td, 'teste', 'Aparar (' + a.nome + ')', parseInt(x, 10));
          tr.appendChild(td);
        });
        t.appendChild(tr);
      });
      box.appendChild(t);
    }
    var locais = Object.keys(cb.protecao);
    if (locais.length) box.appendChild(el('p', 'combate-nota', 'Proteção (RD): ' + locais.map(function (l) { return l + ' ' + cb.protecao[l].rd + (cb.protecao[l].so_frente ? ' (só frente)' : ''); }).join(' · ')));
    if (!compacto) {
      box.appendChild(el('p', 'combate-nota', 'Ordem de ação: Velocidade ' + num(r.valores.velocidade) + ' (no empate, DX ' + r.valores.dx + '). ' + (R.iniciativa ? R.iniciativa.resumo : '')));
      if (R.manobras) {
        var det = el('details', 'manobras');
        det.appendChild(el('summary', null, 'Manobras de combate (resumo, pág. ' + R.manobras.ref.pagina + '–' + (R.manobras.ref.pagina + 1) + ')'));
        var lk = el('p', 'combate-nota');
        var aLk = el('a', null, 'Consulta rápida de combate completa');
        aLk.href = 'combate.html';
        lk.appendChild(aLk);
        det.appendChild(lk);
        det.appendChild(el('p', 'combate-nota', R.manobras.resumo));
        var dl = el('dl', 'manobras-lista');
        R.manobras.itens.forEach(function (m) {
          var d = el('div');
          d.appendChild(el('dt', null, m.nome));
          d.appendChild(el('dd', null, m.resumo));
          d.appendChild(el('dd', 'manobra-meta', 'Movimento: ' + m.movimento + ' · Defesa: ' + m.defesa));
          dl.appendChild(d);
        });
        det.appendChild(dl);
        box.appendChild(det);
      }
    }
    return box;
  }

  // ---------- em jogo: PV, PF, pontos ganhos, dinheiro e anotações da sessão (salvos no personagem) ----------
  function painelEmJogo(idFicha, compacto, aoMudar) {
    var box = el('section', 'em-jogo' + (compacto ? ' em-jogo-compacto' : ''));
    function salvarEmJogo(mudanca) {
      var salvo = arquivo.obter(idFicha);
      if (!salvo) return;
      salvo.em_jogo = Object.assign({}, salvo.em_jogo || {}, mudanca);
      arquivo.salvar(salvo);
      desenhar();
      if (aoMudar) aoMudar();
    }
    function contador(rotulo, valor, max, chave, extra) {
      var c = el('div', 'em-jogo-contador');
      c.appendChild(el('span', 'em-jogo-rotulo', rotulo));
      var linha = el('div', 'em-jogo-linha');
      var menos = el('button', 'btn btn-ghost', '−');
      var mais = el('button', 'btn btn-ghost', '+');
      menos.type = mais.type = 'button';
      menos.setAttribute('aria-label', 'Diminuir ' + rotulo);
      mais.setAttribute('aria-label', 'Aumentar ' + rotulo);
      var campo = el('input', 'em-jogo-valor');
      campo.type = 'number';
      campo.value = valor;
      campo.setAttribute('aria-label', rotulo);
      menos.addEventListener('click', function () { var m = {}; m[chave] = valor - 1; salvarEmJogo(m); });
      mais.addEventListener('click', function () { var m = {}; m[chave] = max != null ? Math.min(max, valor + 1) : valor + 1; salvarEmJogo(m); });
      campo.addEventListener('change', function () { var n = parseInt(campo.value, 10); if (!isNaN(n)) { var m = {}; m[chave] = n; salvarEmJogo(m); } });
      linha.appendChild(menos);
      linha.appendChild(campo);
      if (max != null) linha.appendChild(el('span', 'em-jogo-max', '/ ' + max));
      linha.appendChild(mais);
      c.appendChild(linha);
      if (max != null && max > 0) {
        var barra = el('div', 'em-jogo-barra');
        var cheio = el('span');
        cheio.style.width = Math.max(0, Math.min(100, valor / max * 100)) + '%';
        if (valor < max / 3) barra.classList.add('baixo');
        barra.appendChild(cheio);
        c.appendChild(barra);
      }
      if (extra) c.appendChild(extra);
      return c;
    }
    function registrarNoDiario(entrada) {
      var salvo = arquivo.obter(idFicha);
      if (!salvo) return;
      var agora = new Date();
      var lista = ((salvo.em_jogo || {}).diario || []).slice();
      lista.unshift(Object.assign({ data: agora.toISOString().slice(0, 10), hora: agora.toTimeString().slice(0, 5) }, entrada));
      salvarEmJogo({ diario: lista.slice(0, 300) });
    }
    if (!compacto) diarioAlvo = { registrar: registrarNoDiario };
    function desenhar() {
      box.textContent = '';
      var salvo = arquivo.obter(idFicha);
      if (!salvo) return;
      var f = criador.carregar(salvo), r = criador.resumir(f), e = criador.estadoEmJogo(f, r);
      var cab = el('div', 'em-jogo-cab');
      cab.appendChild(el('h3', null, 'Em jogo'));
      var descansar = el('button', 'btn-link', 'Descansar (PV e PF cheios)');
      descansar.type = 'button';
      descansar.addEventListener('click', function () { salvarEmJogo({ pv: e.pv_max, pf: e.pf_max }); });
      cab.appendChild(descansar);
      box.appendChild(cab);
      var grade = el('div', 'em-jogo-grade');
      grade.appendChild(contador('PV', e.pv, e.pv_max, 'pv'));
      grade.appendChild(contador('PF', e.pf, e.pf_max, 'pf'));
      if (!compacto) {
        grade.appendChild(contador('Pontos ganhos', e.pontos, null, 'pontos'));
        grade.appendChild(contador('Coroas', e.dinheiro, null, 'dinheiro'));
      }
      box.appendChild(grade);
      if (!compacto) {
        // ganhar pontos com motivo: fica registrado no histórico do personagem
        var ganho = el('form', 'em-jogo-ganho');
        ganho.setAttribute('aria-label', 'Registrar pontos ganhos');
        var qtd = el('input');
        qtd.type = 'number';
        qtd.min = 1;
        qtd.max = 50;
        qtd.value = 1;
        qtd.setAttribute('aria-label', 'Quantos pontos');
        var motivo = el('input');
        motivo.placeholder = 'motivo (ex.: sessão 3, salvou a vila)';
        motivo.maxLength = 80;
        motivo.setAttribute('aria-label', 'Motivo');
        var btG = el('button', 'btn btn-ghost', '+ Ganhar pontos');
        btG.type = 'submit';
        ganho.appendChild(qtd);
        ganho.appendChild(motivo);
        ganho.appendChild(btG);
        ganho.addEventListener('submit', function (ev) {
          ev.preventDefault();
          var n = parseInt(qtd.value, 10);
          if (!(n > 0)) return;
          var hist = (e.historico || []).slice();
          hist.unshift({ data: new Date().toISOString().slice(0, 10), pontos: n, motivo: motivo.value.trim() });
          salvarEmJogo({ pontos: e.pontos + n, historico: hist.slice(0, 100) });
        });
        box.appendChild(ganho);
        if (e.historico && e.historico.length) {
          var hl = el('ul', 'em-jogo-historico');
          e.historico.slice(0, 8).forEach(function (h, i) {
            var li = el('li');
            li.appendChild(el('span', 'em-jogo-hist-pts', '+' + h.pontos));
            li.appendChild(el('span', null, (h.motivo || 'sem motivo') + ' · ' + h.data.split('-').reverse().join('/')));
            var desfaz = el('button', 'btn-link', 'desfazer');
            desfaz.type = 'button';
            desfaz.setAttribute('aria-label', 'Desfazer ganho de ' + h.pontos + ' pontos');
            desfaz.addEventListener('click', function () {
              var hist = e.historico.slice();
              hist.splice(i, 1);
              salvarEmJogo({ pontos: Math.max(0, e.pontos - h.pontos), historico: hist });
            });
            li.appendChild(desfaz);
            hl.appendChild(li);
          });
          box.appendChild(hl);
        }
      }
      if (!compacto && e.pontos > 0) {
        var dica = el('p', 'em-jogo-agora');
        dica.appendChild(document.createTextNode('Os ' + e.pontos + ' pontos ganhos já somam no saldo: '));
        var ed = el('a', null, 'abra no criador para gastar');
        ed.href = 'criador.html?editar=' + encodeURIComponent(idFicha);
        dica.appendChild(ed);
        dica.appendChild(document.createTextNode(' (perícias, atributos, vantagens).'));
        box.appendChild(dica);
      }
      var agora = el('p', 'em-jogo-agora', 'Agora: deslocamento ' + e.deslocamento + ' · esquiva ' + e.esquiva + (e.st !== r.valores.st ? ' · ST ' + e.st : ''));
      box.appendChild(agora);
      if (e.efeitos.length) {
        var ul = el('ul', 'em-jogo-efeitos');
        e.efeitos.forEach(function (x) { ul.appendChild(el('li', 'grave-' + x.grave, x.texto)); });
        box.appendChild(ul);
      }
      if (!compacto) {
        var diario = el('div', 'diario');
        diario.appendChild(el('h4', null, 'Diário'));
        var novo = el('form', 'em-jogo-ganho');
        var texto = el('input');
        texto.placeholder = 'o que aconteceu (ex.: sessão 3, chegamos a Fontest)';
        texto.maxLength = 200;
        texto.setAttribute('aria-label', 'Nova entrada do diário');
        var btD = el('button', 'btn btn-ghost', 'Registrar');
        btD.type = 'submit';
        novo.appendChild(texto);
        novo.appendChild(btD);
        novo.addEventListener('submit', function (ev) {
          ev.preventDefault();
          if (!texto.value.trim()) return;
          registrarNoDiario({ tipo: 'nota', texto: texto.value.trim() });
        });
        diario.appendChild(novo);
        if (e.diario && e.diario.length) {
          var dl = el('ol', 'diario-lista');
          e.diario.slice(0, 15).forEach(function (d, i) {
            var li = el('li', 'diario-' + d.tipo);
            li.appendChild(el('span', 'diario-quando', d.data.split('-').reverse().join('/') + (d.hora ? ' ' + d.hora : '')));
            li.appendChild(el('span', 'diario-texto', d.texto));
            var apaga = el('button', 'btn-link', '×');
            apaga.type = 'button';
            apaga.setAttribute('aria-label', 'Apagar entrada');
            apaga.addEventListener('click', function () {
              var lista = e.diario.slice();
              lista.splice(i, 1);
              salvarEmJogo({ diario: lista });
            });
            li.appendChild(apaga);
            dl.appendChild(li);
          });
          diario.appendChild(dl);
          if (e.diario.length > 15) diario.appendChild(el('p', 'combate-nota', '+' + (e.diario.length - 15) + ' entradas mais antigas guardadas.'));
        }
        box.appendChild(diario);
        var notas = el('textarea', 'em-jogo-notas');
        notas.rows = 3;
        notas.maxLength = 2000;
        notas.placeholder = 'Anotações da sessão: ferimentos, promessas, dívidas, nomes…';
        notas.value = e.notas;
        notas.setAttribute('aria-label', 'Anotações da sessão');
        notas.addEventListener('change', function () { salvarEmJogo({ notas: notas.value }); });
        box.appendChild(notas);
      }
    }
    desenhar();
    return box;
  }

  // ---------- cofre: grade de personagens + painel da ficha (tela de seleção de MMO antigo) ----------
  var ARMAZENAMENTO_SELECAO = 'adamar-cofre-selecionado';
  var RASCUNHO = 'adamar-criador';
  var ERAS = { 'Era do Novo Mundo': 'novo', 'Era da Alta Magia': 'magia', 'Era do Apocalipse': 'apocalipse' };

  // rascunho aberto no criador que ainda não foi salvo no cofre (aparece como slot próprio)
  function rascunhoSolto() {
    try {
      var f = JSON.parse(localStorage.getItem(RASCUNHO) || 'null');
      if (!f) return null;
      f = criador.carregar(f);
      if (JSON.stringify(f) === JSON.stringify(criador.fichaNova())) return null;
      var sem = function (x) { var c = Object.assign({}, x); delete c.em_jogo; return JSON.stringify(c); };
      if (f.id_salvo && arquivo.obter(f.id_salvo) && sem(criador.carregar(arquivo.obter(f.id_salvo))) === sem(f)) return null;
      return f;
    } catch (e) { return null; }
  }

  // perícia de maior NH: dá o ícone do brasão
  function melhorPericia(r) {
    var ps = r.pericias.filter(function (x) { return x.pericia && x.nh != null; });
    ps.sort(function (a, b) { return b.nh - a.nh; });
    return ps[0] || null;
  }

  function brasao(f, r, classe) {
    var b = el('div', 'brasao' + (classe ? ' ' + classe : '') + ' era-' + (ERAS[f.era] || 'sem'));
    var inicial = el('span', 'brasao-inicial', (String(f.nome || '?').trim()[0] || '?').toUpperCase());
    b.appendChild(inicial);
    var mp = melhorPericia(r);
    var ic = mp && window.iconeSvg && window.iconeSvg(mp.pericia.icone, 'brasao-icone');
    if (ic) b.appendChild(ic);
    return b;
  }

  function mostrarLista() {
    var grade = document.getElementById('p-lista');
    var painel = document.getElementById('p-painel');
    var aviso = document.getElementById('p-aviso');
    var selecionado = null;
    try { selecionado = localStorage.getItem(ARMAZENAMENTO_SELECAO); } catch (e) { selecionado = null; }

    function desenhar() {
      grade.textContent = '';
      var lista = arquivo.listar();
      if (selecionado && selecionado !== 'rascunho' && !lista.some(function (p) { return p.id === selecionado; })) selecionado = null;
      var solto = rascunhoSolto();
      if (selecionado === 'rascunho' && !solto) selecionado = null;
      if (!selecionado) selecionado = lista.length ? lista[0].id : (solto ? 'rascunho' : null);

      var slots = lista.map(function (p) { return { id: p.id, ficha: criador.carregar(arquivo.obter(p.id)), atualizado: p.atualizado }; });
      if (solto) slots.push({ id: 'rascunho', ficha: solto, rascunho: true });
      slots.forEach(function (s) {
        var r = criador.resumir(s.ficha);
        var b = el('button', 'cofre-slot' + (s.id === selecionado ? ' is-sel' : ''));
        b.type = 'button';
        b.setAttribute('aria-pressed', String(s.id === selecionado));
        b.appendChild(brasao(s.ficha, r));
        var txt = el('span', 'cofre-slot-texto');
        txt.appendChild(el('strong', 'cofre-slot-nome', s.ficha.nome || 'Sem nome'));
        if (s.ficha.conceito) txt.appendChild(el('span', 'cofre-slot-conceito', s.ficha.conceito));
        txt.appendChild(el('span', 'cofre-slot-meta', [s.ficha.origem, s.ficha.era && s.ficha.era.replace('Era d', 'D')].filter(Boolean).join(' · ') || 'Origem e era a definir'));
        b.appendChild(txt);
        b.appendChild(el('span', 'personagem-selo ' + (s.rascunho ? 'rascunho' : r.valida ? 'pronta' : 'rascunho'),
          s.rascunho ? 'Não salvo' : r.valida ? 'Pronta' : 'Rascunho'));
        b.addEventListener('click', function () { selecionar(s.id); });
        b.addEventListener('dblclick', function () {
          location.href = s.rascunho ? 'criador.html' : 'personagens.html?id=' + encodeURIComponent(s.id);
        });
        grade.appendChild(b);
      });
      // slot vazio: criar
      var novo = el('a', 'cofre-slot cofre-novo');
      novo.href = 'criador.html?novo=1';
      novo.appendChild(el('span', 'brasao brasao-vazio', '+'));
      var tn = el('span', 'cofre-slot-texto');
      tn.appendChild(el('strong', 'cofre-slot-nome', 'Novo personagem'));
      tn.appendChild(el('span', 'cofre-slot-conceito', 'Abrir o criador com uma ficha em branco'));
      novo.appendChild(tn);
      grade.appendChild(novo);

      desenharPainel(slots.filter(function (s) { return s.id === selecionado; })[0]);
    }

    function selecionar(id) {
      selecionado = id;
      try { localStorage.setItem(ARMAZENAMENTO_SELECAO, id); } catch (e) { /* sem armazenamento */ }
      desenhar();
      if (window.matchMedia('(max-width: 899px)').matches) painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function desenharPainel(s) {
      painel.textContent = '';
      if (!s) {
        painel.appendChild(el('p', 'cofre-vazio', 'O cofre está vazio. Crie seu primeiro personagem no slot "Novo personagem".'));
        return;
      }
      var f = s.ficha, r = criador.resumir(f), v = r.valores;
      var cab = el('div', 'cofre-cab');
      cab.appendChild(brasao(f, r, 'brasao-grande'));
      var id = el('div', 'cofre-id');
      id.appendChild(el('h2', 'cofre-nome', f.nome || 'Sem nome'));
      if (f.conceito) id.appendChild(el('p', 'cofre-conceito', f.conceito));
      id.appendChild(el('p', 'cofre-meta', [f.era, f.origem, f.jogador ? 'jogador: ' + f.jogador : ''].filter(Boolean).join(' · ')));
      cab.appendChild(id);
      painel.appendChild(cab);

      // atributos em destaque, como numa janela de status
      var atr = el('div', 'cofre-atributos');
      R.atributos.forEach(function (a) {
        var c = el('div', 'cofre-atr');
        c.appendChild(el('span', 'cofre-atr-sigla', a.sigla));
        c.appendChild(el('strong', null, String(v[a.id])));
        rolavel(c, 'teste', a.sigla, v[a.id]);
        atr.appendChild(c);
      });
      painel.appendChild(atr);
      if (!s.rascunho) painel.appendChild(painelEmJogo(s.id, true));
      var sec = el('p', 'cofre-secundarias');
      sec.textContent = ['PV ' + v.pv, 'Vont ' + v.vontade, 'Per ' + v.per, 'PF ' + v.pf, 'Vel ' + num(v.velocidade), 'Desl ' + v.deslocamento].join('  ·  ');
      painel.appendChild(sec);
      var saldo = el('p', 'cofre-saldo');
      saldo.textContent = f.orcamento + ' pontos' + (r.pontos_ganhos ? ' + ' + r.pontos_ganhos + ' ganhos' : '') + ' · ' + (r.restante >= 0 ? (r.restante ? r.restante + ' guardados' : 'todos usados') : 'saldo negativo ' + r.restante) +
        ' · ' + moeda(r.dinheiro_restante) + ' na bolsa';
      painel.appendChild(saldo);
      painel.appendChild(blocoCombate(r, true));

      function secao(titulo, itens) {
        var b = el('section', 'cofre-secao');
        b.appendChild(el('h3', null, titulo));
        if (!itens.length) { b.appendChild(el('p', 'cofre-nada', '—')); return b; }
        var ul = el('ul', 'cofre-lista');
        itens.forEach(function (x) {
          var li = el('li');
          var ic = window.iconeSvg && window.iconeSvg(x.icone, 'icone-item');
          if (ic) li.appendChild(ic);
          li.appendChild(el('span', 'cofre-item-nome', x.nome));
          if (x.valor != null) li.appendChild(rolavel(el('span', 'cofre-item-valor', x.valor), 'teste', x.nome, x.valor));
          ul.appendChild(li);
        });
        b.appendChild(ul);
        return b;
      }
      var tracos = r.tracos.filter(function (x) { return x.traco; });
      var nomeTraco = function (x) {
        var e = x.sel.escolha || {}, c = x.traco.custo_estruturado || {};
        var n = x.traco.nome + (c.tipo === 'niveis' ? ' ' + (e.nivel || 0) : '');
        var vr = criador.nomeVariante(x.traco, e.opcao);
        if (c.tipo === 'opcoes' && vr && vr !== x.traco.nome) n += ' (' + vr + ')';
        return n;
      };
      var grid = el('div', 'cofre-colunas');
      grid.appendChild(secao('Vantagens', tracos.filter(function (x) { return x.custo >= 0; }).map(function (x) { return { nome: nomeTraco(x), icone: x.traco.icone }; })
        .concat(r.talentos.filter(function (x) { return x.talento; }).map(function (x) { return { nome: 'Talento ' + x.talento.nome + ' ' + x.sel.nivel, icone: 'star' }; }))));
      grid.appendChild(secao('Desvantagens', tracos.filter(function (x) { return x.custo < 0; }).map(function (x) { return { nome: nomeTraco(x), icone: x.traco.icone }; })
        .concat(f.peculiaridades.filter(Boolean).map(function (q) { return { nome: q, icone: 'spiral' }; }))));
      var pers = r.pericias.filter(function (x) { return x.pericia; }).slice().sort(function (a, b) { return (b.nh || 0) - (a.nh || 0); });
      grid.appendChild(secao('Perícias', pers.map(function (x) {
        return { nome: x.pericia.nome + (x.sel.especializacao ? ' (' + x.sel.especializacao + ')' : ''), icone: x.pericia.icone, valor: x.nh == null ? '—' : String(x.nh) };
      })));
      grid.appendChild(secao('Equipamento', r.equipamento.filter(function (x) { return x.item; }).map(function (x) {
        return { nome: x.item.nome + ((x.sel.quantidade || 1) > 1 ? ' ×' + x.sel.quantidade : ''), icone: x.item.icone };
      })));
      painel.appendChild(grid);

      if (!r.valida) {
        painel.appendChild(el('p', 'cofre-pendencias', r.erros.length + (r.erros.length === 1 ? ' pendência' : ' pendências') + ' para a ficha ficar pronta: ' +
          r.erros.slice(0, 3).map(function (e) { return e.texto; }).join(' ') + (r.erros.length > 3 ? ' …' : '')));
      }

      // ações
      var acoes = el('div', 'cofre-acoes');
      var editar = el('a', 'btn btn-primary', s.rascunho ? 'Continuar' : 'Editar');
      editar.href = s.rascunho ? 'criador.html' : 'criador.html?editar=' + encodeURIComponent(s.id);
      acoes.appendChild(editar);
      if (!s.rascunho) {
        var ver = el('a', 'btn btn-ghost', 'Ficha completa');
        ver.href = 'personagens.html?id=' + encodeURIComponent(s.id);
        acoes.appendChild(ver);
        var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.whatsapp) || { numero: '' };
        var whats = el('a', 'btn btn-ghost' + (r.valida ? '' : ' is-disabled'), 'Enviar');
        whats.target = '_blank';
        whats.rel = 'noopener';
        whats.href = window.buildWhatsAppUrl ? window.buildWhatsAppUrl(cfg.numero, 'Olá! Montei meu personagem de Adamar:\n\n' + criador.textoFicha(f, r)) : '#';
        whats.title = r.valida ? 'Mandar a ficha pelo WhatsApp' : 'Resolva as pendências antes de enviar';
        whats.addEventListener('click', function (ev) { if (!r.valida) { ev.preventDefault(); aviso.textContent = 'Resolva as pendências antes de enviar.'; } });
        acoes.appendChild(whats);
        var baixa = el('button', 'btn-link', 'Baixar');
        baixa.type = 'button';
        baixa.addEventListener('click', function () { baixar(f); });
        acoes.appendChild(baixa);
        var apagar = el('button', 'btn-link cofre-apagar', 'Apagar');
        apagar.type = 'button';
        var confirmando = null;
        apagar.addEventListener('click', function () {
          if (!confirmando) {
            apagar.textContent = 'Clique de novo para apagar';
            confirmando = setTimeout(function () { apagar.textContent = 'Apagar'; confirmando = null; }, 4000);
            return;
          }
          clearTimeout(confirmando);
          arquivo.remover(s.id);
          aviso.textContent = (f.nome || 'Personagem') + ' foi apagado.';
          selecionado = null;
          desenhar();
        });
        acoes.appendChild(apagar);
      }
      painel.appendChild(acoes);
    }

    document.getElementById('p-abrir').addEventListener('change', function (ev) {
      var arq = ev.target.files && ev.target.files[0];
      if (!arq) return;
      var leitor = new FileReader();
      leitor.onload = function () {
        try {
          var f = criador.carregar(JSON.parse(leitor.result));
          var novoId = arquivo.salvar(f);
          aviso.textContent = novoId ? (f.nome || 'Personagem') + ' entrou no cofre.' : 'Não deu para salvar no navegador.';
          if (novoId) selecionado = novoId;
          desenhar();
        } catch (e) { aviso.textContent = 'Esse arquivo não é uma ficha válida.'; }
        ev.target.value = '';
      };
      leitor.readAsText(arq);
    });
    desenhar();
  }

  // ---------- ficha ----------
  function bloco(titulo, classe) {
    var s = el('section', 'ficha-bloco' + (classe ? ' ' + classe : ''));
    s.appendChild(el('h2', 'ficha-titulo', titulo));
    return s;
  }
  function linhas(pares) {
    var dl = el('dl', 'ficha-valores');
    pares.forEach(function (p) {
      var d = el('div');
      d.appendChild(el('dt', null, p[0]));
      d.appendChild(el('dd', null, p[1]));
      if (p[2]) d.appendChild(el('dd', 'ficha-custo', p[2]));
      dl.appendChild(d);
    });
    return dl;
  }
  function tabela(cab, corpo) {
    var w = el('div', 'table-wrap');
    var t = el('table');
    var tr = el('tr');
    cab.forEach(function (c) { tr.appendChild(el('th', null, c)); });
    var th = el('thead'); th.appendChild(tr); t.appendChild(th);
    var tb = el('tbody');
    corpo.forEach(function (linha) {
      var r = el('tr');
      linha.forEach(function (c) {
        var td = el('td');
        if (c instanceof Node) td.appendChild(c); else td.textContent = c;
        r.appendChild(td);
      });
      tb.appendChild(r);
    });
    t.appendChild(tb);
    w.appendChild(t);
    return w;
  }

  function mostrarFicha(idFicha) {
    document.getElementById('modo-lista').hidden = true;
    document.getElementById('modo-ficha').hidden = false;
    var salvo = arquivo.obter(idFicha);
    var box = document.getElementById('f-ficha');
    if (!salvo) {
      document.getElementById('f-nome').textContent = 'Personagem não encontrado';
      document.getElementById('f-conceito').textContent = 'Ele pode ter sido apagado, ou foi salvo em outro navegador.';
      document.querySelector('.ficha-acoes').hidden = true;
      return;
    }
    var f = criador.carregar(salvo);
    var r = criador.resumir(f);
    var v = r.valores;
    document.title = (f.nome || 'Personagem') + ' — Ruínas de Adamar';
    document.getElementById('f-nome').textContent = f.nome || 'Sem nome';
    document.getElementById('f-kicker').textContent = [f.era, f.origem, f.idade ? f.idade + ' anos' : '', f.altura, f.peso_corporal].filter(Boolean).join(' · ') || 'Personagem';
    document.getElementById('f-conceito').textContent = f.conceito || '';
    document.getElementById('f-editar').href = 'criador.html?editar=' + encodeURIComponent(idFicha);
    var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.whatsapp) || { numero: '' };
    document.getElementById('f-whats').addEventListener('click', function (ev) {
      if (!r.valida) { ev.preventDefault(); alertaInline('Resolva as pendências no criador antes de enviar.'); }
    });
    document.getElementById('f-whats').href = window.buildWhatsAppUrl
      ? window.buildWhatsAppUrl(cfg.numero, 'Olá! Montei meu personagem de Adamar:\n\n' + criador.textoFicha(f, r)) : '#';
    document.getElementById('f-baixar').addEventListener('click', function () { baixar(f); });
    document.getElementById('f-imprimir').addEventListener('click', function () { window.print(); });

    // pontos
    var pts = el('div', 'ficha-pontos');
    // o topo se refaz quando o painel "Em jogo" muda os pontos ganhos
    function desenharPontos() {
      var fx = criador.carregar(arquivo.obter(idFicha) || salvo), rx = criador.resumir(fx);
      pts.textContent = '';
      pts.appendChild(el('strong', null, String(fx.orcamento + (rx.pontos_ganhos || 0))));
      pts.appendChild(el('span', null, 'pontos' + (rx.pontos_ganhos ? ' (' + fx.orcamento + ' iniciais + ' + rx.pontos_ganhos + ' ganhos em jogo)' : ' iniciais') + ' · gastou ' + rx.pontos_gastos + ' · desvantagens devolveram ' + rx.pontos_devolvidos + (fx.jogador ? ' · jogador: ' + fx.jogador : '')));
      pts.appendChild(el('span', rx.restante < 0 ? 'calc-estourou' : null, rx.restante >= 0 ? (rx.restante ? rx.restante + ' guardados para depois' : 'todos usados') : 'saldo negativo: ' + rx.restante));
      pts.appendChild(el('span', 'personagem-selo ' + (rx.valida ? 'pronta' : 'rascunho'), rx.valida ? 'Pronta' : 'Rascunho'));
    }
    desenharPontos();
    if (!r.valida) document.getElementById('f-whats').classList.add('is-disabled');
    box.appendChild(pts);

    box.appendChild(painelEmJogo(idFicha, false, desenharPontos));

    var grade = el('div', 'ficha-grade');
    box.appendChild(grade);

    var atr = bloco('Atributos');
    atr.appendChild(linhas(R.atributos.map(function (a) {
      return [a.sigla, String(v[a.id]), sinal(calc.custoAtributo(a.id, f.atributos[a.id]))];
    })));
    grade.appendChild(atr);

    var sec = bloco('Secundárias');
    sec.appendChild(linhas(R.secundarias.map(function (s) {
      var aj = f.ajustes[s.id] || 0;
      return [s.sigla, num(v[s.id]), aj ? sinal(calc.custoSecundaria(s.id, aj)) : ''];
    }).concat([['Base de Carga', num(r.base_carga) + ' kg']])));
    grade.appendChild(sec);

    var so = f.social;
    var ap = porId(R.aparencia.niveis, so.aparencia);
    var rq = porId(R.riqueza.niveis, so.riqueza);
    var alf = porId(R.idiomas.alfabetizacao_materna, so.alfabetizacao);
    var soc = bloco('Lugar no mundo');
    soc.appendChild(linhas([
      ['Aparência', ap ? ap.nome : so.aparencia, sinal(calc.custoAparencia(so.aparencia))],
      ['Status', sinal(so.status), sinal(calc.custoStatus(so.status))],
      ['Riqueza', so.multimilionario ? 'Multimilionário ' + so.multimilionario : (rq ? rq.nome : so.riqueza), sinal(calc.custoRiqueza(so.riqueza, so.multimilionario))],
      ['Leitura', alf ? alf.nome : so.alfabetizacao, sinal(calc.custoAlfabetizacao(so.alfabetizacao))],
      ['Dinheiro', moeda(r.recursos)]
    ].concat(f.idioma_materno ? [['Língua materna', f.idioma_materno]] : [])
      .concat(f.idiomas.map(function (i) {
        var nf = porId(R.idiomas.niveis, i.fala), ne = porId(R.idiomas.niveis, i.escrita);
        return [i.nome || 'Idioma', 'fala ' + (nf ? nf.nome : i.fala) + ', escrita ' + (ne ? ne.nome : i.escrita), sinal(calc.custoIdioma(i.fala, i.escrita))];
      }))));
    grade.appendChild(soc);

    var comb = bloco('Combate', 'ficha-largo ficha-combate');
    comb.appendChild(blocoCombate(r, false));
    box.appendChild(comb);

    // traços
    function listaTracos(titulo, itens, extras) {
      var b = bloco(titulo, 'ficha-largo');
      if (!itens.length && !extras.length) { b.appendChild(el('p', 'pericia-vazio', 'Nenhuma.')); return b; }
      itens.forEach(function (x) {
        var t = x.traco;
        var d = el('div', 'ficha-traco');
        var topo = el('div', 'pericia-topo');
        var e = x.sel.escolha || {};
        var c = t.custo_estruturado || {};
        var nome = t.nome + (c.tipo === 'niveis' ? ' ' + (e.nivel || 0) : '');
        var variante = criador.nomeVariante(t, e.opcao);
        if (c.tipo === 'opcoes' && variante && variante !== t.nome) nome += ' (' + variante + ')';
        if (x.sel.nota) nome += ' — ' + x.sel.nota;
        var forte = el('strong', 'pericia-nome', nome);
        var icT = window.iconeSvg && window.iconeSvg(t.icone, 'icone-item');
        if (icT) forte.insertBefore(icT, forte.firstChild);
        topo.appendChild(forte);
        topo.appendChild(el('span', 'criador-custo', sinal(x.custo) + ' pts'));
        d.appendChild(topo);
        var ul = el('ul', 'efeitos');
        Efeitos.desenharEfeitos(ul, criador.efeitosDoTraco(x.sel));
        if (ul.hidden) d.appendChild(el('p', 'pericia-resumo', t.resumo));
        else d.appendChild(ul);
        b.appendChild(d);
      });
      extras.forEach(function (x) {
        var d = el('div', 'ficha-traco');
        var topo = el('div', 'pericia-topo');
        topo.appendChild(el('strong', 'pericia-nome', x[0]));
        topo.appendChild(el('span', 'criador-custo', x[1]));
        d.appendChild(topo);
        if (x[2]) d.appendChild(el('p', 'pericia-resumo', x[2]));
        b.appendChild(d);
      });
      return b;
    }
    var talentos = r.talentos.filter(function (x) { return x.talento; }).map(function (x) {
      return ['Talento ' + x.talento.nome + ' ' + x.sel.nivel, sinal(x.custo) + ' pts', '+' + x.sel.nivel + ' em ' + x.talento.pericias.map(function (p) { var q = porId(G.pericias, p); return q ? q.nome : p; }).join(', ') + '.'];
    });
    var qualidades = f.qualidades.filter(Boolean).map(function (q) { return [q, '+1 pt', 'Qualidade']; });
    var peculiaridades = f.peculiaridades.filter(Boolean).map(function (q) { return [q, '-1 pt', 'Peculiaridade']; });
    box.appendChild(listaTracos('Vantagens', r.tracos.filter(function (x) { return x.traco && x.custo >= 0; }), talentos.concat(qualidades)));
    box.appendChild(listaTracos('Desvantagens', r.tracos.filter(function (x) { return x.traco && x.custo < 0; }), peculiaridades));

    // perícias
    var per = bloco('Perícias', 'ficha-largo');
    var comPericia = r.pericias.filter(function (x) { return x.pericia; });
    if (!comPericia.length) per.appendChild(el('p', 'pericia-vazio', 'Nenhuma.'));
    else {
      per.appendChild(tabela(['Perícia', 'Tipo', 'NH', 'Pontos'], comPericia.map(function (x) {
        var nome = el('span');
        var icP = window.iconeSvg && window.iconeSvg(x.pericia.icone, 'icone-item');
        if (icP) nome.appendChild(icP);
        nome.appendChild(el('strong', null, x.pericia.nome + (x.sel.especializacao ? ' (' + x.sel.especializacao + ')' : '')));
        if (x.bonus.length || x.situacional.length) {
          var ul = el('ul', 'efeitos');
          Efeitos.desenharEfeitos(ul, x.bonus.map(function (b) { return { tipo: 'aplicado', texto: sinal(b.valor) + ' de ' + b.origem }; })
            .concat(x.situacional.map(function (b) { return { tipo: 'condicional', texto: sinal(b.valor) + ' de ' + b.origem + ' — ' + b.condicao }; })));
          nome.appendChild(ul);
        }
        return [nome, x.atributo + '/' + x.pericia.dificuldade, x.nh == null ? '—' : String(x.nh), String(x.sel.pontos || 0)];
      })));
    }
    box.appendChild(per);

    // perícias sem treino: o que o personagem ainda consegue tentar (as melhores entre as de Adamar)
    var compradas = {};
    r.pericias.forEach(function (x) { if (x.pericia) compradas[x.pericia.id] = true; });
    var semTreino = G.pericias.filter(function (p) { return p.adamar === 'livre' && !compradas[p.id]; })
      .map(function (p) { return { p: p, nh: r.combate.sem_treino(p) }; })
      .filter(function (x) { return x.nh != null; })
      .sort(function (a, b) { return b.nh - a.nh || a.p.nome.localeCompare(b.p.nome, 'pt-BR'); })
      .slice(0, 15);
    if (semTreino.length) {
      var st = bloco('Sem treino (as melhores)', 'ficha-largo');
      st.appendChild(el('p', 'combate-nota', 'Perícias que o personagem não comprou, mas pode tentar pelo valor pré-definido do livro.'));
      var ul = el('ul', 'cofre-lista sem-treino');
      semTreino.forEach(function (x) {
        var li = el('li');
        var ic = window.iconeSvg && window.iconeSvg(x.p.icone, 'icone-item');
        if (ic) li.appendChild(ic);
        li.appendChild(el('span', 'cofre-item-nome', x.p.nome));
        li.appendChild(rolavel(el('span', 'cofre-item-valor', String(x.nh)), 'teste', x.p.nome + ' (sem treino)', x.nh));
        ul.appendChild(li);
      });
      st.appendChild(ul);
      box.appendChild(st);
    }

    // equipamento
    var eq = bloco('Equipamento', 'ficha-largo');
    var itens = r.equipamento.filter(function (x) { return x.item; });
    if (!itens.length) eq.appendChild(el('p', 'pericia-vazio', 'Nada.'));
    else {
      eq.appendChild(tabela(['Item', 'Qtd.', 'Preço'], itens.map(function (x) {
        var nomeItem = el('span');
        var icE = window.iconeSvg && window.iconeSvg(x.item.icone, 'icone-item');
        if (icE) nomeItem.appendChild(icE);
        nomeItem.appendChild(document.createTextNode(x.item.nome));
        return [nomeItem, String(x.sel.quantidade || 1), x.preco == null ? '—' : moeda(x.preco)];
      })));
      eq.appendChild(el('p', 'calc-detalhe', 'Gasto ' + moeda(r.gasto_equipamento) + ' de ' + moeda(r.recursos) + ' · ' +
        (r.dinheiro_restante >= 0 ? 'sobram ' + moeda(r.dinheiro_restante) : 'faltam ' + moeda(-r.dinheiro_restante))));
    }
    box.appendChild(eq);

    // texto livre
    [['Aparência', f.aparencia_fisica], ['História', f.historia], ['Recado para o narrador', f.notas]].forEach(function (x) {
      if (!x[1]) return;
      var b = bloco(x[0], 'ficha-largo');
      x[1].split(/\n+/).forEach(function (par) { b.appendChild(el('p', null, par)); });
      box.appendChild(b);
    });

    if (r.erros.length) {
      var pe = bloco('Pendências: ficha incompleta', 'ficha-largo');
      var ule = el('ul', 'calc-avisos');
      r.erros.forEach(function (a) { ule.appendChild(el('li', null, a.texto)); });
      pe.appendChild(ule);
      box.insertBefore(pe, box.children[1]);
    }
    marcarRolaveis(box);

    if (r.avisos.length) {
      var av = bloco('Para conversar com o narrador', 'ficha-largo');
      var ul = el('ul', 'app-pendencias');
      r.avisos.forEach(function (a) { ul.appendChild(el('li', null, a.texto)); });
      av.appendChild(ul);
      box.appendChild(av);
    }
  }
  // ?id=<id> abre a ficha completa; sem isso, o cofre
  var id = (/[?&]id=([^&]+)/.exec(location.search) || [])[1];
  if (id) mostrarFicha(decodeURIComponent(id)); else mostrarLista();
})();
