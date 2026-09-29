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

## Ideias para a próxima rodada

- **Modo mestre:** uma tela com vários personagens ao mesmo tempo (PV, PF, defesas) e a ordem de ação da luta.
- **Mais modelos prontos** e revisão dos atuais (ver decisão acima).

## Para revisar quando tiver tempo

- [ ] **Ícones:** alguns são aproximações (armaduras usam uma camisa, a Maça do Tabler parece varinha). Se algum incomodar, me diga o item.
- [ ] **Imagens do site:** são pinturas em domínio público (créditos em `creditos.html`). Se tiver arte própria de Adamar, é só pôr em `img/arte/` com o mesmo nome do arquivo que quer trocar.
