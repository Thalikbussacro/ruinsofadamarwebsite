import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { validarAdamarRpg } from './gerar-dados.mjs';
const S = createRequire(import.meta.url)('../js/sistemas.js');

// objetos: junta em profundidade, troca listas e valores, null apaga
assert.deepEqual(S.mesclarObjeto({ a: 1, b: { c: 2, d: 3 }, l: [1, 2] }, { b: { c: 9 }, l: [7], e: 5 }), { a: 1, b: { c: 9, d: 3 }, l: [7], e: 5 });
assert.deepEqual(S.mesclarObjeto({ a: 1, b: 2 }, { b: null }), { a: 1 });

// listas: muda por id, acrescenta, remove; marca o que é próprio
const base = [{ id: 'x', nome: 'X', custo: 5 }, { id: 'y', nome: 'Y', custo: 10 }, { id: 'z', nome: 'Z', custo: 1 }];
const l = S.mesclarLista(base, { itens: [{ id: 'y', custo: 12 }, { id: 'w', nome: 'W', custo: 3 }], remover: ['z'] });
assert.deepEqual(l.map((i) => i.id), ['x', 'y', 'w']);
assert.equal(l[0], base[0]);                // igual ao GURPS: o mesmo objeto, sem marca
assert.equal(l[1].custo, 12);
assert.equal(l[1].nome, 'Y');               // o que não mudou vem do GURPS
assert.equal(l[1].proprio, 'mudado');
assert.equal(l[2].proprio, 'novo');
assert.equal(base[1].custo, 10);            // o GURPS não é alterado

// montar: sistema, nome e regras mescladas
const G = { regras: { campanha: { pontos: 80, moeda: 'coroa' } }, pericias: base, vantagens: [], desvantagens: [], equipamento: [], tabela_dano: { t: 1 } };
const A = S.montar(G, { meta: { nome: 'Adamar RPG', termos: { NH: 'Nível' } }, regras: { campanha: { pontos: 100 } }, pericias: { itens: [{ id: 'x', custo: 4 }] } });
assert.equal(A.sistema, 'adamar-rpg');
assert.equal(A.regras.campanha.pontos, 100);
assert.equal(A.regras.campanha.moeda, 'coroa');
assert.equal(A.termos.NH, 'Nível');
assert.equal(A.pericias[0].custo, 4);
assert.deepEqual(A.tabela_dano, { t: 1 });
assert.equal(G.regras.campanha.pontos, 80);

// validação: remover o que não existe é erro; o conjunto montado passa pelas regras do GURPS
const ler = (a) => JSON.parse(readFileSync(new URL('../data/gurps/' + a + '.json', import.meta.url), 'utf8'));
const dados = { livros: ler('livros'), regras: ler('regras'), pericias: ler('pericias'), vantagens: ler('vantagens'), desvantagens: ler('desvantagens'), equipamento: ler('equipamento') };
assert.deepEqual(validarAdamarRpg(dados, {}), []);
assert.match(validarAdamarRpg(dados, { pericias: { remover: ['nao-existe'] } }).join('\n'), /remover "nao-existe"/);
assert.match(validarAdamarRpg(dados, { pericias: { itens: [{ id: 'nova', nome: 'Nova' }] } }).join('\n'), /adamar-rpg: pericias\/nova: falta/);
assert.deepEqual(validarAdamarRpg(dados, { pericias: { itens: [{ id: 'arco', resumo: 'Atirar com arco, do jeito de Adamar.' }] } }), []);

console.log('sistemas ok');
