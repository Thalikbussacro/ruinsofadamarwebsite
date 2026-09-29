// tools/enriquecimento.mjs — mostra o andamento do enriquecimento dos itens (ver docs/enriquecimento-itens.md).
// Uso: node tools/enriquecimento.mjs            (resumo por fatia)
//      node tools/enriquecimento.mjs E3          (lista os itens pendentes da fatia E3)
import { readFileSync } from 'node:fs';

const ler = (f) => {
  const j = JSON.parse(readFileSync(new URL('../data/gurps/' + f + '.json', import.meta.url), 'utf8'));
  return Array.isArray(j) ? j : Object.values(j).find(Array.isArray);
};
const pericias = ler('pericias');
const vantagens = ler('vantagens');
const desvantagens = ler('desvantagens');
const equipamento = ler('equipamento');

const inicial = (i) => i.nome.normalize('NFD').toUpperCase().replace(/[^A-Z]/g, '')[0]; // sem acentos nem aspas
const entre = (a, b) => (i) => inicial(i) >= a && inicial(i) <= b;

// Cada fatia: código, título, itens. Ordem = prioridade (primeiro o que a mesa mais usa).
export const FATIAS = [
  ['P1', 'Perícias livres A–C', pericias.filter((i) => i.adamar === 'livre' && entre('A', 'C')(i))],
  ['P2', 'Perícias livres D–L', pericias.filter((i) => i.adamar === 'livre' && entre('D', 'L')(i))],
  ['P3', 'Perícias livres M–R', pericias.filter((i) => i.adamar === 'livre' && entre('M', 'R')(i))],
  ['P4', 'Perícias livres S–Z', pericias.filter((i) => i.adamar === 'livre' && entre('S', 'Z')(i))],
  ['P5', 'Perícias com o narrador e fora de Adamar', pericias.filter((i) => i.adamar !== 'livre')],
  ['V1', 'Vantagens livres e qualidades', vantagens.filter((i) => i.adamar === 'livre' || i.categoria === 'qualidade')],
  ['V2', 'Vantagens com o narrador', vantagens.filter((i) => i.adamar === 'narrador' && i.categoria !== 'qualidade')],
  ['V3', 'Vantagens fora de Adamar A–L', vantagens.filter((i) => i.adamar === 'nao' && i.categoria !== 'qualidade' && entre('A', 'L')(i))],
  ['V4', 'Vantagens fora de Adamar M–Z', vantagens.filter((i) => i.adamar === 'nao' && i.categoria !== 'qualidade' && entre('M', 'Z')(i))],
  ['D1', 'Peculiaridades', desvantagens.filter((i) => i.categoria === 'peculiaridade')],
  ['D2', 'Desvantagens livres A–E', desvantagens.filter((i) => i.categoria !== 'peculiaridade' && i.adamar === 'livre' && entre('A', 'E')(i))],
  ['D3', 'Desvantagens livres F–M', desvantagens.filter((i) => i.categoria !== 'peculiaridade' && i.adamar === 'livre' && entre('F', 'M')(i))],
  ['D4', 'Desvantagens livres N–Z', desvantagens.filter((i) => i.categoria !== 'peculiaridade' && i.adamar === 'livre' && entre('N', 'Z')(i))],
  ['D5', 'Desvantagens com o narrador e fora de Adamar', desvantagens.filter((i) => i.categoria !== 'peculiaridade' && i.adamar !== 'livre')],
  ['E1', 'Armas corpo a corpo', equipamento.filter((i) => i.categoria === 'arma-corpo-a-corpo')],
  ['E2', 'Armas de distância e pesadas', equipamento.filter((i) => i.categoria === 'arma-distancia' || i.categoria === 'arma-pesada')],
  ['E3', 'Armas de fogo', equipamento.filter((i) => i.categoria === 'arma-de-fogo')],
  ['E4', 'Armaduras', equipamento.filter((i) => i.categoria === 'armadura')],
  ['E5', 'Escudos e armaduras de cavalo', equipamento.filter((i) => i.categoria === 'escudo' || i.categoria === 'armadura-cavalo')],
  ['E6', 'Equipamento variado A–L', equipamento.filter((i) => i.categoria === 'equipamento' && entre('A', 'L')(i))],
  ['E7', 'Equipamento variado M–Z', equipamento.filter((i) => i.categoria === 'equipamento' && entre('M', 'Z')(i))]
];

// Um item conta como feito quando tem descrição e ao menos dois exemplos.
export const feito = (i) => typeof i.descricao === 'string' && i.descricao.length >= 200 && Array.isArray(i.exemplos) && i.exemplos.length >= 2;

// todo item precisa cair em exatamente uma fatia
const contagem = new Map();
for (const [, , itens] of FATIAS) for (const i of itens) contagem.set(i, (contagem.get(i) || 0) + 1);
const foraDeFatia = [pericias, vantagens, desvantagens, equipamento].flat().filter((i) => contagem.get(i) !== 1);
if (foraDeFatia.length) {
  console.error('itens fora de fatia (ou em mais de uma): ' + foraDeFatia.map((i) => i.id).join(', '));
  process.exitCode = 1;
}

const pedida = process.argv[2];
if (pedida) {
  const f = FATIAS.find((x) => x[0] === pedida.toUpperCase());
  if (!f) { console.error('fatia desconhecida: ' + pedida); process.exit(1); }
  f[2].filter((i) => !feito(i)).forEach((i) => console.log(i.id + '  ' + i.nome + '  (' + i.adamar + ')'));
} else {
  let total = 0, prontos = 0;
  for (const [cod, titulo, itens] of FATIAS) {
    const n = itens.filter(feito).length;
    total += itens.length;
    prontos += n;
    console.log(cod.padEnd(3) + ' ' + titulo.padEnd(46) + String(n).padStart(4) + ' / ' + itens.length);
  }
  console.log('total'.padEnd(50) + String(prontos).padStart(4) + ' / ' + total);
}
