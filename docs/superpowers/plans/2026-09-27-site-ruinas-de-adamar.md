# Site Ruínas de Adamar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site estático de apresentação do cenário Ruínas de Adamar com home de chamada para jogar e menus dropdown estilo portal de jogo anos 2000.

**Architecture:** Páginas HTML estáticas contendo só `<main>`; `js/site.js` injeta cabeçalho (logo + nav com dropdowns + botão Jogar) e rodapé a partir de uma árvore `NAV`, resolvendo caminhos por `data-root`. Um script Node sem dependências (`tools/check-site.mjs`) é o teste automatizado: valida estrutura, links, navegação e ausência de spoilers.

**Tech Stack:** HTML5, CSS3 (custom properties), JavaScript ES2020 sem módulos (funciona em `file://`), Google Fonts (Cinzel, Cinzel Decorative, IM Fell English), Node 24 para o checker, PowerShell/.NET System.Drawing para comprimir o mapa.

**Spec:** `docs/superpowers/specs/2026-09-27-site-ruinas-de-adamar-design.md`

## Global Constraints

- Sem build e sem dependências npm; o site abre direto de `file://` e de qualquer host estático.
- Todo texto em português do Brasil com acentuação preservada.
- Conteúdo **somente** adaptado/condensado de `C:\Users\Thalik\Desktop\Cofres Obsidian\RuinsOfAdamarObsidian\0.Adamar\` (somente leitura). Não inventar lore. Onde não houver fonte: bloco `.soon` "em breve".
- Fora do site: campanhas, NPCs/PCs, Masmorra de Sirelia, itens (Anel de Possessão só pode ser citado como aparece no cânone), DM Tools, Ideias Pendentes, fichas D&D.
- Paleta: carvão `#0e0d0c`, pedra `#1c1a17`, osso `#d9ccb0`, ouro velho `#a8884a`, vermelho seco `#6e1f1a`, brasa `#c2562b`.
- Chamada para jogar: WhatsApp via `SITE_CONFIG.whatsapp` em `js/site.js`.
- Sem scroll horizontal em 375px.

## Review Focus

1. **Aberto via `file://` ou em subpasta do host** — todos os links do menu e assets devem resolver; coberto pelo checker (links relativos) e `data-root` em toda página.
2. **Toque sem hover** — em telas touch/mobile o primeiro toque num item com submenu abre o submenu em vez de navegar; testado manualmente em 375px na Task 2.
3. **Teclado** — Tab chega aos subitens (`:focus-within`), Escape fecha o dropdown; testado na Task 2.
4. **Número de WhatsApp vazio ou formatado** (`""`, `"+55 (49) 99999-0000"`) — vazio gera `https://wa.me/?text=...` (usuário escolhe contato), formatado é reduzido a dígitos; teste no checker via `tools/whatsapp.test.mjs`.
5. **Tabelas e palavras longas no mobile** — tabelas dentro de `.table-wrap` com `overflow-x:auto`; checker falha se houver `<table>` fora de `.table-wrap`.

---

## Contrato de marcação (usado por todas as páginas)

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Magia — Ruínas de Adamar</title>
  <meta name="description" content="...">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
  <script src="../js/site.js" defer></script>
</head>
<body data-root="../" data-page="canone/magia.html">
  <main id="conteudo" class="page">
    <article class="scroll">
      <header class="page-head">
        <p class="kicker">Cânone</p>
        <h1>Magia</h1>
        <p class="lede">Frase de abertura.</p>
      </header>
      <section><h2>...</h2><p>...</p></section>
      <aside class="callout">...</aside>
      <div class="table-wrap"><table>...</table></div>
      <div class="soon"><p>Em breve.</p></div>
      <nav class="page-links"><a href="...">‹ Anterior</a><a href="...">Próxima ›</a></nav>
    </article>
  </main>
  <noscript><p class="noscript">Menu: <a href="../index.html">Início</a> ...</p></noscript>
