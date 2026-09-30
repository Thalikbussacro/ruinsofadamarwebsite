# Ruínas de Adamar — site

Site estático do cenário de RPG "Ruínas de Adamar", jogado com GURPS 4e: o mundo, o cânone, como criar personagens, como jogar à mesa e as crônicas do cenário. Além da vitrine, traz ferramentas de mesa que rodam só no navegador (sem servidor e sem conta):

- **Cofre de personagens** (`mesa/personagens.html`): grade de personagens estilo seleção de MMO, com painel resumido e ficha completa em tela cheia (menu de seções fixo no computador e em gaveta no celular; o equipamento separa armas roláveis, armadura e mochila). Cada personagem fica guardado no `localStorage` do navegador; dá para baixar e carregar o `.json`, enviar pelo WhatsApp e imprimir em A4.
- **Criador de personagem** (`mesa/criador.html`): em dois painéis, estilo GCS (a ficha viva à esquerda, as etapas em abas com os catálogos à direita; arrastar um item para a ficha ou usar o +; no celular, alterna entre Ficha e Montar), com pontos como saldo (vantagens custam, desvantagens devolvem, pode sobrar), modelos prontos, janela de escolha para traços com versões, níveis ou custo variável, validação contra as regras e ícone por item.
- **Na ficha, durante o jogo:** situações (bônus que só valem em certos momentos) se ligam e desligam e entram nas rolagens; cada item tem local (numa mão, nas duas, nas costas, no cinto, vestido, levado, dentro de outro, em casa) e contador de usos; um boneco mostra a proteção de cada parte do corpo e o que está nas mãos, costas e cinto (uma coisa por mão: pôr outra tira a primeira); tabela de carga e força, locais de acerto, pontos por parte, nível relativo das perícias, retrato e qualidade dos itens.
- **Jogando** (botão no topo da ficha): tudo numa tela, estilo MMO — retrato, PV/PF, situações, o boneco (clicar na arma rola), barra de ação com cada arma (atacar, dano por modo, aparar) e as defesas, atributos e perícias para rolar, o histórico de rolagens e o inventário em quadradinhos (clicar gasta um consumível).
- **Protótipo do jogo** (dentro do modo Jogando; regras próprias em `data/jogo/`, motor em `js/simulacao.js`, design em `docs/jogo/design.md`): relógio e clima por bioma e estação, fome, sede, cansaço e temperatura do corpo (roupa, chuva, abrigo), saúde por parte do corpo (ferimentos que sangram, infeccionam e curam; enfaixar, costurar, tala), inventário em grade com encaixe automático, desgaste e conserto de armas, e receitas (lenha, água fervida, bandagem, tala, carne assada…).
- **Em jogo** (na ficha): PV, PF, coroas, pontos ganhos (com histórico e desfazer), notas e **diário da sessão** (entradas livres e rolagens registradas com um clique).
- **Rolador de dados**: clique em atributo, perícia, defesa ou dano na ficha para rolar 3d com sorteio criptográfico; modificador de situação e resultado explicado (margem, crítico).
- **Ficha de combate**: armas, NH, dano, defesas, carga e proteção, mais ordem de ação e manobras. Usa os números de dano, peso e proteção de `data/gurps/equipamento.json` e `tabela-dano.json`.
- **Consulta rápida de combate** (`mesa/combate.html`): manobras, ataque, defesas, dano, ferimentos e fadiga, com a página do livro.

Sem build e sem dependências de npm. É só HTML, CSS e JavaScript puro; o site abre direto de `file://` ou de qualquer host estático.

## Abrir localmente

A forma mais simples é dar duplo clique em `index.html` — o site abre no navegador e funciona normalmente a partir do `file://`.

Se preferir servir por HTTP (recomendado para testar como em produção):

```
python -m http.server 8080
```

e acesse `http://localhost:8080/` no navegador.

## Estrutura

