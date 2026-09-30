# Ruínas de Adamar — documento de design do jogo

Versão 0.1 · 30/09/2026 · rascunho para discussão

Este documento descreve o jogo de computador baseado em Ruínas de Adamar: um simulador de sobrevivência em 3D isométrico, multijogador, no espírito de *Project Zomboid*, ambientado no cenário do site. Ele parte do que o repositório já tem (cânone, dados, motor de regras, protótipos de interface) e marca o que falta. O cenário é a fonte; quando o documento precisa de algo que o cânone não diz, isso aparece como **decisão em aberto**, nunca como lore nova.

---

## 1. A proposta em uma frase

Sobreviver num continente jovem, frio e cheio de ruínas, onde a fome, o frio e uma ferida mal cuidada matam mais que monstros — até o dia em que a barreira entre os mundos afina e algo atravessa.

## 2. Pilares (vêm direto do cânone)

1. **Materialidade primeiro** (*Materialidade*). O mundo é físico: frio congela, calor desidrata, fome enfraquece, sede mata rápido. Nada dispensa mãos, ferramentas e tempo. O jogo é legível: o jogador prevê consequências.
2. **O sobrenatural é exceção** (*Magia*, *Entremundos*). A magia é rara, temida e perigosa; cada uso num lugar afina a barreira ali. Ela quebra a previsibilidade — por isso é incrível e por isso tem preço.
3. **As pequenas vitórias importam** (*Materialidade*). Fogueira acesa, pão quente, telhado seco, estrada conhecida. O ciclo diário é o coração do jogo.
4. **A ameaça vem de fora** (*Forasteiros*, *Masmorras*). Onde a barreira é fina — ruínas, masmorras, lugares de muita magia —, coisas atravessam. É o papel que os zumbis têm no *Zomboid*: a pressão que cresce com o tempo e força decisões.
5. **Qualquer pessoa cabe** (*Visão geral*). O personagem é humano, de qualquer arquétipo cultural, sem classe fixa: o que ele sabe fazer vem das perícias e do que carrega.

## 3. Formato

| | |
|---|---|
| Gênero | Simulação de sobrevivência, mundo aberto, *sandbox* |
| Câmera | 3D isométrica (ou 3D com câmera fixa em ângulo), zoom e rotação em passos de 90° |
| Jogadores | 1 a 16 por servidor (cooperativo; PvP como opção do servidor) |
| Era | Era do Novo Mundo (padrão). As outras duas eras são modos futuros: Alta Magia (mais fantasia) e Apocalipse (sobrevivência extrema em cavernas e minas) |
| Tom | Baixa fantasia sombria. Nada de heróis invulneráveis nem cura num frasco |
| Plataforma inicial | PC (Windows e Linux) |

## 4. O ciclo de jogo

**Minuto a minuto:** andar, olhar, ouvir; decidir o que carregar; lutar ou fugir; cuidar de ferimentos.
**Hora a hora:** comer, beber, descansar, manter-se aquecido e seco; trabalhar (cortar lenha, caçar, costurar, consertar).
**Dia a dia:** abrigo, fogueira e comida para a noite; planejar viagens (suprimentos, clima, rota); negociar com vilas; aprender perícias fazendo.
**Semana a semana:** estações mudam o clima e a comida; ruínas são exploradas; a barreira afina em alguns lugares e os forasteiros aparecem com mais frequência; a comunidade de jogadores cresce ou se desfaz.

**Condição de fim:** a morte é permanente para o personagem (o mundo e a comunidade continuam). Morrer deve ser consequência de decisões — fome, frio, infecção, excesso de confiança —, não de azar puro.

## 5. Sistemas

Cada sistema abaixo diz **o que é**, **o que já existe no repositório** e **o que falta**. Os marcados com ★ ganham um protótipo jogável no site nesta rodada (ver §9).

### 5.1 Personagem

- **Atributos** (força, destreza, inteligência, vigor, percepção, vontade), **pontos de vida e fadiga**, **perícias** com nível e **vantagens/desvantagens**.
- Testes por rolagem de 3 dados contra o nível (sucesso, margem, crítico). O jogo mostra a chance antes de agir.
- Aprender fazendo: usar uma perícia dá experiência nela.
- **Existe:** criador de personagem, ficha completa, motor de cálculo testado (`js/gurps-calculo.js`, `js/criador-ficha.js`), rolagens com modificadores e situações.
- **Falta:** o **sistema de regras próprio** (ver §7). Hoje o motor usa os números do GURPS, que não podem ir para um jogo distribuído.

