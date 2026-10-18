# Ícones de itens: notas

Renderização com `cairosvg` 2.9.1 (Python). Previews gerados a partir de cada SVG com o lado maior em 512 px (`-512`, `-dark` sobre `#14110e`) e em 64 px (`-64`).

Não usei imagens de referência da web: as ferramentas de busca desta sessão devolvem só texto, não imagens. Silhuetas e proporções vêm de conhecimento geral dos objetos.

## martelo-de-guerra (3 iterações)
- Suposições: espigão levemente curvo para baixo (estilo bec de corbin), cabeça de contusão de face retangular, lingüetas de ferro descendo da cabeça, empunhadura em couro vinho no terço inferior. Sem espigão na ponta superior, para não virar arma de haste.
- Desenhado com o cabo na vertical e girado 45° (`rotate(45)`): a luz local "da esquerda" vira "de cima à esquerda" no resultado.
- Pendente: a 64 px o cabo vira uma linha fina; a cabeça continua legível. A face inferior escura do espigão some um pouco sobre o fundo escuro, só o contorno a separa.

## rifle-de-assalto-556 (3 iterações)
- Suposições: coronha fixa, trilho superior com alça de mira simples, massa de mira triangular, guarda-mão com fendas de ventilação, carregador curvo para a frente, quebra-chamas com fenda. Peças de polímero (coronha, empunhadura, carregador, guarda-mão) e de ferro (caixa da culatra, trilho, cano). Silhueta genérica, mistura de vários modelos.
- `viewBox` 512×210.
- Pendente: os três tons de polímero da paleta são muito próximos; o volume das peças de polímero fica sutil, e a 64 px a coronha e o carregador perdem contraste com o fundo. A silhueta continua clara.

## besta-de-alavanca (3 iterações)
- Grade 1x2, `viewBox` 256×512. Besta vista de cima (arco no alto, estribo na frente), com o pé de cabra a meio caminho de armar: as garras puxam a corda, os braços do garfo apoiam no pino que atravessa a coronha e o cabo sai em diagonal para baixo à direita, com empunhadura de couro.
- Escolhi vista de cima em vez de perfil porque o perfil esconde o arco e a besta deixa de ser reconhecível. O custo é que a mecânica real da alavanca (pivô sobre os pinos, garra articulada) fica simplificada: as garras aparecem como uma moldura em U.
- O ferro da alavanca é a única peça clara; a besta fica em madeira para a alavanca se destacar.
- Pendente: a 32×64 a alavanca se reduz a uma mancha cinza sobre a coronha; a leitura "besta com algo encaixado" se mantém, mas "alavanca" só fica clara a partir de ~128 px. A besta em si é uma arma; aparece porque o item precisa de contexto.
