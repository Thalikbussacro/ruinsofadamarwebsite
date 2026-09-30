# Pendências do dono

Coisas que dependem de você (decisão, acesso ou teste no seu aparelho). Vou acrescentando aqui; quando resolver, pode apagar a linha ou me avisar.

## Para fazer no PC

- [x] **Publicar os números de combate** — feito por você em 29/09/2026.
- [ ] **Conferir no Galaxy S24** se o rodapé do criador (Voltar · Salvar · Continuar) aparece inteiro acima da barra de navegação.

## Decisões de regra (a mesa decide)

- [ ] **Qualidade dos itens (proposta minha, confirmar):** escala em que 0 é normal. Armas: −1 Barata (preço ×0,4, quebra mais fácil), +1 Boa (×4, +1 no dano corpo a corpo), +2 Excelente (×20, +2 no dano). Armaduras: −1 ×0,5, +1 ×3, +2 ×10 (só preço e descrição). Ferramentas e equipamento: −1 Improvisada (×0,5, −1 na perícia), +1 Boa (×5, +1), +2 Excelente (×20, +2). Os números ficam em `data/gurps/regras.json` → `qualidade_itens`; é só mudar lá.
- [ ] **Recipientes:** hoje só itens com nome de mochila, bolsa, algibeira, aljava, saco, bainha, bornal, cesto, caixa, baú ou alforje aparecem como "Dentro de…". Faltou algum?
- [ ] **Dano: +4 vira +1d?** Regra opcional do livro (ex.: 1d+4 passa a 2d). Hoje o site **não** converte.
- [ ] **Peso da munição conta na carga?** Hoje flechas, virotes e pedras **não** entram no peso.
- [ ] **Armaduras em camadas:** hoje a proteção de peças no mesmo lugar **só soma**. O livro tem regras mais finas (camadas flexíveis, só frente). Somar está bom?
- [ ] **Dever:** as opções cobrem só a frequência (−2 a −15). Os agravantes do livro (extremamente perigoso, involuntário) ainda não entram. Precisa?
- [ ] **Modelos prontos:** hoje são Caçador, Soldado, Curandeira, Ladrão, Erudito e Mercador. Quer outros (Menestrel, Pescador, Guarda de caravana, Sacerdote de um panteão…) ou mexer nesses?

## Para testar quando puder

- [ ] **Diário da sessão:** na ficha completa (Cofre › personagem), painel Em jogo. Escreva uma entrada; role algo e clique "→ diário" no quadro de rolagens.
- [ ] **Consulta rápida de combate** (À Mesa › Combate): ver se o resumo está do jeito que a mesa usa, se falta algo (ex.: agarrar, derrubar, tabela de distância).

## Enriquecimento dos itens (feito — revisar quando puder)

Os 1097 itens ganharam "Mais sobre" (descrição, exemplos na mesa, Adamar, dica, relacionados) e 1049 foram ligados ao GCS. Detalhes em `docs/enriquecimento-itens.md`. Os textos são com palavras próprias, a partir do conhecimento de GURPS, não do livro: vale conferir com o livro na mão os que você mais usa.

- [ ] **Conferir com o livro** (fiquei em dúvida sobre qual regra o nome traduzido representa):
  - **Arrebatador** (vantagem, 80 pts, pág. 41): não achei o correspondente em inglês; o texto descreve um fascínio sobrenatural.
  - **Interposição** (vantagem, pág. 66): suspeito que seja o *Jumper* (viajar entre mundos ou épocas); o texto está genérico.
  - Já corrigidos por mim, mas vale olhar: Dissimulação (= *Acting*), Lábia (= *Fast-Talk*), Temor (= *Fearfulness*) e Mão Fraca (= *Bad Grip*, pegada fraca; o resumo antigo falava em mão inábil e estava errado).
- [ ] **Texto do livro para consulta pessoal:** a proteção do Claude Code não me deixa extrair texto do PDF, nem para uso local. Se quiser, dá para você mesmo extrair para `data-local/` (fora do git) e eu faço o site mostrar esse texto só quando ele existir na sua máquina, do mesmo jeito que os números de combate.
- [ ] **Itens sem vínculo com o GCS** (48): ataques naturais, armaduras de cavalo e alguns traços sem equivalente direto. Se souber o nome em inglês de algum, é só me dizer.

## Jogo (ver `docs/jogo/design.md`)

- [ ] **Ler o documento de design** e corrigir o que não for o que você imagina.
- [ ] **Decisões em aberto:** região de Roestia do primeiro mapa e seus biomas; quais forasteiros existem e como agem; se a magia entra no primeiro jogo; tempo real ou turnos no solo; nome do jogo.
- [ ] **Adamar RPG** (o sistema próprio, ao lado do GURPS): ir trocando em `data/adamar-rpg/` o que ainda é igual ao GURPS — custos e fórmulas de `regras.json`, a lista de perícias e vantagens com seus valores, a tabela de dano, os números das armas e armaduras, os termos (NH, GdP, GeB, RD). `node tools/adamar-rpg.mjs` mostra quanto já é próprio (hoje 0%).
- [ ] **Números da simulação** (fome, sede, frio, sangramento, infecção, cura, desgaste, receitas) são proposta minha em `data/jogo/*.json`; ajuste jogando no modo Jogando.
- [ ] **Calendário:** usei um ano de 360 dias em quatro estações de 90 como proposta; o cânone não fixa um.

## Ideias para a próxima rodada

- **Modo mestre:** uma tela com vários personagens ao mesmo tempo (PV, PF, defesas) e a ordem de ação da luta.
- **Mais modelos prontos** e revisão dos atuais (ver decisão acima).

## Para revisar quando tiver tempo

- [ ] **Ícones:** alguns são aproximações (armaduras usam uma camisa, a Maça do Tabler parece varinha). Se algum incomodar, me diga o item.
- [ ] **Imagens do site:** são pinturas em domínio público (créditos em `creditos.html`). Se tiver arte própria de Adamar, é só pôr em `img/arte/` com o mesmo nome do arquivo que quer trocar.
