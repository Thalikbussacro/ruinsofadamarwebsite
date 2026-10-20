# Ícones de itens: notas

Um SVG por item, com o nome igual ao `id` em `data/gurps/equipamento.json`. Os previews PNG não ficam no repositório: são gerados só na hora da revisão.

Itens que são o mesmo objeto de outro com outra regra de uso (ex.: `espada-bastarda-duas-maos`) não têm SVG próprio: `apelidos.json` aponta cada um para o SVG que ele usa. Ataques naturais e desarmados (soco, chute, dentes, presas, bico, golpeador) e golpes com escudo não são objetos e ficam sem ícone desenhado.

Renderização com `cairosvg` 2.9.1 (Python), por `tools/icones-svg/render.py`. Previews gerados a partir de cada SVG com o lado maior em 512 px (`-512`, `-dark` sobre `#14110e`) e em 64 px (`-64`).

Não usei imagens de referência da web: as ferramentas de busca desta sessão devolvem só texto, não imagens. Silhuetas e proporções vêm de conhecimento geral dos objetos.

## martelo-de-guerra (3 iterações)
- Suposições: espigão levemente curvo para baixo (estilo bec de corbin), cabeça de contusão de face retangular, lingüetas de ferro descendo da cabeça, empunhadura em couro vinho no terço inferior. Sem espigão na ponta superior, para não virar arma de haste.
- Desenhado com o cabo na vertical e girado 45° (`rotate(45)`): a luz local "da esquerda" vira "de cima à esquerda" no resultado.
- Pendente: a 64 px o cabo vira uma linha fina; a cabeça continua legível. A face inferior escura do espigão some um pouco sobre o fundo escuro, só o contorno a separa.

## rifle-de-assalto-556mm (3 iterações)
- Suposições: coronha fixa, trilho superior com alça de mira simples, massa de mira triangular, guarda-mão com fendas de ventilação, carregador curvo para a frente, quebra-chamas com fenda. Peças de polímero (coronha, empunhadura, carregador, guarda-mão) e de ferro (caixa da culatra, trilho, cano). Silhueta genérica, mistura de vários modelos.
- `viewBox` 512×210.
- Pendente: os três tons de polímero da paleta são muito próximos; o volume das peças de polímero fica sutil, e a 64 px a coronha e o carregador perdem contraste com o fundo. A silhueta continua clara.

## besta-de-alavanca (3 iterações)
- Grade 1x2, `viewBox` 256×512. Besta vista de cima (arco no alto, estribo na frente), com o pé de cabra a meio caminho de armar: as garras puxam a corda, os braços do garfo apoiam no pino que atravessa a coronha e o cabo sai em diagonal para baixo à direita, com empunhadura de couro.
- Escolhi vista de cima em vez de perfil porque o perfil esconde o arco e a besta deixa de ser reconhecível. O custo é que a mecânica real da alavanca (pivô sobre os pinos, garra articulada) fica simplificada: as garras aparecem como uma moldura em U.
- O ferro da alavanca é a única peça clara; a besta fica em madeira para a alavanca se destacar.
- Pendente: a 32×64 a alavanca se reduz a uma mancha cinza sobre a coronha; a leitura "besta com algo encaixado" se mantém, mas "alavanca" só fica clara a partir de ~128 px. A besta em si é uma arma; aparece porque o item precisa de contexto.

## elmo-grande (1 iteração)
- Item `elmo-grande` de `data/gurps/equipamento.json` (guardado em 3x3, então tela quadrada). Elmo de topo achatado visto de frente: calota rebitada, cruz de reforço, duas fendas de visão e respiros só do lado direito, como em muitos elmos reais.
- Volume de cilindro feito com três faixas verticais (clara à esquerda, escura à direita), recortadas por `clipPath`.
- Pendente: as faixas têm borda dura e o cilindro fica um pouco "chapado em listras". A 64 px os respiros e os rebites viram ruído, mas as fendas e a cruz seguram a leitura.

## escudo-medio (1 iteração)
- Grade 3x4, `viewBox` 384×512. Suposição: escudo de forma "heater" (topo levemente curvo, ponta embaixo), por caber em 3x4 e ser o escudo medieval mais óbvio. Tábuas verticais de madeira, aro de ferro em traço duplo e duas fileiras de rebites das travessas. Sem brasão nem pintura.
- Pendente: nada relevante. Um escudo redondo também combinaria com o cenário; se o "médio" do Adamar for redondo, refaço.

## lampiao (2 iterações)
- Grade 2x2. A descrição diz "lâmpada a óleo" e o item é NT2; escolhi a lanterna de ferro com painéis de chifre e argola, que é o que "lampião" sugere. A outra leitura seria uma lamparina de barro aberta.
- Material novo, o chifre translúcido dos painéis: `#d6bf8a` / `#b89c66` / `#8c7346`. A chama é chapada (`#c98a3c` com miolo `#e6c878`), sem brilho em volta. Ela ficou porque sem chama a lanterna parece uma gaiola.
- Iteração 2: tirei o montante central, que cortava a chama ao meio, e aumentei a chama para ela sobreviver a 64 px.
- Pendente: a chama ficou grande e um pouco "desenho animado" perto do resto. Pela forma, o objeto ocupa só uns 40% da largura da tela.

## espada-grande (2 iterações)
- Grade 1x6, `viewBox` 96×576. A grade tem prioridade sobre a regra da diagonal: espada em pé, ponta para cima. Lâmina com duas faces (clara à esquerda) e sulco central, guarda reta, empunhadura longa de duas mãos em couro vinho e pomo oval.
- Iteração 2: encurtei a guarda, que quase encostava nas bordas da tela estreita.
- Pendente: a 11×64 px só a cor da empunhadura separa a espada de uma lança curta. É o limite da grade 1x6.

## pistola-auto-45 (2 iterações)
- Sem grade no catálogo; `viewBox` 472×308, cano para a direita. Silhueta genérica de pistola .45 clássica: ferrolho com estrias atrás, cão exposto, trava de empunhadura, guarda-mato e placas de madeira na empunhadura.
- Iteração 2: a trava da empunhadura estava pontuda e parecia um espinho; arredondei.
- Pendente: o cão ainda lê como uma "orelha" pequena no canto superior esquerdo.

