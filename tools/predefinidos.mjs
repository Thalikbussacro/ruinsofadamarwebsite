// tools/predefinidos.mjs — converte o texto de pré-definido das perícias ("IQ-5 ou Comércio-3")
// em caminhos que o motor percorre. Uso: node tools/predefinidos.mjs  (atualiza data/gurps/pericias.json)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ATRIBUTOS = { dx: 'dx', iq: 'iq', ht: 'ht', st: 'st', percepcao: 'per', per: 'per', vontade: 'vontade' };
const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Nomes que o livro escreve de um jeito no pré-definido e de outro no verbete.
const APELIDOS = { 'instrumento musical': 'instrumentos musicais', 'espadas de lamina larga': 'espada de lamina larga' };

export function criarIndice(pericias) {
  const porNome = new Map();
  for (const p of pericias) porNome.set(semAcento(p.nome), p.id);
  return (nome) => porNome.get(APELIDOS[semAcento(nome)] || semAcento(nome)) || null;
}

// Retorna { caminhos, parcial, especial, desconhecidos }.
export function estruturarPredefinido(texto, acharPericia) {
  const saida = { caminhos: [], parcial: false, especial: null, desconhecidos: [] };
  const t = String(texto || '').trim().replace(/\.$/, '').replace(/\s+e\s+outr[ao]s$/i, ', entre outras');
  if (!t || /^nenhum/i.test(t)) return saida;
  if (/^especial$/i.test(t)) { saida.especial = 'Especial'; return saida; }

  // Quebra em ", " e " ou ". Pedaços sem modificador esperam o próximo: ou formam um nome só
  // ("Arte ou Esporte de Combate-2") ou dividem o mesmo modificador ("Medicina, Medicina Alternativa ou Veterinária-4").
  const pedacos = t.split(/,\s*|\s+ou\s+/).map((p) => p.trim()).filter(Boolean);
  const itens = [];
  let pendentes = [];
  const MOD = /([-+]\d+)\s*(\([^)]*\))?\s*$/;
  for (const p of pedacos) {
    if (/^entre outr[ao]s$/i.test(p) || /verdadeira/.test(p)) { itens.push(p); continue; }
    const m = MOD.exec(p);
    if (!m) { pendentes.push(p); continue; }
    if (!pendentes.length) { itens.push(p); continue; }
    const junto = pendentes.join(' ou ') + ' ou ' + p;
    const nomeJunto = junto.replace(MOD, '').replace(/\([^)]*\)\s*$/, '').trim();
    if (acharPericia(nomeJunto)) itens.push(junto);
    else { for (const q of pendentes) itens.push(q + m[1]); itens.push(p); }
    pendentes = [];
  }
  for (const q of pendentes) itens.push(q);

  for (const item of itens) {
    if (/^entre outr[ao]s$/i.test(item)) { saida.parcial = true; continue; }
    const m = /^(.+?)\s*(?:\(([^)]*)\))?\s*([-+]\d+)\s*(?:\(([^)]*)\))?$/.exec(item);
    if (!m) { saida.especial = (saida.especial ? saida.especial + '; ' : '') + item; continue; }
    const nome = m[1].trim(), esp = m[2] ? m[2].trim() : null, mod = parseInt(m[3], 10);
    const atr = ATRIBUTOS[semAcento(nome)];
    if (atr) { saida.caminhos.push({ tipo: 'atributo', atributo: atr, mod }); continue; }
    const id = acharPericia(nome);
    if (!id) { saida.desconhecidos.push(nome); saida.especial = (saida.especial ? saida.especial + '; ' : '') + item; continue; }
    const c = { tipo: 'pericia', id, mod };
    if (esp) c.especializacao = esp;
    if (m[4]) c.nota = m[4].trim();
    saida.caminhos.push(c);
  }
  return saida;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
  const caminho = join(RAIZ, 'data', 'gurps', 'pericias.json');
  const dados = JSON.parse(readFileSync(caminho, 'utf8'));
  const achar = criarIndice(dados.itens);
  const problemas = [];
  for (const p of dados.itens) {
    const r = estruturarPredefinido(p.predefinido, achar);
    p.predefinidos = { caminhos: r.caminhos, parcial: r.parcial || undefined, especial: r.especial || undefined };
    if (r.desconhecidos.length) problemas.push(`${p.id}: ${r.desconhecidos.join(', ')}`);
  }
  writeFileSync(caminho, JSON.stringify(dados, null, 2) + '\n');
  console.log(problemas.length ? 'Perícias de origem não encontradas:\n' + problemas.join('\n') : 'todas as origens encontradas');
}
