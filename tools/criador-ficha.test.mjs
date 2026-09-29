import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { criarCalculo } = require('../js/gurps-calculo.js');
const { criarCriador } = require('../js/criador-ficha.js');

const ler = (a) => JSON.parse(readFileSync(new URL('../data/gurps/' + a + '.json', import.meta.url), 'utf8'));
const G = { regras: ler('regras'), pericias: ler('pericias').itens, vantagens: ler('vantagens').itens, desvantagens: ler('desvantagens').itens, equipamento: ler('equipamento').itens };
const calc = criarCalculo(G.regras);
const c = criarCriador(G, calc);
const erros = (r) => r.erros.map((e) => e.texto).join('|');
const avisos = (r) => r.avisos.map((e) => e.texto).join('|');

// ficha nova: 0 pontos gastos, orçamento padrão de Adamar
let f = c.fichaNova();
let r = c.resumir(f);
assert.equal(f.orcamento, 80);
assert.equal(r.total, 0);
assert.equal(r.restante, 80);
assert.match(erros(r), /Falta o nome/);
assert.doesNotMatch(erros(r), /pontos/); // saldo sobrando não é pendência
assert.equal(r.valida, false);

// atributos + perícia: DX 12 (+40), Espada Curta? usa Faca (Fácil, DX): 2 pontos → DX+1 = 13
f.nome = 'Teste';
f.atributos.dx = 12;
f.pericias.push({ id: 'faca', pontos: 2 });
r = c.resumir(f);
assert.equal(r.custos.atributos, 40);
assert.equal(r.pericias[0].nh, 13);
assert.equal(r.total, 42);

// traço com níveis e bônus fixo em grupo de perícias (Carisma soma em Liderança)
f.pericias.push({ id: 'lideranca', pontos: 1 }); // IQ/Média, 1 pt → IQ-1 = 9
f.tracos.push({ id: 'carisma', escolha: { nivel: 2 } });
r = c.resumir(f);
const lid = r.pericias.find((p) => p.sel.id === 'lideranca');
assert.equal(lid.nh, 9 + 2);
assert.equal(r.custos.vantagens, 10);

// talento: soma nas perícias da lista e custa por nível
const talento = G.regras.talentos[0];
f.talentos.push({ id: talento.id, nivel: 1 });
r = c.resumir(f);
assert.equal(r.custos.vantagens, 10 + talento.custo_por_nivel);

// desvantagens, peculiaridades e limite (-40 com 80 pontos)
f.tracos.push({ id: 'fora-de-forma', escolha: { opcao: 1 } }); // -15
f.peculiaridades = ['a', 'b', 'c', 'd', 'e', 'f'];
r = c.resumir(f);
assert.equal(r.custos.desvantagens, -15);
assert.equal(r.custos.peculiaridades, -6);
assert.match(erros(r), /No máximo 5 peculiaridades/);
assert.equal(r.limite, -40);
f.atributos.st = 5; // -50: estoura o limite (atributos baixos contam, pág. 11)
r = c.resumir(f);
assert.match(erros(r), /além do limite de -40/);

// idiomas: língua materna grátis, outro idioma custa
f = c.fichaNova();
f.idiomas.push({ nome: 'Indacorano', fala: 'sotaque', escrita: 'nenhum' });
r = c.resumir(f);
assert.equal(r.custos.social, 2);

// traço vetado em Adamar e perícia sem especialização geram aviso
f.tracos.push({ id: 'familiaridade-cultural', escolha: { opcao: 0 } });
f.pericias.push({ id: 'antropologia', pontos: 1 });
r = c.resumir(f);
assert.match(erros(r), /Familiaridade Cultural não existe em Adamar/);
assert.match(erros(r), /Antropologia: escolha a especialização/);