## lanca-chama (3 iterações)
- Sem grade; `viewBox` 512×400. Mochila com dois tanques de combustível e o tanque de pressão no meio (inspirado no tipo da Segunda Guerra, sem copiar um modelo), cinta de couro, mangueira e lança horizontal com bico para a direita.
- Cor nova, verde-oliva militar fosco: `#7d7a55` / `#5f5d41` / `#44432f`.
- Iteração 2: sem fogo, parecia lavadora de pressão ou cilindro de mergulho. Pus uma língua de chama chapada saindo do bico, nas mesmas cores da chama do lampião. Iteração 3: reenquadrei para a chama não encostar na borda.
- Pendente: a chama é o elemento que faz a leitura; sem ela o ícone não funciona. A lança fica fina a 64 px.

## pedra-de-amolar (3 iterações)
- Grade 1x1. Uma pedra solta é só um retângulo cinza; para mostrar a função, pus a pedra numa base de madeira, em vista oblíqua, com uma faca de cozinha deitada em cima.
- Cor nova, pedra cinza-azulada para não confundir com o ferro: `#b2b4b3` (só no brilho) / `#8f9294` / `#6e7173` / `#4f5254`.
- Iterações 2 e 3: centralização vertical (a base pesava embaixo).
- Pendente: a faca é uma lâmina num ícone de ferramenta; mantive pequena e sem ponta agressiva. Se incomodar, a alternativa é a pedra sozinha com uma gota d'água, que fica menos legível. A 64 px a faca vira um risco.

## pastilhas-purificar-agua (1 iteração)
- Sem grade; tela quadrada. Frasco de vidro âmbar com tampa de rosca e rótulo liso (sem texto), mais duas pastilhas com vinco na frente.
- Cor nova, vidro âmbar: `#9c7444` / `#7a5734` / `#573c22`; o reflexo do vidro é uma faixa creme fina.
- Pendente: o ícone diz "comprimidos", não "purificar água". Não pus gota d'água porque seria símbolo, não objeto. Se o catálogo precisar diferenciar de remédios, dá para pôr um cantil ao lado.

# Lote: armaduras de cavalo

# Lote G-bardas

Geral: todos os SVGs foram gerados por script (`tools/icones-svg/bardas/` (`gen.py`, `heads.py`, `bodies.py`)) para que a silhueta do cavalo seja exatamente a mesma em toda a série. Cavalo chapado em marrom-acinzentado escuro (`#4a4038`, com `#372f29` para cauda e pernas do lado oposto). Esse tom foi derivado do pelo, mais escuro e menos saturado, para não competir com a peça. Luz e sombra nas peças vêm de uma borda clara no alto à esquerda e escura embaixo à direita, feitas com clipPath de cópias deslocadas da própria forma. Malha: arcos em ∩ pequenos. Escamas: fileiras de U maiores, com arco claro. Couro e tecido: couro natural com borda de tecido claro em traço duplo. Peças de malha e escamas da cabeça e da barda parcial levam bainha de couro.
Cabeça/pescoço: 512x512, perfil virado para a direita, com o pescoço cortado reto embaixo (como busto). Cavalo inteiro: viewBox `-22 -25 568 444` (proporção 512x400 com margem; o contorno fica com ~5,4 px efetivos).

## barda-mascara-couro-tecido (4 iterações)
- Máscara cobre testa, olho e chanfro até acima das narinas, com furo do olho e uma correia vinho atrás para mostrar que está vestida.
- Pendente: nada relevante.

## barda-mascara-malha (4 iterações)
- Mesma forma da máscara, preenchida com malha.
- Pendente: em 64 px a malha vira cinza liso; só se distingue das escamas em tamanho grande.

## barda-mascara-escamas (4 iterações)
- Mesma forma, com escamas.
- Pendente: nada relevante.

## barda-mascara-placas (4 iterações)
- Chanfron de uma lâmina, com aresta central, anel no olho e 3 rebites.
- Pendente: nada relevante.

## barda-cabeca-pescoco-couro-tecido (4 iterações)
- Capuz que cobre cabeça e pescoço. Deixa à mostra orelha, focinho e base do pescoço, com borda de tecido em todo o contorno e uma costura.
- Pendente: o tecido ao redor do canto da ganacha forma um "tubo" um pouco estranho.

## barda-cabeca-pescoco-malha (4 iterações)
- Capuz de malha com bainha de couro na frente e embaixo.
- Pendente: em 64 px lê como "cavalo cinza"; a bainha e o focinho escuro ajudam, mas pouco.

## barda-cabeca-pescoco-escamas (4 iterações)
- Capuz de escamas com bainha de couro.
- Pendente: nada relevante.

## barda-cabeca-pescoco-placas (4 iterações)
- Chanfron, mais crinet de 5 lâminas articuladas que cobrem o pescoço.
- Pendente: nada relevante.

## barda-parcial-couro-tecido (2 iterações)
- Peitoral que cobre peito, espádua e frente do tronco até a altura da barriga, com borda de tecido embaixo e atrás.
- Pendente: a faixa de tecido vertical atrás parece um pouco uma "cinta".

## barda-parcial-malha (2 iterações)
- Mesma forma, em malha, com bainha de couro.
- Pendente: nada relevante.

## barda-parcial-escamas (2 iterações)
- Mesma forma, em escamas.
- Pendente: nada relevante.

## barda-completa-couro-tecido (2 iterações)
- Gualdrapa (caparazão) que cobre tronco e garupa até abaixo da barriga, com gomos costurados e barra de tecido. A cauda fica por cima.
- Pendente: nada relevante.

## barda-completa-malha (2 iterações)
- Mesma forma, em malha, com barra de couro.
- Pendente: a 64 px é um bloco cinza; lê como "cavalo coberto", mas o material não aparece.

## barda-completa-placas (3 iterações)
- Peitoral, flanqueira e garupeira como três placas separadas. O dorso aparece entre elas, onde iria a sela.
- Pendente: a flanqueira retangular no meio parece um pouco uma caixa.

## barda-perneiras-placas (4 iterações)
- Placas nas quatro canelas (as do lado oposto mais escuras), cada uma com junta na altura do joelho ou jarrete; os cascos ficam à mostra.
- Pendente: as placas são pequenas no ícone inteiro; em 64 px leem como "pernas cinza".

# Lote: ferramentas, kits e montaria

# Lote E-ferramentas

## kit-de-escriba (2 iterações)
- Pergaminho com rolos, tinteiro de cerâmica e pena de ganso enfiada no tinteiro.
- Pendente: nada relevante.

## tablete-de-cera (2 iterações)
- Díptico de madeira com cera (paleta cera/sebo), riscos ondulados (não é texto) e estilete de ferro.
- Pendente: nada relevante.

## tambor (1 iteração)
- Caixa de madeira, pele de linho claro, aros escuros, cordas tensoras em zigue-zague, duas baquetas cruzadas.
- Pendente: nada relevante.

