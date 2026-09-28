import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { criarCalculo } = require('../js/gurps-calculo.js');
const regras = JSON.parse(readFileSync(new URL('../data/gurps/regras.json', import.meta.url), 'utf8'));
const c = criarCalculo(regras);

// Atributos: 10 é gratuito; ST/HT 10 por nível, DX/IQ 20 (pág. 14–15)
assert.equal(c.custoAtributo('st', 12), 20);
assert.equal(c.custoAtributo('iq', 9), -20);
assert.equal(c.custoAtributo('dx', 10), 0);

// Secundárias a partir dos atributos (pág. 16–17)
const sec = c.secundarias({ st: 11, dx: 12, iq: 9, ht: 11 });
assert.deepEqual(sec, { pv: 11, vontade: 9, per: 9, pf: 11, velocidade: 5.75, deslocamento: 5 });

// Ajustes compram ou vendem a partir da base; velocidade em passos de 0,25 a 5 pontos
assert.equal(c.custoSecundaria('pv', 2), 4);
assert.equal(c.custoSecundaria('per', -1), -5);
assert.equal(c.custoSecundaria('velocidade', 0.5), 10);
assert.equal(c.custoSecundaria('deslocamento', 1), 5);

// Limites de campanha realista: PV ±30% da ST (ST 10 → 7 a 13), Per no máximo -4
assert.deepEqual(c.limitesSecundaria('pv', { st: 10, dx: 10, iq: 10, ht: 10 }), { min: 7, max: 13 });
assert.deepEqual(c.limitesSecundaria('per', { st: 10, dx: 10, iq: 12, ht: 10 }), { min: 8, max: 20 });
assert.deepEqual(c.limitesSecundaria('velocidade', { st: 10, dx: 10, iq: 10, ht: 10 }), { min: 3, max: 7 });

// Esquiva = piso(Velocidade) + 3; exemplo do livro: Velocidade 5,25 → Esquiva 8
assert.equal(c.esquiva(5.25), 8);
assert.equal(c.esquiva(5.25, 2), 6);
assert.equal(c.esquiva(1, 4), 1); // nunca abaixo de 1

// Base de Carga = ST²/10 kg, em meios quilos como na tabela: ST 10 = 10, ST 15 = 22,5, ST 14 = 19,5
assert.equal(c.baseDeCarga(10), 10);
assert.equal(c.baseDeCarga(15), 22.5);
assert.equal(c.baseDeCarga(14), 19.5);
assert.equal(c.baseDeCarga(13), 17);

// Nível de carga pelo peso carregado (ST 10, BC 10 kg)
assert.equal(c.nivelDeCarga(10, 10), 0);
assert.equal(c.nivelDeCarga(10, 25), 2);
assert.equal(c.nivelDeCarga(10, 101), 5); // acima de 10×BC: não consegue se mover
assert.equal(c.deslocamentoComCarga(5, 2), 3);
assert.equal(c.deslocamentoComCarga(1, 4), 1);

// Custo de perícias (pág. 170). Exemplo do livro: DX 14 quer Espadas Curtas (Média) 17 = DX+3 → 12 pontos
assert.equal(c.custoPericia('Média', 3), 12);
assert.equal(c.custoPericia('Fácil', 0), 1);
assert.equal(c.custoPericia('Difícil', 0), 4);
assert.equal(c.custoPericia('Muito Difícil', -3), 1);
assert.equal(c.custoPericia('Muito Difícil', 1), 12);
assert.equal(c.custoPericia('Fácil', 5), 16); // linha Atributo+5 da tabela: 16 / 20 / 24 / 28
assert.equal(c.custoPericia('Muito Difícil', 5), 28);
assert.equal(c.custoPericia('Média', -2), null); // abaixo do mínimo comprável

// Inverso: quantos níveis os pontos compram
assert.equal(c.nivelPorPontos('Média', 12), 3);
assert.equal(c.nivelPorPontos('Difícil', 1), -2);
assert.equal(c.nivelPorPontos('Difícil', 3), -1); // 3 pontos só pagam o nível de 2
assert.equal(c.nivelPorPontos('Fácil', 0), null);

// Ficha completa: soma atributos e ajustes
const ficha = c.calcularFicha({ atributos: { st: 11, dx: 12, iq: 10, ht: 10 }, ajustes: { per: 2, pv: 1 } });
assert.equal(ficha.valores.per, 12);
assert.equal(ficha.valores.pv, 12);
assert.equal(ficha.custos.atributos, 10 + 40);
assert.equal(ficha.custos.secundarias, 10 + 2);
assert.equal(ficha.total, 62);

console.log('gurps-calculo ok');
