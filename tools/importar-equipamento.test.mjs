import assert from 'node:assert/strict';
import { juntar, publico, precoEstruturado } from './importar-equipamento.mjs';

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
console.log('importar-equipamento ok');
