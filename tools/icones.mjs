// tools/icones.mjs — monta data/gurps/icones.json com o desenho (SVG) de cada ícone usado pelas listas.
// Os ícones vêm do Tabler Icons (MIT, só contorno); os que começam com "custom:" são desenhos próprios
// (data/icones-proprios.json). Cada item das listas guarda só o nome em "icone".
// Uso: node tools/icones.mjs                       (baixa o que faltar e grava icones.json)
//      node tools/icones.mjs --aplicar <pasta>     (antes: grava em cada lista os ícones de <pasta>/icones-saida-<lista>.json)
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TABLER = { nome: 'Tabler Icons', versao: '3.48.0', licenca: 'MIT', site: 'https://tabler.io/icons' };
export const LISTAS = ['pericias', 'vantagens', 'desvantagens', 'equipamento'];
// ícones usados direto pelas telas (fora das listas): "Do zero" no criador, Talentos e peculiaridades no cofre
export const EXTRAS = ['pencil', 'star', 'spiral'];
export const urlTabler = (nome) => `https://cdn.jsdelivr.net/npm/@tabler/icons@${TABLER.versao}/icons/outline/${nome}.svg`;

// Tira o <svg> de fora e o retângulo invisível que o Tabler põe em todo ícone; fica só o desenho.
export function miolo(svg) {
  const m = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg);
  if (!m) throw new Error('SVG inválido');
  return m[1]
    .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '')
    .replace(/\s*\n\s*/g, '')
    .replace(/\s+\/>/g, '/>')
    .trim();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ler = (a) => JSON.parse(readFileSync(join(RAIZ, 'data', 'gurps', a + '.json'), 'utf8'));
  const gravar = (a, d) => writeFileSync(join(RAIZ, 'data', 'gurps', a + '.json'), JSON.stringify(d, null, 2) + '\n');
  const i = process.argv.indexOf('--aplicar');
  if (i !== -1) {
    const pasta = process.argv[i + 1];
    for (const l of LISTAS) {
      const arq = join(pasta, `icones-saida-${l}.json`);
      if (!existsSync(arq)) { console.log('sem saída para', l); continue; }
      const mapa = JSON.parse(readFileSync(arq, 'utf8'));
      const d = ler(l);
      let n = 0;
      for (const it of d.itens) if (mapa[it.id]) { it.icone = mapa[it.id]; n++; }
      gravar(l, d);
      console.log(l, n, 'de', d.itens.length);
    }
  }

  const usados = new Set(EXTRAS);
  for (const l of LISTAS) for (const it of ler(l).itens) if (it.icone) usados.add(it.icone);
  // modelos e outras listas de data/adamar também podem ter ícone
  const pastaAdamar = join(RAIZ, 'data', 'adamar');
  for (const f of readdirSync(pastaAdamar).filter((x) => x.endsWith('.json'))) {
    const d = JSON.parse(readFileSync(join(pastaAdamar, f), 'utf8'));
    for (const it of d.itens || []) if (it.icone) usados.add(it.icone);
  }
  const proprios = JSON.parse(readFileSync(join(RAIZ, 'data', 'icones-proprios.json'), 'utf8')).icones;
  const arqSaida = join(RAIZ, 'data', 'gurps', 'icones.json');
  const antes = existsSync(arqSaida) ? JSON.parse(readFileSync(arqSaida, 'utf8')).icones : {};
  const icones = {};
  const faltando = [];
  for (const nome of [...usados].sort()) {
    if (nome.startsWith('custom:')) {
      if (proprios[nome]) icones[nome] = { svg: proprios[nome], fonte: 'proprio' };
      else faltando.push(nome);
      continue;
    }
    if (antes[nome] && antes[nome].svg) { icones[nome] = antes[nome]; continue; }
    const r = await fetch(urlTabler(nome));
    if (!r.ok) { faltando.push(nome); continue; }
    icones[nome] = { svg: miolo(await r.text()), fonte: 'tabler', url: urlTabler(nome) };
  }
  writeFileSync(arqSaida, JSON.stringify({
    descricao: 'Desenho de cada ícone usado nas listas (campo "icone"). Tabler: só o miolo do SVG 24×24, traço de contorno.',
    tabler: TABLER,
    proprios: 'data/icones-proprios.json',
    icones
  }, null, 2) + '\n');
  console.log(Object.keys(icones).length, 'ícones gravados');
  if (faltando.length) { console.log('Não encontrados:', faltando.join(', ')); process.exitCode = 1; }
}
