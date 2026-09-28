// tools/custo-estruturado.mjs — converte o custo em texto dos traços ("5/nível", "5 ou 15", "-5 a -15*")
// num objeto que o motor de regras entende. Uso: node tools/custo-estruturado.mjs  (atualiza data/gurps/*.json)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const n = (s) => parseInt(s.replace('+', ''), 10);

// Formatos:
//   { tipo: 'fixo', valor }                       "10", "-15"
//   { tipo: 'opcoes', valores, unidade? }         "5 ou 15", "5, 10 ou 15", "1 ou 2/cultura"
//   { tipo: 'faixa', min, max }                   "5 a 20", "-5 a -15"
//   { tipo: 'niveis', por_nivel, base?, unidade?} "5/nível", "3 por +1", "5/apetrecho", "5 (nível 0), +10/nível"
//   { tipo: 'minimo', valor }                     "10 ou mais"
//   { tipo: 'variavel' }                          "Variável" e qualquer formato não reconhecido (o jogador digita)
// autocontrole: true quando o livro marca o custo com * (pág. 121).
export function estruturarCusto(texto) {
  const bruto = String(texto).trim();
  const autocontrole = /\*/.test(bruto);
  const t = bruto.replace(/\*/g, '').trim();
  const com = (o) => (autocontrole ? { ...o, autocontrole: true } : o);
  let m;

  if (/^vari[aá]vel/i.test(t)) return com({ tipo: 'variavel' });
  if ((m = /^([-+]?\d+)$/.exec(t))) return com({ tipo: 'fixo', valor: n(m[1]) });
  if ((m = /^([-+]?\d+) ou mais$/.exec(t))) return com({ tipo: 'minimo', valor: n(m[1]) });
  if ((m = /^([-+]?\d+) a ([-+]?\d+)$/.exec(t))) {
    const a = n(m[1]), b = n(m[2]);
    return com({ tipo: 'faixa', min: Math.min(a, b), max: Math.max(a, b) });
  }
  if ((m = /^([-+]?\d+) \(nível 0\), \+(\d+)\/nível$/.exec(t))) {
    return com({ tipo: 'niveis', base: n(m[1]), por_nivel: n(m[2]), nivel_min: 0 });
  }
  if ((m = /^([-+]?\d+)\s*(?:\/|por\s)\s*(\+1 de reação|\+1|nível|[a-zà-ú]+)$/i.exec(t))) {
    const u = m[2].toLowerCase();
    const unidade = u === 'nível' || u === '+1' ? null : u.replace(/^\+1 de /, '');
    return com(unidade ? { tipo: 'niveis', por_nivel: n(m[1]), unidade } : { tipo: 'niveis', por_nivel: n(m[1]) });
  }
  if ((m = /^((?:[-+]?\d+,\s*)*[-+]?\d+) ou ([-+]?\d+)(?:\/([a-zà-ú]+))?$/i.exec(t))) {
    const valores = m[1].split(',').map((x) => n(x.trim())).concat([n(m[2])]);
    return com(m[3] ? { tipo: 'opcoes', valores, unidade: m[3] } : { tipo: 'opcoes', valores });
  }
  return com({ tipo: 'variavel', texto: bruto });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
  const naoReconhecidos = [];
  for (const arq of ['vantagens', 'desvantagens']) {
    const caminho = join(RAIZ, 'data', 'gurps', arq + '.json');
    const dados = JSON.parse(readFileSync(caminho, 'utf8'));
    for (const it of dados.itens) {
      it.custo_estruturado = estruturarCusto(it.custo);
      if (it.custo_estruturado.texto && !/^vari/i.test(it.custo)) naoReconhecidos.push(`${arq}/${it.id}: "${it.custo}"`);
    }
    writeFileSync(caminho, JSON.stringify(dados, null, 2) + '\n');
  }
  console.log(naoReconhecidos.length ? 'Viraram "variável" (conferir):\n' + naoReconhecidos.join('\n') : 'todos os custos reconhecidos');
}
