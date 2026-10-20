# Ícones SVG dos itens

Ferramentas para desenhar e revisar as ilustrações de `data/svgicons/` (uma por item de equipamento, nome igual ao `id`). As notas de cada ícone (suposições e pendências) estão em `data/svgicons/NOTAS.md`; itens que usam o SVG de outro estão em `data/svgicons/apelidos.json`. Depois de acrescentar ou renomear um SVG, rode `node tools/gerar-dados.mjs` para o item ganhar o campo `ilustracao` (a janela de detalhes do site mostra a imagem).

Precisa de Python 3 com `cairosvg` e `Pillow` (`pip install cairosvg pillow`). Rode tudo a partir da raiz do repositório.

## Revisar

- `python3 tools/icones-svg/render.py <id> [<id> ...]`: gera, numa pasta temporária fora do repositório (`<tmp>/icones-svg/`), os previews `preview/<id>-512.png`, `-dark.png` (sobre `#14110e`) e `-64.png`, e a folha `<id>-sheet.png` (512 sobre fundo escuro, 64 ampliado 4x e 64 real).
- `python3 tools/icones-svg/contato.py <saida.png> <id> [<id> ...]`: folha de contato de vários ícones (depois do `render.py`).

## Geradores

A maior parte dos ícones é escrita à mão. Algumas séries saem de scripts, para manter a mesma geometria entre peças parecidas; editar a forma-base e rodar o script regenera a série inteira (o script sobrescreve o SVG, então ajuste manual no SVG se perde).

- `bardas/`: armaduras de cavalo. `heads.py` (máscara, cabeça e pescoço) e `bodies.py` (parcial, completa, perneiras), com o cavalo de `base.py` e `gen.py`.
- `tronco-cabeca/items.py <id> ...`: armaduras de tronco e cabeça (silhueta de tronco comum em `lib.py`).
- `membros/items.py <id> ...`: mangas, perneiras, braçadeiras, luvas e calçados (`lib.py`, `feet.py`).
- `distancia/`: `bows.py` (arcos), `shields.py` (escudos leve, pequeno e grande), `capas.py`, `redes.py`, `laco.py`, `bola.py` (boleadeira), `funda.py`, `fusti.py` (fustíbalo), `arpao.py`; `rope.py` e `geo.py` são auxiliares.
- `hastes/`: armas de haste diagonais (`pole.py` + um script por item: `alab.py`, `bordao.py`, `glaive.py`, `justa.py`, `lanca.py`, `lancalonga.py`, `mhaste.py`, `nagi.py`), maça-estrela (`me.py`) e mangual de duas mãos (`m2.py`, com `flail.py`).
- `correntes/`: `kusari.py` e `nunchaku.py`, com os elos de `chain.py`.

Observação: o `cairosvg` herda `stroke-linecap="round"` do `<g>` pai mesmo quando o filho declara outro valor; desenhe corda tracejada e corrente fora de um `<g>` com linecap round.

## Checklist de revisão

- Dá para dizer o que é só pela silhueta no 64 px?
- Reconhecível sem legenda? Acessório ou peça solta: mostre em contexto mínimo (ex.: alavanca encaixada na besta). Kits: mostre 2 a 4 objetos típicos agrupados ou uma bolsa/caixa aberta mostrando o conteúdo.
- Proporções corretas. Arma de duas mãos tem cabo bem mais longo que a cabeça. Respeite a proporção da grade.
- Nada cortado; nada encosta nas bordas (margem ~8%). Objeto centralizado (confira com a folha: margens parecidas dos dois lados).
- Contorno de espessura uniforme, cantos arredondados.
- Luz sempre de cima à esquerda em todas as peças.
- Ferramentas não parecem armas.
- Sem elementos proibidos.

## Estilo