// texto da ficha e carregar (JSON incompleto vira ficha completa)
f.nome = 'Aldric';
assert.match(c.textoFicha(f, c.resumir(f)), /^\*Aldric\*/);
const g = c.carregar({ nome: 'X', atributos: { st: 12 } });
assert.equal(g.atributos.dx, 10);
assert.equal(g.atributos.st, 12);
assert.deepEqual(g.pericias, []);
assert.equal(c.carregar(null).nome, '');
// variantes: o bônus da versão escolhida entra no NH; o da outra versão, não
f = c.fichaNova();
f.pericias.push({ id: 'deteccao-de-mentiras', pontos: 4 }); // Per/Difícil, 4 pts → Per+0 = 10
f.tracos.push({ id: 'empatia', escolha: { opcao: 1 } }); // Empatia (15): +3
r = c.resumir(f);
assert.equal(r.pericias[0].nh, 13);
f.tracos[0].escolha.opcao = 0; // Sensível (5): +1 só em situação
r = c.resumir(f);
assert.equal(r.pericias[0].nh, 10);
assert.equal(r.pericias[0].situacional[0].valor, 1);
assert.match(c.textoFicha(f, r), /Empatia \(Sensível\)/);
// efeitos sem condição entram sozinhos: Reflexos em Combate soma +1 na Esquiva
f = c.fichaNova();
const esquivaBase = c.resumir(f).esquiva;
f.tracos.push({ id: 'reflexos-em-combate', escolha: {} });
assert.equal(c.resumir(f).esquiva, esquivaBase + 1);
// com condição, não: Zarolho (-1 DX só em combate) não muda a DX
f.tracos.push({ id: 'zarolho', escolha: {} });
assert.equal(c.resumir(f).valores.dx, 10);

// equipamento: soma os preços em coroas e avisa se passar do dinheiro inicial
f = c.fichaNova();
const comPreco = G.equipamento.filter((i) => i.preco && i.adamar === 'livre');
const item = comPreco[0];
f.equipamento.push({ id: item.id, quantidade: 2 });
r = c.resumir(f);
assert.equal(r.gasto_equipamento, item.preco.valor * 2);
assert.equal(r.dinheiro_restante, r.recursos - item.preco.valor * 2);
const caro = comPreco.reduce((a, b) => (b.preco.valor > a.preco.valor ? b : a));
f.equipamento = [{ id: caro.id, quantidade: 100 }];
assert.match(erros(c.resumir(f)), /mais que o dinheiro inicial/);
// efeitos com etiqueta: Zarolho é condicional e vai para "Lembrar na mesa"
f = c.fichaNova();
f.tracos.push({ id: 'zarolho', escolha: {} });
assert.ok(c.efeitosDoTraco(f.tracos[0]).some((e) => e.tipo === 'condicional'));
assert.match(c.textoFicha(f, c.resumir(f)), /Lembrar na mesa:[\s\S]*\[CONDICIONAL\]/);

// ficha válida: fecha exatamente nos pontos, com nome e sem pendências
f = c.fichaNova();
f.nome = 'Válido';
f.atributos.dx = 12; // 40
f.atributos.ht = 11; // 10
f.pericias.push({ id: 'faca', pontos: 4 }); // 4
f.tracos.push({ id: 'carisma', escolha: { nivel: 2 } }); // 10
f.pericias.push({ id: 'lideranca', pontos: 16 }); // 16 → total 80
r = c.resumir(f);
assert.equal(r.total, 80);
assert.deepEqual(r.erros, []);
assert.equal(r.valida, true);
// saldo: sobrar pontos é permitido (ficam guardados); saldo negativo é erro
f.pericias[1].pontos = 12;
r = c.resumir(f);
assert.equal(r.restante, 4);
assert.equal(r.valida, true);
assert.match(c.textoFicha(f, r), /guardados 4/);
assert.equal(r.pontos_gastos - r.pontos_devolvidos, r.total);
f.pericias[1].pontos = 20;
r = c.resumir(f);
assert.match(erros(r), /Saldo negativo: faltam 4 pontos/);
assert.equal(r.problemas.length, 1);
f.pericias[1].pontos = 16;

// peculiaridade do catálogo conta como peculiaridade (-1), não como desvantagem nem no limite
const pec = G.desvantagens.find((t) => t.categoria === 'peculiaridade' && t.adamar === 'livre');
f.tracos.push({ id: pec.id, escolha: {} });
r = c.resumir(f);
assert.equal(r.custos.peculiaridades, -1);
assert.equal(r.custos.desvantagens, 0);
assert.equal(r.peculiaridades, 1);

// perícia repetida, pontos zerados, idioma sem nome e qualidade em branco
f = c.fichaNova();
f.pericias.push({ id: 'faca', pontos: 1 }, { id: 'faca', pontos: 1 }, { id: 'lideranca', pontos: 0 });
f.idiomas.push({ nome: '', fala: 'rudimentar', escrita: 'nenhum' });
f.qualidades.push('  ');
r = c.resumir(f);
assert.match(erros(r), /aparece duas vezes/);
assert.match(erros(r), /Liderança: pontos insuficientes/);
assert.match(erros(r), /idioma sem nome/);
assert.match(erros(r), /qualidade em branco/);
assert.ok(r.erros.every((e) => e.etapa));

