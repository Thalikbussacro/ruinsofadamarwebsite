import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { buildCharacterMessage } = require('../js/jogar.js');

// ficha completa: todas as seções, fé com deus entre parênteses
const completo = buildCharacterMessage({
  jogador: 'Ana',
  era: 'Era do Novo Mundo',
  magia: 'Um boato que dá medo',
  fe: 'Devoto de um deus',
  deus: 'Varnak',
  motivacao: 'Dever',
  origem: 'Fontest',
  origemDetalhe: 'Filha de soldado da fronteira.',
  nome: 'Lia',
  idade: '24',
  oficio: 'Caçadora',
  habilidades: 'Rastrear, arco.',
  aparencia: 'Magra, cicatriz no queixo.',
  marca: 'Medo de água funda.'
});
assert.ok(completo.startsWith('Olá! Quero jogar Ruínas de Adamar.'));
assert.ok(completo.includes('*Jogador:* Ana'));
assert.ok(completo.includes('*Os deuses:* Devoto de um deus (Varnak)'));
assert.ok(completo.includes('— Origem —\n*De onde vem:* Fontest'));
assert.ok(completo.includes('*Uma marca ou um medo:* Medo de água funda.'));

// campos vazios ou só com espaços são omitidos; fé sem deus não ganha parênteses
const minimo = buildCharacterMessage({ jogador: 'Bruno', era: 'Era do Apocalipse', fe: 'Não ouvem', deus: '', nome: '   ' });
assert.ok(minimo.includes('*Os deuses:* Não ouvem'));
assert.ok(!minimo.includes('('));
assert.ok(!minimo.includes('*Nome:*'));
assert.ok(!minimo.includes('undefined'));

console.log('jogar ok');