### 5.2 Saúde por parte do corpo ★

- Onze partes: cabeça, pescoço, tronco, braços, mãos, pernas e pés (direita e esquerda).
- Cada ferimento tem **tipo** (corte, perfuração, contusão, queimadura, fratura, mordida), **gravidade** (leve, séria, grave), se **sangra**, se está **limpo**, o **tratamento** (bandagem, sutura, tala) e a **infecção** (0–100).
- **Sangramento** tira sangue a cada hora; perder muito sangue enfraquece, depois derruba, depois mata. **Infecção** cresce em feridas sujas e não tratadas e dá febre. **Dor** atrapalha tudo. Ferimento em perna ou pé tira deslocamento; em braço ou mão, destreza.
- Tratar exige o item certo (bandagem, linha e agulha, tala) e um teste de Primeiros Socorros; limpar a ferida com água fervida ou álcool reduz a infecção.
- Cura leva dias e depende de comida, descanso e tratamento.
- **Existe:** o boneco com as partes do corpo e a proteção de cada uma.

### 5.3 Necessidades e tempo ★

- **Fome, sede, cansaço e temperatura do corpo**, cada um de 0 a 100, mudando a cada hora conforme a **atividade** (repouso, caminhada, trabalho pesado, combate) e o **ambiente** (temperatura, chuva, vento).
- **Roupas** isolam do frio (e esquentam demais no calor); roupa **molhada** perde o isolamento.
- Cada necessidade tem faixas (ok → incômodo → grave → crítico) que viram **modificadores** nos testes e, no extremo, dano.
- **Comida** tem calorias, água e validade; estraga com o tempo.
- **Tempo** corre (no multijogador, contínuo; sozinho, acelerável ao dormir). Dia, noite, estações.
- **Existe:** o estado "Em jogo" da ficha (PV, PF, diário), as situações que viram modificadores.

### 5.4 Inventário em grade ★

- Cada recipiente (mochila, algibeira, aljava, bolsos) tem uma **grade**; cada item ocupa **largura × altura** células e pode girar. Peso (carga) e espaço (grade) são limites separados.
- Itens **longos** (lanças, arcos longos) não cabem na mochila: vão na mão ou presos às costas. Armaduras e roupas ocupam o corpo.
- Lugares do corpo: mão direita, mão esquerda, duas mãos, costas, cinto, vestido.
- **Existe:** tamanho na grade para 215 itens, tamanho dos recipientes (`data/adamar/inventario.json`), lugares do corpo e recipientes aninhados na ficha, peso e carga.

### 5.5 Durabilidade e qualidade ★

- Cada item tem **condição** (0–100). Armas perdem condição ao bater e aparar; armaduras ao receber golpes; ferramentas ao trabalhar. Qualidade barata desgasta mais rápido.
- Em 0, o item **quebra** e não serve até ser consertado. Consertar exige ferramenta e perícia e não volta ao máximo para sempre.
- **Existe:** qualidade do item (−1 a +2) com efeito em preço e dano.

### 5.6 Produção (receitas) ★

- Receitas dizem o que se faz, com o quê, com qual ferramenta, qual perícia e quanto tempo leva. Falhar gasta material; sucesso crítico melhora a qualidade.
- Materiais básicos: lenha, graveto, pedra, pano, couro cru, linha, carne crua, água suja, ervas.
- **Existe:** a lista de equipamento com preço, peso e perícia de uso.

### 5.7 Mundo e clima ★ (base)

- **Roestia**, continente grande: geleiras, desertos, florestas tropicais, estepes, arquipélagos, montanhas (*Geografia*). O mapa do jogo é uma **região** dele, não o continente inteiro.
- **Biomas** com temperatura por estação, chuva, recursos (caça, lenha, água, ervas) e perigos.
- **Clima** gerado hora a hora: temperatura, chuva, vento, neblina.
- **Barreira**: cada lugar tem uma espessura; ruínas e masmorras têm barreira fina; usar magia afina mais (*Entremundos*). Onde é fina, forasteiros podem atravessar.
- **Existe:** o cânone e o mapa. **Decisão em aberto:** qual região de Roestia é o mapa do primeiro jogo e quais biomas ela tem.

### 5.8 Combate

