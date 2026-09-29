# Enriquecimento dos itens (perícias, traços e equipamento)

Hoje cada item das listas tem só um `resumo` de uma linha (35 a 60 caracteres em média). O objetivo é que todo item — livre, com o narrador ou fora de Adamar — ganhe uma explicação de verdade: como funciona, quando se usa, exemplos na mesa e o que significa no cenário.

**Situação em 29/09/2026: concluído.** Os 1097 itens têm `descricao` e `exemplos` (a maioria também `em_adamar`, `dica_mesa` e `relacionados`), e 1049 estão vinculados ao GCS (ver abaixo).

Andamento: `node tools/enriquecimento.mjs` (resumo por fatia), `node tools/enriquecimento.mjs P1` (itens pendentes de uma fatia) e `node tools/enriquecimento.mjs P1 --json` (os mesmos itens em JSON, para escrever).

## Onde ficam os textos

Cada fatia tem um arquivo em `data/gurps/enriquecimento/<FATIA>.json`, no formato `{ "lista": "pericias", "itens": { "<id>": { descricao, exemplos, em_adamar, dica_mesa, relacionados } } }`. As listas (`pericias.json` etc.) continuam enxutas; `tools/gerar-dados.mjs` junta os textos aos itens, valida (campo desconhecido, id inexistente, relacionado inexistente, descrição curta) e grava tudo em `js/dados-gurps.js`. Para mudar um texto, edite o arquivo da fatia e rode o gerador.

No site, `js/detalhes.js` (`window.ItemUI`) mostra cada item como um **card compacto** (ícone, nome, custo ou preço, status em Adamar, resumo de duas linhas) e, ao clicar, abre a **janela de detalhes**: descrição, "Na mesa", "Em Adamar", dica, relacionados clicáveis, versões, efeitos na ficha e a ficha técnica (página, pré-definido, preço, GCS). Vale nas listas de À Mesa (o endereço `#id` abre o item direto, dá para mandar o link), no catálogo do criador (com o botão "Adicionar à ficha") e nos nomes dos itens escolhidos no criador e na ficha completa.

Campos já previstos para o futuro, sem mudar o código: `raridade` (texto; aparece no card e na janela) e `imagem` (caminho a partir da raiz do site; miniatura no card e imagem grande na janela). Basta acrescentar ao item, direto na lista ou num arquivo de enriquecimento (nesse caso, incluir o campo em `CAMPOS_ENRIQUECIMENTO`, em `tools/gerar-dados.mjs`).

## Vínculo com o GCS

`data/gurps/gcs.json` liga cada item nosso ao item correspondente do GCS (GURPS Character Sheet), Basic Set: `id` estável do GCS, `nome` em inglês e `ref` (página do Basic Set em inglês, que não bate com a da edição brasileira). Nas listas aparece como "GCS: Area Knowledge (B176)", e a busca também acha pelo nome em inglês.

- `node tools/gcs.mjs conferir` confere o vínculo contra a biblioteca local do GCS (Master Library; ou `GCS_BIBLIOTECA=<pasta>`).
- `node tools/gcs.mjs candidatos <pasta>` gera as listas lado a lado, nossas e do GCS, para vincular itens novos.
- Sem vínculo (48): ataques naturais e desarmados (soco, chute, presas…), armaduras de cavalo, alguns traços sem equivalente direto no Basic Set (Arrebatador, Interposição, Defesas Ampliadas, Favor, Grupo de Contato…) e três perícias (Captação, Golpe Debilitante, Perícia Abrangente).

## Campos novos

O `resumo` continua curto, porque é ele que aparece nas listas e nos cards do criador. Os campos novos são opcionais no gerador e aparecem ao abrir o item.

| Campo | O que é | Tamanho |
|---|---|---|
| `descricao` | Como o item funciona, com as nossas palavras: o que cobre, o que não cobre, com o que costuma ser confundido e os pontos de regra que importam na mesa (sempre citando a página em `ref`). | 1 a 3 parágrafos (mín. 200 caracteres) |
| `exemplos` | Situações de uso na mesa, em lista. Podem ser inventadas: "atravessar o rio cheio a nado com a mochila", "convencer o guarda a abrir o portão depois do toque de recolher". | 2 a 4 frases |
| `em_adamar` | Por que o item é livre, com o narrador ou fora do cenário, e como aparece em Adamar. Só com base no que já está no cânone do site; sem base, o campo fica de fora. | 1 a 3 frases |
| `dica_mesa` | Opcional. Conselho prático para o jogador ou o narrador (ex.: "combine com o narrador o que conta como situação de estresse"). | 1 a 2 frases |
| `relacionados` | Opcional. `id`s de itens que costumam andar juntos ou que se confundem (ex.: Furtividade ↔ Camuflagem). | lista |