```
index.html          página inicial
jogar.html          formulário "Quero jogar" (criação de personagem → WhatsApp)
mundo/               O Mundo (visão geral, eras, linha do tempo, geografia)
canone/               Cânone (materialidade, magia, entremundos, forasteiros, masmorras, divindades)
personagens/          Personagens (criando personagem, fé e panteões)
mesa/                À Mesa (regras, combate, listas GURPS, criador, cofre, sessão zero)
cronicas/            Crônicas (histórias do cenário)
css/style.css        estilo único do site
js/site.js           casca do site (cabeçalho, menu, rodapé, botões "Jogar") e SITE_CONFIG
js/whatsapp.js       utilitário para montar a URL do WhatsApp
js/jogar.js          lógica do formulário e montagem da mensagem da ficha
js/pericias.js       listas filtráveis de GURPS (perícias, vantagens, desvantagens)
js/gurps-calculo.js  cálculos de ficha (custos, secundárias, carga, perícias)
js/ficha-gurps.js    página de atributos com calculadora
js/criador-ficha.js  lógica do criador de personagem (custo, NH, limites, avisos, texto da ficha)
js/gurps-efeitos.js  texto e etiqueta (aplicado, sempre, condicional, regra) dos efeitos dos traços
js/personagens-salvos.js  personagens guardados no navegador (localStorage)
js/personagens.js    Cofre de personagens: grade estilo seleção de MMO, painel da ficha e ficha completa (mesa/personagens.html)
js/icones.js         desenha o ícone de um item (window.iconeSvg)
js/detalhes.js       itens em card compacto + janela de detalhes (window.ItemUI): listas, criador e ficha
js/boneco.js         o boneco do personagem: proteção por parte do corpo e os lugares (mãos, costas, cinto)
js/simulacao.js      motor do protótipo do jogo: tempo, clima, necessidades, saúde, grade, desgaste, receitas
data/jogo/           regras próprias do jogo (proposta): saúde, necessidades, mundo, materiais, receitas
js/criador.js        página do criador de personagem (mesa/criador.html)
js/combate.js        consulta rápida de combate (manobras e iniciativa de regras.json)
js/dados-gurps.js    GERADO a partir de data/gurps/ — não editar à mão
js/dados-textos.js   GERADO: descrições e exemplos dos itens, carregado depois da página
data/gurps/          base de conhecimento GURPS em JSON (fonte oficial)
data/gurps/enriquecimento/  textos longos de cada item, um arquivo por fatia (ver docs/enriquecimento-itens.md)
data/gurps/gcs.json  vínculo de cada item com o GCS (id, nome em inglês, página do Basic Set)
data/adamar/         dados do cenário (modelos prontos de personagem)
referencias/         PDFs de referência, só local (fora do git)
data-local/          base completa com estatísticas do livro, só local (fora do git)
img/                 imagens (mapa de Adamar; img/arte: pinturas em domínio público, créditos em creditos.html)
tools/               checador do site e testes
```

## Configurar o WhatsApp e os links do rodapé

Tudo fica em `SITE_CONFIG`, no topo de `js/site.js`:

```js
var SITE_CONFIG = {
  whatsapp: {
    numero: '+55 49 99948-6398',   // vazio abre o WhatsApp para escolher o contato
    mensagem: 'Olá! Vi o site de Ruínas de Adamar e quero jogar.'
  },
  spotify: 'https://open.spotify.com/playlist/...',
  pinterest: 'https://br.pinterest.com/...'
};
```

- `whatsapp.numero`: aceita qualquer formatação com dígitos, espaços, parênteses e hífen (ex.: `'+55 49 99999-0000'`). Só os dígitos são usados para montar o link `wa.me`. Deixe em branco (`''`) para que o WhatsApp abra sem um contato pré-definido (o visitante escolhe para quem enviar).
- Todo botão "Jogar" leva a `jogar.html`. Lá o jogador responde cinco etapas (era, três perguntas sobre o mundo, origem, personagem, envio) e o formulário abre o WhatsApp com a ficha já escrita. As opções e textos do formulário ficam direto em `jogar.html`; a formatação da mensagem fica em `buildCharacterMessage`, em `js/jogar.js`.
- `whatsapp.mensagem`: texto usado no link "fale direto com o narrador" (sem formulário).
- `spotify` / `pinterest`: URLs mostradas no rodapé.

