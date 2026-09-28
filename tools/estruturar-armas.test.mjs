import assert from 'node:assert/strict';
import { modoEstruturado, danoEstruturado as d, alcanceEstruturado as a, apararEstruturado as p, stEstruturada as s, periciasDaArma } from './estruturar-armas.mjs';

// Exemplos sintéticos no formato do livro (sem copiar a tabela).
assert.deepEqual(d('GeB+3 cont'), { base: 'geb', mod: 3, tipo: 'contusao' });
assert.deepEqual(d('GdP perf'), { base: 'gdp', mod: 0, tipo: 'perfuracao' });
assert.deepEqual(d('GeB-1 corte'), { base: 'geb', mod: -1, tipo: 'corte' });
assert.deepEqual(d('1d-3 pa-'), { dados: 1, mod: -3, tipo: 'perfurante-pequeno' });
assert.deepEqual(d('8d(5) qmd'), { dados: 8, mod: 0, tipo: 'queimadura', divisor_armadura: 5 });
assert.equal(d('—'), null);
assert.deepEqual(d('GdP(0,5) perf'), { base: 'gdp', mod: 0, tipo: 'perfuracao', divisor_armadura: 0.5 });
assert.deepEqual(d('espec.'), { especial: true });
assert.deepEqual(a('x4'), { max_st: 4 });
assert.deepEqual(p('var.'), { especial: true });

assert.deepEqual(a('C,1'), { min: 0, max: 1 });
assert.deepEqual(a('1-3*'), { min: 1, max: 3, preparar: true });
assert.deepEqual(a('2,3*'), { min: 2, max: 3, preparar: true });
assert.deepEqual(a('x3/x4'), { meio_st: 3, max_st: 4 });

assert.deepEqual(p('0D'), { mod: 0, desbalanceada: true });
assert.deepEqual(p('0E'), { mod: 0, esgrima: true });
assert.deepEqual(p('-1'), { mod: -1 });
assert.equal(p('Não'), null);

assert.deepEqual(s('11†'), { min: 11, duas_maos: true });
assert.deepEqual(s('13‡'), { min: 13, duas_maos: true, despreparada: true });
assert.deepEqual(s('7'), { min: 7 });
assert.equal(s('—'), null);

const achar = (n) => ({ boxe: 'boxe', briga: 'briga', 'caratê': 'carate', 'arma de arremesso': 'arma-de-arremesso' })[n.toLowerCase()] || null;
assert.deepEqual(periciasDaArma('Boxe, Briga, Caratê ou DX', achar).map((x) => x.id || x.atributo), ['boxe', 'briga', 'carate', 'dx']);
assert.deepEqual(periciasDaArma('Briga-2 ou DX-2', achar), [{ tipo: 'pericia', id: 'briga', mod: -2 }, { tipo: 'atributo', atributo: 'dx', mod: -2 }]);
assert.deepEqual(periciasDaArma('Arma de Arremesso (Faca)', achar), [{ tipo: 'pericia', id: 'arma-de-arremesso', especializacao: 'Faca' }]);
// modo de arma à distância (estatísticas direto no item)
assert.deepEqual(modoEstruturado({ dano: 'GdP+2 perf', prec: '3', alcance: 'x10/x15', st: '10†', magnitude: '-6', cdt: '1', tiros: '1(2)' }),
  { dano: { base: 'gdp', mod: 2, tipo: 'perfuracao' }, alcance: { meio_st: 10, max_st: 15 }, aparar: undefined, st: { min: 10, duas_maos: true }, precisao: 3, cdt: '1', tiros: '1(2)', magnitude: -6 });
console.log('estruturar-armas ok');