// "com o narrador" é aviso, não erro
f = c.fichaNova();
const narr = G.vantagens.find((t) => t.adamar === 'narrador' && t.custo_estruturado && t.custo_estruturado.tipo === 'fixo');
f.tracos.push({ id: narr.id, escolha: {} });
r = c.resumir(f);
assert.match(avisos(r), /só com o narrador/);
assert.doesNotMatch(erros(r), /só com o narrador/);
// modelos (data/adamar/modelos.json): todos fecham sem erro nos 80 pontos e mantêm quem o personagem é
const modelos = JSON.parse(readFileSync(new URL('../data/adamar/modelos.json', import.meta.url), 'utf8')).itens;
assert.ok(modelos.length >= 4);
for (const m of modelos) {
  const base = c.fichaNova();
  base.nome = 'Teste';
  base.era = 'Era do Novo Mundo';
  base.idade = '30';
  const fm = c.aplicarModelo(base, m);
  const rm = c.resumir(fm);
  assert.deepEqual(rm.erros.map((e) => e.texto), [], 'modelo ' + m.id);
  assert.ok(rm.restante >= 0 && rm.restante <= 15, 'modelo ' + m.id + ' deixa ' + rm.restante + ' pontos');
  assert.equal(fm.nome, 'Teste');
  assert.equal(fm.era, 'Era do Novo Mundo');
  assert.equal(fm.idade, '30');
  assert.ok(G.equipamento.length && rm.gasto_equipamento <= rm.recursos);
}
// combate: só roda se os números de jogo estiverem na base pública (tabela de dano e peso/dano/RD dos itens)
const arqTabela = new URL('../data/gurps/tabela-dano.json', import.meta.url);
const comNumeros = existsSync(arqTabela) && G.equipamento.some((i) => i.combate);
if (comNumeros) {
const G2 = { ...G, tabela_dano: JSON.parse(readFileSync(arqTabela, 'utf8')) };
const c2 = criarCriador(G2, calc);
const sold = c2.resumir(c2.aplicarModelo(c2.fichaNova(), modelos.find((m) => m.id === 'soldado')));
assert.deepEqual(sold.combate.dano_basico, { gdp: '1d-1', geb: '1d+2' });
const golpe = sold.combate.armas.find((a) => /corte/.test(a.dano));
assert.equal(golpe.dano, '1d+3 corte');
assert.equal(golpe.nh, 13);
assert.equal(sold.combate.db, 2);
assert.equal(sold.combate.defesas.aparar, 9 + 2); // 13/2+3 = 9, +2 do escudo
assert.equal(sold.combate.protecao['tronco'].rd, 4);
assert.equal(sold.combate.carga.nome, 'Leve');
// ataques desarmados: soco sempre; o Soldado está de botas, então chute com botas
assert.ok(sold.combate.armas.some((a) => a.nome === 'Soco' && a.natural));
assert.ok(sold.combate.armas.some((a) => a.nome === 'Chute com Botas'));
// faca: alcance C
const cac = c2.resumir(c2.aplicarModelo(c2.fichaNova(), modelos.find((m) => m.id === 'cacador')));
assert.ok(cac.combate.armas.some((a) => a.nome === 'Faca' && a.alcance === 'C'));
// sem treino: arma sem a perícia usa o pré-definido (Arco: DX-5)
const sem = c2.fichaNova();
sem.atributos.dx = 12;
sem.equipamento.push({ id: 'arco-comum', quantidade: 1 });
const rs = c2.resumir(sem);
assert.equal(rs.combate.armas[0].nh, 12 - 5);
assert.match(rs.combate.armas[0].pericia, /sem treino/);
// ST abaixo da mínima da arma gera aviso e penalidade
sem.atributos.st = 8;
sem.equipamento = [{ id: 'arco-longo', quantidade: 1 }];
const rst = c2.resumir(sem);
assert.match(rst.avisos.map((a) => a.texto).join('|'), /pede ST 11/);
} else {
  // sem os números, a ficha continua funcionando: combate vazio, sem erro
  const r0 = c.resumir(c.aplicarModelo(c.fichaNova(), modelos.find((m) => m.id === 'soldado')));
  assert.equal(r0.combate.dano_basico, null);
  assert.ok(Array.isArray(r0.combate.armas));
}
console.log('criador-ficha ok' + (comNumeros ? '' : ' (sem números de combate)'));
