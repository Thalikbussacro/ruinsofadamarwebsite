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
mundo/               O Mundo (visão geral, eras, linha do tempo, geografia)
canone/               Cânone (materialidade, magia, entremundos, forasteiros, masmorras, divindades)
personagens/          Personagens (criando personagem, fé e panteões)
mesa/                À Mesa (regras, sugestões aos jogadores, sessão zero)
cronicas/            Crônicas (histórias do cenário)
css/style.css        estilo único do site
js/site.js           casca do site (cabeçalho, menu, rodapé, botões "Jogar") e SITE_CONFIG
js/whatsapp.js       utilitário para montar a URL do WhatsApp
img/                 imagens (mapa de Adamar)
tools/               checador do site e testes
```

## Configurar o WhatsApp e os links do rodapé

Tudo fica em `SITE_CONFIG`, no topo de `js/site.js`:

```js
var SITE_CONFIG = {
  whatsapp: {
    numero: '',   // ex.: '+55 49 99999-0000' — vazio abre o WhatsApp para escolher o contato
    mensagem: 'Olá! Vi o site de Ruínas de Adamar e quero jogar.'
  },
  spotify: 'https://open.spotify.com/playlist/...',
  pinterest: 'https://br.pinterest.com/...'
};
```

- `whatsapp.numero`: aceita qualquer formatação com dígitos, espaços, parênteses e hífen (ex.: `'+55 49 99999-0000'`). Só os dígitos são usados para montar o link `wa.me`. Deixe em branco (`''`) para que o botão "Jogar" abra o WhatsApp sem um contato pré-definido (o visitante escolhe para quem enviar).
- `whatsapp.mensagem`: texto que já vem preenchido na conversa do WhatsApp.
- `spotify` / `pinterest`: URLs mostradas no rodapé.

Depois de editar, recarregue qualquer página — todas usam o mesmo `js/site.js`.

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

Confirma, para todas as páginas: `data-root`/`data-page` corretos, `<main id="conteudo">`, `<title>`, links e imagens existentes em disco, tabelas dentro de `.table-wrap`, ausência de termos/marcadores proibidos, e que `js/whatsapp.js` carrega antes de `js/site.js`. Também confere que todo `href` usado em `NAV` (`js/site.js`) existe em disco. Saída esperada com o site completo: `20 páginas ok` (sem falhas).

```
node tools/check-site.test.mjs
node tools/whatsapp.test.mjs
```

São os testes automatizados do próprio checador e do utilitário de WhatsApp — devem terminar com `check-site self-test ok` e `whatsapp ok`, respectivamente.

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
