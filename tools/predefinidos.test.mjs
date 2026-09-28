import assert from 'node:assert/strict';
import { criarIndice, estruturarPredefinido as e } from './predefinidos.mjs';

const achar = criarIndice([
  { id: 'comercio', nome: 'Comércio' }, { id: 'adestramento-de-animais', nome: 'Adestramento de Animais' },
  { id: 'arte-ou-esporte-de-combate', nome: 'Arte ou Esporte de Combate' }, { id: 'instrumentos-musicais', nome: 'Instrumentos Musicais' },
  { id: 'boemia', nome: 'Boêmia' }
]);

assert.deepEqual(e('DX-5', achar).caminhos, [{ tipo: 'atributo', atributo: 'dx', mod: -5 }]);
assert.deepEqual(e('IQ-5 ou Comércio-3', achar).caminhos, [
  { tipo: 'atributo', atributo: 'iq', mod: -5 }, { tipo: 'pericia', id: 'comercio', mod: -3 }
]);
assert.deepEqual(e('Percepção-4', achar).caminhos, [{ tipo: 'atributo', atributo: 'per', mod: -4 }]);
assert.deepEqual(e('Vontade-5', achar).caminhos, [{ tipo: 'atributo', atributo: 'vontade', mod: -5 }]);
// especialização e "(mesma)"
assert.deepEqual(e('IQ-5, Adestramento de Animais (mesma)-4', achar).caminhos[1],
  { tipo: 'pericia', id: 'adestramento-de-animais', mod: -4, especializacao: 'mesma' });
// nome de perícia com "ou" dentro não vira duas alternativas
assert.deepEqual(e('Arte ou Esporte de Combate-2, Atuação-3', achar).caminhos[0],
  { tipo: 'pericia', id: 'arte-ou-esporte-de-combate', mod: -2 });
// apelidos: o livro escreve "Instrumento Musical" e "Boemia" no pré-definido
assert.equal(e('Instrumento Musical-2', achar).caminhos[0].id, 'instrumentos-musicais');
assert.equal(e('IQ-5 ou Boemia-3', achar).caminhos[1].id, 'boemia');
// "entre outras", "Especial", "Nenhum"
assert.equal(e('DX-4, entre outras', achar).parcial, true);
assert.equal(e('IQ-5 e outros', achar).parcial, true);
assert.equal(e('Especial', achar).especial, 'Especial');
assert.deepEqual(e('Nenhum', achar).caminhos, []);
// origem desconhecida fica registrada, sem quebrar
const r = e('IQ-6 ou Alquimia-3', achar);
assert.deepEqual(r.desconhecidos, ['Alquimia']);
assert.equal(r.caminhos.length, 1);
// modificador compartilhado: "Medicina, Medicina Alternativa ou Veterinária-4"
const achar2 = criarIndice([{ id: 'medicina', nome: 'Medicina' }, { id: 'medicina-alternativa', nome: 'Medicina Alternativa' }, { id: 'veterinaria', nome: 'Veterinária' }, { id: 'furtividade', nome: 'Furtividade' }, { id: 'observacao', nome: 'Observação' }]);
assert.deepEqual(e('IQ-4, Medicina, Medicina Alternativa ou Veterinária-4', achar2).caminhos.map((c) => (c.id || c.atributo) + c.mod),
  ['iq-4', 'medicina-4', 'medicina-alternativa-4', 'veterinaria-4']);
// nota depois do número
assert.deepEqual(e('IQ-5, Furtividade-4 (a pé) ou Observação-5', achar2).caminhos[1], { tipo: 'pericia', id: 'furtividade', mod: -4, nota: 'a pé' });
console.log('predefinidos ok');