## alforjes (1 iteração)
- Par de bolsas de couro natural com aba e fivela, unidas por faixa no alto. viewBox 512x384.
- Pendente: nada relevante.

## bridao-e-redea (1 iteração)
- Freio articulado de ferro com duas argolas e rédea de couro em laço.
- Pendente: nada relevante.

## esporas (2 iterações)
- Uma espora de roseta vista de cima (arco do calcanhar, pescoço, roseta de 8 pontas, correia vinho). Mostrei uma só para legibilidade.
- Pendente: a roseta fica fina no 64 px.

## estribos (2 iterações)
- Par de estribos de ferro com loro de couro e fivela, em alturas diferentes.
- Pendente: nada relevante.

## ferraduras (2 iterações)
- Par de ferraduras sobrepostas com furos de cravo. Tirei os cravos soltos (pareciam lixo).
- Pendente: nada relevante.

## sela-de-combate (2 iterações)
- Mesma base da sela comum, com arções altos e curvos na frente e atrás, reforçados com ferro; manta de lã, cilha, estribo. viewBox 512x384.
- Pendente: arções lembram um pouco "chifres"; aceitável.

## sela-e-arreios (2 iterações)
- Sela baixa de couro, manta, cilha, aba e estribo. viewBox 512x384.
- Pendente: "arreios" representados só pela cilha e loro.

## gazuas (1 iteração)
- Argola de ferro com quatro gazuas de pontas diferentes.
- Pendente: pode ser lido como molho de chaves finas.

## bandagens (3 iterações)
- Dois rolos de linho empilhados (espiral no topo) e uma faixa desenrolada.
- Pendente: rolos podem lembrar latas/queijos no 64 px.

## instrumentos-cirurgicos (3 iterações)
- Estojo de couro com bolsos e bisturi, pinça, serra de osso e sonda com gancho.
- Pendente: instrumentos pequenos no 64 px; o estojo domina.

## kit-de-emergencia (2 iterações)
- Baú de madeira aberto (cantoneiras de ferro) com rolos de pano, dois frascos de cerâmica e faca. viewBox 512x341. Sem cruz.
- Pendente: nada relevante.

## kit-de-primeiros-socorros (2 iterações)
- Bolsa de couro aberta com rolo de pano e frasco de cerâmica. Sem cruz.
- Pendente: nada relevante.

## agulhas-de-tricot (2 iterações)
- Novelo de lã (tecido escuro/lã) com duas agulhas de madeira cruzadas e ponta de fio solta.
- Pendente: nada relevante.

## arado-de-ferro (1 iteração)
- Vista lateral; timão, rabiça e sola de madeira; relha, aiveca e sega (faca) de ferro. viewBox 512x341.
- Pendente: no 64 px é pequeno, mas a silhueta lê.

## arado-de-madeira (1 iteração)
- Mesmo arado, só madeira, relha de madeira simples amarrada com corda.
- Pendente: relha pequena no 64 px.

## balanca-e-pesos (2 iterações)
- Balança de pratos em bronze com coluna, travessão, correntes e pilha de pesos de ferro; base de madeira.
- Pendente: nada relevante.

## caixa-de-ferramentas-portatil (1 iteração)
- Caixa de madeira com alça central, martelo e formão saindo.
- Pendente: nada relevante.

## carrinho-de-mao (2 iterações)
- Carrinho medieval de madeira, roda de raios de madeira, caixa de tábuas, varais e perna. viewBox 512x341.
- Pendente: nada relevante.

## laboratorio-portatil (2 iterações)
- Caixa de madeira aberta com alambique de bronze, frasco recebedor e frasco alto de cerâmica, almofariz e pilão de pedra na frente.
- Pendente: nada relevante.

## pa (2 iterações)
- Pá com punho em D, diagonal 45° com lâmina no alto à direita (ferramenta longa sem grade).
- Pendente: nada relevante.

## pe-de-cabra-1m (2 iterações)
- Barra de ferro em pé, pescoço de ganso no alto com unha fendida, ponta inferior achatada dobrada.
- Pendente: lembra um pouco uma bengala de ferro.

## picareta-equipamento (2 iterações)
- Em pé, cabo de madeira, cabeça de ferro com ponta curva à esquerda e enxó larga à direita.
- Pendente: nada relevante.

## roca-de-tear (2 iterações)
- Roda de fiar grande sobre banco de três pernas, correia até o fuso com fio enrolado.
- Pendente: cabeçote do fuso pequeno.

## serra (1 iteração)
- Serra traçadora de lenhador em pé, dentes à direita, cabos de madeira nas duas pontas.
- Pendente: cabos parecem "rolinhos" no 512, mas a leitura no 64 é boa.

# Lote: acampamento, iluminação e aljavas

# Lote D-acampamento

Materiais derivados (fora da paleta): lã tingida (cobertor, rolos de cobertor) `#a8634a / #85493a / #5e3329`; linho escuro para linhas `#6e6450` / `#7a705a`; óleo `#c9a24e` (brilho `#e6c878`); pão `#c08e56 / #9a6c3c / #6e4a26`; queijo `#dcbc66 / #b8963e / #8c6c2a` (furos `#6e5420`); carne seca `#8a4a36 / #6a3424`; miolo escuro de caldeirão `#2a2620`.
Observação: `stroke-dasharray` em paths longos (polilinhas) não aparece no cairosvg; na corda troquei por traços de torção explícitos.

## algibeira-bolsa-pequena (1 iteração)
- Bolsa de couro natural com boca franzida, cordão de linho com pontas e alça para o cinto.
- Pendente: nada relevante.

## anzol-e-linha (2 iterações)
- Carretel de madeira com linha enrolada + anzol de ferro com farpa e olhal; linha liga o carretel ao olhal.
- Pendente: a linha fina some no 64 px (o anzol e o carretel bastam).

## arpeu (2 iterações)
- 4 garras (2 laterais, 1 frontal, 1 de trás mais escura), haste curta, olhal com corda de cânhamo.
- Pendente: ainda lembra levemente uma âncora; a corda ajuda a distinguir.

## corda-3-4 (4 iterações)
- Rolo em espiral grossa com ponta solta e traços oblíquos de torção (gerados por script).
- Pendente: nada relevante.

## cordel-3-16 (2 iterações)
- Novelo de cordel fino com fio solto, para contrastar com o rolo grosso da corda.
- Pendente: pode ser lido como novelo de lã; aceitável.

## barraca-1-pessoa (2 iterações)
- Grade 2x4 (retrato) não comporta uma barraca baixa armada: desenhei a lona ENROLADA em pé, amarrada com duas tiras, com duas estacas de madeira atrás e uma corda de esticar.
- Pendente: lê como "rolo de lona/saco de dormir", não necessariamente como barraca. Se a grade puder ser paisagem, trocar por barraca baixa armada.

