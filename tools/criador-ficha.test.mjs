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

// ficha nova: 0 pontos gastos, orçamento padrão de Adamar
let f = c.fichaNova();
let r = c.resumir(f);
assert.equal(f.orcamento, 80);
assert.equal(r.total, 0);
assert.equal(r.restante, 80);
assert.match(r.avisos.join('|'), /Falta o nome/);

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
assert.match(r.avisos.join('|'), /No máximo 5 peculiaridades/);
assert.equal(r.limite, -40);
f.atributos.st = 5; // -50: estoura o limite (atributos baixos contam, pág. 11)
r = c.resumir(f);
assert.match(r.avisos.join('|'), /passaram do limite/);

// idiomas: língua materna grátis, outro idioma custa
f = c.fichaNova();
f.idiomas.push({ nome: 'Indacorano', fala: 'sotaque', escrita: 'nenhum' });
r = c.resumir(f);
assert.equal(r.custos.social, 2);

// traço vetado em Adamar e perícia sem especialização geram aviso
f.tracos.push({ id: 'familiaridade-cultural', escolha: { opcao: 0 } });
f.pericias.push({ id: 'antropologia', pontos: 1 });
r = c.resumir(f);
assert.match(r.avisos.join('|'), /Familiaridade Cultural não existe em Adamar/);
assert.match(r.avisos.join('|'), /Antropologia: escolha a especialização/);

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
console.log('criador-ficha ok');