- Tempo real com pausa tática opcional no modo solo. Cada ataque é um teste (acerto) contra uma defesa (esquiva, aparar, bloqueio); dano tira proteção da armadura naquela parte do corpo e vira ferimento (§5.2).
- Mirar numa parte do corpo custa precisão.
- Armas nas costas ou no cinto precisam ser sacadas (uma ação).
- **Existe:** NH de armas, dano, defesas, locais de acerto com modificador e proteção, rolagem.

### 5.9 Forasteiros e masmorras

- Forasteiros atravessam onde a barreira é fina, de formas variadas: sussurros, possessão, cultos, portais (*Forasteiros*). Cada tipo é uma **família de inimigo** com comportamento próprio — não um zumbi genérico.
- Masmorras são lugares **trancados** que guardam magia; abrir uma muda a região ao redor (*Masmorras*). São o "lugar de alto risco e alta recompensa".
- **Decisão em aberto:** quais forasteiros existem no primeiro jogo (o cânone dá exemplos, mas deixa a escolha ao narrador — aqui, ao designer).

### 5.10 Magia

- Rara. Um personagem só tem acesso com uma vantagem cara, e cada uso afina a barreira local e aumenta a chance de atrair algo.
- **Decisão em aberto:** se a magia entra no primeiro jogo ou fica para depois.

### 5.11 Multijogador

- Servidor autoritativo: o servidor roda as regras (o motor), os clientes mostram.
- Personagens persistentes no servidor; morte permanente.
- Comunidade: construir, dividir comida, tratar ferimentos uns dos outros — várias perícias só fazem sentido em grupo.

## 6. Interface

Os protótipos do site são a primeira versão da interface do jogo:

| Tela do jogo | Protótipo no site |
|---|---|
| Criação de personagem | Criador (dois painéis, modelos prontos) |
| Personagem e equipamento | Boneco com lugares do corpo, ficha |
| Tela de jogo (HUD) | Modo **Jogando**: retrato, PV/PF, situações, barra de ação, perícias, rolagens, inventário |
| Enciclopédia | Listas de itens e perícias com "Mais sobre" |

## 7. Sistema de regras próprio (obrigatório antes de distribuir)

As regras, números e textos do GURPS pertencem à Steve Jackson Games. O jogo precisa de um sistema próprio. O caminho mais curto:

1. Manter a **estrutura** (atributos, perícias com dificuldade, testes de 3d, vantagens/desvantagens com custo), que é ideia e não texto.
2. Trocar **nomes, números e tabelas** por valores próprios (custos, tabela de dano por força, tabelas de armas e armaduras, lista de vantagens), testados em jogo.
3. Escrever **descrições próprias** (o repositório já tem as de todos os itens).
4. Os `id`s estáveis e o formato dos dados continuam; só o conteúdo muda.

Os protótipos desta rodada (§9) já usam **números próprios**, marcados como proposta, em `data/jogo/`.

## 8. Tecnologia (recomendação)

- **Motor:** Godot 4 (gratuito, bom em 3D, rede embutida, GDScript ou C#). Alternativa: Unity.
- **Dados:** os JSON do repositório (itens, perícias, receitas, biomas) como fonte única, exportados para o jogo.
- **Regras:** um módulo sem interface, com testes, como hoje (`js/simulacao.js`). No jogo, portado para a linguagem do motor (ou rodando no servidor).
- **Servidor:** autoritativo, com o motor de regras; o cliente só pede ações.

## 9. O que o repositório ganha nesta rodada

Protótipos jogáveis no site, com regras próprias em `data/jogo/` e o motor em `js/simulacao.js` (testado em `tools/simulacao.test.mjs`):

1. **Saúde por parte do corpo**: ferir, tratar, sangrar, infeccionar, curar; clicar numa parte do boneco.
2. **Necessidades e tempo**: relógio do personagem, avançar o tempo com uma atividade, fome/sede/cansaço/temperatura, penalidades automáticas nas rolagens.
3. **Inventário em grade**: recipientes com grade, encaixe automático, itens que não cabem.
4. **Durabilidade**: condição dos itens, desgaste no uso, conserto.
5. **Receitas**: materiais básicos e receitas; fazer gasta material, tempo e testa a perícia.
6. **Mundo e clima**: biomas genéricos (sem nomear regiões do cânone), clima por estação, gerado hora a hora.

## 10. Decisões em aberto

- Qual região de Roestia é o mapa do primeiro jogo, e com quais biomas.
- Quais forasteiros existem no primeiro jogo e como se comportam.
- Se a magia entra no primeiro jogo.
- Tempo real contínuo ou turnos no modo solo.
- Os números próprios do sistema de regras (§7).
- Nome do jogo.
