import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { criarArquivo, CHAVE } = require('../js/personagens-salvos.js');

function memoria() {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, dados: m };
}

const st = memoria();
const arq = criarArquivo(st);
assert.deepEqual(arq.listar(), []);

// salvar cria id e guarda uma cópia
const ficha = { nome: 'Aldric', conceito: 'caçador', atributos: { st: 11 } };
const id = arq.salvar(ficha, 1000);
assert.ok(id);
assert.equal(ficha.id_salvo, undefined); // não mexe no objeto original
assert.equal(arq.obter(id).nome, 'Aldric');
assert.equal(arq.obter(id).id_salvo, id);

// salvar de novo com o mesmo id substitui
const editada = { ...arq.obter(id), nome: 'Aldric de Montar' };
assert.equal(arq.salvar(editada, 2000), id);
assert.equal(arq.listar().length, 1);
assert.equal(arq.listar()[0].nome, 'Aldric de Montar');

// outra ficha; a lista vem da mais recente para a mais antiga
const id2 = arq.salvar({ nome: '' }, 3000);
assert.deepEqual(arq.listar().map((p) => p.id), [id2, id]);
assert.equal(arq.listar()[0].nome, 'Sem nome');

// id_salvo que não existe mais vira ficha nova
const id3 = arq.salvar({ nome: 'X', id_salvo: 'sumiu' }, 4000);
assert.notEqual(id3, 'sumiu');
assert.equal(arq.listar().length, 3);

// remover
arq.remover(id2);
assert.equal(arq.obter(id2), null);
assert.equal(arq.listar().length, 2);

// armazenamento corrompido ou cheio não quebra
st.setItem(CHAVE, '{nada');
assert.deepEqual(criarArquivo(st).listar(), []);
const cheio = { getItem: () => null, setItem: () => { throw new Error('cheio'); } };
assert.equal(criarArquivo(cheio).salvar({ nome: 'A' }), null);
// cópia de segurança: exporta tudo, restaura mesclando pela data
{
  const mem = {}; const st = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); } };
  const a1 = criarArquivo(st);
  const id1 = a1.salvar({ nome: 'Um' }, 100);
  const id2 = a1.salvar({ nome: 'Dois' }, 200);
  const copia = JSON.parse(JSON.stringify(a1.exportar(300)));
  assert.equal(copia.tipo, 'adamar-cofre');
  assert.equal(copia.personagens.length, 2);
  // noutro aparelho: um personagem já existe mais novo, outro não existe
  const mem2 = {}; const st2 = { getItem: (k) => mem2[k] ?? null, setItem: (k, v) => { mem2[k] = String(v); } };
  const a2 = criarArquivo(st2);
  mem2['adamar-personagens'] = JSON.stringify([{ id: id1, atualizado: 999, ficha: { nome: 'Um editado', id_salvo: id1 } }]);
  const conta = a2.importar(copia);
  assert.deepEqual(conta, { novos: 1, atualizados: 0, mantidos: 1 });
  assert.equal(a2.obter(id1).nome, 'Um editado');
  assert.equal(a2.obter(id2).nome, 'Dois');
  assert.equal(a2.importar({ tipo: 'outra-coisa' }), null);
  assert.ok(a2.espaco() > 0);
  // sem espaço: importar devolve null
  const cheio = criarArquivo({ getItem: () => null, setItem: () => { throw new Error('cheio'); } });
  assert.equal(cheio.importar(copia), null);
}
console.log('personagens-salvos ok');
