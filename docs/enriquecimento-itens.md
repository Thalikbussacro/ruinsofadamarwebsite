# Enriquecimento dos itens (perícias, traços e equipamento)

Hoje cada item das listas tem só um `resumo` de uma linha (35 a 60 caracteres em média). O objetivo é que todo item — livre, com o narrador ou fora de Adamar — ganhe uma explicação de verdade: como funciona, quando se usa, exemplos na mesa e o que significa no cenário.

Andamento: `node tools/enriquecimento.mjs` (resumo por fatia) e `node tools/enriquecimento.mjs P1` (itens pendentes de uma fatia).

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
- [ ] **S0 — Estrutura:** aceitar os campos novos em `tools/gerar-dados.mjs` (tipos e tamanhos), mostrar `descricao`, `exemplos`, `em_adamar` e `dica_mesa` ao abrir o item nas listas (`js/pericias.js`), na janela de escolha do criador e na ficha completa; testes.

### Perícias (253)
- [ ] **P1** — livres A–C (55)
- [ ] **P2** — livres D–L (60)
- [ ] **P3** — livres M–R (44)
- [ ] **P4** — livres S–Z (21)
- [ ] **P5** — com o narrador e fora de Adamar (73)

### Vantagens e qualidades (230)
- [ ] **V1** — livres e qualidades (70)
- [ ] **V2** — com o narrador (39)
- [ ] **V3** — fora de Adamar A–L (63)
- [ ] **V4** — fora de Adamar M–Z (58)

### Desvantagens e peculiaridades (222)
- [ ] **D1** — peculiaridades (35)
- [ ] **D2** — livres A–E (51)
- [ ] **D3** — livres F–M (39)
- [ ] **D4** — livres N–Z (42)
- [ ] **D5** — com o narrador e fora de Adamar (55)

### Equipamento (392)
- [ ] **E1** — armas corpo a corpo (67)
- [ ] **E2** — armas de distância e pesadas (52)
- [ ] **E3** — armas de fogo (50)
- [ ] **E4** — armaduras (81)
- [ ] **E5** — escudos e armaduras de cavalo (22)
- [ ] **E6** — equipamento variado A–L (72)
- [ ] **E7** — equipamento variado M–Z (48)

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