Depois de editar, recarregue qualquer página — todas usam o mesmo `js/site.js`.

## Base de conhecimento GURPS

As listas de perícias, vantagens e desvantagens vêm de `data/gurps/*.json`:

- `livros.json`: os livros de referência (título, ISBN, SHA-256 do PDF). Ver também `docs/referencias.md`.
- `regras.json`: atributos, características secundárias, carga, custo de perícias, aparência, idiomas, culturas, riqueza, status, hierarquia, reputação e o limite de desvantagens (os números da criação de personagem). `js/gurps-calculo.js` faz as contas a partir dele.
- `pericias.json`, `vantagens.json`, `desvantagens.json`: um item por traço, com `id` estável, `nome`, custo ou atributo/dificuldade, `adamar` (`livre`, `narrador` ou `nao`), `resumo` e `ref` (`livro` + `pagina` do livro impresso).

Para mudar algo (um resumo, uma marcação para Adamar, um item novo), edite o JSON e rode:

```
node tools/gerar-dados.mjs
```

- `tabela-dano.json` (só quando publicada com `--publicar`): dano básico (GdP/GeB) por ST, usado na ficha de combate.
- `icones.json`: o desenho (SVG 24×24, só contorno) de cada ícone usado no campo `icone` das listas. Vem do [Tabler Icons](https://tabler.io/icons) (MIT), com o link de origem de cada um; os `custom:…` são desenhos próprios em `data/icones-proprios.json`. Depois de trocar ícones, rode `node tools/icones.mjs` e `node tools/gerar-dados.mjs`.
- `equipamento.json`: armas, armaduras, escudos e equipamento variado, com NT, página e marcação para Adamar. Traz o **preço** (em coroas) dos itens de Adamar. `node tools/importar-equipamento.mjs --publicar` acrescenta também **peso**, **modos de ataque** (dano, alcance, aparar, ST mínima, precisão), **proteção** das armaduras, **bônus de defesa** dos escudos e a tabela de dano (`tabela-dano.json`); a ficha de combate do site usa esses números quando eles estão presentes e funciona sem eles. Publicá-los no repositório é decisão do narrador. A transcrição completa do livro fica em `data-local/gurps/equipamento-completo.json`, fora do git. Para refazer a partir das transcrições: `node tools/importar-equipamento.mjs <pasta-das-secoes>`, depois `node tools/estruturar-armas.mjs` (estrutura os modos de ataque na base local) e por fim `node tools/importar-equipamento.mjs --publicar` (leva preço, peso e números de combate para a base pública, junto com a tabela de dano).

- `enriquecimento/*.json`: descrição, exemplos na mesa, o que o item é em Adamar, dica e itens relacionados, escritos com palavras próprias (nunca texto do livro). O gerador junta aos itens. Andamento e fatias: `node tools/enriquecimento.mjs` e `docs/enriquecimento-itens.md`.
- `gcs.json`: o item correspondente no GCS (GURPS Character Sheet). Conferir com `node tools/gcs.mjs conferir` (lê a biblioteca do GCS instalada na máquina).

Os campos `custo_estruturado` (traços) e `predefinidos` (perícias) são gerados a partir do texto por `node tools/custo-estruturado.mjs` e `node tools/predefinidos.mjs`; rode de novo se mudar o texto de custo ou de pré-definido.

O gerador valida os dados (ids repetidos, livro inexistente, página inválida, valores fora do padrão) e grava `js/dados-gurps.js`, que é o que as páginas carregam. `node tools/gerar-dados.mjs --check` só confere se o arquivo gerado está em dia.

## Adicionar uma página

1. Copie um arquivo `.html` existente na mesma pasta de destino (por exemplo, para uma nova crônica, copie `cronicas/mito-da-criacao.html`) — isso já traz a estrutura de `<head>`, os `<script>` do rodapé e a moldura de conteúdo certas.
2. Ajuste no novo arquivo:
   - `<title>` e a meta `description`.
   - o atributo `data-page` no `<body>` para o caminho relativo à raiz do novo arquivo (ex.: `data-page="cronicas/nova-historia.html"`).
   - o conteúdo dentro de `<main id="conteudo">`.
3. Adicione uma entrada em `NAV`, em `js/site.js`, dentro da seção correspondente (ou crie uma nova seção), com `label` e `href` (caminho relativo à raiz, igual ao `data-page`).
4. Rode o checador (veja abaixo) para confirmar que a página nova está correta.

## Como checar o site

```
node tools/check-site.mjs
```

Confirma, para todas as páginas: `data-root`/`data-page` corretos, `<main id="conteudo">`, `<title>`, links e imagens existentes em disco, tabelas dentro de `.table-wrap`, ausência de termos/marcadores proibidos, e que `js/whatsapp.js` carrega antes de `js/site.js`. Também confere que todo `href` usado em `NAV` (`js/site.js`) existe em disco. Saída esperada com o site completo: `31 páginas ok` (sem falhas).

```
node tools/check-site.test.mjs
node tools/whatsapp.test.mjs
node tools/jogar.test.mjs
node tools/gerar-dados.test.mjs
node tools/gurps-calculo.test.mjs
node tools/importar-equipamento.test.mjs
node tools/custo-estruturado.test.mjs
node tools/predefinidos.test.mjs
node tools/icones-e-grade.test.mjs
node tools/importar-efeitos.test.mjs
node tools/estruturar-armas.test.mjs
node tools/criador-ficha.test.mjs
node tools/gurps-efeitos.test.mjs
node tools/personagens-salvos.test.mjs
node tools/icones.test.mjs
node tools/versionar.test.mjs
node tools/versionar.mjs --check   # links de css/js com a versão certa (rode node tools/versionar.mjs antes de publicar)
node tools/gerar-dados.mjs --check
```

São os testes automatizados do próprio checador e do utilitário de WhatsApp — devem terminar com `check-site self-test ok`, `whatsapp ok` e `jogar ok`.

## Números de combate

Peso, dano, alcance, aparar, proteção e a tabela de dano por ST estão em `data/gurps/equipamento.json` e `data/gurps/tabela-dano.json`, publicados pelo narrador em 29/09/2026. Para refazê-los a partir da base local: `node tools/importar-equipamento.mjs --publicar`, depois `node tools/gerar-dados.mjs` e `node tools/versionar.mjs`. O site também funciona sem eles (mostra o dano como "GeB+1" e fica sem peso, carga e proteção).

## Cache

`node tools/versionar.mjs` põe `?v=<hash>` nos links de CSS e JS de todas as páginas, para o navegador (e o celular) pegar a versão nova depois de cada publicação. Rode antes de publicar; `--check` só confere.

## Hospedar

### GitHub Pages

1. Crie um repositório no GitHub e faça push deste projeto para ele.
2. No repositório, vá em **Settings › Pages**.
3. Em "Build and deployment", escolha **Deploy from a branch**, selecione o branch (ex.: `main`) e a pasta raiz (`/`).
4. Salve — o GitHub publica o site em poucos minutos no endereço indicado na própria página de Pages.

### Render (ou Netlify) como site estático

1. Crie um novo "Static Site" apontando para o repositório.
2. Não é necessário build command (deixe em branco).
3. Publish directory / diretório de publicação: raiz do repositório (`.` ou `/`).
4. Publique — o site é servido diretamente, sem etapa de build.