Um item conta como feito quando tem `descricao` (≥ 200 caracteres) e pelo menos dois `exemplos`.

## Regras do conteúdo

1. **Palavras próprias, nunca o texto do livro.** O repositório é público e o *Módulo Básico* é protegido por direitos autorais: nada de copiar ou parafrasear de perto parágrafos do livro. Explicar a regra com as nossas palavras e apontar a página (`ref`) está certo; transcrever não está. Isso vale também para `descricao` longas: resumir e explicar, não reproduzir.
2. **Sem tabelas de números do livro.** Dano, peso, RD e tabelas continuam fora da versão pública (ver README, "Números de combate"). A `descricao` de uma arma fala de uso, estilo, alcance em palavras, prós e contras, não dos números.
3. **Exemplos podem ser inventados**; o cenário não. Exemplos são situações genéricas de fantasia medieval ou usam lugares, povos e épocas que já estão no site. Nada de criar lore nova de Adamar (nomes de reinos, deuses, eventos) sem o narrador. Na dúvida, exemplo genérico.
4. **Itens fora de Adamar também ganham texto.** A `descricao` explica o traço normalmente e o `em_adamar` diz por que não entra (ex.: tecnologia acima de NT3, magia fora do padrão do cenário) ou quando o narrador poderia abrir exceção, se o cânone indicar.
5. **Português do Brasil, tom de guia de mesa**, falando com o jogador ("você"), sem jargão sem explicar.
6. **Validação:** depois de cada fatia, rodar `node tools/gerar-dados.mjs`, os testes e `node tools/check-site.mjs`, e seguir a rotina de publicação sem números do README.

## Fatias

Cada fatia é um commit (`feat: enriquece <fatia>`). Ordem de prioridade: o que a mesa mais usa primeiro.

### Pré-requisito
- [x] **S0 — Estrutura:** aceitar os campos novos em `tools/gerar-dados.mjs` (tipos e tamanhos), mostrar `descricao`, `exemplos`, `em_adamar` e `dica_mesa` ao abrir o item nas listas (`js/pericias.js`), na janela de escolha do criador e na ficha completa; testes.

### Perícias (253)
- [x] **P1** — livres A–C (55)
- [x] **P2** — livres D–L (60)
- [x] **P3** — livres M–R (44)
- [x] **P4** — livres S–Z (21)
- [x] **P5** — com o narrador e fora de Adamar (73)

### Vantagens e qualidades (230)
- [x] **V1** — livres e qualidades (70)
- [x] **V2** — com o narrador (39)
- [x] **V3** — fora de Adamar A–L (63)
- [x] **V4** — fora de Adamar M–Z (58)

### Desvantagens e peculiaridades (222)
- [x] **D1** — peculiaridades (35)
- [x] **D2** — livres A–E (51)
- [x] **D3** — livres F–M (39)
- [x] **D4** — livres N–Z (42)
- [x] **D5** — com o narrador e fora de Adamar (55)

### Equipamento (392)
- [x] **E1** — armas corpo a corpo (67)
- [x] **E2** — armas de distância e pesadas (52)
- [x] **E3** — armas de fogo (50)
- [x] **E4** — armaduras (81)
- [x] **E5** — escudos e armaduras de cavalo (22)
- [x] **E6** — equipamento variado A–L (72)
- [x] **E7** — equipamento variado M–Z (48)

Total: 1097 itens em 21 fatias, mais a S0.

## Exemplo de item enriquecido (formato, não conteúdo final)

```json
{
  "id": "natacao",
  "nome": "Natação",
  "resumo": "Nadar e não se afogar.",
  "descricao": "Cobre nadar com técnica, boiar, mergulhar e se manter à tona em água agitada. Quem não tem a perícia ainda pode tentar pelo valor pré-definido, mas cansa mais rápido e se arrisca mais quando a água está fria, funda ou com correnteza. Carga pesa muito: armadura e mochila tornam o teste bem mais difícil, e largar o equipamento costuma ser a decisão que salva o personagem. Regras de afogamento e fadiga na água: ver a página indicada.",
  "exemplos": [
    "Atravessar um rio cheio segurando a corda para os companheiros.",
    "Mergulhar para recuperar algo que caiu do barco.",
    "Tirar da água alguém que está se afogando sem ser puxado junto."
  ],
  "dica_mesa": "Antes de pular na água, diga ao narrador o que o personagem está carregando."
}
```
