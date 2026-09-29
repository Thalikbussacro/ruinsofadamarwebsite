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

  var id = (/[?&]id=([^&]+)/.exec(location.search) || [])[1];
  if (id) mostrarFicha(decodeURIComponent(id)); else mostrarLista();

  // ---------- lista ----------
  function mostrarLista() {
    var box = document.getElementById('p-lista');
    var aviso = document.getElementById('p-aviso');
    function desenhar() {
      box.textContent = '';
      var lista = arquivo.listar();
      if (!lista.length) {
        box.appendChild(el('p', 'pericia-vazio', 'Nenhum personagem salvo ainda. Monte um no criador e use "Salvar no navegador".'));
        return;
      }
      lista.forEach(function (p) {
        var ficha = arquivo.obter(p.id);
        var r = criador.resumir(criador.carregar(ficha));
        var card = el('article', 'card personagem-card');
        var h = el('h2', 'personagem-nome');
        var link = el('a', null, p.nome);
        link.href = 'personagens.html?id=' + encodeURIComponent(p.id);
        h.appendChild(link);
        card.appendChild(h);
        if (p.conceito) card.appendChild(el('p', 'personagem-conceito', p.conceito));
        card.appendChild(el('p', 'card-more', [ficha.era, ficha.origem].filter(Boolean).concat([r.total + ' de ' + ficha.orcamento + ' pontos']).join(' · ')));
        card.appendChild(el('p', 'card-more', 'Salvo em ' + quando(p.atualizado)));
        card.appendChild(el('span', 'personagem-selo ' + (r.valida ? 'pronta' : 'rascunho'),
          r.valida ? 'Pronta' : 'Rascunho · ' + r.erros.length + (r.erros.length === 1 ? ' pendência' : ' pendências')));
        var acoes = el('div', 'personagem-acoes');
        var ver = el('a', 'btn btn-ghost', 'Ver ficha');
        ver.href = link.href;
        var editar = el('a', 'btn btn-ghost', 'Editar');
        editar.href = 'criador.html?editar=' + encodeURIComponent(p.id);
        var b = el('button', 'btn-link', 'Baixar');
        b.type = 'button';
        b.addEventListener('click', function () { baixar(ficha); });
        var apagar = el('button', 'btn-link', 'Apagar');
        apagar.type = 'button';
        var confirmando = null;
        apagar.addEventListener('click', function () {
          if (!confirmando) {
            apagar.textContent = 'Clique de novo para apagar';
            confirmando = setTimeout(function () { apagar.textContent = 'Apagar'; confirmando = null; }, 4000);
            return;
          }
          clearTimeout(confirmando);
          arquivo.remover(p.id);
          desenhar();
          aviso.textContent = p.nome + ' foi apagado.';
        });
        [ver, editar, b, apagar].forEach(function (x) { acoes.appendChild(x); });
        card.appendChild(acoes);
        box.appendChild(card);
      });
    }
    document.getElementById('p-abrir').addEventListener('change', function (ev) {
      var arq = ev.target.files && ev.target.files[0];
      if (!arq) return;
      var leitor = new FileReader();
      leitor.onload = function () {
        try {
          var f = criador.carregar(JSON.parse(leitor.result));
          var novo = arquivo.salvar(f);
          aviso.textContent = novo ? (f.nome || 'Personagem') + ' foi adicionado.' : 'Não deu para salvar no navegador.';
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
    document.getElementById('f-kicker').textContent = [f.era, f.origem].filter(Boolean).join(' · ') || 'Personagem';
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
    pts.appendChild(el('strong', null, String(r.total)));
    pts.appendChild(el('span', null, 'de ' + f.orcamento + ' pontos' + (f.jogador ? ' · jogador: ' + f.jogador : '')));
    pts.appendChild(el('span', r.restante ? 'calc-estourou' : null, r.restante === 0 ? 'pontos fechados' : r.restante > 0 ? 'faltam ' + r.restante : 'passou ' + (-r.restante)));
    pts.appendChild(el('span', 'personagem-selo ' + (r.valida ? 'pronta' : 'rascunho'), r.valida ? 'Pronta' : 'Rascunho'));
    if (!r.valida) document.getElementById('f-whats').classList.add('is-disabled');
    box.appendChild(pts);

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
    }).concat([['Esquiva', String(r.esquiva)], ['Base de Carga', num(r.base_carga) + ' kg']])));
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
        topo.appendChild(el('strong', 'pericia-nome', nome));
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

    // equipamento
    var eq = bloco('Equipamento', 'ficha-largo');
    var itens = r.equipamento.filter(function (x) { return x.item; });
    if (!itens.length) eq.appendChild(el('p', 'pericia-vazio', 'Nada.'));
    else {
      eq.appendChild(tabela(['Item', 'Qtd.', 'Preço'], itens.map(function (x) {
        return [x.item.nome, String(x.sel.quantidade || 1), x.preco == null ? '—' : moeda(x.preco)];
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
    if (r.avisos.length) {
      var av = bloco('Para conversar com o narrador', 'ficha-largo');
      var ul = el('ul', 'app-pendencias');
      r.avisos.forEach(function (a) { ul.appendChild(el('li', null, a.texto)); });
      av.appendChild(ul);
      box.appendChild(av);
    }
  }
})();
