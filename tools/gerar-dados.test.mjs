import assert from 'node:assert/strict';
import { validar, montarJs } from './gerar-dados.mjs';

const livros = { itens: [{ id: 'modulo-basico', titulo: 'Módulo Básico' }] };
const pericia = {
  id: 'arco', nome: 'Arco', atributo: 'DX', dificuldade: 'Média', nt: false, especializacao: false,
  predefinido: 'DX-5', grupo: 'combate', adamar: 'livre', resumo: 'Atirar com arco.',
  ref: { livro: 'modulo-basico', pagina: 176 }
};
const vantagem = {
  id: 'carisma', nome: 'Carisma', categoria: 'vantagem', tipo: ['mental'], custo: '5/nível',
  adamar: 'livre', resumo: 'Presença.', ref: { livro: 'modulo-basico', pagina: 47 }
};
const base = () => ({
  livros: structuredClone(livros),
  pericias: { itens: [structuredClone(pericia)] },
  vantagens: { itens: [structuredClone(vantagem)] },
  desvantagens: { itens: [] }
});

// dados válidos: nenhum erro
assert.deepEqual(validar(base()), []);

// id repetido na mesma lista
let d = base(); d.pericias.itens.push(structuredClone(pericia));
assert.match(validar(d).join('\n'), /pericias: id repetido "arco"/);

// valor de "adamar" fora do conjunto
d = base(); d.vantagens.itens[0].adamar = 'talvez';
assert.match(validar(d).join('\n'), /vantagens\/carisma: adamar inválido "talvez"/);

// livro desconhecido e página ausente
d = base(); d.pericias.itens[0].ref = { livro: 'outro-livro' };
const erros = validar(d).join('\n');
assert.match(erros, /pericias\/arco: livro desconhecido "outro-livro"/);
assert.match(erros, /pericias\/arco: página inválida/);

// campo obrigatório vazio
d = base(); d.pericias.itens[0].resumo = '';
assert.match(validar(d).join('\n'), /pericias\/arco: falta "resumo"/);

// tipo de traço fora do conjunto
d = base(); d.vantagens.itens[0].tipo = ['magica'];
assert.match(validar(d).join('\n'), /vantagens\/carisma: tipo inválido "magica"/);

// referências dentro de regras também são conferidas
d = base(); d.regras = { atributos: [{ id: 'st', ref: { livro: 'outro', pagina: 14 } }], carga: { ref: { livro: 'modulo-basico', pagina: 0 } } };
const errosRegras = validar(d).join('\n');
assert.match(errosRegras, /regras\/atributos\[0\]: livro desconhecido "outro"/);
assert.match(errosRegras, /regras\/carga: página inválida/);

// pré-definido apontando para perícia inexistente
d = base(); d.pericias.itens[0].predefinidos = { caminhos: [{ tipo: 'pericia', id: 'besta', mod: -4 }, { tipo: 'atributo', atributo: 'dx', mod: -5 }] };
assert.match(validar(d).join('\n'), /pericias\/arco: pré-definido aponta para perícia inexistente "besta"/);

// equipamento (opcional): categoria fora do conjunto
d = base(); d.equipamento = { itens: [{ id: 'arco-longo', nome: 'Arco Longo', categoria: 'arco', nt: '0', adamar: 'livre', resumo: 'Arco grande.', ref: { livro: 'modulo-basico', pagina: 275 } }] };
assert.match(validar(d).join('\n'), /equipamento\/arco-longo: categoria inválida "arco"/);
d.equipamento.itens[0].categoria = 'arma-distancia';
assert.deepEqual(validar(d), []);
assert.equal(new Function('window', montarJs(d) + 'return window;')({}).GURPS.equipamento[0].id, 'arco-longo');

// efeitos e pré-requisitos inválidos
d = base(); d.vantagens.itens[0].efeitos = [{ alvo: 'pericia', ref: 'inexistente', valor: 1 }];
d.vantagens.itens[0].prerequisitos = [{ tipo: 'traco', id: 'nada' }];
const errosEf = validar(d).join(String.fromCharCode(10));
assert.match(errosEf, /vantagens\/carisma: efeito com perícia inexistente "inexistente"/);
assert.match(errosEf, /vantagens\/carisma: pré-requisito com traço inexistente "nada"/);

// porte da grade fora do conjunto
d = base(); d.equipamento = { itens: [{ id: 'faca', nome: 'Faca', categoria: 'arma-corpo-a-corpo', nt: '0', adamar: 'livre', resumo: 'x', ref: { livro: 'modulo-basico', pagina: 272 }, grade: { porte: 'bolso' } }] };
assert.match(validar(d).join(String.fromCharCode(10)), /equipamento\/faca: porte inválido "bolso"/);

// o JS gerado expõe window.GURPS com as listas e é determinístico
const js = montarJs(base());
assert.match(js, /^\/\/ ARQUIVO GERADO/);
assert.equal(js, montarJs(base()));
const window = {};
new Function('window', js)(window);
assert.equal(window.GURPS.pericias[0].id, 'arco');
assert.equal(window.GURPS.vantagens[0].nome, 'Carisma');
assert.deepEqual(window.GURPS.desvantagens, []);
assert.equal(window.GURPS.livros['modulo-basico'].titulo, 'Módulo Básico');
assert.equal(window.GURPS.regras, null);
assert.deepEqual(window.GURPS.equipamento, []);
assert.deepEqual(window.GURPS.adamar, {});

console.log('gerar-dados ok');
