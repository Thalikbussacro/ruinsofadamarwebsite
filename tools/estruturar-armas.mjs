// tools/estruturar-armas.mjs — transforma os modos de ataque das armas (texto do livro) em dados que o motor usa.
// Trabalha só na base LOCAL (data-local/gurps/equipamento-completo.json), porque os números são do livro.
// Uso: node tools/estruturar-armas.mjs   (rode depois de importar-equipamento.mjs)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Tipos de dano do GURPS em português (Módulo Básico).
const TIPOS = {
  cont: 'contusao', corte: 'corte', perf: 'perfuracao', qmd: 'queimadura', cor: 'corrosao', tox: 'toxico', fad: 'fadiga',
  pa: 'perfurante', 'pa-': 'perfurante-pequeno', 'pa+': 'perfurante-grande', 'pa++': 'perfurante-enorme'
};

// "GeB+3 cont" → { base: 'geb', mod: 3, tipo: 'contusao' }; "1d-3 pa-" → { dados: 1, mod: -3, tipo: 'perfurante-pequeno' }
export function danoEstruturado(texto) {
  const t = String(texto || '').trim();
  if (!t || t === '—') return null;
  if (/^(espec|var)\.?$/i.test(t)) return { especial: true };
  let m = /^(GdP|GeB)\s*([+-]\d+)?\s*(?:\((\d+(?:,\d+)?)\))?\s*([a-zç+-]+)$/i.exec(t);
  if (m) {
    const r = { base: m[1].toLowerCase(), mod: m[2] ? parseInt(m[2], 10) : 0, tipo: TIPOS[m[4].toLowerCase()] || m[4] };
    if (m[3]) r.divisor_armadura = parseFloat(m[3].replace(',', '.'));
    return r;
  }
  m = /^(\d+)d\s*([+-]\d+)?\s*(?:\((\d+(?:,\d+)?)\))?\s*([a-zç+-]+)$/i.exec(t);
  if (m) {
    const r = { dados: parseInt(m[1], 10), mod: m[2] ? parseInt(m[2], 10) : 0, tipo: TIPOS[m[4].toLowerCase()] || m[4] };
    if (m[3]) r.divisor_armadura = parseFloat(m[3].replace(',', '.'));
    return r;
  }
  return { texto: t };
}

// "C,1" → { min: 0, max: 1 }; "1-3*" → { min: 1, max: 3, preparar: true }; "x3/x4" → { meio_st: 3, max_st: 4 }
export function alcanceEstruturado(texto) {
  const t = String(texto || '').trim();
  if (!t || t === '—') return null;
  if (/^(espec|var)\.?$/i.test(t)) return { especial: true };
  let m = /^x(\d+(?:,\d+)?)\s*\/\s*x(\d+(?:,\d+)?)$/i.exec(t);
  if (m) return { meio_st: parseFloat(m[1].replace(',', '.')), max_st: parseFloat(m[2].replace(',', '.')) };
  m = /^x(\d+(?:,\d+)?)$/i.exec(t);
  if (m) return { max_st: parseFloat(m[1].replace(',', '.')) };
  const preparar = /\*/.test(t);
  const partes = t.replace(/\*/g, '').split(/[,-]/).map((x) => x.trim()).map((x) => (/^c$/i.test(x) ? 0 : parseInt(x, 10)));
  if (partes.some(isNaN)) return { texto: t };
  const r = { min: Math.min(...partes), max: Math.max(...partes) };
  if (preparar) r.preparar = true;
  return r;
}

// "0D" → { mod: 0, desbalanceada: true }; "0E" → esgrima; "Não" → null
export function apararEstruturado(texto) {
  const t = String(texto || '').trim();
  if (!t || /^n[aã]o$/i.test(t)) return null;
  if (/^(espec|var)\.?$/i.test(t)) return { especial: true };
  const m = /^([+-]?\d+)\s*([DEF]?)$/i.exec(t);
  if (!m) return { texto: t };
  const r = { mod: parseInt(m[1], 10) };
  if (/d/i.test(m[2])) r.desbalanceada = true;
  if (/[ef]/i.test(m[2])) r.esgrima = true;
  return r;
}

