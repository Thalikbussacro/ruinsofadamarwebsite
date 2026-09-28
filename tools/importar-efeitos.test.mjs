import assert from 'node:assert/strict';
import { conferirEfeito, conferirPrerequisito, limpar } from './importar-efeitos.mjs';

const ids = { pericias: new Set(['medicina', 'diagnose']), tracos: new Set(['carisma']) };
assert.deepEqual(conferirEfeito({ alvo: 'defesa', ref: 'todas', valor: 1 }, ids), []);
assert.deepEqual(conferirEfeito({ alvo: 'regra', descricao: 'x' }, ids), []);
assert.match(conferirEfeito({ alvo: 'magia', valor: 1 }, ids)[0], /alvo inválido/);
assert.match(conferirEfeito({ alvo: 'pericia', ref: 'cirurgia', valor: 1 }, ids)[0], /perícia inexistente/);
assert.match(conferirEfeito({ alvo: 'grupo_pericias', ref: ['medicina', 'x'], valor: 1 }, ids)[0], /"x"/);
assert.match(conferirEfeito({ alvo: 'atributo', ref: 'sorte', valor: 1 }, ids)[0], /inválida/);
assert.match(conferirEfeito({ alvo: 'teste', ref: 'visao' }, ids)[0], /sem valor/);
assert.deepEqual(conferirEfeito({ alvo: 'reacao', valor: 2, condicao: 'animais' }, ids), []);

assert.deepEqual(conferirPrerequisito({ tipo: 'traco', id: 'carisma', nivel_min: 1 }, ids), []);
assert.match(conferirPrerequisito({ tipo: 'pericia', id: 'oratoria', nh_min: 12 }, ids)[0], /inexistente/);
assert.deepEqual(conferirPrerequisito({ tipo: 'atributo', ref: 'iq', min: 10 }, ids), []);

const problemas = [];
const r = limpar({ efeitos: [{ alvo: 'defesa', ref: 'todas', valor: 1 }, { alvo: 'pericia', ref: 'nada', valor: 1 }], prerequisitos: [] }, ids, 'teste', problemas);
assert.equal(r.efeitos.length, 1);
assert.equal(problemas.length, 1);
console.log('importar-efeitos ok');
