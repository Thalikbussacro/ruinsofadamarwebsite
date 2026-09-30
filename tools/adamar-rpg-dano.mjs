// tools/adamar-rpg-dano.mjs — gera data/adamar-rpg/tabela-dano.json, o dano por Força do Adamar RPG, a partir de uma fórmula.
// Ideia: o dano médio cresce em linha reta com a Força (sem os saltos da tabela do GURPS). Mude os números abaixo e rode de novo.
//   Estocada (ataque de ponta):  média = (Força − ESTOCADA_BASE) / 2
//   Golpe (ataque em arco):      média = (Força − GOLPE_BASE) / 2
// A média vira dados de seis faces (3,5 por dado) mais um ajuste; o ajuste nunca passa de −5.
import { writeFileSync } from 'node:fs';

const ESTOCADA_BASE = 6;
const GOLPE_BASE = 4;

export function dano(media) {
  const m = Math.max(0.5, media);
  const dados = Math.max(1, Math.round(m / 3.5));
  const ajuste = Math.max(-5, Math.round(m - dados * 3.5));
  return dados + 'd' + (ajuste > 0 ? '+' + ajuste : ajuste < 0 ? String(ajuste) : '');
}
export function linha(st) {
  return { st, gdp: dano((st - ESTOCADA_BASE) / 2), geb: dano((st - GOLPE_BASE) / 2) };
}

if (process.argv[1] && process.argv[1].endsWith('adamar-rpg-dano.mjs')) {
  const linhas = [];
  for (let st = 1; st <= 100; st++) linhas.push(linha(st));
  const tabela = {
    descricao: 'Dano por Força do Adamar RPG (próprio, proposta 0.1): gerado por tools/adamar-rpg-dano.mjs. As chaves gdp/geb são a Estocada e o Golpe.',
    formula: { estocada: '(Força − ' + ESTOCADA_BASE + ') / 2', golpe: '(Força − ' + GOLPE_BASE + ') / 2', dado: 3.5 },
    regra_acima_de_100: 'Some 1d à Estocada e ao Golpe para cada 10 pontos inteiros de Força acima de 100.',
    linhas
  };
  writeFileSync(new URL('../data/adamar-rpg/tabela-dano.json', import.meta.url), JSON.stringify(tabela, null, 2) + '\n');
  console.log('tabela de dano do Adamar RPG: ST 10 → ' + linha(10).gdp + ' / ' + linha(10).geb + ' · ST 14 → ' + linha(14).gdp + ' / ' + linha(14).geb + ' · ST 20 → ' + linha(20).gdp + ' / ' + linha(20).geb);
}