// "11†" → { min: 11, duas_maos: true }; "13‡" → { min: 13, duas_maos: true, despreparada: true }
export function stEstruturada(texto) {
  const t = String(texto || '').trim();
  const m = /^(\d+)\s*([†‡])?/.exec(t);
  if (!m) return null;
  const r = { min: parseInt(m[1], 10) };
  if (m[2]) r.duas_maos = true;
  if (m[2] === '‡') r.despreparada = true;
  return r;
}

export function modoEstruturado(m, est = {}) {
  const r = {
    dano: danoEstruturado(m.dano),
    alcance: alcanceEstruturado(m.alcance),
    aparar: m.aparar !== undefined ? apararEstruturado(m.aparar) : undefined,
    st: stEstruturada(m.st || est.st)
  };
  if (m.prec != null) r.precisao = parseInt(m.prec, 10);
  if (m.cdt != null) r.cdt = m.cdt;
  if (m.tiros != null) r.tiros = m.tiros;
  if (m.magnitude != null) r.magnitude = parseInt(m.magnitude, 10);
  return r;
}

// "Boxe, Briga, Caratê ou DX" → [boxe, briga, carate, atributo dx]; "Arma de Arremesso (Faca)" → especialização
export function periciasDaArma(texto, acharPericia) {
  const t = String(texto || '').trim();
  if (!t) return [];
  const esp = /^(.*?)\s*\(([^)]+)\)$/.exec(t);
  if (esp && acharPericia(esp[1])) return [{ tipo: 'pericia', id: acharPericia(esp[1]), especializacao: esp[2] }];
  return t.split(/,\s*|\s+ou\s+/).map((p) => {
    const m = /^(.+?)\s*([+-]\d+)?$/.exec(p.trim());
    const nome = m[1], mod = m[2] ? parseInt(m[2], 10) : 0;
    if (/^(dx|st|iq|ht)$/i.test(nome)) return { tipo: 'atributo', atributo: nome.toLowerCase(), mod };
    const id = acharPericia(nome);
    return id ? { tipo: 'pericia', id, mod } : { tipo: 'desconhecida', nome, mod };
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
  const arq = join(RAIZ, 'data-local', 'gurps', 'equipamento-completo.json');
  const dados = JSON.parse(readFileSync(arq, 'utf8'));
  const pericias = JSON.parse(readFileSync(join(RAIZ, 'data', 'gurps', 'pericias.json'), 'utf8')).itens;
  const porNome = new Map(pericias.map((p) => [semAcento(p.nome), p.id]));
  const APELIDOS = { 'espadas de lamina larga': 'espada de lamina larga', 'canhoneiro': 'canhoneiro' };
  const achar = (n) => porNome.get(APELIDOS[semAcento(n)] || semAcento(n)) || null;
  const pendentes = [];
  for (const it of dados.itens) {
    // só armas e escudos ("armadura" também contém "arma")
    if (!/^arma-|^escudo$/.test(it.categoria)) {
      delete it.pericias_uso; delete it.modos_estruturados;
      continue;
    }
    it.pericias_uso = periciasDaArma(it.pericia, achar);
    const est = it.estatisticas || {};
    // armas corpo a corpo têm lista de modos; as à distância guardam um modo só direto nas estatísticas
    const modos = est.modos && est.modos.length ? est.modos : (est.dano ? [est] : []);
    it.modos_estruturados = modos.map((m) => modoEstruturado(m, est));
    if (it.categoria === 'escudo' && est.bd != null) it.bonus_defesa = parseInt(est.bd, 10);
    if (it.adamar !== 'nao') {
      for (const m of it.modos_estruturados) for (const k of ['dano', 'alcance', 'aparar']) if (m[k] && m[k].texto) pendentes.push(`${it.id}: ${k} "${m[k].texto}"`);
      for (const p of it.pericias_uso) if (p.tipo === 'desconhecida') pendentes.push(`${it.id}: perícia "${p.nome}"`);
    }
  }
  writeFileSync(arq, JSON.stringify(dados, null, 2) + '\n');
  console.log(pendentes.length ? 'Não estruturado (itens de Adamar):\n' + pendentes.join('\n') : 'todas as armas de Adamar estruturadas');
}
