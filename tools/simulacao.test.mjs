import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { criarSimulacao } = require('../js/simulacao.js');

const ler = (a) => JSON.parse(readFileSync(new URL('../data/jogo/' + a + '.json', import.meta.url), 'utf8'));
const J = { saude: ler('saude'), necessidades: ler('necessidades'), mundo: ler('mundo'), receitas: ler('receitas'), materiais: ler('materiais') };
const sim = criarSimulacao(J);
// sorteio previsível
function semente(n) { let s = n; return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }

// relógio: começa no dia 61 da primavera, às 8h
let e = sim.estadoInicial();
let rel = sim.relogio(e);
assert.equal(rel.estacao, 'Primavera');
assert.equal(rel.hora, 8);
assert.match(rel.texto, /^Dia 61 \(primavera\), 08:00$/);

// o tempo passa: fome, sede e cansaço sobem caminhando; dormir tira o cansaço
let r = sim.avancar(e, 240, { atividade: 'caminhando', isolamento: 3, rng: semente(1) });
assert.equal(sim.relogio(r.estado).hora, 12);
assert.ok(r.estado.fome > e.fome && r.estado.sede > e.sede && r.estado.cansaco > e.cansaco);
const cansado = r.estado.cansaco;
r = sim.avancar(r.estado, 480, { atividade: 'dormindo', isolamento: 3, rng: semente(2) });
assert.ok(r.estado.cansaco < cansado);

// frio: na geleira, sem roupa, ao ar livre, o corpo esfria e aparece a condição; perto do fogo, esquenta
let frio = sim.estadoInicial({ bioma: 'geleira', dia_do_ano: 300 });
r = sim.avancar(frio, 360, { atividade: 'repouso', isolamento: 0, rng: semente(3) });
assert.ok(r.estado.temp_corpo < 36.3, 'esfriou: ' + r.estado.temp_corpo);
assert.ok(sim.condicoes(r.estado).some((c) => c.origem === 'Temperatura'));
const comRoupa = sim.avancar(frio, 360, { atividade: 'repouso', isolamento: 12, rng: semente(3) });
assert.ok(comRoupa.estado.temp_corpo > r.estado.temp_corpo, 'roupa esquenta');
const fogo = sim.avancar(Object.assign({}, frio, { abrigo: 'casa-com-fogo' }), 360, { atividade: 'repouso', isolamento: 4, rng: semente(3) });
assert.ok(fogo.estado.temp_corpo > r.estado.temp_corpo);

// ferimento: corte sério sangra; enfaixar para; sem tratar e sujo, infecciona
let f = sim.ferir(sim.estadoInicial(), 'braco_d', 'corte', 2);
const id = f.ferimentos[0].id;
assert.equal(f.ferimentos[0].sangrando, true);
r = sim.avancar(f, 120, { atividade: 'repouso', isolamento: 3, rng: semente(4) });
assert.ok(r.estado.sangue < 100);
assert.ok(r.estado.ferimentos[0].infeccao > 0);
assert.ok(sim.condicoes(r.estado).some((c) => c.origem === 'Braço ou mão ferido' && c.alvos.includes('atributo:dx')));
assert.deepEqual(sim.tratamentosPossiveis(r.estado.ferimentos[0]).map((t) => t.id), ['limpar', 'bandagem', 'sutura']);
let t = sim.tratar(r.estado, id, 'limpar');
t = sim.tratar(t, id, 'bandagem', true);
assert.equal(t.ferimentos[0].sangrando, false);
assert.equal(t.ferimentos[0].tratamento, 'bandagem');
// falhar no teste não trata
assert.equal(sim.tratar(r.estado, id, 'bandagem', false).ferimentos[0].tratamento, null);
// tratado, bem alimentado e descansando, sara em alguns dias
let cura = { estado: t, eventos: [] };
const saradas = [];
for (let k = 0; k < 32; k++) { // 8 dias comendo e bebendo a cada 6 horas
  cura = sim.avancar(sim.consumir(cura.estado, { calorias: 700, agua: 2 }), 360, { atividade: 'repouso', isolamento: 3, rng: semente(5 + k) });
  saradas.push(...cura.eventos.filter((ev) => ev.tipo === 'sarou'));
}
assert.equal(cura.estado.ferimentos.length, 0);
assert.equal(saradas.length, 1);
// sem comer, a mesma ferida demora muito mais
const semComer = sim.avancar(t, 60 * 24 * 8, { atividade: 'repouso', isolamento: 3, rng: semente(5) });
assert.equal(semComer.estado.ferimentos.length, 1);
// corte grave: bandagem não segura, só sutura
let g = sim.ferir(sim.estadoInicial(), 'perna_e', 'corte', 3);
assert.equal(sim.tratar(g, g.ferimentos[0].id, 'bandagem', true).ferimentos[0].sangrando, true);
assert.equal(sim.tratar(g, g.ferimentos[0].id, 'sutura', true).ferimentos[0].sangrando, false);
assert.ok(sim.condicoes(g).some((c) => /mancando/.test(c.nome)));