## barraca-4-pessoas (1 iteração)
- Sem grade: viewBox 512x400. Barraca de cumeeira em 3/4, entrada aberta, duas varas (frente e fundo), cordas e estacas.
- Pendente: nada relevante.

## barraca-20-pessoas (2 iterações)
- Sem grade: viewBox 512x440. Pavilhão cônico com sanefa recortada, entrada aberta, mastro central com flâmula lisa (sem heráldica), cordas e estacas.
- Pendente: nada relevante.

## cobertor (2 iterações)
- Cobertor de lã tingida dobrado em três, com duas listras de linho e franja. A 1ª versão em lã cinza parecia pilha de tábuas.
- Pendente: nada relevante.

## pelagem-de-animal (1 iteração)
- Pele de animal esticada vista de cima (silhueta com patas e cauda), faixa escura do lombo e tufos.
- Pendente: nada relevante.

## equipamento-basico-para-grupo (1 iteração)
- Caldeirão de ferro com alça e concha de madeira + tigela de madeira com colher.
- Pendente: nada relevante.

## equipamento-basico-pessoal (2 iterações)
- Cobertor enrolado e amarrado, odre de couro, pederneira (fuzil de aço + pedra).
- Pendente: o fuzil é pequeno no 64 px.

## equipamento-de-alpinismo (2 iterações)
- Rolo de corda, dois cravos (um com argola) e martelo curto de cabo de madeira.
- Pendente: cravos finos no 64 px.

## espigoes-de-ferro-escalador (2 iterações)
- Um cravo de ferro achatado com olhal e argola, inclinado. Título corrigido para "Espigões de ferro (escalador)" (nome na lista tem erro de digitação).
- Pendente: ponta fina no 64 px.

## garrafa-ceramica (1 iteração)
- Garrafa de barro de gargalo longo, rolha, faixas incisas e cordão no gargalo.
- Pendente: nada relevante.

## mochila-pequena (1 iteração)
- Mochila simples de couro natural com aba, correia e fivela, alça de mão.
- Pendente: nada relevante.

## mochila (1 iteração)
- Mochila grande: bolsos laterais, cobertor enrolado por cima, duas correias com fivelas.
- Pendente: nada relevante.

## odre-de-vinho (1 iteração)
- Bolsa de couro em gota com gargalo amarrado, bocal de madeira com tampa e cordão de carregar.
- Pendente: nada relevante.

## oleo (3 iterações)
- Jarrinha de cerâmica com asa, metade de baixo vidrada escura, tampa de pano amarrada e escorrido de óleo no gargalo (diferencia da garrafa).
- Pendente: nada relevante.

## racao-de-viagem (2 iterações)
- Pano de linho aberto com pão duro, cunha de queijo e duas tiras de carne seca.
- Pendente: a ponta dobrada do pano lembra um pouco uma vela de barco.

## tocha (1 iteração)
- Cabo de madeira, trapo embebido amarrado, chama chapada.
- Pendente: nada relevante.

## vara-2m (2 iterações)
- Vara lisa de madeira a 45°, com alguns nós.
- Pendente: nós quase invisíveis; é simplesmente uma vara.

## vela-de-sebo (1 iteração)
- Vela de sebo com escorridos, pavio aceso, em prato de ferro com argola.
- Pendente: nada relevante.

## aljava-de-cintura (2 iterações)
- Tubo de couro levemente cônico com flechas aparecendo; presilhas e pedaço de cinto (couro vinho) atravessado na parte de cima.
- Pendente: penas das flechas se sobrepõem um pouco.

## aljava-de-ombro (2 iterações)
- Tubo reto mais estreito com flechas; correia longa de ombro (couro vinho) presa por argolas no topo e na base.
- Pendente: nada relevante.

## correia-de-couro (1 iteração)
- Laço de couro vinho com passador, preso à ponteira de ferro de um cabo de madeira curto (contexto mínimo, sem cabeça de arma).
- Pendente: o cabo pode ser lido como cabo de ferramenta genérica.

# Lote: lâminas, porretes e armas flexíveis

# Lote A-laminas

Aviso geral: o cairosvg (render.py) parece herdar `stroke-linecap="round"` do `<g>` pai mesmo quando o filho declara `butt` (traços tracejados viram bolinhas, emendas mostram arcos). Para corda/corrente com `butt` ou dasharray, colocar fora de um `<g>` com linecap round. Gerador de corrente (elos alternando plano/de lado ao longo de cúbicas): `scratchpad/alam/chain.py` (+ `nunchaku.py`, `kusari.py`).

## espada-larga (1 iteração)
- 128x512. Lâmina reta 26 de largura, ponta em ogiva, empunhadura curta (uma mão), pomo redondo.
- Pendente: nada relevante; a diferença para a bastarda é só a proporção cabo/lâmina e o pomo.

## espada-bastarda (1 iteração)
- 102x512. Empunhadura ~40% mais longa (mão e meia, 5 voltas), pomo em pera.
- Pendente: a 64 px é difícil distinguir da espada larga (esperado: são parecidas).

## katana (2 iterações)
- Lâmina curva com fio à esquerda (convexo), linha do shinogi, habaki dourado, tsuba como elipse escura, cabo vinho com amarração em losangos, kashira de ferro.
- Pendente: nada relevante.

## espada-curta (1 iteração)
- 171x512. Lâmina larga (44) com ponta longa estilo gládio, guarda curta, pomo grande ovalado.
- Pendente: nada relevante.

## facao (2 iterações)
- Lâmina larga de um gume, barriga larga perto da ponta, dorso reto escuro à direita, reforço de ferro, cabo de madeira com 2 rebites.
- Pendente: nada relevante.

## faca (1 iteração)
- Faca comum: lâmina de um gume, cabo de madeira longo com 2 rebites, sem guarda.
- Pendente: formato próximo ao facão; diferença pela proporção (cabo ≈ lâmina) e lâmina mais estreita.

## adaga (3 iterações)
- Lâmina triangular simétrica de dois gumes com nervura central (metade clara/metade média), guarda pequena, cabo vinho, pomo. Iterações só de largura e centralização.
- Pendente: nada relevante.

## estaca-de-madeira (3 iterações)
- Galho grosso, irregular, com toco de galho cortado ao lado, ponta talhada em facetas de madeira crua. Tons de madeira crua derivados: #c4a070 / #a88456 / #86663e.
- Primeira versão parecia lápis; o toco e o contorno irregular resolveram.
- Pendente: nada relevante.

