// js/personagens.js — "Meus personagens": lista dos salvos no navegador e a ficha pronta de cada um.
(function () {
  var G = window.GURPS;
  if (!G || !G.regras || !window.criarCalculo || !window.criarCriador || !window.criarArquivo) return;
  var R, calc, criador;
  // cada personagem usa o motor do seu sistema de regras (GURPS ou Adamar RPG); os motores ficam guardados
  var motores = {};
  function usarSistema(id) {
    id = id || 'gurps';
    if (!motores[id]) {
      var g = window.Sistemas ? window.Sistemas.obter(id) : window.GURPS;
      var c = window.criarCalculo(g.regras);
      motores[id] = { G: g, R: g.regras, calc: c, criador: window.criarCriador(g, c) };
    }
    G = motores[id].G; R = motores[id].R; calc = motores[id].calc; criador = motores[id].criador;
  }
  usarSistema('gurps');
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
    var menu = document.querySelector('.fx-mais');
    if (menu) menu.open = true;
  }
  var SEM_ESPACO = 'Não deu para salvar: o navegador está sem espaço. No cofre, baixe uma cópia de todos e apague personagens antigos ou retratos grandes.';


  // ---------- rolador: clicar num número rola 3d contra ele (ou o dano); quadro com as últimas rolagens ----------
  var ARMAZENAMENTO_ROLAGENS = 'adamar-rolagens';
  var diarioAlvo = null; // { registrar(entrada) } quando uma ficha completa está aberta
  var ARMAZENAMENTO_MOD = 'adamar-rolagens-mod';
  var modificador = { valor: 0, motivo: '' };
  try { modificador = JSON.parse(sessionStorage.getItem(ARMAZENAMENTO_MOD) || 'null') || modificador; } catch (e) { /* sem armazenamento */ }
  var situacoesLigadas = []; // [{ origem, condicao, valor, alvos, por_dado }] da ficha aberta
  function situacoesPara(alvos) {
    if (!alvos || !alvos.length) return [];
    return situacoesLigadas.filter(function (x) {
      if (x.alvos.indexOf('reacao') !== -1) return false; // reação quem rola é o narrador
      if (x.alvos.indexOf('qualquer') !== -1) return alvos.indexOf('dano') === -1;
      return x.alvos.some(function (a) { return alvos.indexOf(a) !== -1; });
    });
  }
  function textoSituacoes(lista, dados) {
    return lista.map(function (x) {
      var v = x.por_dado && dados ? x.valor * dados : x.valor;
      return (v >= 0 ? ' +' : ' −') + Math.abs(v) + ' ' + x.origem;
    }).join('');
  }
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
  function rolarTeste(rotulo, nhBase, alvos) {
    quadroRolagens();
    var mod = modificador.valor || 0;
    var sits = situacoesPara(alvos);
    var somaSit = sits.reduce(function (t, x) { return t + x.valor; }, 0);
    var nh = nhBase + mod + somaSit;
    var r = calc.rolarDados('3d', sorteio);
    var a = calc.avaliarTeste(nh, r.total);
    var resultado = a.critico ? 'Sucesso decisivo!' : a.falha_critica ? 'Falha crítica!' :
      a.sucesso ? 'Sucesso' + (a.margem ? ' por ' + a.margem : ' (no limite)') : 'Falha por ' + (-a.margem);
    registrar({
      rotulo: rotulo,
      conta: r.total + ' (' + r.dados.join('+') + ') contra ' + (mod || sits.length ? nhBase + textoSituacoes(sits) + (mod ? (mod > 0 ? ' +' : ' −') + Math.abs(mod) + (modificador.motivo ? ' ' + modificador.motivo : '') : '') + ' = ' + nh : nh),
      resultado: resultado,
      classe: a.critico ? 'critico' : a.falha_critica ? 'falha-critica' : a.sucesso ? 'sucesso' : 'falha'
    });
    return a;
  }
  function rolarDano(rotulo, expr, alvos) {
    var r = calc.rolarDados(expr, sorteio);
    if (!r) return;
    var sits = situacoesPara(alvos);
    var extra = sits.reduce(function (t, x) { return t + (x.por_dado ? x.valor * r.dados.length : x.valor); }, 0);
    registrar({
      rotulo: rotulo,
      conta: (r.total + extra) + ' (' + r.dados.join('+') + (r.mod ? (r.mod > 0 ? '+' : '') + r.mod : '') + textoSituacoes(sits, r.dados.length) + ')',
      resultado: expr, classe: 'dano'
    });
  }
  // marca um elemento como rolável: tipo "teste" (valor = NH) ou "dano" (valor = "1d+2")
  function rolavel(no, tipo, rotulo, valor, alvos) {
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
    if (alvos && alvos.length) no.setAttribute('data-alvos', alvos.join(' '));
    no.title = tipo === 'teste' ? 'Rolar 3d contra ' + parseInt(valor, 10) : 'Rolar ' + valor;
    return no;
  }
  function aoRolar(ev) {
    var alvo = ev.target.closest && ev.target.closest('[data-rolar]');
    if (!alvo) return;
    if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return;
    ev.preventDefault();
    var v = alvo.getAttribute('data-valor');
    var alvos = (alvo.getAttribute('data-alvos') || '').split(' ').filter(Boolean);
    if (alvo.getAttribute('data-rolar') === 'teste') rolarTeste(alvo.getAttribute('data-rotulo'), parseInt(v, 10), alvos);
    else rolarDano(alvo.getAttribute('data-rotulo'), v, alvos);
    // arma usada (atacar, aparar, bloquear): pode perder condição
    if (alvo.getAttribute('data-uid')) document.dispatchEvent(new CustomEvent('adamar:usou', { detail: { uid: alvo.getAttribute('data-uid') } }));
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
      var chave = { ST: 'st', DX: 'dx', IQ: 'iq', HT: 'ht', Vont: 'vontade', Per: 'per' }[nome];
      var dd = d.querySelector('dd');
      if (alvo && dd) rolavel(dd, 'teste', alvo, dd.textContent, ['atributo:' + chave]);
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('.ficha-bloco:not(.ficha-combate) .table-wrap tbody tr'), function (tr) {
      if (tr.querySelector('[data-rolar]')) return; // a linha já traz o número rolável
      var tds = tr.querySelectorAll('td');
      if (tds.length >= 3 && /^\d+$/.test(tds[2].textContent.trim())) rolavel(tds[2], 'teste', (tds[0].querySelector('strong') || tds[0]).textContent, tds[2].textContent);
    });
  }

  // o que uma arma pode receber de situação: a perícia dela, "ataque" e "ataque à distância"
  function alvosDaArma(a) {
    var ids = ((a.item && a.item.combate && a.item.combate.pericias) || []).filter(function (x) { return x.tipo === 'pericia'; }).map(function (x) { return 'pericia:' + x.id; });
    return ['ataque'].concat(a.distancia ? ['ataque:distancia'] : []).concat(ids);
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
      if (x[0] === 'GdP' || x[0] === 'GeB') rolavel(c, 'dano', 'Dano ' + x[0], x[1], ['dano']);
      else if (x[0] !== 'Carga') rolavel(c, 'teste', x[0], x[1], ['defesa:' + { Esquiva: 'esquiva', Aparar: 'aparar', Bloqueio: 'bloqueio' }[x[0]]]);
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
        var alvosArma = alvosDaArma(a);
        vals.forEach(function (x, k) {
          var td = el('td', null, String(x));
          if (k === 0) rolavel(td, 'dano', a.nome, x, ['dano']);
          if (k === 1) rolavel(td, 'teste', a.nome, x, alvosArma);
          if (k === 2) rolavel(td, 'teste', 'Aparar (' + a.nome + ')', parseInt(x, 10), ['defesa:aparar']);
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
      if (!arquivo.salvar(salvo)) { alertaInline(SEM_ESPACO); return; }
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
    var b = el('div', 'brasao' + (classe ? ' ' + classe : '') + ' era-' + (ERAS[f.era] || 'sem') + (f.retrato ? ' com-retrato' : ''));
    if (f.retrato) b.style.backgroundImage = 'url("' + f.retrato + '")';
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

      var slots = lista.map(function (p) { var bruta = arquivo.obter(p.id); usarSistema(bruta && bruta.sistema); return { id: p.id, ficha: criador.carregar(bruta), atualizado: p.atualizado }; });
      if (solto) slots.push({ id: 'rascunho', ficha: solto, rascunho: true });
      slots.forEach(function (s) {
        usarSistema(s.ficha.sistema);
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
      usarSistema(s.ficha.sistema);
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
          var dados = JSON.parse(leitor.result);
          if (dados && dados.tipo === 'adamar-cofre') {
            // cópia de todos: junta com o que já está aqui (fica a versão mais recente de cada um)
            var conta = arquivo.importar(dados);
            aviso.textContent = !conta ? 'Não deu para restaurar: o navegador está sem espaço.' :
              'Cópia restaurada: ' + conta.novos + ' novo(s), ' + conta.atualizados + ' atualizado(s), ' + conta.mantidos + ' já estava(m) em dia.';
          } else {
            var f = criador.carregar(dados);
            var novoId = arquivo.salvar(f);
            aviso.textContent = novoId ? (f.nome || 'Personagem') + ' entrou no cofre.' : 'Não deu para salvar: o navegador está sem espaço. Baixe uma cópia de todos e apague personagens antigos.';
            if (novoId) selecionado = novoId;
          }
          desenhar();
          mostrarEspaco();
        } catch (e) { aviso.textContent = 'Esse arquivo não é uma ficha nem uma cópia do cofre.'; }
        ev.target.value = '';
      };
      leitor.readAsText(arq);
    });
    // cópia de segurança de todos os personagens
    document.getElementById('p-copia').addEventListener('click', function () {
      var dados = arquivo.exportar();
      var a = el('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(dados)], { type: 'application/json' }));
      a.download = 'cofre-adamar-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
      aviso.textContent = 'Cópia baixada com ' + dados.personagens.length + ' personagem(ns).';
    });
    // quanto o cofre ocupa: perto do limite do navegador, avisa
    function mostrarEspaco() {
      var usado = arquivo.espaco();
      var dica = document.getElementById('p-espaco');
      var kb = Math.round(usado / 1024);
      var cheio = usado > 3500000;
      dica.classList.toggle('tem-erro', cheio);
      dica.textContent = (cheio ? 'O cofre está quase cheio (' + kb + ' KB de uns 5.000). Baixe uma cópia de todos e apague personagens antigos ou retratos grandes. ' :
        'O cofre ocupa ' + kb + ' KB neste navegador. ') +
        'Para não perder nada (trocar de celular, limpar o navegador), baixe uma cópia de todos de vez em quando; para restaurar, traga o arquivo aqui.';
    }
    mostrarEspaco();
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

  // lista de traços (vantagens ou desvantagens), com o nome abrindo os detalhes
  function listaTracos(itens, extras) {
    var b = el('div', 'fx-lista');
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
      d.setAttribute('data-busca', semAcento(nome + ' ' + t.resumo));
      var forte = el('button', 'pericia-nome app-item-nome-btn', nome);
      forte.type = 'button';
      forte.title = 'Ver detalhes de ' + t.nome;
      forte.setAttribute('aria-haspopup', 'dialog');
      forte.addEventListener('click', function () { if (window.ItemUI) window.ItemUI.abrir(t, { link: false }); });
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
      d.setAttribute('data-busca', semAcento(x[0] + ' ' + (x[2] || '')));
      var topo = el('div', 'pericia-topo');
      topo.appendChild(el('strong', 'pericia-nome', x[0]));
      topo.appendChild(el('span', 'criador-custo', x[1]));
      d.appendChild(topo);
      if (x[2]) d.appendChild(el('p', 'pericia-resumo', x[2]));
      b.appendChild(d);
    });
    return b;
  }
  // caixa de busca que filtra os itens [data-busca] de uma seção
  function buscaNaSecao(sec, dica) {
    var i = el('input', 'fx-busca');
    i.type = 'search';
    i.placeholder = dica;
    i.setAttribute('aria-label', dica);
    i.addEventListener('input', function () {
      var q = semAcento(i.value.trim());
      Array.prototype.forEach.call(sec.querySelectorAll('[data-busca]'), function (n) {
        n.hidden = !!q && n.getAttribute('data-busca').indexOf(q) === -1;
      });
    });
    return i;
  }
  function nomeComIcone(item, texto) {
    var s = el('span', 'fx-nome-item');
    var ic = window.iconeSvg && window.iconeSvg(item.icone, 'icone-item');
    if (ic) s.appendChild(ic);
    var b = el('button', 'app-item-nome-btn', texto || item.nome);
    b.type = 'button';
    b.setAttribute('aria-haspopup', 'dialog');
    b.addEventListener('click', function () { if (window.ItemUI) window.ItemUI.abrir(item, { link: false }); });
    s.appendChild(b);
    return s;
  }
  // arma, armadura/escudo ou mochila
  function tipoDeItem(item) {
    if (item.combate && item.combate.modos && item.combate.modos.length) return 'arma';
    if (item.protecao || item.escudo) return 'protecao';
    return 'mochila';
  }

  var SECOES = [
    ['geral', 'Visão geral', 'book'],
    ['combate', 'Combate', 'sword'],
    ['pericias', 'Perícias', 'tools'],
    ['vantagens', 'Vantagens', 'star'],
    ['desvantagens', 'Desvantagens', 'alert-triangle'],
    ['equipamento', 'Equipamento', 'backpack'],
    ['corpo', 'Corpo', 'custom:armadura'],
    ['jogo', 'Em jogo', 'heart'],
    ['historia', 'História e notas', 'custom:pergaminho']
  ];

  function mostrarFicha(idFicha) {
    var artigo = document.querySelector('.page-cofre > article');
    if (artigo) artigo.hidden = true;
    var tela = document.getElementById('modo-ficha');
    tela.hidden = false;
    document.body.classList.add('modo-app', 'modo-ficha');
    var salvo = arquivo.obter(idFicha);
    var box = document.getElementById('f-ficha');
    if (!salvo) {
      document.getElementById('f-nome').textContent = 'Personagem não encontrado';
      document.getElementById('f-conceito').textContent = 'Ele pode ter sido apagado, ou foi salvo em outro navegador.';
      document.querySelector('.fx-mais').hidden = true;
      document.getElementById('fx-menu-btn').hidden = true;
      return;
    }
    usarSistema(salvo.sistema);
    var semUid = (salvo.equipamento || []).some(function (x) { return !x.uid; });
    var SIM = window.criarSimulacao && G.jogo && G.jogo.saude ? window.criarSimulacao(G.jogo) : null;
    var f, r, v, comPericia, vantagens, desvantagens, talentos, qualidades, peculiaridades, itens;
    function recalcular() {
      salvo = arquivo.obter(idFicha) || salvo;
      f = criador.carregar(salvo);
      r = criador.resumir(f);
      v = r.valores;
      comPericia = r.pericias.filter(function (x) { return x.pericia; });
      vantagens = r.tracos.filter(function (x) { return x.traco && x.custo >= 0; });
      desvantagens = r.tracos.filter(function (x) { return x.traco && x.custo < 0; });
      talentos = r.talentos.filter(function (x) { return x.talento; }).map(function (x) {
        return ['Talento ' + x.talento.nome + ' ' + x.sel.nivel, sinal(x.custo) + ' pts', '+' + x.sel.nivel + ' em ' + x.talento.pericias.map(function (p) { var q = porId(G.pericias, p); return q ? q.nome : p; }).join(', ') + '.'];
      });
      qualidades = f.qualidades.filter(Boolean).map(function (q) { return [q, '+1 pt', 'Qualidade']; });
      peculiaridades = f.peculiaridades.filter(Boolean).map(function (q) { return [q, '-1 pt', 'Peculiaridade']; });
      itens = r.equipamento.filter(function (x) { return x.item; });
      var ligadas = (f.em_jogo && f.em_jogo.situacoes) || [];
      situacoesLigadas = r.situacoes.filter(function (x) { return ligadas.indexOf(x.chave) !== -1; });
      // fome, sede, frio, dor, ferimentos…: valem sozinhas enquanto durarem
      if (SIM && f.em_jogo && f.em_jogo.sim) {
        SIM.condicoes(f.em_jogo.sim).forEach(function (c) {
          situacoesLigadas.push({ chave: 'sim:' + c.origem, origem: c.origem + ' (' + c.nome + ')', condicao: c.nome, valor: c.valor, alvos: c.alvos, auto: true });
        });
      }
    }
    recalcular();
    if (semUid) arquivo.salvar(salvo); // fichas antigas: os itens ganham uid (para contar usos e recipientes)
    // grava uma mudança na ficha salva e refaz a seção aberta
    function mudarFicha(mexer) {
      var sv = arquivo.obter(idFicha);
      if (!sv) return;
      mexer(sv);
      if (!arquivo.salvar(sv)) { alertaInline(SEM_ESPACO); return; }
      recalcular();
      desenharPontos();
      desenharLigadas();
      if (atual) { var topo = box.scrollTop; montar(atual); box.scrollTop = topo; }
    }
    document.title = (f.nome || 'Personagem') + ' — Ruínas de Adamar';
    document.getElementById('f-nome').textContent = f.nome || 'Sem nome';
    document.getElementById('f-kicker').textContent = [G.nome_sistema || 'GURPS', f.era, f.origem, f.idade ? f.idade + ' anos' : '', f.altura, f.peso_corporal].filter(Boolean).join(' · ') || 'Personagem';
    var conceito = document.getElementById('f-conceito');
    conceito.textContent = f.conceito || '';
    document.getElementById('f-editar').href = 'criador.html?editar=' + encodeURIComponent(idFicha);
    var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.whatsapp) || { numero: '' };
    document.getElementById('f-whats').addEventListener('click', function (ev) {
      if (!r.valida) { ev.preventDefault(); alertaInline('Resolva as pendências no criador antes de enviar.'); }
    });
    document.getElementById('f-whats').href = window.buildWhatsAppUrl
      ? window.buildWhatsAppUrl(cfg.numero, 'Olá! Montei meu personagem de Adamar:\n\n' + criador.textoFicha(f, r)) : '#';
    if (!r.valida) document.getElementById('f-whats').classList.add('is-disabled');
    document.getElementById('f-baixar').addEventListener('click', function () { baixar(f); });
    document.getElementById('f-imprimir').addEventListener('click', function () {
      document.querySelector('.fx-mais').open = false;
      window.print();
    });

    // pontos no topo: se refazem quando o painel "Em jogo" muda os pontos ganhos
    var topoPontos = document.getElementById('fx-pontos');
    function desenharPontos() {
      var fx = criador.carregar(arquivo.obter(idFicha) || salvo), rx = criador.resumir(fx);
      topoPontos.textContent = '';
      topoPontos.appendChild(el('strong', null, String(fx.orcamento + (rx.pontos_ganhos || 0)) + ' pts'));
      topoPontos.appendChild(el('span', rx.restante < 0 ? 'calc-estourou' : null, rx.restante >= 0 ? (rx.restante ? rx.restante + ' guardados' : 'todos usados') : 'saldo ' + rx.restante));
      topoPontos.appendChild(el('span', 'personagem-selo ' + (rx.valida ? 'pronta' : 'rascunho'), rx.valida ? 'Pronta' : 'Rascunho'));
      topoPontos.title = (rx.pontos_ganhos ? fx.orcamento + ' iniciais + ' + rx.pontos_ganhos + ' ganhos em jogo' : fx.orcamento + ' iniciais') +
        ' · gastou ' + rx.pontos_gastos + ' · desvantagens devolveram ' + rx.pontos_devolvidos + (fx.jogador ? ' · jogador: ' + fx.jogador : '');
    }
    desenharPontos();

    // retrato no topo
    if (f.retrato) {
      var foto = el('div', 'fx-retrato');
      foto.style.backgroundImage = 'url("' + f.retrato + '")';
      foto.setAttribute('role', 'img');
      foto.setAttribute('aria-label', 'Retrato de ' + (f.nome || 'personagem'));
      var quem = document.querySelector('.fx-quem');
      quem.parentNode.insertBefore(foto, quem);
    }
    // faixa das situações ligadas: aparece em qualquer seção, com o × para desligar
    var faixa = el('div', 'fx-ligadas');
    faixa.setAttribute('aria-live', 'polite');
    box.insertBefore(faixa, conceito.nextSibling);
    function desenharLigadas() {
      faixa.textContent = '';
      faixa.hidden = !situacoesLigadas.length;
      if (!situacoesLigadas.length) return;
      faixa.appendChild(el('span', 'fx-ligadas-rotulo', 'Valendo agora:'));
      situacoesLigadas.forEach(function (x) {
        var c = el('span', 'fx-ligada');
        c.appendChild(document.createTextNode((x.valor > 0 ? '+' : '−') + Math.abs(x.valor) + ' ' + x.origem));
        if (x.auto) c.classList.add('auto');
        else {
          var tira = el('button', null, '×');
          tira.type = 'button';
          tira.setAttribute('aria-label', 'Desligar ' + x.origem);
          tira.addEventListener('click', function () { ligarSituacao(x.chave, false); });
          c.appendChild(tira);
        }
        faixa.appendChild(c);
      });
    }
    function ligarSituacao(chave, ligada) {
      mudarFicha(function (sv) {
        sv.em_jogo = sv.em_jogo || {};
        var lista = (sv.em_jogo.situacoes || []).filter(function (k) { return k !== chave; });
        if (ligada) lista.push(chave);
        sv.em_jogo.situacoes = lista;
      });
    }
    desenharLigadas();

    // ---------- conteúdo de cada seção ----------
    function blocoAtributos() {
      var g = el('div', 'ficha-grade');
      var atr = bloco('Atributos');
      atr.appendChild(linhas(R.atributos.map(function (a) {
        return [a.sigla, String(v[a.id]), sinal(calc.custoAtributo(a.id, f.atributos[a.id]))];
      })));
      g.appendChild(atr);
      var sec = bloco('Secundárias');
      sec.appendChild(linhas(R.secundarias.map(function (s) {
        var aj = f.ajustes[s.id] || 0;
        return [s.sigla, num(v[s.id]), aj ? sinal(calc.custoSecundaria(s.id, aj)) : ''];
      }).concat([['Base de Carga', num(r.base_carga) + ' kg']])));
      g.appendChild(sec);
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
      g.appendChild(soc);
      return g;
    }
    function blocoPendencias() {
      if (!r.erros.length) return null;
      var pe = bloco('Pendências: ficha incompleta', 'ficha-largo');
      var ule = el('ul', 'calc-avisos');
      r.erros.forEach(function (a) { ule.appendChild(el('li', null, a.texto)); });
      pe.appendChild(ule);
      var ed = el('a', 'btn btn-ghost', 'Resolver no criador');
      ed.href = 'criador.html?editar=' + encodeURIComponent(idFicha);
      pe.appendChild(ed);
      return pe;
    }
    function tabelaPericias(lista) {
      return tabela(['Perícia', 'Tipo', 'NH', 'Nível', 'Pontos'], lista.map(function (x) {
        var nome = nomeComIcone(x.pericia, x.pericia.nome + (x.sel.especializacao ? ' (' + x.sel.especializacao + ')' : ''));
        if (x.bonus.length || x.situacional.length) {
          var ul = el('ul', 'efeitos');
          Efeitos.desenharEfeitos(ul, x.bonus.map(function (b) { return { tipo: 'aplicado', texto: sinal(b.valor) + ' de ' + b.origem }; })
            .concat(x.situacional.map(function (b) { return { tipo: 'condicional', texto: sinal(b.valor) + ' de ' + b.origem + ' — ' + b.condicao }; })));
          nome.appendChild(ul);
        }
        var nh = el('strong', 'fx-nh', x.nh == null ? '—' : String(x.nh));
        rolavel(nh, 'teste', x.pericia.nome + (x.sel.especializacao ? ' (' + x.sel.especializacao + ')' : ''), x.nh, ['pericia:' + x.pericia.id]);
        return [nome, x.atributo + '/' + x.pericia.dificuldade, nh, x.nivel_relativo || '—', String(x.sel.pontos || 0)];
      }));
    }

    function blocoSituacoes(filtro) {
      var lista = r.situacoes.filter(filtro || function () { return true; });
      if (!lista.length) return null;
      var b = bloco('Situações', 'ficha-largo fx-situacoes fx-so-tela');
      b.appendChild(el('p', 'combate-nota', 'Bônus e penalidades que só valem em certos momentos. Ligue quando a situação acontecer: as rolagens passam a somar, e o quadro de rolagens mostra de onde veio. Desligue depois.'));
      var ligadas = (f.em_jogo && f.em_jogo.situacoes) || [];
      var ul = el('ul', 'fx-sit-lista');
      lista.forEach(function (x) {
        var li = el('li');
        var lab = el('label', 'fx-sit');
        var cx = el('input');
        cx.type = 'checkbox';
        cx.checked = ligadas.indexOf(x.chave) !== -1;
        cx.addEventListener('change', function () { ligarSituacao(x.chave, cx.checked); });
        lab.appendChild(cx);
        var txt = el('span');
        txt.appendChild(el('strong', null, (x.valor > 0 ? '+' : '−') + Math.abs(x.valor) + (x.por_dado ? ' por dado' : '') + ' · ' + x.origem));
        txt.appendChild(el('span', 'fx-sit-cond', x.condicao + (x.alvos.indexOf('reacao') !== -1 ? ' (é reação: quem aplica é o narrador)' : '')));
        lab.appendChild(txt);
        li.appendChild(lab);
        ul.appendChild(li);
      });
      b.appendChild(ul);
      return b;
    }
    function blocoPontos() {
      var c = r.custos;
      var b = bloco('Pontos por parte', 'fx-pontos-partes');
      b.appendChild(linhas([
        ['Atributos', sinal(c.atributos)], ['Secundárias', sinal(c.secundarias)], ['Social e idiomas', sinal(c.social)],
        ['Vantagens e talentos', sinal(c.vantagens)], ['Qualidades', sinal(c.qualidades)],
        ['Desvantagens', sinal(c.desvantagens)], ['Peculiaridades', sinal(c.peculiaridades)], ['Perícias', sinal(c.pericias)],
        ['Total gasto', String(r.total)], ['Saldo', String(r.restante)]
      ]));
      return b;
    }
    // carga: os cinco níveis com limite, deslocamento e esquiva; e o que dá para levantar ou empurrar
    function blocoCarga() {
      var cb = r.combate, bc = r.base_carga;
      var b = bloco('Carga e força', 'ficha-largo');
      var linhasCarga = R.carga.niveis.map(function (n) {
        var esq = Math.max(1, r.esquiva + n.esquiva + cb.db);
        return [n.nome, 'até ' + num(Math.round(bc * n.peso_max_bc * 10) / 10) + ' kg', String(calc.deslocamentoComCarga(v.deslocamento, n.nivel)), String(esq)];
      });
      var t = tabela(['Carga', 'Peso', 'Deslocamento', 'Esquiva'], linhasCarga);
      var trs = t.querySelectorAll('tbody tr');
      if (trs[cb.carga.nivel]) trs[cb.carga.nivel].classList.add('fx-atual');
      b.appendChild(el('p', 'combate-nota', 'Carregando ' + num(cb.peso_total) + ' kg agora (o que está em casa não conta). Base de Carga ' + num(bc) + ' kg.'));
      b.appendChild(t);
      var forca = el('ul', 'fx-forca');
      [['Levantar com uma mão', 2], ['Levantar com as duas mãos', 8], ['Empurrar ou derrubar', 12], ['Carregar nas costas', 15], ['Arrastar um pouco', 50]].forEach(function (x) {
        var li = el('li');
        li.appendChild(el('span', null, x[0]));
        li.appendChild(el('strong', null, num(Math.round(bc * x[1] * 10) / 10) + ' kg'));
        forca.appendChild(li);
      });
      b.appendChild(forca);
      b.appendChild(el('p', 'combate-nota', 'Empurrar com impulso de corrida dobra o valor. Esforço demorado cansa (PF), a critério do narrador.'));
      return b;
    }
    // locais de acerto: quanto custa mirar e a proteção de cada lugar
    var LOCAIS = [
      ['Olhos', -9, []], ['Crânio', -7, ['crânio']], ['Rosto', -5, ['rosto']], ['Pescoço', -5, ['pescoço']],
      ['Tronco', 0, ['tronco', 'corpo']], ['Órgãos vitais', -3, ['tronco', 'corpo']], ['Virilha', -3, ['virilha', 'corpo']],
      ['Braços', -2, ['braços', 'membros']], ['Mãos', -4, ['mãos']], ['Pernas', -2, ['pernas', 'membros']], ['Pés', -4, ['pés']]
    ];
    function blocoLocais() {
      var pr = r.combate.protecao;
      var b = bloco('Locais de acerto', 'ficha-largo');
      b.appendChild(el('p', 'combate-nota', 'Sem escolher, o golpe vai no tronco. Mirar num lugar tira o valor da coluna do NH do ataque; a proteção é a soma das peças equipadas que cobrem aquele lugar.'));
      b.appendChild(tabela(['Local', 'Para acertar', 'Proteção (RD)'], LOCAIS.map(function (l) {
        var rd = l[2].reduce(function (t, k) { return t + ((pr[k] && pr[k].rd) || 0); }, 0);
        return [l[0], l[1] ? String(l[1]).replace('-', '−') : '0', rd ? String(rd) : '—'];
      })));
      return b;
    }
    // equipamento: onde está (equipado, levado, dentro de algo ou em casa) e quanto sobrou
    var RECIPIENTE = /mochila|bolsa|algibeira|aljava|saco|bainha|bornal|cesto|caixa|baú|alforje/i;
    function seletorLocal(x) {
      var uid = x.sel.uid;
      function descende(y) { // y está dentro de x (em qualquer nível)?
        var visto = {};
        while (y && y.sel.dentro && !visto[y.sel.dentro]) {
          if (y.sel.dentro === uid) return true;
          visto[y.sel.dentro] = true;
          var pai = y.sel.dentro;
          y = itens.filter(function (z) { return z.sel.uid === pai; })[0];
        }
        return false;
      }
      var recipientes = itens.filter(function (y) { return y !== x && RECIPIENTE.test(y.item.nome) && !descende(y); });
      var s0 = el('select', 'fx-local');
      s0.setAttribute('aria-label', 'Onde está ' + x.item.nome);
      criador.lugaresPossiveis(x.item.id).map(function (l) { return ['lugar:' + l, criador.LUGARES[l].nome]; })
        .concat([['levado', 'Levado']]).concat(recipientes.map(function (y) { return ['dentro:' + y.sel.uid, 'Dentro: ' + y.item.nome]; }))
        .concat([['guardado', 'Em casa']]).forEach(function (o) {
          var op = el('option', null, o[1]);
          op.value = o[0];
          s0.appendChild(op);
        });
      s0.value = x.sel.dentro ? 'dentro:' + x.sel.dentro : x.sel.local === 'equipado' ? 'lugar:' + x.sel.lugar : (x.sel.local || 'levado');
      s0.addEventListener('change', function () {
        var val = s0.value;
        if (val.indexOf('lugar:') === 0) { porNoCorpo(uid, val.slice(6)); return; }
        mudarFicha(function (sv) {
          var alvo = (sv.equipamento || []).filter(function (z) { return z.uid === uid; })[0];
          if (!alvo) return;
          if (val.indexOf('dentro:') === 0) { alvo.dentro = val.slice(7); alvo.local = 'levado'; }
          else { delete alvo.dentro; delete alvo.lugar; alvo.local = val; }
        });
      });
      return s0;
    }
    var avisoEquip = '';
    function blocoBoneco() {
      if (!window.Boneco) return null;
      var b = bloco('Corpo', 'ficha-largo fx-boneco');
      if (avisoEquip) { b.appendChild(el('p', 'combate-nota tem-aviso', avisoEquip)); avisoEquip = ''; }
      b.appendChild(window.Boneco.desenhar({
        resumo: r,
        lugaresPossiveis: criador.lugaresPossiveis,
        aoPor: function (uid, lugar) { porNoCorpo(uid, lugar); },
        aoTirar: function (uid) {
          mudarFicha(function (sv) {
            var alvo = (sv.equipamento || []).filter(function (z) { return z.uid === uid; })[0];
            if (alvo) { alvo.local = 'levado'; delete alvo.lugar; }
          });
        }
      }));
      return b;
    }
    function porNoCorpo(uid, lugar) {
      var saiu = [];
      mudarFicha(function (sv) { saiu = criador.equipar(sv, uid, lugar); avisoEquip = criador.avisoDeTroca(saiu, lugar); });
    }
    function contadorUsos(x) {
      var total = x.sel.quantidade || 1;
      var box0 = el('span', 'fx-usos');
      if (total <= 1) { box0.textContent = '1'; return box0; }
      function mexer(delta) {
        mudarFicha(function (sv) {
          sv.em_jogo = sv.em_jogo || {};
          var u = Object.assign({}, sv.em_jogo.usados || {});
          u[x.sel.uid] = Math.max(0, Math.min(total, (u[x.sel.uid] || 0) + delta));
          sv.em_jogo.usados = u;
        });
      }
      var menos = el('button', 'btn-link', '−');
      menos.type = 'button';
      menos.setAttribute('aria-label', 'Gastar um: ' + x.item.nome);
      menos.disabled = x.atual <= 0;
      menos.addEventListener('click', function () { mexer(1); });
      var mais = el('button', 'btn-link', '+');
      mais.type = 'button';
      mais.setAttribute('aria-label', 'Repor um: ' + x.item.nome);
      mais.disabled = x.atual >= total;
      mais.addEventListener('click', function () { mexer(-1); });
      box0.appendChild(menos);
      box0.appendChild(el('strong', x.atual === 0 ? 'calc-estourou' : null, x.atual + '/' + total));
      box0.appendChild(mais);
      return box0;
    }
    // ---------- simulação: tempo, corpo, saúde, inventário, desgaste e receitas ----------
    var parteEscolhida = null;
    var avisoSim = '';
    function estadoSim() { return (f.em_jogo && f.em_jogo.sim) || SIM.estadoInicial(); }
    function vestidos() {
      return r.equipamento.filter(function (x) { return x.item && x.local === 'equipado' && !x.sel.dentro && x.sel.lugar === 'corpo'; }).map(function (x) { return x.item; });
    }
    function tem() {
      var t = {};
      itens.forEach(function (x) { if (x.local !== 'guardado') t[x.item.id] = (t[x.item.id] || 0) + x.atual; });
      return t;
    }
    function nhDe(idPericia) {
      var x = comPericia.filter(function (y) { return y.pericia.id === idPericia && y.nh != null; })[0];
      if (x) return x.nh;
      var p = porId(G.pericias, idPericia);
      var st = p && r.combate.sem_treino(p);
      return st != null ? st : 6;
    }
    function nomeItem(id) { var it = criador.item(id); return it ? it.nome : id; }
    function gastarNoSv(sv, id, n) {
      sv.em_jogo = sv.em_jogo || {};
      var usados = Object.assign({}, sv.em_jogo.usados || {});
      var falta = n;
      (sv.equipamento || []).forEach(function (sel) {
        if (falta <= 0 || sel.id !== id || sel.local === 'guardado') return;
        var disp = (sel.quantidade || 1) - (usados[sel.uid] || 0);
        var tira = Math.min(disp, falta);
        if (tira <= 0) return;
        if (sel.criado) sel.quantidade -= tira; else usados[sel.uid] = (usados[sel.uid] || 0) + tira;
        falta -= tira;
      });
      sv.equipamento = sv.equipamento.filter(function (sel) { return !(sel.criado && sel.quantidade <= 0); });
      sv.em_jogo.usados = usados;
    }
    function darNoSv(sv, id, n) {
      var ex = (sv.equipamento || []).filter(function (sel) { return sel.criado && sel.id === id && sel.local !== 'guardado'; })[0];
      if (ex) ex.quantidade += n;
      else sv.equipamento.push({ id: id, quantidade: n, uid: 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), local: 'levado', qualidade: 0, criado: true });
    }
    // passa o tempo: necessidades, clima e ferimentos andam; o dano (fome extrema, frio, infecção) sai dos PV
    function passarTempo(sv, minutos, atividade) {
      sv.em_jogo = sv.em_jogo || {};
      var e0 = sv.em_jogo.sim || SIM.estadoInicial();
      var res = SIM.avancar(e0, minutos, { atividade: atividade, isolamento: SIM.isolamento(vestidos()), rng: sorteio });
      var acumulado = (e0.dano_acumulado || 0) + res.dano_pv;
      var inteiro = Math.floor(acumulado);
      if (inteiro > 0) sv.em_jogo.pv = (typeof sv.em_jogo.pv === 'number' ? sv.em_jogo.pv : v.pv) - inteiro;
      res.estado.dano_acumulado = acumulado - inteiro;
      sv.em_jogo.sim = res.estado;
      var textos = res.eventos.map(function (x) { return x.texto; });
      if (inteiro > 0) textos.push('Perdeu ' + inteiro + ' PV.');
      return textos;
    }
    function agir(minutos, atividade) {
      mudarFicha(function (sv) { avisoSim = passarTempo(sv, minutos, atividade).join(' '); });
    }
    function mudarSim(mexer) {
      mudarFicha(function (sv) { sv.em_jogo = sv.em_jogo || {}; sv.em_jogo.sim = mexer(sv.em_jogo.sim || SIM.estadoInicial(), sv); });
    }
    function barra(rotulo, valor, max, texto, ruim) {
      var d = el('div', 'jg-barra-sim' + (ruim ? ' ruim' : ''));
      d.appendChild(el('span', 'jg-barra-rotulo', rotulo));
      var b = el('span', 'jg-barra-trilho');
      var cheio = el('span', 'jg-barra-cheio');
      cheio.style.width = Math.max(0, Math.min(100, valor / max * 100)) + '%';
      b.appendChild(cheio);
      d.appendChild(b);
      d.appendChild(el('span', 'jg-barra-valor', texto));
      return d;
    }
    // painel da esquerda: relógio, clima, necessidades, condições e o botão de passar o tempo
    function blocoSim() {
      var e = estadoSim();
      var rel = SIM.relogio(e);
      var b = el('div', 'jg-painel jg-sim');
      b.appendChild(el('h3', null, 'Tempo e corpo'));
      b.appendChild(el('p', 'jg-relogio', rel.texto + (rel.noite ? ' · noite' : '')));
      var cl = e.clima;
      b.appendChild(el('p', 'jg-clima', cl ? String(cl.temperatura).replace('.', ',') + ' °C · ' + (cl.chovendo ? 'chovendo' : 'sem chuva') + ' · vento ' + (cl.vento > 0.66 ? 'forte' : cl.vento > 0.33 ? 'moderado' : 'fraco') + (e.molhado > 0.3 ? ' · molhado' : '') : 'Passe o tempo para ver o clima.'));
      var lugar = el('div', 'jg-lugar');
      var selB = el('select');
      selB.setAttribute('aria-label', 'Onde (bioma)');
      SIM.BIOMAS.forEach(function (bi) { var o = el('option', null, bi.nome); o.value = bi.id; selB.appendChild(o); });
      selB.value = e.bioma;
      selB.addEventListener('change', function () { mudarSim(function (x) { x.bioma = selB.value; x.clima = null; return x; }); });
      var selA = el('select');
      selA.setAttribute('aria-label', 'Abrigo');
      Object.keys(SIM.ABRIGOS).forEach(function (k) { var o = el('option', null, SIM.ABRIGOS[k].nome); o.value = k; selA.appendChild(o); });
      selA.value = e.abrigo;
      selA.addEventListener('change', function () { mudarSim(function (x) { x.abrigo = selA.value; return x; }); });
      lugar.appendChild(selB);
      lugar.appendChild(selA);
      b.appendChild(lugar);
      b.appendChild(barra('Fome', e.fome, 100, Math.round(e.fome) + '', e.fome >= 70));
      b.appendChild(barra('Sede', e.sede, 100, Math.round(e.sede) + '', e.sede >= 70));
      b.appendChild(barra('Cansaço', e.cansaco, 100, Math.round(e.cansaco) + '', e.cansaco >= 75));
      b.appendChild(barra('Corpo', e.temp_corpo - 30, 12, String(e.temp_corpo).replace('.', ',') + ' °C', e.temp_corpo < 35 || e.temp_corpo > 39.5));
      b.appendChild(barra('Sangue', e.sangue, 100, Math.round(e.sangue) + '%', e.sangue < 60));
      var conds = SIM.condicoes(e);
      if (conds.length) {
        var ul = el('ul', 'jg-condicoes');
        conds.forEach(function (c) { ul.appendChild(el('li', null, c.origem + ': ' + c.nome + ' (' + (c.valor > 0 ? '+' : '−') + Math.abs(c.valor) + ')')); });
        b.appendChild(ul);
      }
      if (avisoSim) { b.appendChild(el('p', 'jg-aviso', avisoSim)); avisoSim = ''; }
      var passa = el('div', 'jg-passa');
      var atv = el('select');
      atv.setAttribute('aria-label', 'Atividade');
      Object.keys(SIM.ATIVIDADES).forEach(function (k) { if (k === 'dormindo') return; var o = el('option', null, SIM.ATIVIDADES[k].nome); o.value = k; atv.appendChild(o); });
      atv.value = 'caminhando';
      passa.appendChild(atv);
      [['+10 min', 10], ['+1 h', 60], ['+4 h', 240]].forEach(function (x) {
        var bt = el('button', 'jg-acao', x[0]);
        bt.type = 'button';
        bt.addEventListener('click', function () { agir(x[1], atv.value); });
        passa.appendChild(bt);
      });
      var dormir = el('button', 'jg-acao', 'Dormir 8 h');
      dormir.type = 'button';
      dormir.addEventListener('click', function () { agir(480, 'dormindo'); });
      passa.appendChild(dormir);
      b.appendChild(passa);
      return b;
    }
    // painel de saúde: ferimentos por parte (clicar numa parte do boneco filtra), tratar, e ferir (para o narrador)
    function blocoSaude() {
      var e = estadoSim();
      var b = el('div', 'jg-painel jg-saude');
      var partes = {};
      SIM.PARTES.forEach(function (p) { partes[p.id] = p.nome; });
      b.appendChild(el('h3', null, 'Saúde' + (parteEscolhida ? ' · ' + partes[parteEscolhida] : '')));
      var lista = e.ferimentos.filter(function (x) { return !parteEscolhida || x.parte === parteEscolhida; });
      if (!lista.length) b.appendChild(el('p', 'pericia-vazio', parteEscolhida ? 'Sem ferimentos aqui.' : 'Sem ferimentos. Clique numa parte do corpo para ver ou ferir.'));
      var disp = tem();
      lista.forEach(function (x) {
        var d = el('div', 'jg-ferimento grav-' + x.gravidade);
        var tipo = SIM.TIPOS[x.tipo];
        d.appendChild(el('strong', null, partes[x.parte] + ': ' + tipo.nome.toLowerCase() + ', ferimento ' + SIM.GRAVIDADES[x.gravidade - 1].nome));
        var info = [];
        if (x.sangrando) info.push('sangrando');
        if (x.infeccao >= 1) info.push('infecção ' + Math.round(x.infeccao) + '%');
        if (x.limpo) info.push('limpo');
        if (x.tratamento) info.push(({ bandagem: 'enfaixado', sutura: 'suturado', tala: 'com tala' })[x.tratamento]);
        info.push('cura ' + Math.round(x.cura / SIM.GRAVIDADES[x.gravidade - 1].cura_horas * 100) + '%');
        d.appendChild(el('span', null, info.join(' · ')));
        var acoes = el('div', 'jg-arma-acoes');
        SIM.tratamentosPossiveis(x).forEach(function (t) {
          var itemTem = t.itens.filter(function (id) { return disp[id] > 0; })[0];
          var bt = el('button', 'jg-acao', t.nome + (itemTem ? '' : ' (falta ' + nomeItem(t.itens[0]).toLowerCase() + ')'));
          bt.type = 'button';
          bt.title = t.efeito;
          bt.disabled = !itemTem;
          bt.addEventListener('click', function () {
            var sucesso = true;
            if (t.pericia) sucesso = rolarTeste(t.nome + ' (' + (porId(G.pericias, t.pericia) || {}).nome + ')', nhDe(t.pericia) + (t.modificador || 0), ['pericia:' + t.pericia]).sucesso;
            mudarFicha(function (sv) {
              gastarNoSv(sv, itemTem, 1);
              sv.em_jogo.sim = SIM.tratar(sv.em_jogo.sim || SIM.estadoInicial(), x.id, t.id, sucesso);
              var ev = passarTempo(sv, 10, 'repouso');
              avisoSim = (sucesso ? t.nome + ': feito.' : t.nome + ': não deu certo (o material foi gasto).') + (ev.length ? ' ' + ev.join(' ') : '');
            });
          });
          acoes.appendChild(bt);
        });
        d.appendChild(acoes);
        b.appendChild(d);
      });
      // ferir: o narrador aplica o ferimento que o golpe, a queda ou a mordida causou
      var ferir = el('div', 'jg-ferir');
      var selP = el('select');
      selP.setAttribute('aria-label', 'Parte do corpo');
      SIM.PARTES.forEach(function (p) { var o = el('option', null, p.nome); o.value = p.id; selP.appendChild(o); });
      selP.value = parteEscolhida || 'tronco';
      var selT = el('select');
      selT.setAttribute('aria-label', 'Tipo de ferimento');
      Object.keys(SIM.TIPOS).forEach(function (k) { var o = el('option', null, SIM.TIPOS[k].nome); o.value = k; selT.appendChild(o); });
      var selG = el('select');
      selG.setAttribute('aria-label', 'Gravidade');
      SIM.GRAVIDADES.forEach(function (g) { var o = el('option', null, g.nome); o.value = g.nivel; selG.appendChild(o); });
      var bt = el('button', 'jg-acao', 'Ferir');
      bt.type = 'button';
      bt.addEventListener('click', function () {
        mudarSim(function (x) { return SIM.ferir(x, selP.value, selT.value, parseInt(selG.value, 10)); });
      });
      [selP, selT, selG, bt].forEach(function (n) { ferir.appendChild(n); });
      b.appendChild(ferir);
      if (parteEscolhida) {
        var todas = el('button', 'btn-link', 'ver todas as partes');
        todas.type = 'button';
        todas.addEventListener('click', function () { parteEscolhida = null; montar('jogando'); });
        b.appendChild(todas);
      }
      return b;
    }
    // inventário em grade: bolsos e cada recipiente carregado; o que não cabe aparece à parte
    var RECIPIENTES = (G.adamar && G.adamar.inventario && G.adamar.inventario.recipientes) || {};
    function slug(t) { return semAcento(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    function gradeDe(x) {
      var g = x.item.grade;
      if (!g) return { largura: 1, altura: 1 };
      if (g.porte === 'grade') return g;
      if (g.porte === 'vestido') return g.guardado || { largura: 2, altura: 2 };
      return null; // longo ou de montaria: não entra em mochila
    }
    function condicaoDe(uid) { return ((f.em_jogo || {}).condicao || {})[uid] || { atual: 100, maximo: 100 }; }
    function blocoInventario() {
      var cb = r.combate;
      var inv = el('div', 'jg-inventario');
      var cab = el('div', 'jg-inv-cab');
      cab.appendChild(el('h3', null, 'Inventário · ' + num(cb.peso_total) + ' kg · carga ' + cb.carga.nome));
      var btR = el('button', 'jg-acao', 'Fazer (receitas)');
      btR.type = 'button';
      btR.addEventListener('click', abrirReceitas);
      cab.appendChild(btR);
      inv.appendChild(cab);
      var comigo = itens.filter(function (x) { return x.local !== 'guardado'; });
      var recipientes = comigo.filter(function (x) { var rc = RECIPIENTES[slug(x.item.nome)]; return rc && rc.largura; });
      var grades = recipientes.map(function (c) {
        var rc = RECIPIENTES[slug(c.item.nome)];
        return { titulo: c.item.nome, largura: rc.largura, altura: rc.altura, dentro: comigo.filter(function (x) { return x.sel.dentro === c.sel.uid; }) };
      }).sort(function (a, b) { return b.largura * b.altura - a.largura * a.altura; });
      grades.push({ titulo: 'Bolsos', largura: 2, altura: 2, dentro: [] });
      // soltos: levados sem recipiente escolhido (e que não são eles mesmos recipientes carregados)
      var soltos = comigo.filter(function (x) { return x.local === 'levado' && !x.sel.dentro && recipientes.indexOf(x) === -1; });
      var longos = soltos.filter(function (x) { return !gradeDe(x); });
      soltos = soltos.filter(function (x) { return gradeDe(x); });
      function peca(x) { var g = gradeDe(x); return { uid: x.sel.uid, largura: g.largura, altura: g.altura, quantidade: x.atual || 1, empilha: g.empilha }; }
      grades.forEach(function (gr) {
        var fixos = gr.dentro.filter(function (x) { return gradeDe(x); });
        gr.longos = gr.dentro.filter(function (x) { return !gradeDe(x); });
        // primeiro o que foi posto ali; depois tenta encaixar os soltos no espaço que sobrou
        var tentativa = SIM.encaixar(gr.largura, gr.altura, fixos.concat(soltos).map(peca));
        var ficaram = soltos.filter(function (x) { return tentativa.posicoes[x.sel.uid] && tentativa.sobra.indexOf(x.sel.uid) === -1; });
        soltos = soltos.filter(function (x) { return ficaram.indexOf(x) === -1; });
        gr.itens = fixos.concat(ficaram);
        gr.enc = SIM.encaixar(gr.largura, gr.altura, gr.itens.map(peca));
      });
      var linha = el('div', 'jg-grades');
      grades.forEach(function (gr) {
        var caixa = el('div', 'jg-grade-caixa');
        caixa.appendChild(el('span', 'jg-grade-titulo', gr.titulo + ' (' + gr.largura + '×' + gr.altura + ')'));
        var grade = el('div', 'jg-grade');
        grade.style.gridTemplateColumns = 'repeat(' + gr.largura + ', 2.6rem)';
        grade.style.gridTemplateRows = 'repeat(' + gr.altura + ', 2.6rem)';
        gr.itens.forEach(function (x) {
          (gr.enc.posicoes[x.sel.uid] || []).forEach(function (pos, k) { grade.appendChild(bloquinho(x, pos, k)); });
        });
        caixa.appendChild(grade);
        var fora = gr.enc.sobra.map(function (uid) { return gr.itens.filter(function (x) { return x.sel.uid === uid; })[0]; }).concat(gr.longos);
        if (fora.length) caixa.appendChild(el('p', 'jg-nao-cabe', 'Não cabe aqui: ' + fora.map(function (x) { return x.item.nome; }).join(', ')));
        linha.appendChild(caixa);
      });
      // o que não coube em lugar nenhum vai nos braços (atrapalha: mãos ocupadas)
      var nosBracos = soltos.concat(longos);
      if (nosBracos.length) {
        var fora2 = el('div', 'jg-grade-caixa');
        fora2.appendChild(el('span', 'jg-grade-titulo', 'Sem lugar (nos braços)'));
        var ul = el('div', 'jg-nos-bracos');
        nosBracos.forEach(function (x) {
          var b = el('button', 'jg-peca jg-solto');
          b.type = 'button';
          b.title = x.item.nome;
          var ic = window.iconeSvg && window.iconeSvg(x.item.icone, 'jg-slot-icone');
          if (ic) b.appendChild(ic);
          b.addEventListener('click', function () { abrirItemDoInventario(x); });
          ul.appendChild(b);
        });
        fora2.appendChild(ul);
        fora2.appendChild(el('p', 'jg-nao-cabe', nosBracos.map(function (x) { return x.item.nome; }).join(', ')));
        linha.appendChild(fora2);
      }
      inv.appendChild(linha);
      return inv;
    }
    function bloquinho(x, pos, k) {
      var b = el('button', 'jg-peca');
      b.type = 'button';
      b.style.gridColumn = (pos.x + 1) + ' / span ' + pos.largura;
      b.style.gridRow = (pos.y + 1) + ' / span ' + pos.altura;
      b.title = x.item.nome;
      var ic = window.iconeSvg && window.iconeSvg(x.item.icone, 'jg-slot-icone');
      if (ic) b.appendChild(ic);
      if (k === 0 && (x.sel.quantidade || 1) > 1) b.appendChild(el('span', 'jg-slot-qtd' + (x.atual === 0 ? ' acabou' : ''), String(x.atual)));
      var classe = criador.classeDoItem(x.item.id);
      if (classe !== 'equipamento') {
        var c = condicaoDe(x.sel.uid);
        var bar = el('span', 'jg-condicao' + (c.atual < 25 ? ' ruim' : ''));
        bar.style.width = (c.atual) + '%';
        b.appendChild(bar);
      }
      b.addEventListener('click', function () { abrirItemDoInventario(x); });
      return b;
    }
    function abrirItemDoInventario(x) {
      if (!window.ItemUI) return;
      var comida = G.jogo.materiais.comida_da_lista[x.item.id] || (x.item.calorias || x.item.agua ? x.item : null);
      var acao = null;
      if (comida && x.atual > 0) acao = { rotulo: comida.calorias ? 'Comer' : 'Beber', fazer: function () { consumirItem(x, comida); } };
      else if ((x.sel.quantidade || 1) > 1 && x.atual > 0) acao = { rotulo: 'Gastar um (' + x.atual + ' → ' + (x.atual - 1) + ')', fazer: function () { gastarUm(x.sel.uid, x.sel.quantidade || 1); } };
      else if (criador.classeDoItem(x.item.id) !== 'equipamento' && condicaoDe(x.sel.uid).atual < condicaoDe(x.sel.uid).maximo) acao = { rotulo: 'Consertar', fazer: function () { consertarItem(x); } };
      window.ItemUI.abrir(x.item, { link: false, acao: acao });
    }
    function consumirItem(x, comida) {
      mudarFicha(function (sv) {
        gastarNoSv(sv, x.item.id, 1);
        var e = SIM.consumir(sv.em_jogo.sim || SIM.estadoInicial(), comida);
        // água de rio ou carne crua podem fazer mal
        if (comida.risco && sorteio() < comida.risco) { e = SIM.ferir(e, 'tronco', 'contusao', 1); avisoSim = x.item.nome + ' fez mal: dor de barriga.'; }
        sv.em_jogo.sim = e;
        var ev = passarTempo(sv, 5, 'repouso');
        avisoSim = (avisoSim || (comida.calorias ? 'Comeu ' : 'Bebeu ') + x.item.nome.toLowerCase() + '.') + (ev.length ? ' ' + ev.join(' ') : '');
      });
    }
    function consertarItem(x) {
      var RC = G.jogo.receitas.conserto;
      var disp = tem();
      var ferr = RC.ferramentas[0].filter(function (id) { return disp[id] > 0; })[0];
      if (!ferr) { avisoSim = 'Para consertar falta ' + RC.ferramentas[0].map(nomeItem).join(' ou ').toLowerCase() + '.'; montar('jogando'); return; }
      var pericia = RC.pericia_por_classe[criador.classeDoItem(x.item.id)];
      var a = rolarTeste('Consertar ' + x.item.nome, nhDe(pericia), ['pericia:' + pericia]);
      mudarFicha(function (sv) {
        sv.em_jogo = sv.em_jogo || {};
        var cond = Object.assign({}, sv.em_jogo.condicao || {});
        cond[x.sel.uid] = SIM.consertar(cond[x.sel.uid], a.sucesso);
        sv.em_jogo.condicao = cond;
        var ev = passarTempo(sv, RC.tempo_min, 'trabalho');
        avisoSim = (a.sucesso ? x.item.nome + ' consertado.' : 'O conserto não deu certo.') + (ev.length ? ' ' + ev.join(' ') : '');
      });
    }
    // receitas: o que dá para fazer agora, o que falta, e fazer (teste de perícia, gasto, tempo)
    function abrirReceitas() {
      var d = document.getElementById('jg-receitas') || document.body.appendChild(el('dialog', 'item-dialogo'));
      d.id = 'jg-receitas';
      d.textContent = '';
      var fechar = el('button', 'jogar-fechar', '×');
      fechar.type = 'button';
      fechar.addEventListener('click', function () { d.close(); });
      d.appendChild(fechar);
      d.appendChild(el('h2', null, 'Fazer'));
      var e = estadoSim();
      var disp = tem();
      var bioma = SIM.BIOMAS.filter(function (bi) { return bi.id === e.bioma; })[0];
      d.appendChild(el('p', 'combate-nota', 'Onde você está: ' + (bioma ? bioma.nome.toLowerCase() : '—') + '. O que tem por perto: ' + (bioma ? bioma.recursos.map(nomeItem).join(', ').toLowerCase() : '—') + '.'));
      SIM.RECEITAS.forEach(function (rec) {
        var av = SIM.avaliarReceita(rec, disp, e.bioma);
        var c = el('div', 'jg-receita' + (av.pode ? '' : ' falta'));
        c.appendChild(el('strong', null, rec.nome + ' → ' + rec.resultado.quantidade + '× ' + nomeItem(rec.resultado.id)));
        var partes = [];
        if (rec.ingredientes.length) partes.push('gasta ' + rec.ingredientes.map(function (i) { return i.quantidade + '× ' + nomeItem(i.id); }).join(', '));
        if (rec.ferramentas.length) partes.push('com ' + rec.ferramentas.map(function (g0) { return g0.map(nomeItem).join(' ou '); }).join(' e '));
        if (rec.pericia) partes.push('teste de ' + (porId(G.pericias, rec.pericia) || {}).nome + (rec.modificador ? (rec.modificador > 0 ? ' +' : ' −') + Math.abs(rec.modificador) : ''));
        partes.push(rec.tempo_min + ' min');
        c.appendChild(el('span', null, partes.join(' · ')));
        if (!av.pode) c.appendChild(el('span', 'jg-falta', 'Falta: ' + av.faltam.map(function (x) {
          return x.tipo === 'ingrediente' ? x.quantidade + '× ' + nomeItem(x.id) : x.tipo === 'ferramenta' ? x.ids.map(nomeItem).join(' ou ') : nomeItem(x.id) + ' por perto (mude de lugar)';
        }).join('; ')));
        var bt = el('button', 'btn btn-primary', 'Fazer');
        bt.type = 'button';
        bt.disabled = !av.pode;
        bt.addEventListener('click', function () {
          var teste = rec.pericia ? rolarTeste(rec.nome, nhDe(rec.pericia) + (rec.modificador || 0), ['pericia:' + rec.pericia]) : null;
          var res = SIM.resultadoReceita(rec, teste);
          d.close();
          mudarFicha(function (sv) {
            res.gasta.forEach(function (i) { gastarNoSv(sv, i.id, i.quantidade); });
            res.produz.forEach(function (i) { darNoSv(sv, i.id, i.quantidade); });
            var ev = passarTempo(sv, rec.tempo_min, rec.atividade || 'trabalho');
            avisoSim = (res.produz.length ? rec.nome + ': pronto (' + res.produz.map(function (i) { return i.quantidade + '× ' + nomeItem(i.id); }).join(', ') + ').' : rec.nome + ': não deu certo, parte do material foi perdida.') + (ev.length ? ' ' + ev.join(' ') : '');
          });
        });
        c.appendChild(bt);
        d.appendChild(c);
      });
      if (!d.open) d.showModal();
    }
    // arma usada perde condição às vezes (mais se for barata); quebrada, não serve
    document.addEventListener('adamar:usou', function (ev) {
      if (!SIM) return;
      var uid = ev.detail.uid;
      var x = itens.filter(function (y) { return y.sel.uid === uid; })[0];
      if (!x) return;
      var antes = condicaoDe(uid);
      var depois = SIM.desgastar(antes, x.sel.qualidade || 0, sorteio);
      if (depois.atual === antes.atual) return;
      mudarFicha(function (sv) {
        sv.em_jogo = sv.em_jogo || {};
        var cond = Object.assign({}, sv.em_jogo.condicao || {});
        cond[uid] = depois;
        sv.em_jogo.condicao = cond;
        avisoSim = x.item.nome + (depois.atual === 0 ? ' quebrou!' : ' perdeu condição (' + depois.atual + '%).');
      });
    });

    function gastarUm(uid, total) {
      mudarFicha(function (sv) {
        sv.em_jogo = sv.em_jogo || {};
        var u = Object.assign({}, sv.em_jogo.usados || {});
        u[uid] = Math.min(total, (u[uid] || 0) + 1);
        sv.em_jogo.usados = u;
      });
    }
    function nomeDoItem(x, nivel) {
      var n = nomeComIcone(x.item, x.item.nome + (x.qualidade && x.qualidade.nivel ? ' (' + x.qualidade.nome.toLowerCase() + ')' : ''));
      if (nivel) n.style.paddingLeft = (nivel * 1.2) + 'rem';
      if (nivel) n.insertBefore(el('span', 'fx-dentro', '↳'), n.firstChild);
      return n;
    }
    function pesoDe(x) {
      var kg = x.item.peso && x.item.peso.kg;
      return kg ? num(Math.round(kg * x.atual * 100) / 100) + ' kg' : '—';
    }
    // lista em árvore: cada item e, logo abaixo, o que está dentro dele
    function arvore(lista) {
      var uids = {};
      lista.forEach(function (x) { uids[x.sel.uid] = true; });
      var saida = [];
      function por(x, nivel) {
        saida.push([x, nivel]);
        lista.filter(function (y) { return y.sel.dentro === x.sel.uid; }).forEach(function (y) { por(y, nivel + 1); });
      }
      lista.filter(function (x) { return !x.sel.dentro || !uids[x.sel.dentro]; }).forEach(function (x) { por(x, 0); });
      return saida;
    }

    var construtores = {
      geral: function (s) {
        var pend = blocoPendencias();
        if (pend) s.appendChild(pend);
        s.appendChild(painelEmJogo(idFicha, true, aoMudarEmJogo));
        var sits = blocoSituacoes();
        if (sits) s.appendChild(sits);
        s.appendChild(blocoAtributos());
        s.lastChild.appendChild(blocoPontos());
        var comb = bloco('Combate', 'ficha-largo ficha-combate fx-so-tela');
        comb.appendChild(blocoCombate(r, true));
        s.appendChild(comb);
        // as melhores perícias, para rolar sem trocar de seção
        var melhores = comPericia.filter(function (x) { return x.nh != null; }).sort(function (a, b) { return b.nh - a.nh; }).slice(0, 6);
        if (melhores.length) {
          var bp = bloco('Melhores perícias', 'ficha-largo fx-so-tela');
          bp.appendChild(tabelaPericias(melhores));
          s.appendChild(bp);
        }
      },
      combate: function (s) {
        var comb = bloco('Combate', 'ficha-largo ficha-combate');
        comb.appendChild(blocoCombate(r, false));
        s.appendChild(comb);
        var sitsC = blocoSituacoes(function (x) {
          return x.alvos.some(function (a) { return /^(ataque|defesa|dano|qualquer)/.test(a) || /^atributo:(dx|ht)$/.test(a); });
        });
        if (sitsC) s.appendChild(sitsC);
        s.appendChild(blocoLocais());
      },
      pericias: function (s) {
        var per = bloco('Perícias', 'ficha-largo');
        if (!comPericia.length) per.appendChild(el('p', 'pericia-vazio', 'Nenhuma.'));
        else {
          per.appendChild(buscaNaSecao(per, 'Buscar perícia…'));
          var t = tabelaPericias(comPericia);
          Array.prototype.forEach.call(t.querySelectorAll('tbody tr'), function (tr, k) {
            var x = comPericia[k];
            tr.setAttribute('data-busca', semAcento(x.pericia.nome + ' ' + (x.sel.especializacao || '')));
          });
          per.appendChild(t);
        }
        s.appendChild(per);
        // perícias sem treino: o que o personagem ainda consegue tentar (as melhores entre as de Adamar)
        var compradas = {};
        comPericia.forEach(function (x) { compradas[x.pericia.id] = true; });
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
            li.appendChild(nomeComIcone(x.p));
            li.appendChild(rolavel(el('span', 'cofre-item-valor', String(x.nh)), 'teste', x.p.nome + ' (sem treino)', x.nh, ['pericia:' + x.p.id]));
            ul.appendChild(li);
          });
          st.appendChild(ul);
          s.appendChild(st);
        }
      },
      vantagens: function (s) {
        var b = bloco('Vantagens', 'ficha-largo');
        if (vantagens.length + talentos.length + qualidades.length > 6) b.appendChild(buscaNaSecao(b, 'Buscar vantagem…'));
        b.appendChild(listaTracos(vantagens, talentos.concat(qualidades)));
        s.appendChild(b);
      },
      desvantagens: function (s) {
        var b = bloco('Desvantagens', 'ficha-largo');
        if (desvantagens.length + peculiaridades.length > 6) b.appendChild(buscaNaSecao(b, 'Buscar desvantagem…'));
        b.appendChild(listaTracos(desvantagens, peculiaridades));
        s.appendChild(b);
      },
      equipamento: function (s) {
        var cb = r.combate;
        s.appendChild(el('p', 'calc-detalhe fx-eq-resumo', num(cb.peso_total) + ' kg carregados · carga ' + cb.carga.nome + ' (deslocamento ' + cb.carga.deslocamento + ') · gasto ' + moeda(r.gasto_equipamento) + ' de ' + moeda(r.recursos) + ' · ' +
          (r.dinheiro_restante >= 0 ? 'sobram ' + moeda(r.dinheiro_restante) : 'faltam ' + moeda(-r.dinheiro_restante))));
        if (!itens.length) { s.appendChild(el('p', 'pericia-vazio', 'Nada.')); s.appendChild(blocoCarga()); return; }
        // armas equipadas: prontas para rolar acerto e dano
        var equipadas = itens.filter(function (x) { return x.local === 'equipado'; });
        var ba = bloco('Armas', 'ficha-largo');
        var linhasArma = [];
        equipadas.filter(function (x) { return tipoDeItem(x.item) === 'arma'; }).forEach(function (x) {
          cb.armas.filter(function (a) { return a.item && a.item.id === x.item.id; }).forEach(function (a, k) {
            var nh = el('strong', 'fx-nh', a.nh == null ? '—' : String(a.nh));
            rolavel(nh, 'teste', a.nome, a.nh, alvosDaArma(a));
            var dano = el('span', null, a.dano);
            rolavel(dano, 'dano', a.nome, a.dano, ['dano']);
            var nomeArma = nomeComIcone(x.item, a.nome);
            if (a.sacar) nomeArma.appendChild(el('span', 'fx-sacar', ({ Cinto: 'no cinto', Costas: 'nas costas' }[a.sacar] || a.sacar) + ': saque antes (Preparar)'));
            linhasArma.push([nomeArma, nh, dano, a.alcance || '—', k === 0 ? seletorLocal(x) : '']);
          });
        });
        if (!linhasArma.length) ba.appendChild(el('p', 'pericia-vazio', 'Nenhuma arma equipada. Os ataques desarmados estão em Combate.'));
        else ba.appendChild(tabela(['Arma', 'NH', 'Dano', 'Alcance', 'Onde'], linhasArma));
        s.appendChild(ba);
        // armadura e escudo vestidos: proteção fixa, não rola
        var vestidas = equipadas.filter(function (x) { return tipoDeItem(x.item) === 'protecao'; });
        if (vestidas.length) {
          var bp = bloco('Armadura e escudo', 'ficha-largo');
          bp.appendChild(tabela(['Peça', 'Proteção', 'Peso', 'Onde'], vestidas.map(function (x) {
            var p0 = x.item.protecao, e0 = x.item.escudo;
            var prot = p0 ? 'RD ' + (p0.texto || p0.rd) + (p0.local ? ' · ' + p0.local : '') : e0 ? 'Defesa +' + e0.bd + ' (escudo)' : '—';
            return [nomeDoItem(x), prot, pesoDe(x), seletorLocal(x)];
          })));
          var locais = Object.keys(cb.protecao);
          if (locais.length) bp.appendChild(el('p', 'combate-nota', 'Somando tudo: ' + locais.map(function (l) { return l + ' RD ' + cb.protecao[l].rd; }).join(' · ')));
          s.appendChild(bp);
        }
        // com você: o resto do que está equipado, o que vai levado e o que está dentro de cada coisa
        var comVoce = itens.filter(function (x) { return x.local !== 'guardado' && !(x.local === 'equipado' && tipoDeItem(x.item) !== 'mochila'); });
        var bm = bloco('Com você', 'ficha-largo');
        if (!comVoce.length) bm.appendChild(el('p', 'pericia-vazio', 'Nada além do que está equipado.'));
        else {
          if (comVoce.length > 8) bm.appendChild(buscaNaSecao(bm, 'Buscar no que você leva…'));
          var arvComVoce = arvore(comVoce);
          var tm = tabela(['Item', 'Qtd.', 'Peso', 'Onde'], arvComVoce.map(function (par) {
            return [nomeDoItem(par[0], par[1]), contadorUsos(par[0]), pesoDe(par[0]), seletorLocal(par[0])];
          }));
          Array.prototype.forEach.call(tm.querySelectorAll('tbody tr'), function (tr, k) { tr.setAttribute('data-busca', semAcento(arvComVoce[k][0].item.nome)); });
          bm.appendChild(tm);
        }
        s.appendChild(bm);
        // em casa: não pesa nem protege
        var emCasa = itens.filter(function (x) { return x.local === 'guardado'; });
        if (emCasa.length) {
          var bg = bloco('Em casa', 'ficha-largo');
          bg.appendChild(tabela(['Item', 'Qtd.', 'Onde'], arvore(emCasa).map(function (par) {
            return [nomeDoItem(par[0], par[1]), contadorUsos(par[0]), seletorLocal(par[0])];
          })));
          s.appendChild(bg);
        }
        s.appendChild(blocoCarga());
      },
      jogo: function (s) {
        s.appendChild(painelEmJogo(idFicha, false, aoMudarEmJogo));
      },
      corpo: function (s) {
        var bn = blocoBoneco();
        if (bn) s.appendChild(bn); else s.appendChild(el('p', 'pericia-vazio', 'Nada equipado.'));
      },
      // modo Jogando: tudo numa tela, estilo interface de MMO
      jogando: function (s) {
        var tela = el('div', 'jg');
        var cb = r.combate;
        // --- esquerda: retrato, PV/PF, situações ---
        var esq = el('div', 'jg-col jg-esq');
        var quem = el('div', 'jg-quem');
        var foto = el('div', 'jg-retrato');
        if (f.retrato) foto.style.backgroundImage = 'url("' + f.retrato + '")';
        else foto.textContent = (String(f.nome || '?').trim()[0] || '?').toUpperCase();
        quem.appendChild(foto);
        var nomeJ = el('div');
        nomeJ.appendChild(el('strong', null, f.nome || 'Sem nome'));
        nomeJ.appendChild(el('span', null, f.conceito || ''));
        quem.appendChild(nomeJ);
        esq.appendChild(quem);
        esq.appendChild(painelEmJogo(idFicha, true, aoMudarEmJogo));
        if (SIM) esq.appendChild(blocoSim());
        if (r.situacoes.length) {
          var sit = el('div', 'jg-painel');
          sit.appendChild(el('h3', null, 'Situações'));
          var ligadas = (f.em_jogo && f.em_jogo.situacoes) || [];
          r.situacoes.forEach(function (x) {
            var b = el('button', 'jg-sit' + (ligadas.indexOf(x.chave) !== -1 ? ' ligada' : ''));
            b.type = 'button';
            b.setAttribute('aria-pressed', String(ligadas.indexOf(x.chave) !== -1));
            b.title = x.condicao;
            b.appendChild(el('strong', null, (x.valor > 0 ? '+' : '−') + Math.abs(x.valor)));
            b.appendChild(el('span', null, x.origem));
            b.addEventListener('click', function () { ligarSituacao(x.chave, ligadas.indexOf(x.chave) === -1); });
            sit.appendChild(b);
          });
          esq.appendChild(sit);
        }
        tela.appendChild(esq);

        // --- centro: o boneco e a barra de ação (armas e defesas) ---
        var meio = el('div', 'jg-col jg-meio');
        if (window.Boneco) {
          var feridas = {};
          if (SIM) estadoSim().ferimentos.forEach(function (x) { feridas[x.parte] = Math.max(feridas[x.parte] || 0, x.gravidade); });
          var bn = window.Boneco.desenhar({ resumo: r, feridas: feridas });
          var fig = bn.querySelector('.boneco-corpo');
          fig.classList.add('jg-figura');
          // clicar numa parte do corpo mostra (e prepara para ferir) aquela parte
          Array.prototype.forEach.call(fig.querySelectorAll('[data-parte]'), function (p) {
            p.addEventListener('click', function () { parteEscolhida = p.getAttribute('data-parte'); montar('jogando'); });
            if (p.getAttribute('data-parte') === parteEscolhida) p.classList.add('escolhida');
          });
          // clicar numa arma desenhada nas mãos rola o ataque
          Array.prototype.forEach.call(fig.querySelectorAll('.boneco-item'), function (g) {
            var nome = (g.querySelector('title') || {}).textContent;
            var arma = cb.armas.filter(function (a) { return a.item && a.item.nome === nome && a.nh != null; })[0];
            if (arma) {
              g.classList.add('jg-clicavel');
              rolavel(g, 'teste', arma.nome, arma.nh, alvosDaArma(arma));
            }
          });
          meio.appendChild(fig);
        }
        var barra = el('div', 'jg-barra');
        // um cartão por arma; cada modo de ataque (golpe, estocada…) vira um botão de dano
        var porArma = [];
        cb.armas.forEach(function (a) {
          var chave = a.item.id + '|' + (a.natural ? 'n' : '');
          var grupo = porArma.filter(function (g) { return g.chave === chave; })[0];
          if (!grupo) { grupo = { chave: chave, modos: [] }; porArma.push(grupo); }
          grupo.modos.push(a);
        });
        porArma.forEach(function (grupo) {
          var a = grupo.modos[0];
          var c0 = el('div', 'jg-arma' + (a.sacar ? ' guardada' : '') + (a.natural ? ' natural' : ''));
          var cab = el('div', 'jg-arma-cab');
          var ic = window.iconeSvg && window.iconeSvg(a.item.icone, 'jg-arma-icone');
          if (ic) cab.appendChild(ic);
          cab.appendChild(el('span', null, a.nome.split(' — ')[0]));
          c0.appendChild(cab);
          if (a.sacar) c0.appendChild(el('span', 'fx-sacar', ({ Cinto: 'no cinto', Costas: 'nas costas' }[a.sacar] || a.sacar) + ': saque antes'));
          var acoes = el('div', 'jg-arma-acoes');
          var melhorNh = grupo.modos.reduce(function (m, x) { return x.nh != null && (m == null || x.nh > m.nh) ? x : m; }, null);
          var selArma = itens.filter(function (y) { return y.item.id === a.item.id && y.local === 'equipado'; })[0];
          var quebrada = selArma && SIM && condicaoDe(selArma.sel.uid).atual === 0;
          if (quebrada) { c0.classList.add('quebrada'); c0.appendChild(el('span', 'fx-sacar', 'quebrada: conserte antes de usar')); }
          // condição da arma equipada (desgasta no uso) e o conserto
          if (selArma && SIM) {
            var cd = condicaoDe(selArma.sel.uid);
            if (cd.atual < 100) {
              var linhaC = el('div', 'jg-arma-cond');
              var trilho = el('span', 'jg-barra-trilho');
              var cheio = el('span', 'jg-barra-cheio');
              cheio.style.width = cd.atual + '%';
              trilho.appendChild(cheio);
              linhaC.appendChild(trilho);
              linhaC.appendChild(el('span', null, cd.atual + '%'));
              if (cd.atual < cd.maximo) {
                var cons = el('button', 'btn-link', 'consertar');
                cons.type = 'button';
                cons.addEventListener('click', function () { consertarItem(selArma); });
                linhaC.appendChild(cons);
              }
              c0.appendChild(linhaC);
            }
          }
          if (melhorNh && !quebrada) {
            var atk = rolavel(el('button', 'jg-acao', 'Atacar ' + melhorNh.nh), 'teste', a.nome.split(' — ')[0], melhorNh.nh, alvosDaArma(melhorNh));
            if (selArma) atk.setAttribute('data-uid', selArma.sel.uid);
            acoes.appendChild(atk);
          }
          grupo.modos.forEach(function (m) { acoes.appendChild(rolavel(el('button', 'jg-acao jg-dano', m.dano), 'dano', m.nome, m.dano, ['dano'])); });
          var ap = grupo.modos.reduce(function (mx, x) { var n = parseInt(x.aparar, 10); return !isNaN(n) && (mx == null || n > mx) ? n : mx; }, null);
          if (ap != null && !a.sacar) acoes.appendChild(rolavel(el('button', 'jg-acao', 'Aparar ' + ap), 'teste', 'Aparar (' + a.nome.split(' — ')[0] + ')', ap, ['defesa:aparar']));
          Array.prototype.forEach.call(acoes.children, function (b) { b.type = 'button'; });
          c0.appendChild(acoes);
          barra.appendChild(c0);
        });
        meio.appendChild(barra);
        var defs = el('div', 'jg-defesas');
        [['Esquiva', cb.defesas.esquiva, 'esquiva'], ['Aparar', cb.defesas.aparar, 'aparar'], ['Bloqueio', cb.defesas.bloqueio, 'bloqueio']].forEach(function (x) {
          if (x[1] == null) return;
          var b = el('button', 'jg-defesa');
          b.type = 'button';
          b.appendChild(el('span', null, x[0]));
          b.appendChild(el('strong', null, String(x[1])));
          defs.appendChild(rolavel(b, 'teste', x[0], x[1], ['defesa:' + x[2]]));
        });
        meio.appendChild(defs);
        if (SIM) meio.appendChild(blocoSaude());
        tela.appendChild(meio);

        // --- direita: atributos, perícias e o quadro de rolagens ---
        var dir = el('div', 'jg-col jg-dir');
        var atrs = el('div', 'jg-atributos');
        [['ST', v.st, 'st'], ['DX', v.dx, 'dx'], ['IQ', v.iq, 'iq'], ['HT', v.ht, 'ht'], ['Per', v.per, 'per'], ['Vont', v.vontade, 'vontade']].forEach(function (x) {
          var b = el('button', 'jg-atr');
          b.type = 'button';
          b.appendChild(el('span', null, x[0]));
          b.appendChild(el('strong', null, String(x[1])));
          atrs.appendChild(rolavel(b, 'teste', x[0], x[1], ['atributo:' + x[2]]));
        });
        dir.appendChild(atrs);
        var per = el('div', 'jg-painel jg-pericias');
        per.appendChild(el('h3', null, 'Perícias'));
        if (comPericia.length > 6) per.appendChild(buscaNaSecao(per, 'Buscar perícia…'));
        var lista = el('div', 'jg-lista');
        comPericia.slice().sort(function (a, b) { return a.pericia.nome.localeCompare(b.pericia.nome, 'pt-BR'); }).forEach(function (x) {
          var b = el('button', 'jg-pericia');
          b.type = 'button';
          var ic = window.iconeSvg && window.iconeSvg(x.pericia.icone, 'icone-item');
          if (ic) b.appendChild(ic);
          var rot = x.pericia.nome + (x.sel.especializacao ? ' (' + x.sel.especializacao + ')' : '');
          b.appendChild(el('span', null, rot));
          b.appendChild(el('strong', null, x.nh == null ? '—' : String(x.nh)));
          b.setAttribute('data-busca', semAcento(rot));
          lista.appendChild(x.nh == null ? b : rolavel(b, 'teste', rot, x.nh, ['pericia:' + x.pericia.id]));
        });
        if (!comPericia.length) lista.appendChild(el('p', 'pericia-vazio', 'Nenhuma perícia.'));
        per.appendChild(lista);
        dir.appendChild(per);
        var log = el('div', 'jg-log');
        dir.appendChild(log);
        tela.appendChild(dir);

        // --- embaixo: o inventário em grade (bolsos e recipientes) ---
        tela.appendChild(SIM ? blocoInventario() : el('div'));
        s.appendChild(tela);
        // o quadro de rolagens entra na coluna da direita (no computador)
        if (window.matchMedia('(min-width: 1100px)').matches) {
          var q = quadroRolagens();
          q.classList.add('embutido');
          q.classList.remove('fechado');
          log.appendChild(q);
        }
      },
      historia: function (s) {
        var algum = false;
        [['Aparência', f.aparencia_fisica], ['História', f.historia], ['Recado para o narrador', f.notas]].forEach(function (x) {
          if (!x[1]) return;
          algum = true;
          var b = bloco(x[0], 'ficha-largo');
          x[1].split(/\n+/).forEach(function (par) { b.appendChild(el('p', null, par)); });
          s.appendChild(b);
        });
        if (r.avisos.length) {
          algum = true;
          var av = bloco('Para conversar com o narrador', 'ficha-largo');
          var ul = el('ul', 'app-pendencias');
          r.avisos.forEach(function (a) { ul.appendChild(el('li', null, a.texto)); });
          av.appendChild(ul);
          s.appendChild(av);
        }
        if (!algum) s.appendChild(el('p', 'pericia-vazio', 'Sem história nem notas ainda. Dá para escrever no criador, na etapa Conceito.'));
      }
    };
    var contagens = {
      pericias: comPericia.length, vantagens: vantagens.length + talentos.length + qualidades.length,
      desvantagens: desvantagens.length + peculiaridades.length, equipamento: itens.length
    };

    // ---------- seções: cada uma é montada ao entrar (assim PV/PF e diário estão sempre em dia) ----------
    var secoes = {};
    SECOES.forEach(function (x) {
      var s = el('section', 'fx-sec');
      s.setAttribute('data-sec', x[0]);
      s.setAttribute('aria-label', x[1]);
      s.hidden = true;
      secoes[x[0]] = s;
      box.appendChild(s);
    });
    var jogar = el('section', 'fx-sec fx-jogando');
    jogar.setAttribute('data-sec', 'jogando');
    jogar.setAttribute('aria-label', 'Jogando');
    jogar.hidden = true;
    secoes.jogando = jogar;
    box.appendChild(jogar);
    var botaoJogar = document.getElementById('fx-jogar');
    var antesDeJogar = 'geral';
    botaoJogar.addEventListener('click', function () {
      if (atual === 'jogando') abrirSecao(antesDeJogar);
      else { antesDeJogar = atual || 'geral'; abrirSecao('jogando'); }
    });
    function montar(id) {
      var s = secoes[id];
      s.textContent = '';
      construtores[id](s);
      marcarRolaveis(s);
    }
    function aoMudarEmJogo() {
      recalcular();
      desenharPontos();
    }

    var nav = document.getElementById('fx-nav');
    var botaoMenu = document.getElementById('fx-menu-btn');
    var veu = document.getElementById('fx-veu');
    function gaveta(aberta) {
      nav.classList.toggle('aberta', aberta);
      veu.hidden = !aberta;
      botaoMenu.setAttribute('aria-expanded', String(aberta));
    }
    botaoMenu.addEventListener('click', function () { gaveta(!nav.classList.contains('aberta')); });
    veu.addEventListener('click', function () { gaveta(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('aberta')) gaveta(false); });

    var botoes = {};
    SECOES.forEach(function (x) {
      var b = el('button', 'fx-nav-item');
      b.type = 'button';
      var ic = window.iconeSvg && window.iconeSvg(x[2], 'fx-nav-icone');
      if (ic) b.appendChild(ic);
      b.appendChild(el('span', null, x[1]));
      if (contagens[x[0]] != null) b.appendChild(el('span', 'fx-nav-conta', String(contagens[x[0]])));
      if (x[0] === 'geral' && r.erros.length) b.appendChild(el('span', 'fx-nav-alerta', '!'));
      b.addEventListener('click', function () { abrirSecao(x[0]); gaveta(false); });
      botoes[x[0]] = b;
      nav.appendChild(b);
    });
    var atual = null;
    function abrirSecao(id) {
      if (!secoes[id]) id = 'geral';
      if (atual) secoes[atual].hidden = true;
      // saindo do Jogando, o quadro de rolagens volta a flutuar
      if (atual === 'jogando' && id !== 'jogando') {
        var q = quadroRolagens();
        q.classList.remove('embutido');
        document.body.appendChild(q);
      }
      montar(id);
      document.body.classList.toggle('modo-jogando', id === 'jogando');
      botaoJogar.setAttribute('aria-pressed', String(id === 'jogando'));
      botaoJogar.textContent = id === 'jogando' ? '‹ Ficha' : '▶ Jogando';
      secoes[id].hidden = false;
      conceito.hidden = id !== 'geral';
      Object.keys(botoes).forEach(function (k) {
        botoes[k].classList.toggle('ativo', k === id);
        if (k === id) botoes[k].setAttribute('aria-current', 'true'); else botoes[k].removeAttribute('aria-current');
      });
      atual = id;
      box.scrollTop = 0;
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + (id === 'geral' ? '' : '#' + id));
    }
    // o diário recebe rolagens de qualquer seção: a seção "Em jogo" fica montada por baixo
    montar('jogo');
    // para imprimir, todas as seções aparecem
    window.addEventListener('beforeprint', function () { SECOES.forEach(function (x) { if (x[0] !== atual && x[0] !== 'geral') montar(x[0]); }); });
    abrirSecao(decodeURIComponent(location.hash.slice(1)) || 'geral');
  }
  // ?id=<id> abre a ficha completa; sem isso, o cofre
  var id = (/[?&]id=([^&]+)/.exec(location.search) || [])[1];
  if (id) mostrarFicha(decodeURIComponent(id)); else mostrarLista();
})();
