// tools/versionar.mjs — põe "?v=<hash>" nos links de css/ e js/ de todas as páginas, a partir do conteúdo de cada arquivo.
// Assim o navegador (e o cache do GitHub Pages) baixa de novo só o que mudou.
// Uso: node tools/versionar.mjs          (atualiza as páginas)
//      node tools/versionar.mjs --check  (falha se alguma página estiver com versão velha)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const REF = /((?:href|src)=")((?:\.\.\/)*)((?:css|js)\/[\w.-]+\.(?:css|js))(?:\?v=[\w]+)?(")/g;

export function hashDe(conteudo) {
  return createHash('sha256').update(conteudo).digest('hex').slice(0, 8);
}

// Troca as referências de um HTML usando lerHash(caminhoRelativoAoSite) → hash (ou null para não mexer).
export function versionarHtml(html, lerHash) {
  return html.replace(REF, (tudo, ini, voltas, arquivo, fim) => {
    const h = lerHash(arquivo);
    return h ? ini + voltas + arquivo + '?v=' + h + fim : tudo;
  });
}

function paginas(pasta) {
  const saida = [];
  for (const nome of readdirSync(pasta)) {
    if (/^(node_modules|\.git|data-local|referencias|docs)$/.test(nome)) continue;
    const c = join(pasta, nome);
    if (statSync(c).isDirectory()) saida.push(...paginas(c));
    else if (nome.endsWith('.html')) saida.push(c);
  }
  return saida;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const checar = process.argv.includes('--check');
  const cache = {};
  const lerHash = (arq) => {
    if (!(arq in cache)) {
      try { cache[arq] = hashDe(readFileSync(join(RAIZ, arq))); } catch (e) { cache[arq] = null; }
    }
    return cache[arq];
  };
  const velhas = [];
  for (const p of paginas(RAIZ)) {
    const antes = readFileSync(p, 'utf8');
    const depois = versionarHtml(antes, lerHash);
    if (antes === depois) continue;
    if (checar) velhas.push(relative(RAIZ, p));
    else writeFileSync(p, depois);
  }
  if (checar) {
    if (velhas.length) { console.error('Versões desatualizadas (rode node tools/versionar.mjs): ' + velhas.join(', ')); process.exit(1); }
    console.log('versões em dia');
  } else console.log('páginas versionadas');
}
