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

// remover por regra e poda das referências ao que saiu
{
  const base2 = {
    regras: { talentos: [{ id: 't', pericias: ['a', 'b'] }] },
    pericias: [
      { id: 'a', nome: 'A', adamar: 'livre', predefinidos: { caminhos: [{ tipo: 'pericia', id: 'b', mod: -2 }, { tipo: 'atributo', atributo: 'dx', mod: -4 }] }, relacionados: ['b'] },
      { id: 'b', nome: 'B', adamar: 'nao' }
    ],
    vantagens: [{ id: 'v', nome: 'V', adamar: 'livre', efeitos: [{ alvo: 'grupo_pericias', ref: ['a', 'b'], valor: 1 }, { alvo: 'pericia', ref: 'b', valor: 1 }], prerequisitos: [{ tipo: 'exclui', id: 'b' }] }],
    desvantagens: [], equipamento: []
  };
  const M = S.montar(base2, { pericias: { remover_se: { adamar: 'nao' } } });
  assert.deepEqual(M.pericias.map((i) => i.id), ['a']);
  assert.deepEqual(M.pericias[0].predefinidos.caminhos.map((c) => c.id || c.atributo), ['dx']);
  assert.deepEqual(M.pericias[0].relacionados, []);
  assert.deepEqual(M.vantagens[0].efeitos, [{ alvo: 'grupo_pericias', ref: ['a'], valor: 1 }]);
  assert.deepEqual(M.vantagens[0].prerequisitos, []);
  assert.deepEqual(M.regras.talentos[0].pericias, ['a']);
  assert.deepEqual(base2.pericias[0].predefinidos.caminhos.length, 2); // o GURPS fica intacto
  // o que foi mudado de propósito não é removido pela regra
  const M2 = S.montar(base2, { pericias: { remover_se: { adamar: 'nao' }, itens: [{ id: 'b', adamar: 'livre' }] } });
  assert.deepEqual(M2.pericias.map((i) => i.id), ['a', 'b']);
}
// o Adamar RPG de verdade (data/adamar-rpg) é válido
{
  const { carregarAdamarRpg } = await import('./gerar-dados.mjs');
  assert.deepEqual(validarAdamarRpg(dados, carregarAdamarRpg()), []);
}

console.log('sistemas ok');
