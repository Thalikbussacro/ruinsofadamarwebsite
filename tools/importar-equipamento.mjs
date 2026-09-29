// tools/importar-equipamento.mjs — junta as transcrições de equipamento (um JSON por seção do livro)
// e grava duas versões:
//   data-local/gurps/equipamento-completo.json  tudo, com as estatísticas do livro (fora do git)
//   data/gurps/equipamento.json                 só o que pode ser público: nome, categoria, NT, página, Adamar, resumo, preço
// Uso: node tools/importar-equipamento.mjs <pasta-com-os-json-das-secoes>
//      node tools/importar-equipamento.mjs --precos   (só atualiza o preço na base pública, a partir da local)
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

// "$60" → { valor: 60 }; "+$20" → adicional; "$1K" → 1000; "$25 (cada 10 m)" → { valor: 25, por: 'cada 10 m' }; "—"/"var." → null
export function precoEstruturado(texto) {
  const t = String(texto == null ? '' : texto).trim();
  const m = /^(\+)?\$\s*([\d.]+(?:,\d+)?)\s*([KM])?\s*(?:\((.+)\))?$/i.exec(t);
  if (!m) return null;
  const mult = { K: 1000, M: 1000000 }[(m[3] || '').toUpperCase()] || 1;
  const r = { valor: Math.round(parseFloat(m[2].replace(/\./g, '').replace(',', '.')) * mult * 100) / 100 };
  if (m[1]) r.adicional = true;
  if (m[4]) r.por = m[4].trim();
  return r;
}

// Só o preço vai para a base pública, e só dos itens que existem em Adamar (em coroas: 1 coroa = $1).
// Itens cujo preço no livro depende da versão: vale a versão que existe em Adamar.
const PRECO_MANUAL = {
  'caixa-de-ferramentas-portatil': { valor: 300, nota: 'de Carpintaria; a de Armeiro custa 600' }
};

export function publico(item) {
  const est = item.estatisticas || {};
  // sem custo no item, usa o do primeiro modo (ex.: Arremessador de Lança: o bastão)
  const custo = est.custo != null ? est.custo : ((est.modos || [])[0] || {}).custo;
  const preco = item.adamar === 'nao' ? null : (PRECO_MANUAL[item.id] || precoEstruturado(custo));
  return {
    id: item.id,
    nome: item.nome,
    categoria: item.categoria,
    subcategoria: item.subcategoria || null,
    pericia: item.pericia || null,
    nt: String(item.nt),
    adamar: item.adamar,
    resumo: item.resumo,
    ref: { livro: LIVRO, pagina: item.pagina },
    ...(preco ? { preco } : {})
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pasta = process.argv[2];
  if (pasta === '--precos') {
    const local = JSON.parse(readFileSync(join(RAIZ, 'data-local', 'gurps', 'equipamento-completo.json'), 'utf8'));
    const arqPublico = join(RAIZ, 'data', 'gurps', 'equipamento.json');
    const pub = JSON.parse(readFileSync(arqPublico, 'utf8'));
    const porId = new Map(local.itens.map((i) => [i.id, i]));
    let n = 0;
    for (const it of pub.itens) {
      const { preco } = publico(porId.get(it.id) || it);
      if (preco) { it.preco = preco; n++; } else delete it.preco;
    }
    writeFileSync(arqPublico, JSON.stringify(pub, null, 2) + '\n');
    console.log(`${n} itens com preço`);
    process.exit(0);
  }
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
