import assert from 'node:assert/strict';
import { validar, montarJs, juntarEnriquecimento } from './gerar-dados.mjs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

// variantes que não batem com as opções de custo
d = base(); d.vantagens.itens[0].custo_estruturado = { tipo: 'opcoes', valores: [5, 15] };
d.vantagens.itens[0].variantes = [{ nome: 'A', custo: 5 }];
d.vantagens.itens[0].efeitos = [{ alvo: 'regra', descricao: 'x', variante: 3 }];
const errosVar = validar(d).join(String.fromCharCode(10));
assert.match(errosVar, /variantes não batem/);
assert.match(errosVar, /variante inexistente 3/);

// ícone sem desenho em icones.json
d = base(); d.vantagens.itens[0].icone = 'sword';
d.icones = { icones: { shield: { svg: '<path d="M1 1"/>' } } };
assert.match(validar(d).join(String.fromCharCode(10)), /ícone sem desenho "sword"/);
d.icones.icones.sword = { svg: '<path d="M2 2"/>' };
assert.deepEqual(validar(d), []);
assert.equal(new Function('window', montarJs(d) + 'return window;')({}).GURPS.icones.sword, '<path d="M2 2"/>');

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

// enriquecimento: arquivos por fatia entram nos itens; campos e ids desconhecidos viram erro
{
  const pasta = mkdtempSync(join(tmpdir(), 'enr-'));
  const texto = 'Cobre atirar com arco de guerra ou de caça, cuidar da corda e escolher a flecha certa para cada alvo, com ou sem mira.';
  writeFileSync(join(pasta, 'P1.json'), JSON.stringify({ lista: 'pericias', itens: {
    arco: { descricao: texto, exemplos: ['Caçar um cervo.', 'Acertar a sentinela.'], relacionados: ['carisma'] },
    fantasma: { descricao: texto }
  } }));
  writeFileSync(join(pasta, 'V1.json'), JSON.stringify({ lista: 'vantagens', itens: { carisma: { descricao: texto, cor: 'azul' } } }));
  const e = base();
  juntarEnriquecimento(e, pasta);
  assert.equal(e.pericias.itens[0].descricao, texto);
  assert.equal(e.pericias.itens[0].exemplos.length, 2);
  const erros = validar(e).join('\n');
  assert.match(erros, /P1.json: item inexistente "fantasma"/);
  assert.match(erros, /V1.json\/carisma: campo desconhecido "cor"/);
  e.pericias.itens[0].relacionados = ['nada'];
  e.vantagens.itens[0].descricao = 'curta';
  const erros2 = validar(e).join('\n');
  assert.match(erros2, /pericias\/arco: relacionado inexistente "nada"/);
  assert.match(erros2, /vantagens\/carisma: descrição curta demais/);
}

console.log('gerar-dados ok');
