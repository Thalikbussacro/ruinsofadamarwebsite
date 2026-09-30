// tools/adamar-rpg.mjs — quanto do Adamar RPG já é próprio e o que ainda é igual ao GURPS.
// Uso: node tools/adamar-rpg.mjs            (resumo)
//      node tools/adamar-rpg.mjs pericias   (os itens de uma lista que ainda são iguais ao GURPS)
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { carregarAdamarRpg } from './gerar-dados.mjs';
const Sistemas = createRequire(import.meta.url)('../js/sistemas.js');

const ler = (a) => JSON.parse(readFileSync(new URL('../data/gurps/' + a + '.json', import.meta.url), 'utf8'));
const LISTAS = ['pericias', 'vantagens', 'desvantagens', 'equipamento'];
const base = { regras: ler('regras') };
for (const l of LISTAS) base[l] = ler(l).itens;
const arqTabela = new URL('../data/gurps/tabela-dano.json', import.meta.url);
if (existsSync(arqTabela)) base.tabela_dano = JSON.parse(readFileSync(arqTabela, 'utf8'));
const dif = carregarAdamarRpg();
const A = Sistemas.montar(base, dif);

// folhas (valores simples) de um objeto: caminho → valor
function folhas(o, caminho = '', saida = {}) {
  if (o && typeof o === 'object') {
    for (const k of Object.keys(o)) folhas(o[k], caminho ? caminho + '.' + k : k, saida);
  } else saida[caminho] = o;
  return saida;
}
function comparar(a, b) {
  const fa = folhas(a), fb = folhas(b);
  const chaves = new Set([...Object.keys(fa), ...Object.keys(fb)]);
  let iguais = 0;
  for (const k of chaves) if (fa[k] === fb[k]) iguais++;
  return { total: chaves.size, iguais };
}

const pedida = process.argv[2];
if (pedida) {
  if (!LISTAS.includes(pedida)) { console.error('lista desconhecida: ' + pedida); process.exit(1); }
  A[pedida].filter((i) => !i.proprio).forEach((i) => console.log(i.id + '  ' + i.nome));
} else {
  let propriosTotal = 0, itensTotal = 0;
  console.log('Adamar RPG — o que já é próprio (o resto ainda é igual ao GURPS)\n');
  const reg = comparar(base.regras, A.regras);
  console.log('regras        ' + String(reg.total - reg.iguais).padStart(5) + ' de ' + reg.total + ' valores mudados');
  for (const l of LISTAS) {
    const mudados = A[l].filter((i) => i.proprio === 'mudado').length;
    const novos = A[l].filter((i) => i.proprio === 'novo').length;
    const removidos = ((dif[l] && dif[l].remover) || []).length;
    const iguais = A[l].filter((i) => !i.proprio).length;
    propriosTotal += mudados + novos;
    itensTotal += A[l].length;
    console.log(l.padEnd(13) + String(mudados).padStart(5) + ' mudados · ' + novos + ' novos · ' + removidos + ' removidos · ' + iguais + ' iguais ao GURPS');
  }
  const tabela = dif.tabela_dano ? 'própria' : 'igual ao GURPS';
  console.log('tabela de dano  ' + tabela);
  const termos = Object.keys((dif.meta && dif.meta.termos) || {}).length;
  console.log('termos        ' + String(termos).padStart(5) + ' trocados (NH, GdP, GeB, RD…)');
  const pct = Math.round(((reg.total - reg.iguais) + propriosTotal) / (reg.total + itensTotal) * 100);
  console.log('\nPróprio: ' + pct + '% (regras e itens somados). Para distribuir o jogo, a meta é chegar perto de 100% em regras, números e listas.');
}
