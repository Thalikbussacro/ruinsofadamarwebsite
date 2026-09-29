# Ruínas de Adamar — site

Site estático de apresentação do cenário de RPG livre de sistema "Ruínas de Adamar": o mundo, o cânone, como criar personagens, como jogar à mesa e as crônicas do cenário. Não é uma ferramenta de mesa (sem fichas, NPCs de campanha ou dados de sessão) — é a vitrine pública do cenário.

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
mesa/                À Mesa (regras, sugestões aos jogadores, sessão zero)
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
js/criador.js        página do criador de personagem (mesa/criador.html)
js/dados-gurps.js    GERADO a partir de data/gurps/ — não editar à mão
data/gurps/          base de conhecimento GURPS em JSON (fonte oficial)
referencias/         PDFs de referência, só local (fora do git)
data-local/          base completa com estatísticas do livro, só local (fora do git)
img/                 imagens (mapa de Adamar)
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

- `equipamento.json`: armas, armaduras, escudos e equipamento variado, com NT, página e marcação para Adamar. Traz o **preço** (em coroas, só dos itens de Adamar), mas **sem as demais estatísticas** (dano, peso, RD): elas ficam em `data-local/gurps/equipamento-completo.json`, fora do git, porque a política da Steve Jackson Games não permite publicar as tabelas. Para refazer as duas versões a partir das transcrições: `node tools/importar-equipamento.mjs <pasta-das-secoes>` (ou `--precos` para só atualizar os preços); depois `node tools/estruturar-armas.mjs` estrutura os modos de ataque das armas na base local.

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

Confirma, para todas as páginas: `data-root`/`data-page` corretos, `<main id="conteudo">`, `<title>`, links e imagens existentes em disco, tabelas dentro de `.table-wrap`, ausência de termos/marcadores proibidos, e que `js/whatsapp.js` carrega antes de `js/site.js`. Também confere que todo `href` usado em `NAV` (`js/site.js`) existe em disco. Saída esperada com o site completo: `26 páginas ok` (sem falhas).

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
node tools/gerar-dados.mjs --check
```

São os testes automatizados do próprio checador e do utilitário de WhatsApp — devem terminar com `check-site self-test ok`, `whatsapp ok` e `jogar ok`.

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
