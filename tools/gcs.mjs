// tools/gcs.mjs — vínculo dos nossos itens com a biblioteca do GCS (GURPS Character Sheet), Basic Set.
// Uso: node tools/gcs.mjs candidatos <pasta-saida>   gera as listas lado a lado (nossas e do GCS) para montar o vínculo
//      node tools/gcs.mjs conferir                    confere data/gurps/gcs.json contra a biblioteca local
// A biblioteca fica fora do repositório: GCS_BIBLIOTECA, ou a Master Library do GCS (completa), ou a cópia em
// User Library/RuinsOfAdamar (mesmos ids, mas com menos perícias).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BIB = process.env.GCS_BIBLIOTECA || [
  join(homedir(), 'GCS', 'Master Library', 'Basic Set'),
  join(homedir(), 'GCS', 'User Library', 'RuinsOfAdamar', 'Basic Set.Basic Set')
].find((p) => existsSync(p)) || '';
const ARQUIVOS = { pericias: 'Basic Set Skills.skl', tracos: 'Basic Set Traits.adq', equipamento: 'Basic Set Equipment.eqp' };

function linhas(arquivo) {
  const saida = [];
  (function andar(rs) { for (const r of rs || []) { if (r.children) andar(r.children); else saida.push(r); } })(JSON.parse(readFileSync(join(BIB, arquivo), 'utf8')).rows);
  return saida;
}
function nossos(lista) {
  const j = JSON.parse(readFileSync(new URL('../data/gurps/' + lista + '.json', import.meta.url), 'utf8'));
  return Array.isArray(j) ? j : Object.values(j).find(Array.isArray);
}
export function gcsCompacto(tipo) {
  return linhas(ARQUIVOS[tipo]).map((r) => ({
    id: r.id,
    nome: (r.name || r.description) + (r.specialization ? ' (' + r.specialization + ')' : ''),
    ref: r.reference,
    ...(r.difficulty ? { dif: r.difficulty } : {}),
    ...(r.base_points != null ? { pontos: r.base_points } : {}),
    ...(r.points_per_level ? { por_nivel: r.points_per_level } : {}),
    ...(r.tags ? { tags: r.tags.join(', ') } : {}),
    ...(r.local_notes ? { notas: r.local_notes } : {})
  }));
}

const principal = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
const [cmd, arg] = principal ? process.argv.slice(2) : [];
if (!principal) {
  // importado: só expõe gcsCompacto
} else if (cmd === 'candidatos') {
  const nossosCompactos = (lista, campos) => nossos(lista).map((i) => Object.fromEntries(['id', 'nome', ...campos, 'resumo'].filter((k) => i[k] != null).map((k) => [k, i[k]])));
  writeFileSync(join(arg, 'gcs-pericias.json'), JSON.stringify({ nossos: nossosCompactos('pericias', ['atributo', 'dificuldade', 'especializacao']), gcs: gcsCompacto('pericias') }, null, 1));
  writeFileSync(join(arg, 'gcs-tracos.json'), JSON.stringify({ nossos: [...nossosCompactos('vantagens', ['categoria', 'custo']), ...nossosCompactos('desvantagens', ['categoria', 'custo'])], gcs: gcsCompacto('tracos') }, null, 1));
  writeFileSync(join(arg, 'gcs-equipamento.json'), JSON.stringify({ nossos: nossosCompactos('equipamento', ['categoria', 'subcategoria', 'nt']), gcs: gcsCompacto('equipamento') }, null, 1));
  console.log('candidatos gravados em ' + arg);
} else if (cmd === 'conferir') {
  const v = JSON.parse(readFileSync(new URL('../data/gurps/gcs.json', import.meta.url), 'utf8'));
  const erros = [];
  const temBib = existsSync(BIB);
  const porTipo = { pericias: 'pericias', vantagens: 'tracos', desvantagens: 'tracos', equipamento: 'equipamento' };
  for (const [lista, tipo] of Object.entries(porTipo)) {
    const ids = new Set(nossos(lista).map((i) => i.id));
    const gcs = temBib ? new Map(gcsCompacto(tipo).map((g) => [g.id, g])) : null;
    for (const [id, g] of Object.entries(v[lista] || {})) {
      if (!ids.has(id)) erros.push(lista + '/' + id + ': item nosso inexistente');
      if (!g.id || !g.nome) erros.push(lista + '/' + id + ': falta id ou nome do GCS');
      if (gcs && !gcs.has(g.id)) erros.push(lista + '/' + id + ': id do GCS não existe na biblioteca (' + g.id + ')');
      else if (gcs && gcs.get(g.id).nome !== g.nome) erros.push(lista + '/' + id + ': nome não bate com o GCS (' + g.nome + ' ≠ ' + gcs.get(g.id).nome + ')');
    }
    const n = Object.keys(v[lista] || {}).length;
    console.log(lista.padEnd(13) + String(n).padStart(4) + ' / ' + ids.size + ' vinculados');
  }
  if (!temBib) console.log('(biblioteca do GCS não encontrada: conferi só o formato)');
  if (erros.length) { console.error(erros.join('\n')); process.exit(1); }
} else {
  console.error('uso: node tools/gcs.mjs candidatos <pasta> | conferir');
  process.exit(1);
}
