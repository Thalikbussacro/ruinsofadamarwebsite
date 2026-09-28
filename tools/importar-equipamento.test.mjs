import assert from 'node:assert/strict';
import { juntar, publico } from './importar-equipamento.mjs';

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
console.log('importar-equipamento ok');
