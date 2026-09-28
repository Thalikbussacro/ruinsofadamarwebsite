# Site Ruínas de Adamar — Design

## Objetivo

Site público para apresentar o cenário **Ruínas de Adamar** (RPG livre de sistema, low dark fantasy) e convidar pessoas para jogar. Abre direto numa página de apresentação que desperta interesse e chama para jogar; menus e submenus dão acesso ao cenário, cânone, orientação de personagens e regras da mesa.

## Decisões

| Decisão | Escolha |
|---|---|
| Stack | HTML + CSS + JS puros, sem build, sem dependências de runtime |
| Estrutura | Multipágina estática; cabeçalho/rodapé injetados por `js/site.js` |
| Conteúdo | Adaptado/condensado **somente** do cofre Obsidian; nada de lore inventada |
| Páginas sem conteúdo no cofre | Existem com estrutura e aviso "em breve" |
| Spoilers | Só cânone público. Fora: campanhas, NPCs/PCs, Masmorra de Sirelia, itens, DM Tools, Ideias Pendentes, fichas D&D |
| Chamada para jogar | WhatsApp; link configurável em `SITE_CONFIG` no topo de `js/site.js` |
| Hospedagem | Qualquer host estático (GitHub Pages, Netlify, Render) |
| Idioma | Português do Brasil, acentuação preservada |

Fonte do conteúdo: `C:\Users\Thalik\Desktop\Cofres Obsidian\RuinsOfAdamarObsidian\0.Adamar\` (somente leitura).

## Estilo visual

Portal de jogo anos 2000 (Diablo II / Neverwinter) em chave low dark fantasy:

- **Cabeçalho**: faixa larga com logo tipográfico "Ruínas de Adamar" (Cinzel Decorative / Cinzel) gravado, subtítulo discreto.
- **Navegação**: barra horizontal "de pedra" abaixo do logo. Itens com submenu abrem painel dropdown no hover (e no foco via teclado). Botão destacado **Jogar** à direita.
- **Conteúdo**: moldura ornamentada (bordas duplas, cantos em ouro velho) sobre fundo carvão texturizado por gradientes/ruído CSS.
- **Paleta**: carvão `#0e0d0c`, pedra `#1c1a17`, osso/pergaminho `#d9ccb0`, ouro velho `#a8884a`, vermelho seco `#6e1f1a`, brasa `#c2562b` (uso mínimo). Dessaturado, sem neon.
- **Tipografia**: Cinzel (títulos/menu), IM Fell English (corpo), via Google Fonts.
- **Mobile**: menu vira botão hambúrguer; submenus em acordeão por toque. Sem scroll horizontal.
- **Acessibilidade**: navegação por teclado nos dropdowns, contraste AA no corpo do texto, `prefers-reduced-motion` respeitado.

## Mapa do site

```
index.html                      Início (apresentação + chamada)
mundo/visao-geral.html          O Mundo ▸ Visão geral
mundo/eras.html                 O Mundo ▸ Eras
mundo/linha-do-tempo.html       O Mundo ▸ Linha do Tempo
mundo/geografia.html            O Mundo ▸ Geografia (Roestia + mapa)
canone/materialidade.html       Cânone ▸ Materialidade
canone/magia.html               Cânone ▸ Magia
canone/entremundos.html         Cânone ▸ Entremundos
canone/forasteiros.html         Cânone ▸ Forasteiros
canone/masmorras.html           Cânone ▸ Masmorras
canone/divindades.html          Cânone ▸ Divindades
personagens/criando.html        Personagens ▸ Criando seu personagem
personagens/fe.html             Personagens ▸ Fé e panteões
mesa/regras.html                À Mesa ▸ Regras
mesa/sugestoes.html             À Mesa ▸ Sugestões aos jogadores (em breve)
mesa/sessao-zero.html           À Mesa ▸ Sessão zero (em breve)
cronicas/mito-da-criacao.html   Crônicas ▸ Mito da criação
cronicas/praga-vermelha.html    Crônicas ▸ A Praga Vermelha
cronicas/vinda-para-roestia.html Crônicas ▸ Vinda para Roestia
cronicas/contos-de-invasoes.html Crônicas ▸ Contos de Invasões
```

Nota de fonte por página: cada página interna vem de sua nota homônima no cofre. `personagens/criando.html` vem da seção "Um mundo grande o bastante para qualquer personagem" + "Tecnologia e limites do humano" (Materialidade). `personagens/fe.html` vem de Divindades (seção inicial + panteões resumidos). `mesa/regras.html` vem de "Regras GURPS" + princípio livre de sistema. Crônicas são textos in-universe; exibidos na íntegra se não contiverem spoilers de campanha, senão resumidos.

## Página inicial

1. **Hero**: logo, frase "Adamar é um mundo brutal e simples.", subtítulo curto, botão **Jogar** (WhatsApp) + botão secundário "Conhecer o mundo".
2. **O que é**: parágrafo condensado de "Ruínas de Adamar".
3. **Pilares**: cards para Materialidade, Magia, Forasteiros, Masmorras, Divindades, cada um linkando para sua página.
4. **Três Eras**: cards Novo Mundo (padrão), Alta Magia, Apocalipse.
5. **Qualquer personagem cabe**: arquétipos culturais, sem classes nem raças, livre de sistema.
6. **Recursos**: mapa, cânone, crônicas, playlist Spotify, Pinterest (links do "Map of Content").
7. **Chamada final**: bloco "A mesa está posta" com botão WhatsApp.

## Arquitetura

```
css/style.css     Tokens, layout, cabeçalho, nav/dropdowns, moldura, componentes, responsivo
js/site.js        SITE_CONFIG (whatsapp, links externos) + NAV (árvore do menu)
                  injeta <header>/<nav>/<footer>, marca página ativa, controla menu mobile
img/              logo/ornamentos (SVG inline no CSS quando possível), mapa comprimido
```

- Cada página tem `<body data-root="../">` (ou `"./"` na raiz) para `site.js` resolver caminhos relativos, funcionando tanto em subpasta de host quanto aberto via `file://`.
- Páginas contêm apenas `<main>` com o conteúdo; cabeçalho/rodapé vêm do JS. `<noscript>` mostra links básicos.
- Links `[[wikilink]]`/`` `Nome` `` do cofre viram links para a página correspondente quando ela existir; senão texto simples.

## Mapa

`6.Anexos/Mapa de Adamar.png` (32 MB) é convertido para JPEG/WebP ~2400px de largura (< 1,5 MB) em `img/mapa-adamar.jpg`, com clique para abrir em tamanho maior.

## Verificação

- Abrir todas as páginas num servidor local e no navegador: sem erros no console, sem links quebrados (script de checagem de links relativos).
- Hover/foco dos dropdowns no desktop; hambúrguer + acordeão em 375px de largura.
- Link do WhatsApp abre `https://wa.me/<numero>` com mensagem pré-preenchida.

## Fora do escopo

Busca, CMS, sincronização automática com o cofre, sistema de login, formulários com backend.
