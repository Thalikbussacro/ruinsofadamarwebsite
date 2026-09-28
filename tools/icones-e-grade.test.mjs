import assert from 'node:assert/strict';
import { iconeItem, gradeItem, iconeTraco } from './icones-e-grade.mjs';

const it = (nome, categoria = 'equipamento', extra = {}) => ({ nome, categoria, adamar: 'livre', ...extra });
assert.equal(iconeItem(it('Kit de Primeiros Socorros')), 'cura');   // não é "soco"
assert.equal(iconeItem(it('Bridão e Rédea')), 'ferradura');          // não é "rede"
assert.equal(iconeItem(it('Balança e Pesos')), 'balanca');           // não é "lança"
assert.equal(iconeItem(it('Espada Larga', 'arma-corpo-a-corpo')), 'espada');
assert.equal(iconeItem(it('Escudo Médio', 'escudo')), 'escudo');
assert.equal(iconeItem(it('Soco', 'arma-corpo-a-corpo')), 'punho');
assert.equal(iconeItem(it('Pá')), 'ferramenta');
assert.equal(iconeItem(it('Sela e Arreios')), 'ferradura');
assert.equal(iconeItem(it('Lança', 'arma-corpo-a-corpo')), 'lanca');
assert.equal(iconeItem(it('Rede de Combate', 'arma-distancia')), 'arremesso');

assert.deepEqual(gradeItem(it('Faca', 'arma-corpo-a-corpo')), { porte: 'grade', largura: 1, altura: 2 });
assert.deepEqual(gradeItem(it('Lança', 'arma-corpo-a-corpo')), { porte: 'longo' });
assert.deepEqual(gradeItem(it('Picareta', 'equipamento')), { porte: 'grade', largura: 2, altura: 4 });
assert.deepEqual(gradeItem(it('Picareta', 'arma-corpo-a-corpo')), { porte: 'grade', largura: 1, altura: 3 });
assert.deepEqual(gradeItem(it('Ração de Viagem')), { porte: 'grade', largura: 1, altura: 1, empilha: 3 });
assert.deepEqual(gradeItem(it('Cota de Malha Longa', 'armadura', { subcategoria: 'Armadura Corporal' }), '12,5'), { porte: 'vestido', guardado: { largura: 3, altura: 4 } });
assert.equal(gradeItem(it('Soco', 'arma-corpo-a-corpo')), null);   // ataque natural
assert.equal(gradeItem(it('Pistola', 'arma-de-fogo', { adamar: 'nao' })), null);

assert.equal(iconeTraco({ categoria: 'vantagem', tipo: ['mental'] }), 'mente');
assert.equal(iconeTraco({ categoria: 'desvantagem', tipo: ['fisica'] }), 'punho-rachado');
assert.equal(iconeTraco({ categoria: 'vantagem', tipo: ['mental', 'sobrenatural'] }), 'sol');
assert.equal(iconeTraco({ categoria: 'peculiaridade', tipo: ['mental'] }), 'espiral');
console.log('icones-e-grade ok');
