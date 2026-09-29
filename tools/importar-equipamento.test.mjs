import assert from 'node:assert/strict';
import { juntar, publico, precoEstruturado, pesoEstruturado, rdEstruturada, numerosDeJogo } from './importar-equipamento.mjs';

const secoes = [
  { secao: 'corpo-a-corpo', notas: { t: { 1: 'n' } }, itens: [
    { id: 'machadinha', nome: 'Machadinha', categoria: 'arma-corpo-a-corpo', nt: '0', pagina: 271, adamar: 'livre', resumo: 'x', estatisticas: { custo: '$50' } }
  ] },
  { secao: 'distancia', itens: [
    { id: 'machadinha', nome: 'Machadinha', categoria: 'arma-distancia', nt: '0', pagina: 276, adamar: 'livre', resumo: 'y' },
    { id: 'machadinha', nome: 'Machadinha', categoria: 'arma-distancia', nt: '0', pagina: 276, adamar: 'livre', resumo: 'z' }
  ] }
];
const { itens, notas } = juntar(secoes);
assert.deepEqual(itens.map((i) => i.id), ['machadinha', 'machadinha-distancia', 'machadinha-2']);
assert.deepEqual(notas, { 'corpo-a-corpo': { t: { 1: 'n' } } });

// a versão pública não leva estatísticas do livro
const p = publico(itens[0]);
assert.equal(p.estatisticas, undefined);
assert.deepEqual(p.ref, { livro: 'modulo-basico', pagina: 271 });
assert.equal(p.nt, '0');
// preço: único número que vai para a base pública
assert.deepEqual(precoEstruturado('$60'), { valor: 60 });
assert.deepEqual(precoEstruturado('$10.000'), { valor: 10000 });
assert.deepEqual(precoEstruturado('$1,50'), { valor: 1.5 });
assert.deepEqual(precoEstruturado('+$20'), { valor: 20, adicional: true });
assert.deepEqual(precoEstruturado('$2K'), { valor: 2000 });
assert.deepEqual(precoEstruturado('$25 (cada 10 m)'), { valor: 25, por: 'cada 10 m' });
assert.equal(precoEstruturado('—'), null);
assert.equal(precoEstruturado('var.'), null);
assert.equal(precoEstruturado(undefined), null);
assert.equal(publico({ ...itens[0], adamar: 'nao', estatisticas: { custo: '$5' } }).preco, undefined);
assert.deepEqual(publico({ ...itens[0], adamar: 'livre', estatisticas: { custo: '$5' } }).preco, { valor: 5 });
// peso e proteção
assert.deepEqual(pesoEstruturado('1,5'), { kg: 1.5 });
assert.deepEqual(pesoEstruturado('1,5 kg'), { kg: 1.5 });
assert.deepEqual(pesoEstruturado('1,5/0,05'), { kg: 1.5, municao: 0.05 });
assert.deepEqual(pesoEstruturado('0,25 kg (cada 10 m)'), { kg: 0.25, por: 'cada 10 m' });
assert.deepEqual(pesoEstruturado('desprezível'), { kg: 0 });
assert.equal(pesoEstruturado('—'), null);
assert.equal(pesoEstruturado('var.'), null);
assert.deepEqual(rdEstruturada('4/2*'), { rd: 4, contusao: 2, flexivel: true });
assert.deepEqual(rdEstruturada('4D'), { rd: 4, so_frente: true });
assert.deepEqual(rdEstruturada('1*'), { rd: 1, flexivel: true });
assert.deepEqual(rdEstruturada('4/2D*'), { rd: 4, contusao: 2, so_frente: true, flexivel: true });
// números de jogo só para itens de Adamar
assert.deepEqual(numerosDeJogo({ adamar: 'nao', estatisticas: { peso: '1' } }), {});
const arma = numerosDeJogo({ adamar: 'livre', estatisticas: { peso: '1,5', modos: [{ dano: 'GeB+1 corte' }] },
  modos_estruturados: [{ dano: { base: 'geb', mod: 1, tipo: 'corte' }, alcance: { min: 1, max: 1 }, aparar: { mod: 0 }, st: { min: 10 } }],
  pericias_uso: [{ tipo: 'pericia', id: 'espada-de-lamina-larga', mod: 0 }] });
assert.equal(arma.peso.kg, 1.5);
assert.equal(arma.combate.modos[0].dano.base, 'geb');
assert.equal(arma.combate.pericias[0].id, 'espada-de-lamina-larga');
const cota = numerosDeJogo({ adamar: 'livre', estatisticas: { local: 'tronco', rd: '4/2*', peso: '8' } });
assert.deepEqual(cota.protecao, { local: 'tronco', texto: '4/2*', rd: 4, contusao: 2, flexivel: true });
assert.deepEqual(numerosDeJogo({ adamar: 'livre', estatisticas: { bd: '2', rd_pv: '7/40' } }).escudo, { bd: 2, rd_pv: '7/40' });
console.log('importar-equipamento ok');