</body>
</html>
```

Na raiz: `data-root="./"`, `href="css/style.css"`, `src="js/site.js"`. `data-page` = caminho relativo à raiz, igual ao `href` em `NAV`.

Componentes CSS: `.btn`, `.btn-primary`, `.btn-ghost`, `.card-grid`, `.card`, `.hero`, `.band` (seção da home), `.era-card`, `.ornament` (divisor), `.kicker`, `.lede`, `.callout`, `.soon`, `.table-wrap`, `.page-links`, `.map-figure`, `.timeline`.

---

### Task 1: Checker e utilitário do WhatsApp

**Files:**
- Create: `tools/check-site.mjs`
- Create: `tools/whatsapp.test.mjs`
- Create: `js/whatsapp.js` (função pura, também carregada pelo site)

**Interfaces:**
- Produces: `window.buildWhatsAppUrl(numero, mensagem) -> string` (em `js/whatsapp.js`, também exportada via `module.exports` quando existir). `node tools/check-site.mjs` retorna código 0/1.

- [ ] **Step 1: Teste do WhatsApp**

```js
// tools/whatsapp.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { buildWhatsAppUrl } = require('../js/whatsapp.js');
assert.equal(buildWhatsAppUrl('', 'Oi'), 'https://wa.me/?text=Oi');
assert.equal(buildWhatsAppUrl('+55 (49) 99999-0000', 'Quero jogar'), 'https://wa.me/5549999990000?text=Quero%20jogar');
assert.equal(buildWhatsAppUrl(undefined, ''), 'https://wa.me/');
console.log('whatsapp ok');
```

- [ ] **Step 2: Rodar e ver falhar** — `node tools/whatsapp.test.mjs` → erro "Cannot find module".

- [ ] **Step 3: Implementar**

```js
// js/whatsapp.js
(function (root) {
  function buildWhatsAppUrl(numero, mensagem) {
    var digits = String(numero || '').replace(/\D/g, '');
    var url = 'https://wa.me/' + digits;
    return mensagem ? url + '?text=' + encodeURIComponent(mensagem) : url;
  }
  root.buildWhatsAppUrl = buildWhatsAppUrl;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildWhatsAppUrl: buildWhatsAppUrl };
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Checker** — `tools/check-site.mjs` percorre todos os `.html` (exceto `docs/`, `tools/`) e falha se:
  - faltar `data-root` ou `data-page` no `<body>`, ou `data-page` ≠ caminho real do arquivo;
  - faltar `<main id="conteudo">` ou `<title>`;
  - algum `href`/`src` relativo (sem `http`, `mailto`, `#`) não existir em disco (ignorando `?`/`#`);
  - algum `href` em `NAV` (extraído de `js/site.js` por regex `href:\s*'([^']+)'`) não existir;
  - existir `<table>` fora de `<div class="table-wrap">`;
  - aparecer termo proibido (case-insensitive): `Masmorra de Sirelia`, `Mestre Perin`, `Mestre Thalik`, `Strahd`, `Lucia`, `Campanha 1`, `Espada Misteriosa`, `Totem Misterioso`;
  - aparecer `TODO`, `TBD` ou `lorem`.
  Imprime cada falha como `arquivo: motivo` e termina com `N páginas ok` ou código 1.

- [ ] **Step 5: Rodar** — `node tools/whatsapp.test.mjs` → `whatsapp ok`; `node tools/check-site.mjs` → falha (não há páginas/`site.js` ainda) de forma legível.

- [ ] **Step 6: Commit** — `git add tools js/whatsapp.js && git commit -m "chore: adiciona checker do site e utilitário do whatsapp"`

---

### Task 2: Casca do site — CSS, `site.js`, `index.html` mínimo

**Files:**
- Create: `css/style.css`, `js/site.js`, `index.html`

**Interfaces:**
- Consumes: `buildWhatsAppUrl` (Task 1) — `site.js` injeta `<script src="{root}js/whatsapp.js">` não é necessário: cada página carrega `whatsapp.js` antes de `site.js` (ambos `defer`).
- Produces: `SITE_CONFIG`, `NAV`; qualquer elemento `[data-jogar]` recebe `href` do WhatsApp e `target="_blank" rel="noopener"`.

- [ ] **Step 1: `js/site.js`**

```js
(function () {
  var SITE_CONFIG = {
    whatsapp: {
      numero: '', // ex.: '+55 49 99999-0000' — vazio abre o WhatsApp para escolher o contato
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
  // renderHeader(): logo (link index), botão .nav-toggle (aria-expanded), <ul class="nav">
  //   item com children => <li class="has-sub"><button class="nav-top" aria-expanded>label</button><ul class="sub">…</ul></li>
  //   item ativo (data-page) e seu pai recebem .is-active e aria-current="page"
  //   último <li class="nav-cta"><a class="btn btn-primary" data-jogar>⚔ Jogar</a></li>
  // renderFooter(): nome, "Um cenário de Thalik Bussacro", links Spotify/Pinterest, botão Jogar
  // Comportamento: hover abre via CSS (@media (hover:hover)); clique no .nav-top alterna .open (toque/mobile);
  //   Escape fecha todos e devolve foco; clique fora fecha; .nav-toggle abre/fecha o menu mobile.
  // Por fim: document.querySelectorAll('[data-jogar]') → href = buildWhatsAppUrl(...), target _blank, rel noopener.
})();
```

O arquivo final implementa exatamente os comentários acima com DOM puro (`document.createElement`), inserindo o header como primeiro filho do `<body>` e o footer como último.

- [ ] **Step 2: `css/style.css`** — tokens da paleta em `:root`; fundo carvão com `radial-gradient` + ruído SVG inline (`data:` URI feTurbulence); cabeçalho com logo em Cinzel Decorative, gradiente osso→ouro em `background-clip:text`, sombra gravada; nav de "pedra" (gradiente `#2a2622`→`#161412`, bordas ouro velho 1px em cima/baixo); `.sub` escondido (`visibility:hidden; opacity:0; transform:translateY(-4px)`) e revelado em `@media (hover:hover){ .has-sub:hover .sub }`, `.has-sub:focus-within .sub`, `.has-sub.open .sub`; `.scroll` com borda dupla ouro, cantos ornamentais via `::before/::after`, fundo pedra; corpo IM Fell English 1.15rem/1.7 osso; `@media (max-width: 860px)` nav vira coluna oculta até `.nav-open`, `.sub` estático em acordeão; `@media (prefers-reduced-motion: reduce)` zera transições; todos os componentes do contrato.

- [ ] **Step 3: `index.html` mínimo** — seguindo o contrato, com `<script src="js/whatsapp.js" defer></script>` antes de `site.js`, hero com h1 e um `<a class="btn btn-primary" data-jogar>`.

- [ ] **Step 4: Verificar** — `node tools/check-site.mjs` passa só com erros de links do NAV para páginas ainda inexistentes (esperado). Servir com `python -m http.server 8080` e no navegador: header renderiza, dropdown abre no hover, Tab alcança subitens, Escape fecha, 375px mostra hambúrguer e acordeão, botão Jogar aponta para `https://wa.me/?text=...`. Console sem erros.

- [ ] **Step 5: Commit** — `git commit -m "feat: adiciona casca do site com cabeçalho, menu e rodapé"`

---

### Task 3: Mapa comprimido

**Files:** Create: `img/mapa-adamar.jpg`, `img/mapa-adamar-grande.jpg`

- [ ] **Step 1** — PowerShell com `System.Drawing`: carregar `6.Anexos/Mapa de Adamar.png`, redimensionar para 1600px e 3200px de largura (HighQualityBicubic), salvar JPEG qualidade 82.
- [ ] **Step 2** — Conferir tamanhos: 1600 < 600 KB, 3200 < 2 MB (baixar qualidade se preciso). Abrir a imagem e confirmar visualmente.
- [ ] **Step 3: Commit** — `git commit -m "feat: adiciona mapa de adamar comprimido"`

---

### Task 4: Home completa

**Files:** Modify: `index.html`

Seções (fonte: `Ruínas de Adamar.md`, `Map of Content.md`, Cânone):
1. `.hero` — kicker "Um cenário de RPG livre de sistema"; h1 "Ruínas de Adamar"; frase "Adamar é um mundo brutal e simples."; parágrafo "Brutal porque o frio importa…"; botões Jogar (`data-jogar`) e "Conhecer o mundo" (`mundo/visao-geral.html`).
2. `.band` "O que é" — condensação dos parágrafos "Simples porque…" e "A magia existe…" + "É um mundo que se parece com a realidade física antes de se permitir qualquer fantasia. Mas se permite."
3. `.band` "Os pilares" — `.card-grid` com 6 cards linkando para `canone/*.html`, texto = bullets de "Como o mundo funciona".
4. `.band` "Três eras" — 3 `.era-card` (Novo Mundo marcado "cenário padrão") com texto da seção Eras.
5. `.band` "Qualquer personagem cabe" — condensação de "Um mundo grande o bastante…" + chamada para `personagens/criando.html`.
6. `.band` "Recursos" — cards: Mapa (`mundo/geografia.html`), Cânone, Crônicas, Linha do Tempo, Playlist (Spotify, externo), Pinterest (externo).
7. `.band.cta-final` — "A mesa está posta." + botão Jogar.

- [ ] Implementar, rodar checker, ver no navegador desktop e 375px, commit `feat: adiciona página inicial de apresentação`.

---

### Task 5: O Mundo (4 páginas)

**Files:** Create `mundo/visao-geral.html`, `mundo/eras.html`, `mundo/linha-do-tempo.html`, `mundo/geografia.html`

Fontes: `Ruínas de Adamar.md` (visão geral completa, sem a seção Pinterest), `Eras/*.md` + seção Eras de `Ruínas de Adamar.md`, `Linha do Tempo.md` (lista `.timeline`, cada `##### ` vira `<li><span class="date">…</span><h3>…</h3><p>…</p></li>`), `Adamar.md` + `Roestia.md` + `Indacor.md` (só descrição pública) + `.map-figure` com link para a versão grande. Referências com crase (`` `Magia` ``) viram links para páginas do site quando existirem.

- [ ] Ler cada fonte, escrever a página, rodar checker, conferir no navegador, commit `feat: adiciona páginas de o mundo`.

---

### Task 6: Cânone (6 páginas)

**Files:** Create `canone/{materialidade,magia,entremundos,forasteiros,masmorras,divindades}.html`

Fonte: nota homônima em `0.Lore/0.Cânone/`, texto integral com formatação limpa (remover frontmatter, `## Imagens` vazias). Em Forasteiros, o texto de origem tem um trecho embaralhado no início (bullet "Destruição e maldade intrínseca" partido) — reunir o bullet no lugar correto da lista "Por que invadem" sem alterar palavras. Divindades: panteões em `.table-wrap`. `.page-links` encadeando as 6 na ordem do menu.

- [ ] Escrever, checker, navegador, commit `feat: adiciona páginas do cânone`.

---

### Task 7: Personagens e À Mesa (5 páginas)

**Files:** Create `personagens/criando.html`, `personagens/fe.html`, `mesa/regras.html`, `mesa/sugestoes.html`, `mesa/sessao-zero.html`

- `criando.html`: "Um mundo grande o bastante para qualquer personagem" (Ruínas de Adamar.md) + "Tecnologia e limites do humano" e "Corpo e ferimentos" (Materialidade) como "o que esperar".
- `fe.html`: primeiros parágrafos de Divindades (sobre os deuses e a magia divina) + tabela do panteão oficial de Roestia + links para Divindades.
- `regras.html`: seção "Livre de sistema" (o cenário não é um sistema; resume exigências de coerência de Ruínas de Adamar.md) + "Em mesas GURPS" com a lista de Regras GURPS.md (TL 3, aptidão mágica máxima 0, mana muito baixo, livros).
- `sugestoes.html`, `sessao-zero.html`: header + `.soon` "Esta seção está sendo escrita pelo narrador." + botão Jogar.

- [ ] Escrever, checker, navegador, commit `feat: adiciona páginas de personagens e da mesa`.

---

### Task 8: Crônicas (4 páginas)

**Files:** Create `cronicas/{mito-da-criacao,praga-vermelha,vinda-para-roestia,contos-de-invasoes}.html`

Fonte: `0.Lore/1.Histórias/*.md` e `0.Lore/3.Obras/Contos de Invasões.md`, texto integral in-universe com tipografia de pergaminho (`.scroll.chronicle`, capitular na primeira letra). Antes de publicar, ler cada texto e remover apenas trechos que citem campanhas/PCs/NPCs (checker cobre termos conhecidos).

- [ ] Escrever, checker, navegador, commit `feat: adiciona crônicas`.

---

### Task 9: Verificação final e README

**Files:** Create `README.md`

- [ ] `node tools/check-site.mjs` → `20 páginas ok` (21 com index). `node tools/whatsapp.test.mjs` → ok.
- [ ] Navegador em http.server: percorrer todas as páginas pelo menu, desktop e 375px, console limpo, sem scroll horizontal (`document.documentElement.scrollWidth <= innerWidth`).
- [ ] README: como abrir localmente, onde trocar o número do WhatsApp (`js/site.js` → `SITE_CONFIG`), como adicionar página (arquivo + entrada em `NAV`), como hospedar (GitHub Pages: push + Settings › Pages; ou Render static site).
- [ ] Commit `docs: adiciona readme`.
