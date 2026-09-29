# App Ruínas de Adamar — estrutura da v1

Documento de referência para o projeto do app. Descreve o que a v1 faz, como se organiza e o que falta nos dados. Base: o site atual e a base de conhecimento em `data/gurps/`.

> **Estado em 29/09/2026:** boa parte da v1 já existe no próprio site estático, sem login nem servidor: criador guiado, cofre de personagens (localStorage), ficha completa com combate, rolagem local, pontos ganhos, diário da sessão e consulta de combate (ver `README.md`). Continuam fora: login, sincronização entre aparelhos, inventário em grade e campanhas.

## Objetivo

Um gerenciador de personagens **próprio de Ruínas de Adamar**, construído sobre as regras do GURPS 4e já estruturadas neste repositório. Não é um GCS genérico: cobre só o que existe em Adamar (humanos, NT3, magia rara) e permite acrescentar regras do cenário no mesmo formato das regras do GURPS.

## Escopo

### v1 (Fase 1)
- Login (jogador e narrador).
- **Meus personagens**: criar, editar, duplicar, arquivar.
- **Criador guiado**: conceito (era, origem), pontos iniciais (padrão 80), atributos e secundárias, sociedade, vantagens/qualidades, desvantagens/peculiaridades, perícias, equipamento.
- **Ficha**: visualização completa, com NH, defesas, dano, carga e dinheiro calculados.
- **Rolagem local** a partir da ficha (perícias, atributos, defesas, dano), com resultado explicado (sucesso, margem, crítico).
- **Inventário em grade** (estilo Resident Evil 4) além do peso/carga do GURPS.
- Funciona **offline**: rolagens e ficha não dependem de conexão; o servidor guarda e sincroniza.

### Fora da v1
- Campanhas com convite (Fase 2), sessão ao vivo com rolagens visíveis ao narrador (Fase 3), estado do mundo — barreira, calendário d.u., viagens, diário (Fase 4).
- Técnicas, magias, modificadores percentuais de vantagens (ampliações/limitações), modelos raciais.
- Exportação para GCS/Foundry (desejável, não obrigatória na v1).

## Arquitetura

```
Site atual (vitrine, estático)
  └─ botão "Ir para o app" ─► App (SPA)
                               ├─ UI: criador, ficha, rolagens, inventário
                               ├─ Motor de regras (JS puro, sem UI) ← data/gurps + regras de Adamar
                               ├─ Armazenamento local (IndexedDB) — offline-first
                               └─ API + banco (Postgres) — contas, personagens, sincronização
```

- **Motor de regras separado da interface.** Funções puras, testadas com os exemplos do livro, como `js/gurps-calculo.js` já faz hoje. O mesmo motor roda no navegador e no servidor (validação).
- **Offline-first.** A ficha é um documento JSON; o app edita localmente e sincroniza quando houver conexão. Conflito: vence a edição mais recente, com histórico de versões.
- **Stack sugerida** (a decidir no projeto novo): SvelteKit ou Next.js; Postgres (Supabase ou Neon); autenticação do próprio provedor (Supabase Auth) ou Auth.js; hospedagem Vercel ou Render. Supabase adianta a Fase 3 (canais em tempo real).

## Modelo de dados

### Base de regras (somente leitura; importada de `data/gurps/`)
| Tabela | Origem | Observação |
|---|---|---|
| `livros` | `livros.json` | título, ISBN, SHA-256 do PDF, deslocamento de página |
| `pericias` | `pericias.json` | atributo, dificuldade, especialização, grupo, `adamar`, pré-definidos estruturados |
| `tracos` | `vantagens.json` + `desvantagens.json` | categoria (vantagem, qualidade, desvantagem, peculiaridade), tipos, custo estruturado, efeitos, pré-requisitos |
| `itens` | `equipamento.json` + base local | categoria, NT, perícia, `adamar`, modos de ataque, custo, peso, **tamanho na grade** |
| `regras` | `regras.json` | atributos, secundárias, carga, custo de perícias, sociedade, limites |
| `regras_privadas` | `data-local/` | tabela de dano, estatísticas de equipamento (nunca públicas) |

Todos os itens mantêm o `id` estável e a `ref` (livro + página) de hoje.

### Dados de usuário
| Tabela | Campos principais |
|---|---|
| `usuarios` | id, nome, email, papel (jogador/narrador) |
| `personagens` | id, dono, nome, era, origem, pontos_iniciais, **ficha (JSON)**, versão, atualizado_em |
| `personagens_historico` | personagem, versão, ficha (JSON), data |
| `rolagens` (Fase 3) | personagem, sessão, o que rolou, resultado, data |
| `campanhas` (Fase 2) | id, narrador, nome, era, regras da mesa (pontos, limite de desvantagens, analfabetismo…) |

### A ficha (documento)
Guarda **escolhas**, não resultados: atributos comprados, ajustes, traços escolhidos (id + nível/opção + custo digitado quando variável), perícias (id + especialização + pontos), itens (id + quantidade + posição na grade + equipado). Tudo o que é número derivado (NH, defesas, dano, carga, total de pontos) é **recalculado pelo motor**. Assim uma correção na base de regras corrige todas as fichas.

## Motor de regras

