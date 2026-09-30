# Adamar RPG 0.1 — propostas para aprovar

O Adamar RPG é o sistema próprio de Ruínas de Adamar, que vai para o jogo. Ele vive ao lado do GURPS (a mesa continua em GURPS) como **cópia viva**: `data/adamar-rpg/` guarda só o que muda. Esta é a primeira rodada de mudanças. Cada item está marcado como proposta; marque o que aprova, risque o que não quer e anote o que muda.

Quanto já é próprio: `node tools/adamar-rpg.mjs` (depois desta rodada: **17%**, com a tabela de dano e os termos próprios).

## 1. Termos próprios

Na ficha e no criador de um personagem Adamar RPG:

| GURPS | Adamar RPG |
|---|---|
| NH (nível de habilidade) | **Nível** |
| GdP (golpe de ponta) | **Estocada** |
| GeB (golpe em balanço) | **Golpe** |
| RD (resistência a dano) | **Proteção** |
| PV (pontos de vida) | **Vida** |
| PF (pontos de fadiga) | **Fôlego** |

Por quê: nomes em português comum, sem sigla, que qualquer jogador entende e que não são os do GURPS.
Onde: `data/adamar-rpg/meta.json` → `termos`.

- [ ] Aprovo os termos

## 2. Atributos: DX e IQ mais baratos

| Atributo | GURPS | Adamar RPG |
|---|---|---|
| ST (Força) | 10 por nível | 10 |
| DX (Destreza) | 20 | **15** |
| IQ (Inteligência) | 20 | **15** |
| HT (Vitalidade) | 10 | 10 |

Por quê: num jogo de sobrevivência o personagem precisa ser bom em muita coisa diferente (caçar, costurar, lutar, cozinhar). Com DX e IQ a 20, quase todo ponto vai para eles; a 15, sobra espaço para perícias e o personagem fica mais variado. Força e vigor continuam valendo o mesmo (carregar peso e aguentar frio importam).
Onde: `data/adamar-rpg/regras.json` → `atributos`.

- [ ] Aprovo

## 3. Curva de perícias: cada nível custa 2

| Nível acima do mínimo | GURPS (pontos) | Adamar RPG (pontos) |
|---|---|---|
| mínimo | 1 | 1 |
| +1 | 2 | 3 |
| +2 | 4 | 5 |
| +3 | 8 | 7 |
| +4 | 12 | 9 |
| +5 | 16 | 11 |

Por quê: no GURPS subir fica caro rápido (4 por nível); no Adamar RPG é constante (2 por nível). No jogo, a experiência vem de **usar** a perícia; uma curva constante deixa o avanço previsível e sem "muro". Um pouco mais caro no começo, bem mais barato para quem se especializa.
Onde: `data/adamar-rpg/regras.json` → `custo_pericias`. O criador mostra os pontos certos para cada sistema.

- [ ] Aprovo

## 4. Dano por Força: fórmula própria

Em vez da tabela do livro, uma linha reta:

- **Estocada** (ponta) = (Força − 6) ÷ 2 de dano médio
- **Golpe** (em arco) = (Força − 4) ÷ 2 de dano médio
- A média vira dados de seis faces (3,5 por dado) mais um ajuste.

| Força | Estocada | Golpe |
|---|---|---|
| 8 | 1d-2 | 1d-1 |
| 10 | 1d-1 | 1d |
| 12 | 1d | 1d+1 |
| 14 | 1d+1 | 1d+2 |
| 16 | 1d+2 | 2d-1 |
| 20 | 2d | 2d+1 |

Por quê: previsível e sem os saltos da tabela; gente forte bate mais, mas ninguém vira máquina de dano. Para mudar, edite as duas constantes em `tools/adamar-rpg-dano.mjs` e rode de novo (gera `data/adamar-rpg/tabela-dano.json`).

- [ ] Aprovo a fórmula
- [ ] Quero outros números: estocada base ___, golpe base ___

## 5. Só o que existe em Adamar

Saem do Adamar RPG só o que o site marca como "não existe em Adamar", que agora é **só tecnologia** acima da Idade Média: **32 perícias, 9 vantagens, 8 desvantagens e 166 itens**. As referências a eles (pré-definidos, efeitos, pré-requisitos, talentos) são podadas sozinhas.

O sobrenatural, o mágico e o de criatura (asas, voo, garras, maldições…) **ficam**, marcados como **bloqueado na criação**: existem no mundo, mas um personagem novo não pode começar com eles. Ao longo do jogo podem ser ganhos (magia, transformação, pacto, maldição), combinado com o narrador. Isso vale nos dois sistemas: na criação é erro; numa ficha que já jogou vira só um aviso ("ganho em jogo"). O que está "com o narrador" fica como antes.

Por quê: a lista do jogo passa a ser a lista do cenário, e o que é raro não some, só não é de partida. É também a primeira grande diferença de conteúdo em relação ao livro.
Onde: `"remover_se": { "adamar": "nao" }` em cada lista de `data/adamar-rpg/`. Para salvar um item da regra, é só mudá-lo em `itens` (o que foi mudado de propósito fica).

- [ ] Aprovo

## 6. Perícias novas de sobrevivência

| Perícia | Atributo | Dificuldade | O que cobre |
|---|---|---|---|
| **Pesca** | Per | Fácil | linha, rede, armadilha, arpão; onde e quando o peixe está |
| **Acampamento** | IQ | Fácil | fogo, fogueira que dura, abrigo, escolher onde dormir |
| **Coleta** | Per | Fácil | frutos, raízes, ervas, cogumelos, lenha e gravetos; o que se come e o que é veneno |

Por quê: são as ações do dia a dia do jogo (§5.3 e §5.6 do design) e hoje ficavam todas dentro de Sobrevivência.
Onde: `data/adamar-rpg/pericias.json` → `itens`.

- [ ] Aprovo
- [ ] Quero também: ___

## 7. Correção que vale para os dois sistemas

As receitas do jogo usavam isqueiro, cantil e cinturão de ferramentas, que o próprio site marca como "não existe em Adamar". Trocados por **pederneira e isca** (item novo) e **odre**.

## O que ainda é igual ao GURPS (próximas rodadas)

- Os valores das vantagens e desvantagens que ficaram (custos e níveis).
- A lista de perícias que ficou (nomes, dificuldades, pré-definidos).
- Os números das armas e armaduras (dano, alcance, proteção, peso).
- As fórmulas das características secundárias (Vida, Fôlego, Velocidade, Deslocamento) e a carga.
- Os modificadores dos locais de acerto e a tabela de manobras.

Sugestão de ordem: armas e armaduras (o combate do jogo depende delas) → secundárias e carga → vantagens e desvantagens.
