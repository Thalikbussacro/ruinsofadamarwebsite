# Pendências do dono

Coisas que dependem de você (decisão, acesso ou teste no seu aparelho). Vou acrescentando aqui; quando resolver, pode apagar a linha ou me avisar.

## Para fazer no PC

- [ ] **Publicar os números de combate** (peso, dano, alcance, aparar, proteção e tabela de dano por ST). Eles já estão prontos no seu computador, fora de commit; a proteção do Claude Code não me deixa publicar tabelas do livro num repositório público. Se quiser publicar, rode na pasta do projeto:
  `git add -A && git commit -m "feat: publica números de combate" && git push`
  (ou, no Claude Code, o mesmo comando com `!` na frente). Sem isso, o site funciona, mas mostra "GeB+1" em vez de "1d+3" e fica sem peso, carga e proteção.
- [ ] **Opcional: liberar esse tipo de push para o Claude** adicionando uma regra de permissão nas configurações do Claude Code, se preferir que eu publique das próximas vezes.
- [ ] **Conferir no Galaxy S24** se o rodapé do criador (Voltar · Salvar · Continuar) aparece inteiro acima da barra de navegação.

## Decisões de regra (a mesa decide)

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

## Ideias para a próxima rodada

- **Modo mestre:** uma tela com vários personagens ao mesmo tempo (PV, PF, defesas) e a ordem de ação da luta.
- **Mais modelos prontos** e revisão dos atuais (ver decisão acima).

## Para revisar quando tiver tempo

- [ ] **Ícones:** alguns são aproximações (armaduras usam uma camisa, a Maça do Tabler parece varinha). Se algum incomodar, me diga o item.
- [ ] **Imagens do site:** são pinturas em domínio público (créditos em `creditos.html`). Se tiver arte própria de Adamar, é só pôr em `img/arte/` com o mesmo nome do arquivo que quer trocar.
