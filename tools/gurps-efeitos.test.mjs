import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { tipoEfeito, textoEfeito } = require('../js/gurps-efeitos.js');

const G = {
  pericias: [{ id: 'lideranca', nome: 'Liderança' }, { id: 'oratoria', nome: 'Oratória' }],
  regras: { catalogo_testes: { influencia: { descricao: 'testes de Influência' } } }
};
assert.equal(tipoEfeito({ alvo: 'pericia', ref: 'lideranca', valor: 1 }), 'aplicado');
assert.equal(tipoEfeito({ alvo: 'defesa', ref: 'todas', valor: 1 }), 'aplicado');
assert.equal(tipoEfeito({ alvo: 'defesa', ref: 'aparar', valor: 1 }), 'sempre');
assert.equal(tipoEfeito({ alvo: 'reacao', valor: 1 }), 'sempre');
assert.equal(tipoEfeito({ alvo: 'atributo', ref: 'dx', valor: -1, condicao: 'em combate' }), 'condicional');
assert.equal(tipoEfeito({ alvo: 'regra', descricao: 'x' }), 'regra');

assert.equal(textoEfeito({ alvo: 'grupo_pericias', ref: ['lideranca', 'oratoria'], valor: 1, por_nivel: true }, G, 2), '+2 em Liderança, Oratória');
assert.equal(textoEfeito({ alvo: 'grupo_pericias', ref: ['lideranca'], valor: 1, por_nivel: true }, G), '+1 por nível em Liderança');
assert.equal(textoEfeito({ alvo: 'atributo', ref: 'dx', valor: -1, condicao: 'em combate' }, G), '-1 em DX — em combate');
assert.equal(textoEfeito({ alvo: 'teste', ref: 'influencia', valor: 1, condicao: 'testes de Influência' }, G), '+1 em testes de Influência');
assert.equal(textoEfeito({ alvo: 'reacao', valor: 2, condicao: 'animais' }, G), '+2 na reação dos outros — animais');
assert.equal(textoEfeito({ alvo: 'regra', descricao: 'Não sente dor.' }, G), 'Não sente dor.');
console.log('gurps-efeitos ok');