### Já existe (`js/gurps-calculo.js`, com testes)
Custo de atributos e secundárias, limites de campanha realista, esquiva, base de carga, níveis de carga, custo de perícia e nível por pontos, aparência, status, riqueza e dinheiro inicial em NT3, idiomas, alfabetização, reputação, limite de desvantagens, dano básico (com tabela local).

### A construir
- **NH de perícias** com pré-definidos em cadeia (melhor caminho entre atributo e outras perícias) e especializações.
- **Efeitos de traços**: bônus em atributos, secundárias, perícias (por id ou grupo), defesas, testes de reação. Formato declarativo, ex.: `{ "alvo": "defesas", "valor": 1 }`, `{ "alvo": "pericia", "grupo": "curandeiro", "valor": "nivel" }`.
- **Pré-requisitos** declarativos, ex.: `{ "traco": "carisma", "nivel_min": 1 }`.
- **Armas**: modos de ataque ligados à perícia; dano "GeB+2" resolvido pela ST; aparar a partir do NH; ST mínima e penalidades.
- **Validação da ficha**: pontos, limite de desvantagens, máximo de 5 peculiaridades, itens "não existe" bloqueados, "com o narrador" sinalizados.
- **Rolagem**: 3d6 contra o NH efetivo. Sucesso decisivo com 3–4 sempre, 5 com NH ≥ 15, 6 com NH ≥ 16. Falha crítica com 18 sempre, 17 se NH ≤ 15, ou falha por 10 ou mais. Mostra a margem.

### Regras de Adamar (mesmo formato das do GURPS)
Cada regra do cenário é um dado + uma função pura, testada, com `ref` apontando para a nota do cânone em vez do livro. Primeiras candidatas:
- **Inventário em grade**: cada item tem `tamanho` (largura × altura); recipientes (mochila, alforje, aljava) têm grade própria. Peso continua definindo a carga do GURPS; a grade limita o espaço.
- **Barreira por local** (Fase 4): espessura por região, reduzida pelo uso de magia, com efeitos por faixa (ver documento de sistemas).
- **Materialidade**: cura lenta e sequelas como marcadores na ficha.

## Dados que faltam (para a v1)

Só para itens `livre` e `narrador` (o que é `nao` fica fora do app):

1. ~~**Custo estruturado dos traços**~~ — feito: `custo_estruturado` em vantagens/desvantagens (fixo, opções, faixa, níveis, mínimo, variável; `autocontrole` quando há *), com `custoTraco()` no motor. Faltam fórmulas próprias de Aliados, Patronos, Inimigos, Dependentes e Dever (hoje "variável").
2. ~~**Pré-definidos estruturados das perícias**~~ — feito: `predefinidos.caminhos` (atributo ou perícia + modificador, especialização, nota), 172 de 217 perícias permitidas; as demais não têm pré-definido no livro ou são "Especial".
3. ~~**Efeitos dos traços**~~ — feito: `efeitos` nos 287 traços permitidos (134 com números, 153 descritivos), com `catalogo_testes` em regras.json. Os 23 traços com versões (Boa Forma/Ótima Forma, Sensível/Empatia…) têm `variantes` (nome, custo, resumo), uma por opção de custo, e os efeitos de uma versão só têm `variante` com o índice dela.
4. ~~**Pré-requisitos**~~ — feito: `prerequisitos` (traço, perícia, atributo, exclusão, texto) em 74 traços; `nivel_max` onde o livro limita.
5. ~~**Especializações**~~ — feito: `especializacoes` com marcação de Adamar nas 38 perícias com †; Ritual Religioso e Teologia usam os panteões do cânone. Fórmulas de Aliados, Patronos, Inimigos, Dependentes, Dever, Favor, Contatos e Grupo de Contato e a lista de Talentos estão em `regras.json` (`formulas`, `talentos`).
6. ~~**Modos de ataque estruturados**~~ — feito (só na base local): `modos_estruturados` nas 176 armas e escudos (dano GdP/GeB ou dados + tipo + divisor de armadura, alcance, aparar com desbalanceada/esgrima, ST mínima com duas mãos, precisão, CdT, tiros, magnitude), `pericias_uso` ligando cada arma às perícias do banco e `bonus_defesa` nos escudos. Armas de efeito especial (rede, laço, garrote, capas) ficam com `especial: true`. Gerado por `node tools/estruturar-armas.mjs`.
7. ~~**Ícones** e **tamanho na grade**~~ — feito: `icone` (chave genérica) em perícias, traços e itens; `grade` nos itens de Adamar; regras do inventário em `data/adamar/inventario.json`.

## Cuidado com licença

O app contém estatísticas do livro (dano, custo, peso). Para uso da mesa, atrás de login, o risco é baixo; o app **não deve ficar público** com esses números. Se um dia for aberto, consultar a política de licenças da Steve Jackson Games para ferramentas digitais.

## Critérios de pronto da v1
- Uma ficha de 80 pontos criada do zero no app bate, ponto por ponto, com a mesma ficha feita à mão pelo livro.
- NH, defesas, dano e carga conferem com o livro em pelo menos 5 personagens de teste (guerreiro, caçador, curandeira, ladrão, sacerdote).
- Itens "não existe" não aparecem; "com o narrador" aparecem sinalizados.
- A ficha funciona sem internet e sincroniza ao reconectar.