// comer e beber
const faminto = Object.assign(sim.estadoInicial(), { fome: 80, sede: 80 });
const comeu = sim.consumir(faminto, { calorias: 700, agua: 1 });
assert.ok(comeu.fome < 80 && comeu.sede < 80);

// fome extrema dá dano
const morrendo = Object.assign(sim.estadoInicial(), { fome: 95, sede: 95 });
assert.ok(sim.avancar(morrendo, 120, { atividade: 'repouso', isolamento: 3, rng: semente(6) }).dano_pv > 0);

// grade: encaixa, gira e diz o que não coube
const enc = sim.encaixar(4, 3, [
  { uid: 'a', largura: 2, altura: 2 }, { uid: 'b', largura: 3, altura: 1 }, { uid: 'c', largura: 1, altura: 1, quantidade: 5, empilha: 3 }, { uid: 'd', largura: 4, altura: 4 }
]);
assert.ok(enc.posicoes.a && enc.posicoes.b);
assert.equal(enc.posicoes.c.length, 2); // 5 unidades empilhando 3 por célula = 2 células
assert.deepEqual(enc.sobra, ['d']);
const girou = sim.encaixar(1, 3, [{ uid: 'lanca', largura: 3, altura: 1 }]);
assert.deepEqual(girou.posicoes.lanca[0], { x: 0, y: 0, largura: 1, altura: 3 });

// desgaste e conserto
let cond = { atual: 100, maximo: 100 };
for (let k = 0; k < 50; k++) cond = sim.desgastar(cond, -1, semente(10 + k));
assert.ok(cond.atual < 100);
const consertado = sim.consertar({ atual: 20, maximo: 100 }, true);
assert.equal(consertado.maximo, 95);
assert.equal(consertado.atual, 55);
assert.deepEqual(sim.consertar({ atual: 20, maximo: 100 }, false), { atual: 20, maximo: 100 });

// receitas: faltas, recurso do bioma e o que se gasta
const ferver = sim.RECEITAS.find((x) => x.id === 'ferver-agua');
assert.equal(sim.avaliarReceita(ferver, {}, 'floresta-temperada').pode, false);
assert.equal(sim.avaliarReceita(ferver, { 'agua-suja': 2, lenha: 1, isqueiro: 1 }, 'floresta-temperada').pode, true);
const lenha = sim.RECEITAS.find((x) => x.id === 'cortar-lenha');
assert.ok(sim.avaliarReceita(lenha, { machadinha: 1 }, 'deserto').faltam.some((x) => x.tipo === 'recurso'));
assert.equal(sim.avaliarReceita(lenha, { machadinha: 1 }, 'floresta-temperada').pode, true);
assert.deepEqual(sim.resultadoReceita(ferver, { sucesso: false }).gasta, [{ id: 'agua-suja', quantidade: 1 }, { id: 'lenha', quantidade: 1 }]);
assert.equal(sim.resultadoReceita(ferver, { sucesso: true }).produz[0].id, 'agua-fervida');

// os dados do jogo apontam para itens que existem
const eq = new Set(JSON.parse(readFileSync(new URL('../data/gurps/equipamento.json', import.meta.url), 'utf8')).itens.map((i) => i.id));
J.materiais.itens.forEach((i) => eq.add(i.id));
const ids = [];
J.receitas.receitas.forEach((x) => { x.ingredientes.forEach((i) => ids.push(i.id)); x.ferramentas.forEach((g0) => g0.forEach((i) => ids.push(i))); ids.push(x.resultado.id); });
Object.values(J.saude.tratamentos).forEach((x) => x.itens.forEach((i) => ids.push(i)));
Object.keys(J.necessidades.isolamento.por_item).forEach((i) => ids.push(i));
assert.deepEqual(ids.filter((i) => !eq.has(i)), []);

console.log('simulacao ok');
