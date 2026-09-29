import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
assert.match(erros(r), /Faltam 80 pontos/);
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
// sobra ou excesso de pontos é erro
f.pericias[1].pontos = 12;
assert.match(erros(c.resumir(f)), /Faltam 4 pontos/);
f.pericias[1].pontos = 20;
assert.match(erros(c.resumir(f)), /Gastou 4 pontos além/);
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
console.log('criador-ficha ok');