- Vetorial plano com volume falso: cada material com 3 tons chapados (claro, médio, escuro). Claro nas faces/bordas voltadas para cima-esquerda, escuro nas opostas. Cilindros e cabos ganham uma faixa clara fina de brilho.
- Faixas de luz/sombra: desenhe a forma com o tom médio, depois as faixas clara/escura recortadas com `<clipPath>` (ou formas internas sem traço) e por fim o contorno de novo por cima (`<use ... fill="none"/>`). Veja `elmo-grande.svg` e `escudo-medio.svg`.
- Contorno `#0a0806`, `stroke-linejoin="round"`, `stroke-linecap="round"`, espessura ~1,2% do lado maior do viewBox (6 em 512; 7 em 576). Linhas internas de detalhe: 3,5 a 5.
- Fundo TRANSPARENTE. Sem moldura, borda ou tile.
- Proibido: gradientes, filtros, sombras projetadas, blur, brilho, texturas, opacidade parcial, texto, ferrugem, musgo, runas, rachaduras, gemas, efeitos mágicos, brasões/pintura heráldica. Detalhe só se ajudar a identificar.
- Barra dobrada ou curva (corda, corrente, alça, aro): truque do traço duplo — o mesmo `path` duas vezes, primeiro com traço escuro grosso, depois com o traço da cor por cima, mais fino.
- Malha de anéis (cota de malha): preencha com o tom médio do ferro e desenhe fileiras de pequenos arcos (`a` ou `Q`) em tom escuro do ferro, traço 3–4, sem contorno preto em cada anel. Escamas: fileiras sobrepostas de "U" com a borda inferior clara/escura. Placas: poucas lâminas grandes com rebites.
- Use `<title>` com o nome do item em português e `role="img"` no `<svg>`.

## Paleta (claro / médio / escuro)

- Ferro: `#b5ae9c` / `#8a8579` / `#5f5b52` (sombras profundas `#4a463f`)
- Madeira: `#9a7448` / `#7a5a3a` / `#55391f`
- Couro vinho (empunhaduras, correias): `#8a3a32` / `#6b2a24` / `#4a1b17`
- Couro natural (bolsas, botas, selas, armaduras de couro): `#a07850` / `#7c5a3a` / `#573d26`
- Corda / tecido claro / linho: `#d8cdb0` / `#b5a98a` / `#8f8468`
- Tecido escuro / lã: `#7a7264` / `#5e574b` / `#433e35`
- Pele / pelo animal: `#a08a6a` / `#7e6a4e` / `#5a4a36`
- Bronze: `#c4a066` / `#9a7a46` / `#6e5530`
- Cerâmica / barro: `#b07a58` / `#8c5c40` / `#64402c`
- Chifre translúcido: `#d6bf8a` / `#b89c66` / `#8c7346`
- Pedra: `#b2b4b3` (só brilho) / `#8f9294` / `#6e7173` / `#4f5254`
- Cera / sebo: `#e0cf98` / `#c2ac72` / `#968254`
- Chama (só quando o objeto real queima, ex. tocha, vela): `#c98a3c` com miolo `#e6c878`, sem halo.
- Polímero (itens modernos): `#5f5a50` / `#4a463f` / `#322f29`
- Dourado `#c9a45c`: muito pouco, só detalhe de peça nobre.
- Contorno: `#0a0806`.
Se precisar de outro material, derive 3 tons com saturação baixa e quente, e anote nas notas.

## Tela e orientação

- `viewBox` justo, margem ~8%, objeto centralizado.
- Grade `L x A` (largura x altura em células): viewBox proporcional. 1x1, 2x2, 3x3, 4x4 → `0 0 512 512`. 1x2 → `0 0 256 512`. 2x3 → `0 0 341 512`. 3x4 → `0 0 384 512`. 1x3 → `0 0 171 512`. 1x4 → `0 0 128 512`. 1x5 → `0 0 102 512`. 2x4 → `0 0 256 512`. 3x2 → `0 0 512 341`. 4x5 → `0 0 410 512`. 1x6 → `0 0 96 576`. Na dúvida, lado maior = 512.
- Itens longos com grade estreita (1xN, 2xN com N ≥ 3): em pé, cabeça/ponta para CIMA. Itens corpo a corpo longos SEM grade (armas de haste, lanças): diagonal de ~45°, cabeça no alto à direita, `viewBox 0 0 512 512` (dica: desenhe na vertical e gire com `rotate(45)`; a luz "da esquerda" no desenho local vira "de cima à esquerda" — veja `martelo-de-guerra.svg`).
- Itens sem grade e não longos: escolha a proporção natural do objeto, com o lado maior 512.
- Arcos: em pé, corda à esquerda ou à direita, arco desarmado não; mostre arco armado com corda reta.

## Lições

- A 64 px, peças finas somem: cabos com pelo menos ~5% do lado maior de espessura; detalhes pequenos (rebites, furos) viram ruído — use poucos.
- Os 3 tons de cada material são próximos; faça as faixas claras largas o bastante para aparecer.
- Objetos que precisam de contexto: pense no que faz a leitura (ex.: o lança-chamas só funcionou com a chama; a pedra de amolar com a faca em cima; o lampião sem o montante central cortando a chama).
- Confira a centralização na folha de revisão: margens parecidas dos dois lados e nunca menores que ~6%.