## cassetete (3 iterações)
- Porrete de couro recheado: cabeça em gota, costura de borda com pontos, amarração vinho no pescoço, cabo e alça de pulso (traço duplo). Couro escuro derivado: #7a6450 / #5c4836 / #3f3125 (o couro natural lia como madeira/colher).
- Pendente: nada relevante.

## porrete (1 iteração)
- Clava de madeira afinando para o cabo, dois nós, tira de couro vinho enrolada na empunhadura (traço duplo).
- Pendente: os nós lembram furos de leve.

## bastao-curto (1 iteração)
- Haste reta de madeira com ponteiras de ferro nas duas pontas e empunhadura de couro.
- Pendente: nada relevante.

## soco-ingles (3 iterações)
- Sem grade: 512x341. Ferro forjado com 4 anéis, barra de palma e cravos piramidais (toque medieval).
- Tirei rebites da barra (com o vão curvo parecia rosto sorrindo); vão agora retangular.
- Pendente: a forma é a clássica de soco inglês; medieval só pelo ferro e cravos.

## garrote (5 iterações)
- Corda com dois cabos de madeira, formando laço cruzado (perna esquerda por cima). Corda com tracejado de torção como em corda-3-4.
- Iterações para limpar a emenda do cruzamento (ver aviso do linecap no cairosvg).
- Pendente: nada relevante.

## chicote (4 iterações)
- Cabo vinho trançado na diagonal inferior esquerda; trança de couro natural em espiral (volta interna por cima), ponta fina pendendo.
- Pendente: a passagem da trança grossa para a ponta fina é abrupta.

## nunchaku (2 iterações)
- Duas clavas de madeira quase paralelas com ponteiras de ferro, corrente curta em arco no topo.
- Pendente: nada relevante.

## kusari (3 iterações)
- Corrente em S com peso octogonal grande na ponta de baixo (pendurado por argola) e peso menor em barra na outra ponta (kusari-fundo).
- Pendente: a 64 px os elos ficam finos; lê como corrente, mas sem detalhe.

# Lote: machados, maças e armas de haste

# Lote B-hastes

Hastes diagonais geradas por scripts em `tools/icones-svg/hastes/` (pole.py + um script por item); o SVG final é estático.

## machado (1 iteração)
- 2x4 em pé. Lâmina barbada à esquerda, talão quadrado à direita, empunhadura de couro vinho.
- Pendente: nada relevante.

## machadinha (3 iterações)
- 1x3. Cabo simples de madeira sem couro, com dilatação na ponta (estilo machadinha de lenhador); cabeça pequena com olho estreito.
- Pendente: na grade 1x3 o cabo fica longo em relação à cabeça; a diferença para o machado vem do cabo sem couro e da cabeça menor.

## machado-de-arremesso (2 iterações)
- 2x3. Cabeça tipo francisca, compacta e inclinada para cima, cabo curto levemente curvo com amarração de couro.
- Pendente: nada relevante.

## maca (2 iterações)
- 2x3. Maça de flanges: 5 flanges visíveis (frontal, duas a ±60°, duas laterais) em tons do claro (esq.) ao escuro (dir.).
- Pendente: a 64 px as flanges viram uma cabeça serrilhada; a primeira versão parecia machado duplo e foi descartada.

## maca-pequena (2 iterações)
- 1x3. Para diferenciar da maça, cabeça de gomos (ovoide com 3 nervuras) e botão no topo.
- Pendente: nada relevante.

## picareta (2 iterações)
- 1x3. Picareta de guerra: bico perfurante reto e grosso levemente caído, martelete curto atrás, lingüetas e empunhadura.
- Pendente: o bico curvo da primeira versão lembrava martelo de unha; ficou reto, mas ainda pode lembrar um martelo à primeira vista.

## maca-estrela (2 iterações)
- 2x3. Cabo curto de uma mão, corrente de elos alternados (traço duplo + barras), bola com 10 cravos.
- Pendente: elos finos a 64 px (aparecem como traço pontilhado).

## malho (2 iterações)
- 2x4. Marreta: bloco grande com faces de batida, cabo longo com duas empunhaduras.
- Pendente: nada relevante.

## machado-duas-maos (1 iteração)
- 2x4. Lâmina grande barbada, espigão traseiro, cabo longo com duas empunhaduras e lingüetas.
- Pendente: nada relevante.

## segadeira (2 iterações)
- 2x4. Gadanha: cabo comprido levemente curvo, punho lateral de madeira, lâmina longa curva saindo para a esquerda no topo. Sem couro, para ler como ferramenta.
- Pendente: nada relevante.

## mangual-duas-maos (2 iterações)
- 2x3. Mesmo vocabulário da maça-estrela, mas cabo longo com duas empunhaduras, bola maior com 12 cravos e um aro de reforço.
- Pendente: na mesma grade 2x3 fica parecido com a maça-estrela; a diferença é o cabo longo e a bola maior.

## lanca (2 iterações)
- Diagonal 45°. Ponta em folha larga com nervura, alvado, empunhadura de couro no meio, ponteira.
- Pendente: nada relevante.

## lanca-longa (3 iterações)
- Diagonal 45°. Ponta estreita em losango com lingüetas longas (estilo pique), haste mais fina, duas empunhaduras.
- Pendente: a cabeça é menor que a da lança por definição; ainda legível a 64 px.

## lanca-de-justa (2 iterações)
- Diagonal 45°. Haste grossa afunilando até uma ponta pequena, vamplate cônico de ferro protegendo a mão, empunhadura estreita, contrapeso grosso.
- Pendente: nada relevante.

## azagaia (1 iteração)
- Grade 1x5 → em pé, viewBox 102x512 (a lista dá grade, então não é diagonal). Haste fina, ponta em folha pequena, amarração de corda de arremesso.
- Pendente: nada relevante.

## glaive (4 iterações)
- Diagonal 45°. Lâmina larga de um gume (gume convexo à direita local), pequeno esporão traseiro, alvado.
- Pendente: o esporão é pequeno a 64 px.

