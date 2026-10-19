# Ícones de itens: notas

Um SVG por item, com o nome igual ao `id` em `data/gurps/equipamento.json`. Os previews PNG não ficam no repositório: são gerados só na hora da revisão.

Itens que são o mesmo objeto de outro com outra regra de uso (ex.: `espada-bastarda-duas-maos`) não têm SVG próprio: `apelidos.json` aponta cada um para o SVG que ele usa. Ataques naturais e desarmados (soco, chute, dentes, presas, bico, golpeador) e golpes com escudo não são objetos e ficam sem ícone desenhado.

Renderização com `cairosvg` 2.9.1 (Python). Previews gerados a partir de cada SVG com o lado maior em 512 px (`-512`, `-dark` sobre `#14110e`) e em 64 px (`-64`).

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

Geral: todos os SVGs foram gerados por script (`scratchpad/gbardas/gen.py`, `heads.py`, `bodies.py`) para que a silhueta do cavalo seja exatamente a mesma em toda a série. Cavalo chapado em marrom-acinzentado escuro (`#4a4038`, com `#372f29` para cauda e pernas do lado oposto). Esse tom foi derivado do pelo, mais escuro e menos saturado, para não competir com a peça. Luz e sombra nas peças vêm de uma borda clara no alto à esquerda e escura embaixo à direita, feitas com clipPath de cópias deslocadas da própria forma. Malha: arcos em ∩ pequenos. Escamas: fileiras de U maiores, com arco claro. Couro e tecido: couro natural com borda de tecido claro em traço duplo. Peças de malha e escamas da cabeça e da barda parcial levam bainha de couro.
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
