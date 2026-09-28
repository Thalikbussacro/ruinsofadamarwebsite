// tools/importar-equipamento.mjs — junta as transcrições de equipamento (um JSON por seção do livro)
// e grava duas versões:
//   data-local/gurps/equipamento-completo.json  tudo, com as estatísticas do livro (fora do git)
//   data/gurps/equipamento.json                 só o que pode ser público: nome, categoria, NT, página, Adamar, resumo
// Uso: node tools/importar-equipamento.mjs <pasta-com-os-json-das-secoes>
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIVRO = 'modulo-basico';
// Sufixo usado quando o mesmo nome aparece em duas tabelas (ex.: machadinha corpo a corpo e de arremesso).
const SUFIXO = {
  'arma-corpo-a-corpo': 'corpo-a-corpo', 'arma-distancia': 'distancia', 'arma-de-fogo': 'fogo', 'arma-pesada': 'pesada',
  'municao': 'municao', 'armadura': 'armadura', 'armadura-cavalo': 'cavalo', 'escudo': 'escudo', 'equipamento': 'equipamento'
};

export function juntar(secoes) {
  const itens = [];
  const notas = {};
  const vistos = new Map();
  for (const secao of secoes) {
    if (secao.notas) notas[secao.secao] = secao.notas;
    for (const bruto of secao.itens) {
      let id = bruto.id;
      if (vistos.has(id)) id = `${bruto.id}-${SUFIXO[bruto.categoria] || 'item'}`;
      if (vistos.has(id)) {
        let n = 2;
        while (vistos.has(`${bruto.id}-${n}`)) n++;
        id = `${bruto.id}-${n}`;
      }
      vistos.set(id, true);
      itens.push({ ...bruto, id, secao: secao.secao });
    }
  }
  return { itens, notas };
}

export function publico(item) {
  return {
    id: item.id,
    nome: item.nome,
    categoria: item.categoria,
    subcategoria: item.subcategoria || null,
    pericia: item.pericia || null,
    nt: String(item.nt),
    adamar: item.adamar,
    resumo: item.resumo,
    ref: { livro: LIVRO, pagina: item.pagina }
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pasta = process.argv[2];
  if (!pasta) {
    console.error('Uso: node tools/importar-equipamento.mjs <pasta-com-os-json-das-secoes>');
    process.exit(1);
  }
  const arquivos = readdirSync(pasta).filter((f) => f.endsWith('.json')).sort();
  const secoes = arquivos.map((f) => JSON.parse(readFileSync(join(pasta, f), 'utf8')));
  const { itens, notas } = juntar(secoes);

  const local = join(RAIZ, 'data-local', 'gurps');
  mkdirSync(join(local, 'equipamento-fontes'), { recursive: true });
  for (const f of arquivos) copyFileSync(join(pasta, f), join(local, 'equipamento-fontes', f));
  writeFileSync(join(local, 'equipamento-completo.json'), JSON.stringify({
    descricao: 'Equipamento do GURPS 4e (Módulo Básico) com as estatísticas do livro. Uso local; não publicar.',
    notas, itens
  }, null, 2) + '\n');

  writeFileSync(join(RAIZ, 'data', 'gurps', 'equipamento.json'), JSON.stringify({
    descricao: 'Equipamento do GURPS 4e para Adamar: nome, categoria, NT, página e marcação. As estatísticas ficam no livro (e na base local).',
    adamar: { livre: 'existe em Adamar', narrador: 'raro ou exótico: só com o narrador', nao: 'não existe em Adamar (pólvora ou tecnologia além da Idade Média)' },
    itens: itens.map(publico)
  }, null, 2) + '\n');

  const duvidas = itens.filter((i) => i.duvida).length;
  console.log(`${itens.length} itens de ${arquivos.length} seções (${duvidas} com dúvida anotada)`);
}