## naginata-armas-de-haste (4 iterações)
- Diagonal 45°. Lâmina curva, tsuba, colar metálico, haste de madeira mais escura (derivei #7a5a3a / #5a3f26 / #3e2915) e ponteira longa de metal.
- Pendente: nada relevante.

## alabarda (2 iterações)
- Diagonal 45°. Lâmina de machado para cima-esquerda, gancho para baixo-direita, espigão de lança no topo.
- Pendente: nada relevante.

## machado-de-haste (4 iterações)
- Diagonal 45°. Lâmina grande em meia-lua (machado dinamarquês), talão pequeno, haste longa com duas empunhaduras; sem espigão, para diferenciar da alabarda.
- Pendente: nada relevante.

## bordao-bastao (3 iterações)
- Diagonal 45°. Bastão liso de madeira com ponteiras de ferro nas duas pontas. Faixas de couro removidas para ficar liso.
- Pendente: por ser só um cilindro, depende da faixa de luz e das ponteiras para ser lido.

# Lote: armaduras de membros, mãos e pés

# Lote F2-membros

Geração: os SVGs saem de um gerador Python com formas-base compartilhadas
(`tools/icones-svg/membros/`: `lib.py`, `items.py`, `feet.py`) para garantir o mesmo vocabulário:
todas as perneiras usam a mesma perna (LEG), todas as mangas a mesma manga dobrada no cotovelo (SLEEVE),
braçadeiras a mesma braçadeira (VAMB), luvas a mesma mão, calçados a mesma sola.
Pares: peça de trás deslocada para cima/direita e um tom abaixo (claro->médio, médio->escuro, escuro->escuro*0.72).
Interiores ocos (abertura de braçadeira, sapato, bota, solleret, borda interna da greva) usam o tom profundo do material escurecido (x0.6), como as fendas pretas do elmo.
Couro escuro de reforço/cintos/solas: `#7c5a3a / #573d26 / #3f2b1a` (couro natural um tom abaixo).
Faixas de luz: o próprio contorno deslocado (clip aninhado), então seguem a forma; nos calçados o deslocamento é diagonal (luz de cima-esquerda).

## perneiras-de-couro (3 iterações)
- Par de pernas inteiras (coxa a tornozelo), aba com ilhó no topo para amarrar ao cinto, duas correias finas com fivela, marca do joelho.
- Pendente: no 2x2 o par fica estreito (muita margem lateral); a forma das pernas é algo cilíndrica.

## perneiras-de-couro-reforcado (1 iteração)
- Mesma perna em couro natural com placa de coxa, joelheira redonda e talas da canela em couro escuro rebitado, uma correia.
- Pendente: nada relevante; a 64 px os rebites viram pontinhos.

## perneiras-de-cota-de-malha (1 iteração)
- Mesma perna em ferro com fileiras de arcos (malha), faixa de couro no topo + aba.
- Pendente: no 2x2 o par fica estreito; a 64 px a malha vira textura cinza (lê como malha/tecido metálico).

## perneiras-de-escamas (2 iterações)
- Mesma perna com escamas em U (cor por posição: claras à esquerda), faixa de couro no topo.
- Correção: tom profundo da peça de trás estava igual ao escuro e sumia o contorno das escamas.
- Pendente: nada relevante.

## perneiras-de-placas (2 iterações)
- Coxote com lâmina articulada, joelheira em cúpula com asa em leque no lado externo, greva com aresta central.
- Pendente: a 64 px as asas dos joelhos parecem um nó/engrenagem pequena.

## calcas-de-couro (2 iterações)
- Calças inteiras com cós de couro escuro, braguilha com cordão cruzado em linho, costuras laterais e marcas dos joelhos.
- Correção: faixas por deslocamento faziam triângulos estranhos no gancho; trocadas por faixas retas.
- Pendente: nada relevante.

## saiote-de-couro-batido (3 iterações)
- Cinto com fivela e duas camadas de tiras (pteruges) levemente em leque, tachas de ferro.
- Pendente: pode lembrar franja/vassoura em vez de saia; 7 tiras finas a 64 px viram listras.

## mangas-de-tecido (2 iterações)
- Manga inteira (cabeça do ombro em cúpula, cotovelo dobrado) em linho, costuras acolchoadas tracejadas transversais, punho mais escuro.
- Pendente: tracejado some a 64 px (fica só manga clara).

## mangas-de-couro-reforcado (2 iterações)
- Couro natural com ombreira, cotoveleira e talas do antebraço em couro escuro rebitado, correia com fivela.
- Pendente: nada relevante.

## mangas-de-cota-de-malha (1 iteração)
- Mesma manga em malha com debrum de couro no ombro.
- Pendente: nada relevante.

## mangas-de-escamas (2 iterações)
- Mesma manga com escamas sobre couro, debrum de couro no ombro.
- Pendente: o claro/escuro das escamas segue x fixo, não acompanha a inclinação do antebraço.

## bracadeiras-de-bronze (3 iterações)
- Par de braçadeiras (antebraço) inclinadas, borda do cotovelo oblíqua com interior escuro, filete de brilho, borda do punho.
- Correção: aros/cordões de couro faziam parecer barril; removidos.
- Pendente: sem contexto pode lembrar canos de bota; bronze ainda puxa para madeira/couro claro.

## bracadeira-de-placas (3 iterações)
- Nome no singular, mas desenhado em par (seguindo a orientação do lote). Duas metades articuladas (aresta central), duas lâminas na ponta do cotovelo, correia com fivela, rebites.
- Correção: cotoveleira em cúpula com leque no topo parecia tampa/cogumelo; trocada por lâminas.
- Pendente: nada relevante.

## grevas-de-bronze (3 iterações)
- Par de grevas anatômicas (joelho em cúpula, relevo da panturrilha, aresta da canela), interior escuro visível na borda direita para mostrar a casca.
- Pendente: ainda um pouco "chapada" (lembra tampa de sarcófago); poderia ganhar mais volume.

## luvas-de-tecido (2 iterações)
- Par sobreposto em linho, punho curto canelado, três costuras no dorso.
- Pendente: nada relevante.

## luvas-de-couro (2 iterações)
- Par em couro natural, cano largo, costuras do dorso, correia com fivela no punho.
- Pendente: nada relevante.

## manoplas (2 iterações)
- Par em ferro: dedos segmentados em lâminas, placa dos nós dos dedos, lâminas do dorso, cano em sino com borda clara e rebites.
- Pendente: dedos finos a 64 px viram listras, mas a silhueta de mão lê bem.

## sandalias (2 iterações)
- Perfil, bico à direita: sola grossa, tira do calcanhar, laço do tornozelo, tira em T até a tira dos dedos.
- Pendente: as tiras sem pé dentro ficam "em pé" de forma pouco realista; muita margem vertical (formato largo no 2x2).

## sapatos (2 iterações)
- Sapato baixo de couro até o tornozelo, bico arredondado, abertura escura, correia com fivela, costura da gáspea.
- Pendente: margem vertical grande (objeto largo no 2x2).

## botas (2 iterações)
- Botas altas com cano dobrado em couro escuro, duas correias com fivela (reforçadas), sola escura.
- Pendente: bico algo anguloso.

## sollerets (3 iterações)
- Perfil de sapato de placas: colar do tornozelo, quatro lâminas articuladas com filete claro e rebites, bico pontudo, sola de couro.
- Correção: perfil em cunha (parecia broca); peito do pé rebaixado.
- Pendente: margem vertical grande.

# Lote: armaduras de tronco e cabeça

# Lote F1-tronco-cabeca

Gerador: os SVGs saíram de um script Python (`tools/icones-svg/tronco-cabeca/items.py` + `lib.py`) com uma silhueta-base de tronco comum (`torso()`), padrões de malha (anéis), escamas (U por coluna clara/média/escura) e um passo final que centraliza o desenho com `translate`. Peças de tronco: vista frontal, plana, sem corpo. Grade de "guardado" da `lista.txt`.

## tanga-de-pele (3 iterações)
- Cordão de couro cru com nó e pontas soltas, faixa de pele dobrada sobre o cordão, aba da frente com barra irregular e aba de trás mais larga e escura.
- Pendente: com 2x2 a peça fica larga e baixa; a 64 px lê como "avental de pele", não necessariamente tanga.

## tunica-de-pele (1 iteração)
- Túnica sem mangas de pele, barra irregular, poucos traços de pelo, cordão na cintura.
- Pendente: nada relevante; é mais estreita que as outras peças 2x2.

## peitoral-de-bronze (3 iterações)
- Couraça anatômica (peitorais, linha alba, abdômen) só da frente: pescoço aberto (sem costas), alças de ombro de couro presas na frente e correias laterais soltas que viriam das costas.
- Pendente: as correias laterais ainda lembram bracinhos à distância; o volume em faixas verticais é duro.

## corselete-de-bronze (3 iterações)
- Mesma couraça anatômica, mais larga; a placa das costas aparece escura dentro do decote (diferença para o peitoral), dobradiças laterais, e duas camadas de pteruges de couro cobrindo a virilha.
- Pendente: ombros um pouco quadrados; os pteruges a 64 px viram uma faixa listrada.

## tunica-armadura (2 iterações)
- Gambeson de linho com costuras verticais, mangas curtas, gola enrolada e três presilhas de couro; comprimento até a coxa.
- Pendente: nada relevante.

## jaqueta-de-couro (2 iterações)
- Jaqueta de couro natural, mangas longas afastadas do corpo, gola com lapelas e três tiras com fivela.
- Pendente: a 64 px pode passar por casaco comum (é o que ela é).

## armadura-de-couro (1 iteração)
- Couraça de couro rígido com abas de ombro rebitadas, cinto vinho com fivela e seis faldas largas com costura tracejada.
- Pendente: a silhueta é próxima à do corselete de bronze; a cor e o cinto separam.

## armadura-de-escamas-leve (2 iterações)
- Colete sem mangas, curto, escamas pequenas de ferro claro (coluna clara/média/escura) com bordas de couro.
- Pendente: nada relevante.

## loriga-segmentada (3 iterações)
- Estilo romano: ombreiras em lâminas curvas sobrepostas, cintas horizontais, abertura frontal com tiras de couro e fivelas de bronze, rebites de bronze.
- Pendente: as ombreiras ficaram "arco-íris" largas e há um vão escuro entre elas e o peito; legível, mas esquemático.

## cota-de-malha-longa (3 iterações)
- Cota até o joelho, mangas curtas, gola de couro, cinto. Tirei a fenda frontal, que fazia parecer bermuda.
- Pendente: nada relevante.

## camisa-de-cota-de-malha (2 iterações)
- Mesma malha (anéis em fileiras, tom escuro do ferro), corpo curto até o quadril, mangas curtas, sem cinto.
- Pendente: a diferença para a cota longa depende do comprimento e do cinto.

## armadura-de-escamas (1 iteração)
- Escamas maiores e mais escuras (médio/escuro/sombra do ferro), mangas curtas, mais longa, cinto de couro escuro.
- Pendente: nada relevante.

## peitoral-de-aco (1 iteração)
- Peito de aço medieval: quilha central, borda enrolada no pescoço e nas cavas, lâmina de cintura; mesmas alças e correias do peitoral de bronze (só frente).
- Pendente: quilha parece um pouco um zíper de perto.

## corselete-de-aco (5 iterações)
- Peito de aço com a placa das costas visível no decote e saia de quatro lâminas em sino (faldas) cobrindo a virilha.
- Tentei escarcelas separadas (2 placas): pareciam bermuda; troquei por saia de lâminas.
- Pendente: nada relevante.

## armadura-de-placas-laminadas-de-aco (2 iterações)
- Tronco todo em lâminas horizontais sobrepostas (sombra sob cada borda) com rebites nas pontas, alças de ombro.
- Pendente: lê um pouco como regata listrada; difere da loriga por não ter ombreiras nem fivelas de bronze.

## barrete-de-tecido (2 iterações)
- Gorro acolchoado de linho com costuras em gomos, abas de orelha e cordões de amarrar.
- Pendente: nada relevante.

## barrete-de-couro (3 iterações)
- Gorro rígido de couro em gomos com costura tracejada, aro e botão no topo. Ampliado com `scale(1.2)` (traço compensado para 6).
- Pendente: nada relevante.

## elmo-de-bronze (2 iterações)
- Coríntio de frente: olhos amendoados ligados à fenda entre as bochechas, nasal, borda incisa.
- Pendente: sem crista; a leitura depende do recorte em T.

## celada-de-bronze (2 iterações)
- Suposição: gorro cônico de bronze (tipo pilos), com aro e botão; só crânio. A forma alta ajuda a grade 2x3.
- Pendente: pode ler como sino/funil fora de contexto.

## elmo-de-couro (1 iteração)
- Calota de couro em gomos, aro costurado, nasal de couro rebitado e abas de bochecha.
- Pendente: nada relevante.

## elmo-de-legionario (4 iterações)
- Perfil 3/4 olhando para a esquerda: calota de ferro, reforço de testa em bronze, reforço cruzado, recorte da orelha, protetor de nuca largo, protetor de bochecha articulado, botão de crista.
- Pendente: o protetor de nuca parece um pouco solto da calota; a 64 px a leitura "elmo romano" é razoável.

## coifa-de-cota-de-malha (2 iterações)
- Capuz de malha de frente, abertura do rosto com borda de couro, mantelete sobre os ombros.
- Pendente: nada relevante.

## elmo-circular (1 iteração)
- Elmo arredondado (globo) com viseira curva de quilha central, duas fendas por lado e respiros só do lado direito, pinos da viseira, gola.
- Pendente: nada relevante; difere do elmo-grande pelo topo redondo e pela viseira em arco.

## mascara-facial-nt3 (2 iterações)
- Máscara de ferro só do rosto, olhos amendoados, nariz em quilha, fenda da boca, duas tiras de couro com fivela de cada lado. Na 1ª versão as tiras curvas pareciam patas de inseto.
- Pendente: expressão um pouco sinistra (inevitável numa máscara).

## celada (2 iterações)
- Salada (sallet) de aço de perfil, olhando para a esquerda: crânio com quilha e aba de nuca longa; sem viseira (só crânio).
- Pendente: perfil largo numa grade 2x3: sobra muito espaço vertical e o ícone fica pequeno a 64 px.

# Lote: armas de distância, redes, capas e escudos

# Lote C-distancia

Geradores auxiliares (não fazem parte do site) em `tools/icones-svg/distancia/` (bows.py, shields.py, capas.py, redes.py, laco.py, bola.py, funda.py, fusti.py, arpao.py, rope.py, geo.py). Os SVGs finais estão em `data/svgicons/`.

## arco-comum (3 iterações)
- Em pé, corda reta à esquerda, haste afilada nas pontas (forma gerada por offset de curva), empunhadura de couro vinho.
- Pendente: a 64 px o arco fica fino (é natural do objeto numa grade 1x5).

## arco-curto (3 iterações)
- Viewbox 128x512 (1x4), curvatura bem mais funda que a do comum, haste um pouco mais grossa.
- Pendente: nada relevante.

## arco-longo (3 iterações)
- Sem grade: viewBox 96x512, alto e esguio, curvatura rasa, empunhadura curta.
- Pendente: a 64 px é quase uma linha; a diferença para o comum está mais na proporção da célula do que no desenho.

## arco-composto (4 iterações)
- Perfil recurvo: pontas viram para a frente e a corda encosta nelas. Ventre em chifre (#d6bf8a/#b89c66), dorso em madeira, linha de junção entre as camadas.
- Pendente: a 64 px lê como "arco ondulado"; as camadas só aparecem no tamanho grande.

## besta (2 iterações)
- Vista de cima coerente com besta-de-alavanca: estribo na frente, verga de madeira, amarração de corda, corda armada na noz, virote carregado, gatilho longo ao lado.
- Pendente: nada relevante.

## besta-de-garrucha (2 iterações)
- Pequena, de uma mão: verga de aço, sem estribo, coronha curta que vira cabo de pistola com couro e pomo de ferro, gatilho em gancho.
- Pendente: mistura leve de vista (cabo em ângulo) para indicar "de uma mão".

## besta-de-pelouro (2 iterações)
- Mesma base da besta, com corda dupla, espaçadores de chifre, bolsa de couro com a pedra no lugar do virote e mira em forquilha na frente.
- Pendente: nada relevante.

## escudo-leve (3 iterações)
- Broquel redondo com face de couro natural (costura tracejada), aro de ferro e umbo grande com aba rebitada. Volume da face em crescentes (clip + evenodd).
- Pendente: nada relevante.

## escudo-pequeno (3 iterações)
- Redondo de tábuas verticais, tábua da esquerda clara e da direita escura (como no escudo-medio), aro e umbo de ferro.
- Pendente: nada relevante.

## escudo-grande (3 iterações)
- 4x5 (410x512). Pavês/escudo longo de topo arredondado e ponta baixa, nervura central, tábuas, duas cintas de ferro com rebites, aro de ferro.
- A primeira versão (retangular) parecia porta ou barril; trocada pela forma longa de lágrima.
- Pendente: nada relevante.

## capa-pesada (3 iterações)
- Capa com capuz, pendurada, em tecido escuro, gola de pele e fecho de bronze. Interior do capuz em #2c2823 (sombra derivada do tecido escuro, fora da paleta).
- Pendente: a silhueta lembra um pouco um sino; o capuz ajuda.

## capa-leve (3 iterações)
- Mesma estrutura, em linho claro, mais estreita, fechada com cordão. Interior do capuz em #6e6552 (derivado).
- Pendente: igual à pesada.

## rede-grande (3 iterações)
- Rede quadrada de bordas côncavas, malha diagonal levemente caída, corda de borda grossa e 8 pesos de chumbo (tons de pedra).
- Pendente: a 64 px a malha vira textura; a leitura vem dos pesos e da borda.

## rede-de-combate (2 iterações)
- Menor, 7 pesos, malha mais aberta e corda de recolher terminando em laço de pulso.
- Pendente: nada relevante.

## laco (3 iterações)
- Rolo de três voltas de corda e laço corrediço com olhal. Testei textura de torção com dasharray e removi (quase invisível).
- Pendente: nada relevante.

## boleadeira (3 iterações)
- Três bolas envoltas em couro natural com costura, presas por cordas sinuosas a um nó central.
- A versão com pedras cinzas lia como molécula; trocada por couro e cordas curvas.
- Pendente: ainda lembra levemente um diagrama de moléculas no 64 px.

## funda (3 iterações)
- Pendurada: alça para o dedo e nó no alto, duas cordas, bolsa de couro em crescente com a pedra bem visível.
- Pendente: nada relevante.

## fustibalo (3 iterações)
- Sem grade, diagonal: bastão com empunhadura de couro e ponteira de ferro com gancho; a funda pende da ponta com a pedra.
- Pendente: o gancho fica pouco visível atrás da corda.

## arremessador-de-lanca (4 iterações)
- Propulsor em pé com empunhadura e presilha de couro; a ponta de baixo vira um gancho que encaixa a base do dardo, que corre ao lado até o alto.
- As duas primeiras versões (dardo por cima da tábua, presilhas dos dois lados) pareciam espada com guarda.
- Pendente: o dardo com penas lembra uma flecha; é aceitável.

## arpao (3 iterações)
- Diagonal, ponta no alto à direita, girado 45° como o martelo-de-guerra. Ponta de ferro grande com duas farpas, amarração de corda no alvado, corda solta com uma volta.
- Pendente: nada relevante.

## zarabatana (2 iterações)
- Tubo longo de madeira com amarrações de couro e bocal de chifre embaixo; dardo-agulha com tufo de linho ao lado.
- Pendente: o dardo é fino no 64 px.

## scorpion (3 iterações)
- Sem grade, 512. Vista lateral 3/4: tripé de madeira escura (para destacar a máquina), coronha inclinada, quadro de torção com feixe de corda e chapas de ferro, dois braços, corda armada na garra, virote carregado e molinete atrás.
- Pendente: o braço inferior cruza o tripé; está legível, mas um pouco cheio.
