// js/site.js — casca do site: cabeçalho, menu, rodapé e botões "Jogar".
(function () {
  var SITE_CONFIG = {
    whatsapp: {
      numero: '+55 49 99948-6398', // vazio abre o WhatsApp para escolher o contato
      mensagem: 'Olá! Vi o site de Ruínas de Adamar e quero jogar.'
    },
    spotify: 'https://open.spotify.com/playlist/6LauoSCcWG3fzsGqlEChv6',
    pinterest: 'https://br.pinterest.com/austrothalik/ru%C3%ADnas-de-adamar/'
  };

  var NAV = [
    { label: 'Início', href: 'index.html' },
    { label: 'O Mundo', children: [
      { label: 'Visão geral', href: 'mundo/visao-geral.html' },
      { label: 'Eras', href: 'mundo/eras.html' },
      { label: 'Linha do Tempo', href: 'mundo/linha-do-tempo.html' },
      { label: 'Geografia', href: 'mundo/geografia.html' }
    ]},
    { label: 'Cânone', children: [
      { label: 'Materialidade', href: 'canone/materialidade.html' },
      { label: 'Magia', href: 'canone/magia.html' },
      { label: 'Entremundos', href: 'canone/entremundos.html' },
      { label: 'Forasteiros', href: 'canone/forasteiros.html' },
      { label: 'Masmorras', href: 'canone/masmorras.html' },
      { label: 'Divindades', href: 'canone/divindades.html' }
    ]},
    { label: 'Personagens', children: [
      { label: 'Criando seu personagem', href: 'personagens/criando.html' },
      { label: 'Fé e panteões', href: 'personagens/fe.html' }
    ]},
    { label: 'À Mesa', children: [
      { label: 'Regras', href: 'mesa/regras.html' },
      { label: 'Perícias (GURPS)', href: 'mesa/pericias-gurps.html' },
      { label: 'Vantagens (GURPS)', href: 'mesa/vantagens-gurps.html' },
      { label: 'Desvantagens (GURPS)', href: 'mesa/desvantagens-gurps.html' },
      { label: 'Sugestões aos jogadores', href: 'mesa/sugestoes.html' },
      { label: 'Sessão zero', href: 'mesa/sessao-zero.html' }
    ]},
    { label: 'Crônicas', children: [
      { label: 'Mito da criação', href: 'cronicas/mito-da-criacao.html' },
      { label: 'A Praga Vermelha', href: 'cronicas/praga-vermelha.html' },
      { label: 'Vinda para Roestia', href: 'cronicas/vinda-para-roestia.html' },
      { label: 'Contos de Invasões', href: 'cronicas/contos-de-invasoes.html' }
    ]}
  ];

  var body = document.body;
  var ROOT = body.getAttribute('data-root') || './';
  var PAGE = body.getAttribute('data-page') || '';

  // ---------- utilitários ----------
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var key in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
        if (key === 'className') node.className = attrs[key];
        else if (key === 'text') node.textContent = attrs[key];
        else node.setAttribute(key, attrs[key]);
      }
    }
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function jogarButton(extraClass) {
    // U+FE0E força a espada em forma de texto (sem emoji colorido).
    return el('a', { className: 'btn btn-primary' + (extraClass ? ' ' + extraClass : ''), 'data-jogar': '' }, [
      el('span', { className: 'glyph', 'aria-hidden': 'true', text: '⚔︎' }),
      ' Jogar'
    ]);
  }

  // ---------- cabeçalho ----------
  function renderHeader() {
    var header = el('header', { className: 'site-header' });

    header.appendChild(el('a', { className: 'skip-link', href: '#conteudo', text: 'Pular para o conteúdo' }));

    var logo = el('a', { className: 'logo', href: ROOT + 'index.html' }, [
      el('span', { className: 'logo-title', text: 'Ruínas de Adamar' }),
      el('span', { className: 'logo-sub', text: 'Um mundo de fantasia sombria' })
    ]);
    header.appendChild(el('div', { className: 'banner' }, [logo]));

    var toggle = el('button', {
      className: 'nav-toggle', type: 'button',
      'aria-expanded': 'false', 'aria-controls': 'menu-principal'
    }, [el('span', { className: 'nav-toggle-icon', 'aria-hidden': 'true' }), 'Menu']);

    var ul = el('ul', { className: 'nav', id: 'menu-principal' });

    NAV.forEach(function (item, i) {
      var li;
      if (item.children) {
        var subId = 'submenu-' + i;
        var btn = el('button', {
          className: 'nav-top', type: 'button',
          'aria-expanded': 'false', 'aria-controls': subId
        }, [item.label]);
        var sub = el('ul', { className: 'sub', id: subId });
        var parentActive = false;
        item.children.forEach(function (child) {
          var a = el('a', { href: ROOT + child.href, text: child.label });
          var subLi = el('li', null, [a]);
          if (child.href === PAGE) {
            parentActive = true;
            subLi.classList.add('is-active');
            a.classList.add('is-active');
            a.setAttribute('aria-current', 'page');
          }
          sub.appendChild(subLi);
        });
        li = el('li', { className: 'has-sub' }, [btn, sub]);
        if (parentActive) {
          li.classList.add('is-active');
          btn.classList.add('is-active');
          // o pai não é a página em si: "true" = item atual dentro do conjunto
          btn.setAttribute('aria-current', 'true');
        }
      } else {
        var link = el('a', { className: 'nav-top', href: ROOT + item.href, text: item.label });
        li = el('li', null, [link]);
        if (item.href === PAGE) {
          li.classList.add('is-active');
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'page');
        }
      }
      ul.appendChild(li);
    });

    ul.appendChild(el('li', { className: 'nav-cta' }, [jogarButton()]));

    var nav = el('nav', { className: 'site-nav', 'aria-label': 'Menu principal' }, [
      el('div', { className: 'nav-inner' }, [toggle, jogarButton('nav-cta-mobile'), ul])
    ]);
    header.appendChild(nav);

    body.insertBefore(header, body.firstChild);
    return header;
  }

  // ---------- rodapé ----------
  function renderFooter() {
    var ext = function (href, label) {
      return el('a', { href: href, target: '_blank', rel: 'noopener', text: label });
    };
    var footer = el('footer', { className: 'site-footer' }, [
      el('div', { className: 'footer-inner' }, [
        el('div', { className: 'ornament', 'aria-hidden': 'true' }),
        el('p', { className: 'footer-name', text: 'Ruínas de Adamar' }),
        el('p', { className: 'footer-credit', text: 'Um cenário de Thalik Bussacro' }),
        el('ul', { className: 'footer-links' }, [
          el('li', null, [ext(SITE_CONFIG.spotify, 'Playlist no Spotify')]),
          el('li', null, [ext(SITE_CONFIG.pinterest, 'Referências no Pinterest')])
        ]),
        jogarButton()
      ])
    ]);
    body.appendChild(footer);
    return footer;
  }

  // ---------- comportamento do menu ----------
  function setupMenu(header) {
    var nav = header.querySelector('.site-nav');
    var toggle = header.querySelector('.nav-toggle');
    var items = Array.prototype.slice.call(header.querySelectorAll('.has-sub'));

    function closeItem(li) {
      li.classList.remove('open');
      li.querySelector('.nav-top').setAttribute('aria-expanded', 'false');
    }
    function closeAll(except) {
      items.forEach(function (li) { if (li !== except) closeItem(li); });
    }
    function setMobile(open) {
      nav.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    items.forEach(function (li) {
      var btn = li.querySelector('.nav-top');
      btn.addEventListener('click', function () {
        var willOpen = !li.classList.contains('open');
        closeAll(li);
        li.classList.remove('is-suppressed');
        li.classList.toggle('open', willOpen);
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        // num clique que fecha, o foco no botão não deve reabrir via :focus-within
        if (!willOpen) li.classList.add('is-suppressed');
      });
      // liberar a supressão quando o foco ou o ponteiro saírem do item
      li.addEventListener('focusout', function (e) {
        if (!li.contains(e.relatedTarget)) {
          li.classList.remove('is-suppressed');
          closeItem(li);
        }
      });
      li.addEventListener('mouseleave', function () {
        li.classList.remove('is-suppressed');
      });
    });

    toggle.addEventListener('click', function () {
      var open = !nav.classList.contains('nav-open');
      setMobile(open);
      if (!open) closeAll();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' && e.key !== 'Esc') return;
      var active = document.activeElement;
      var ownerItem = null;
      items.forEach(function (li) { if (li.contains(active)) ownerItem = li; });
      var wasMobileOpen = nav.classList.contains('nav-open');
      var mobile = getComputedStyle(toggle).display !== 'none';
      // no mobile, um item já fechado não tem o que fechar: o Escape fecha o menu
      var closeSub = ownerItem && (!mobile || ownerItem.classList.contains('open'));

      closeAll();
      if (closeSub) {
        // esconde o painel mesmo com o foco ainda dentro do item
        ownerItem.classList.add('is-suppressed');
        ownerItem.querySelector('.nav-top').focus();
      } else if (wasMobileOpen && nav.contains(active)) {
        setMobile(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) {
        closeAll();
        if (nav.classList.contains('nav-open')) setMobile(false);
      }
    });
  }

  // ---------- botões "Jogar" ----------
  // Todos levam ao formulário de personagem (jogar.html), que envia a ficha pelo WhatsApp.
  function wireJogar() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-jogar]'), function (a) {
      a.setAttribute('href', ROOT + 'jogar.html');
      a.removeAttribute('target');
      a.removeAttribute('rel');
      if (PAGE === 'jogar.html') a.setAttribute('aria-current', 'page');
    });
  }

  var header = renderHeader();
  renderFooter();
  setupMenu(header);
  wireJogar();

  window.SITE_CONFIG = SITE_CONFIG;
  window.NAV = NAV;
})();
