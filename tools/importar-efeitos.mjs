// tools/importar-efeitos.mjs — junta aos dados os lotes de efeitos, pré-requisitos, especializações e fórmulas.
// Uso: node tools/importar-efeitos.mjs <pasta-com-os-lotes>
//   lotes A–D → vantagens/desvantagens: efeitos, prerequisitos, nivel_max
//   lote E    → pericias: especializacoes, regra_troca, livre_escolha
//   lote F    → regras.json: formulas (aliados, patronos, …) e talentos
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ALVOS = ['atributo', 'secundaria', 'pericia', 'grupo_pericias', 'defesa', 'reacao', 'teste', 'dano', 'carga', 'custo_vida', 'regra'];
const REFS = {
  atributo: ['st', 'dx', 'iq', 'ht'],
  secundaria: ['pv', 'vontade', 'per', 'pf', 'velocidade', 'deslocamento'],
  defesa: ['esquiva', 'aparar', 'bloqueio', 'todas'],
  dano: ['gdp', 'geb', 'todos']
};

// Confere um efeito; devolve a lista de problemas (vazia se ok).
export function conferirEfeito(e, ids) {
  const p = [];
  if (!ALVOS.includes(e.alvo)) return [`alvo inválido "${e.alvo}"`];
  if (e.alvo === 'regra') { if (!e.descricao) p.push('regra sem descrição'); return p; }
  if (REFS[e.alvo] && !REFS[e.alvo].includes(e.ref)) p.push(`ref "${e.ref}" inválida para ${e.alvo}`);
  if (e.alvo === 'pericia' && !ids.pericias.has(e.ref)) p.push(`perícia inexistente "${e.ref}"`);
  if (e.alvo === 'grupo_pericias') {
    if (!Array.isArray(e.ref)) p.push('grupo_pericias sem lista');
    else for (const r of e.ref) if (!ids.pericias.has(r)) p.push(`perícia inexistente "${r}"`);
  }
  if (e.alvo !== 'reacao' && e.alvo !== 'custo_vida' && typeof e.valor !== 'number') p.push('sem valor numérico');
  return p;
}

export function conferirPrerequisito(r, ids) {
  if (r.tipo === 'traco' || r.tipo === 'exclui') return ids.tracos.has(r.id) ? [] : [`traço inexistente "${r.id}"`];
  if (r.tipo === 'pericia') return ids.pericias.has(r.id) ? [] : [`perícia inexistente "${r.id}"`];
  if (r.tipo === 'atributo') return REFS.atributo.concat(REFS.secundaria).includes(r.ref) ? [] : [`atributo inválido "${r.ref}"`];
  if (r.tipo === 'texto') return r.descricao ? [] : ['pré-requisito de texto vazio'];
  return [`tipo de pré-requisito inválido "${r.tipo}"`];
}

// Remove efeitos/pré-requisitos inválidos (registrando) em vez de abortar tudo.
export function limpar(item, ids, onde, problemas) {
  const efeitos = [];
  for (const e of item.efeitos || []) {
    const p = conferirEfeito(e, ids);
    if (p.length) problemas.push(`${onde}: efeito descartado (${p.join('; ')}): ${JSON.stringify(e)}`);
    else efeitos.push(e);
  }
  const prerequisitos = [];
  for (const r of item.prerequisitos || []) {
    const p = conferirPrerequisito(r, ids);
    if (p.length) problemas.push(`${onde}: pré-requisito descartado (${p.join('; ')}): ${JSON.stringify(r)}`);
    else prerequisitos.push(r);
  }
  return { efeitos, prerequisitos };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
  const pasta = process.argv[2];
  const ler = (a) => JSON.parse(readFileSync(join(RAIZ, 'data', 'gurps', a + '.json'), 'utf8'));
  const gravar = (a, d) => writeFileSync(join(RAIZ, 'data', 'gurps', a + '.json'), JSON.stringify(d, null, 2) + '\n');
  const pericias = ler('pericias'), vant = ler('vantagens'), desv = ler('desvantagens'), regras = ler('regras');
  const ids = {
    pericias: new Set(pericias.itens.map((p) => p.id)),
    tracos: new Set(vant.itens.concat(desv.itens).map((t) => t.id))
  };
  const porId = new Map(vant.itens.concat(desv.itens).map((t) => [t.id, t]));
  const periciaPorId = new Map(pericias.itens.map((p) => [p.id, p]));
  const problemas = [];
  const faltando = [];

  const lotes = readdirSync(pasta).filter((f) => /^[A-F]-.*\.json$/.test(f) && !f.endsWith('.itens.json')).sort();
  for (const f of lotes) {
    const lote = JSON.parse(readFileSync(join(pasta, f), 'utf8'));
    const esperados = JSON.parse(readFileSync(join(pasta, f.replace(/\.json$/, '.itens.json')), 'utf8')).map((i) => i.id);
    for (const id of esperados) if (!lote.itens[id]) faltando.push(`${f}: ${id}`);

    for (const [id, v] of Object.entries(lote.itens)) {
      if (/^E-/.test(f)) {
        const p = periciaPorId.get(id);
        if (!p) { problemas.push(`${f}: perícia desconhecida "${id}"`); continue; }
        p.especializacoes = v.especializacoes || [];
        if (v.regra_troca) p.regra_troca = v.regra_troca;
        if (v.livre_escolha) p.livre_escolha = true;
        if (v.duvida) p.duvida_especializacoes = v.duvida;
      } else if (/^F-/.test(f)) {
        regras.formulas = regras.formulas || {};
        if (id === 'talento') regras.talentos = v.talentos || [];
        else regras.formulas[id] = { ...v.formula, ref: { livro: 'modulo-basico', pagina: (porId.get(id) || {}).ref?.pagina } };
        const t = porId.get(id);
        if (t && v.efeitos) Object.assign(t, limpar(v, ids, `${f}/${id}`, problemas));
      } else {
        const t = porId.get(id);
        if (!t) { problemas.push(`${f}: traço desconhecido "${id}"`); continue; }
        Object.assign(t, limpar(v, ids, `${f}/${id}`, problemas));
        t.nivel_max = v.nivel_max ?? null;
        if (v.duvida) t.duvida_efeitos = v.duvida; else delete t.duvida_efeitos;
      }
    }
  }
  for (const t of regras.talentos || []) {
    t.pericias = (t.pericias || []).filter((p) => ids.pericias.has(p) || (problemas.push(`talento ${t.id}: perícia inexistente "${p}"`), false));
  }
  gravar('pericias', pericias); gravar('vantagens', vant); gravar('desvantagens', desv); gravar('regras', regras);
  console.log(`${lotes.length} lotes importados.`);
  if (faltando.length) console.log('Itens sem resposta:\n' + faltando.join('\n'));
  if (problemas.length) console.log('Problemas (descartados, conferir):\n' + problemas.join('\n'));
}
