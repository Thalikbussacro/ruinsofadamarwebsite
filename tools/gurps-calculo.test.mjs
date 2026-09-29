import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { criarCalculo } = require('../js/gurps-calculo.js');
const regras = JSON.parse(readFileSync(new URL('../data/gurps/regras.json', import.meta.url), 'utf8'));
const c = criarCalculo(regras);

// Atributos: 10 é gratuito; ST/HT 10 por nível, DX/IQ 20 (pág. 14–15)
assert.equal(c.custoAtributo('st', 12), 20);
assert.equal(c.custoAtributo('iq', 9), -20);
assert.equal(c.custoAtributo('dx', 10), 0);

// Secundárias a partir dos atributos (pág. 16–17)
const sec = c.secundarias({ st: 11, dx: 12, iq: 9, ht: 11 });
assert.deepEqual(sec, { pv: 11, vontade: 9, per: 9, pf: 11, velocidade: 5.75, deslocamento: 5 });

// Ajustes compram ou vendem a partir da base; velocidade em passos de 0,25 a 5 pontos
assert.equal(c.custoSecundaria('pv', 2), 4);
assert.equal(c.custoSecundaria('per', -1), -5);
assert.equal(c.custoSecundaria('velocidade', 0.5), 10);
assert.equal(c.custoSecundaria('deslocamento', 1), 5);

// Limites de campanha realista: PV ±30% da ST (ST 10 → 7 a 13), Per no máximo -4
assert.deepEqual(c.limitesSecundaria('pv', { st: 10, dx: 10, iq: 10, ht: 10 }), { min: 7, max: 13 });
assert.deepEqual(c.limitesSecundaria('per', { st: 10, dx: 10, iq: 12, ht: 10 }), { min: 8, max: 20 });
assert.deepEqual(c.limitesSecundaria('velocidade', { st: 10, dx: 10, iq: 10, ht: 10 }), { min: 3, max: 7 });

// Esquiva = piso(Velocidade) + 3; exemplo do livro: Velocidade 5,25 → Esquiva 8
assert.equal(c.esquiva(5.25), 8);
assert.equal(c.esquiva(5.25, 2), 6);
assert.equal(c.esquiva(1, 4), 1); // nunca abaixo de 1

// Base de Carga = ST²/10 kg, em meios quilos como na tabela: ST 10 = 10, ST 15 = 22,5, ST 14 = 19,5
assert.equal(c.baseDeCarga(10), 10);
assert.equal(c.baseDeCarga(15), 22.5);
assert.equal(c.baseDeCarga(14), 19.5);
assert.equal(c.baseDeCarga(13), 17);

// Nível de carga pelo peso carregado (ST 10, BC 10 kg)
assert.equal(c.nivelDeCarga(10, 10), 0);
assert.equal(c.nivelDeCarga(10, 25), 2);
assert.equal(c.nivelDeCarga(10, 101), 5); // acima de 10×BC: não consegue se mover
assert.equal(c.deslocamentoComCarga(5, 2), 3);
assert.equal(c.deslocamentoComCarga(1, 4), 1);

// Custo de perícias (pág. 170). Exemplo do livro: DX 14 quer Espadas Curtas (Média) 17 = DX+3 → 12 pontos
assert.equal(c.custoPericia('Média', 3), 12);
assert.equal(c.custoPericia('Fácil', 0), 1);
assert.equal(c.custoPericia('Difícil', 0), 4);
assert.equal(c.custoPericia('Muito Difícil', -3), 1);
assert.equal(c.custoPericia('Muito Difícil', 1), 12);
assert.equal(c.custoPericia('Fácil', 5), 16); // linha Atributo+5 da tabela: 16 / 20 / 24 / 28
assert.equal(c.custoPericia('Muito Difícil', 5), 28);
assert.equal(c.custoPericia('Média', -2), null); // abaixo do mínimo comprável

// Inverso: quantos níveis os pontos compram
assert.equal(c.nivelPorPontos('Média', 12), 3);
assert.equal(c.nivelPorPontos('Difícil', 1), -2);
assert.equal(c.nivelPorPontos('Difícil', 3), -1); // 3 pontos só pagam o nível de 2
assert.equal(c.nivelPorPontos('Fácil', 0), null);

// Ficha completa: soma atributos e ajustes
const ficha = c.calcularFicha({ atributos: { st: 11, dx: 12, iq: 10, ht: 10 }, ajustes: { per: 2, pv: 1 } });
assert.equal(ficha.valores.per, 12);
assert.equal(ficha.valores.pv, 12);
assert.equal(ficha.custos.atributos, 10 + 40);
assert.equal(ficha.custos.secundarias, 10 + 2);
assert.equal(ficha.total, 62);

// ---------- sociedade (págs. 11, 21–29) ----------
assert.equal(c.custoAparencia('atraente'), 4);
assert.equal(c.custoAparencia('feio'), -8);
assert.equal(c.custoStatus(-2), -10);
assert.equal(c.custoStatus(5), 25); // exemplo do livro

// Idiomas: mesmo nível falado e escrito paga o nível; diferentes pagam metade de cada (exemplo: Francês falado Nenhum / escrito Materna = 3)
assert.equal(c.custoIdioma('sotaque', 'sotaque'), 4);
assert.equal(c.custoIdioma('nenhum', 'materna'), 3);
assert.equal(c.custoAlfabetizacao('analfabeto'), -3);

// Riqueza e dinheiro inicial em NT3 ($1.000)
assert.equal(c.custoRiqueza('pobre'), -15);
assert.equal(c.custoRiqueza('confortavel'), 10);
assert.equal(c.custoRiqueza('podre-de-rico', 1), 75); // Multimilionário 1
assert.equal(c.recursosIniciais('medio'), 1000);
assert.equal(c.recursosIniciais('pobre'), 200);
assert.equal(c.recursosIniciais('rico'), 5000);
assert.equal(c.recursosIniciais('podre-de-rico', 1), 1000000); // 1.000 vezes a média
assert.equal(c.recursosIniciais('medio', 0, 2), 750); // NT2
assert.equal(c.statusPorRiqueza('rico'), 1);
assert.equal(c.statusPorRiqueza('podre-de-rico', 2), 3);
assert.equal(c.statusPorRiqueza('medio'), 0);

// Reputação: exemplos do livro. Sir Anacreon: +2, todos, 10 ou menos → 5. Dragão Verde: +3 (todos menos um grupo) e -4 (grupo grande) → 0
assert.equal(c.custoReputacao(2, 'quase-todos', 'as-vezes'), 5);
assert.equal(c.custoReputacao(3, 'todos-menos-grupo', 'sempre') + c.custoReputacao(-4, 'grupo-grande', 'sempre'), 0);

// Limite de desvantagens: 50% dos pontos iniciais (exemplo: -75 em 150)
assert.equal(c.limiteDesvantagens(150, 0.5), -75);
assert.equal(c.limiteDesvantagens(80, 0.5), -40);

// Ficha com sociedade: soma custos e separa o que conta no limite de desvantagens
const f2 = c.calcularFicha({
  atributos: { st: 9, dx: 11, iq: 10, ht: 10 },
  ajustes: { per: 1 },
  social: { aparencia: 'feio', status: -1, riqueza: 'batalhador', alfabetizacao: 'analfabeto', analfabetismoRegra: true, culturas: 1 }
});
assert.equal(f2.custos.social, -8 - 5 - 10 - 3 + 1);
assert.equal(f2.total, -10 + 20 + 5 + (-25));
assert.equal(f2.desvantagens, -10 - 8 - 5 - 10); // analfabetismo como regra do cenário não conta
assert.equal(f2.recursos, 500);

// Dano básico: a Tabela de Dano fica fora do repositório público, então a função recebe a tabela.
const tabelaDano = { linhas: [
  { st: 10, gdp: '1d-2', geb: '1d' }, { st: 13, gdp: '1d', geb: '2d-1' },
  { st: 40, gdp: '4d+1', geb: '7d-1' }, { st: 45, gdp: '5d', geb: '7d+1' }, { st: 100, gdp: '11d', geb: '13d' }
] };
assert.deepEqual(c.danoBasico(13, tabelaDano), { gdp: '1d', geb: '2d-1' }); // exemplo do livro: ST 13 → 1d/2d-1
assert.deepEqual(c.danoBasico(42, tabelaDano), { gdp: '4d+1', geb: '7d-1' }); // entre linhas: usa a de baixo
assert.deepEqual(c.danoBasico(125, tabelaDano), { gdp: '13d', geb: '15d' }); // +1d a cada 10 acima de 100
assert.equal(c.danoBasico(13, null), null); // sem tabela local

// Custo de um traço a partir do custo estruturado e da escolha do jogador
assert.equal(c.custoTraco({ tipo: 'fixo', valor: 15 }), 15);
assert.equal(c.custoTraco({ tipo: 'niveis', por_nivel: 5 }, { nivel: 3 }), 15);
assert.equal(c.custoTraco({ tipo: 'niveis', base: 5, por_nivel: 10, nivel_min: 0 }, { nivel: 0 }), 5); // Aptidão Mágica 0
assert.equal(c.custoTraco({ tipo: 'niveis', base: 5, por_nivel: 10, nivel_min: 0 }, { nivel: 2 }), 25);
assert.equal(c.custoTraco({ tipo: 'opcoes', valores: [5, 15] }, { opcao: 1 }), 15);
assert.equal(c.custoTraco({ tipo: 'opcoes', valores: [1, 2], unidade: 'cultura' }, { opcao: 0, quantidade: 3 }), 3);
assert.equal(c.custoTraco({ tipo: 'faixa', min: -15, max: -5 }, { valor: -10 }), -10);
assert.throws(() => c.custoTraco({ tipo: 'faixa', min: -15, max: -5 }, { valor: -20 }), /fora da faixa/);
assert.equal(c.custoTraco({ tipo: 'variavel' }, { valor: -7 }), -7);
// Autocontrole (pág. 121): -15* com 6 → -30, com 9 → -22 (ignora frações), com 15 → -7
assert.equal(c.custoTraco({ tipo: 'fixo', valor: -15, autocontrole: true }, { autocontrole: 6 }), -30);
assert.equal(c.custoTraco({ tipo: 'fixo', valor: -15, autocontrole: true }, { autocontrole: 9 }), -22);
assert.equal(c.custoTraco({ tipo: 'fixo', valor: -15, autocontrole: true }, { autocontrole: 15 }), -7);
assert.equal(c.custoTraco({ tipo: 'fixo', valor: -15, autocontrole: true }), -15); // padrão 12

// somar dano
assert.equal(c.somarDano('1d-2', 1), '1d-1');
assert.equal(c.somarDano('1d-1', 1), '1d');
assert.equal(c.somarDano('2d', 3), '2d+3');
assert.equal(c.somarDano('1d+2', -3), '1d-1');
assert.equal(c.somarDano('xx', 1), null);
// fórmulas: aliado com 100% dos pontos (5) presente constantemente (×4) = 20
assert.equal(c.custoFormula('aliados', { pontos_relativos: 3, frequencia: 0 }), 20);
// aliado 50% (2), com frequência (×1) = 2; esporadicamente (×0,5) = 1
assert.equal(c.custoFormula('aliados', { pontos_relativos: 1, frequencia: 3 }), 2);
assert.equal(c.custoFormula('aliados', { pontos_relativos: 1, frequencia: 4 }), 1);
// patrono poderoso (10), 12 ou menos (×2) = 20; com Relutante (-50%) = 10
assert.equal(c.custoFormula('patronos', { poder: 0, frequencia: 2 }), 20);
assert.equal(c.custoFormula('patronos', { poder: 0, frequencia: 2, modificadores: ['Relutante'] }), 10);
// inimigo mais forte (-20), Rival (×0,5), 9 ou menos (×1) = -10
assert.equal(c.custoFormula('inimigos', { poder: 2, intencao: 1, frequencia: 2 }), -10);
// dependente com 50% dos pontos (-5), amigo (×1), 12 ou menos (×2) = -10
assert.equal(c.custoFormula('dependentes', { pontos_relativos: 2, importancia: 1, frequencia: 1 }), -10);
// contato NH 15 (2), com frequência (×1), razoavelmente confiável (×2) = 4; com informação sobrenatural (+1) = 6
assert.equal(c.custoFormula('contatos', { nh_efetivo: 1, frequencia: 3, confiabilidade: 1 }), 4);
assert.equal(c.custoFormula('contatos', { nh_efetivo: 1, informacao_sobrenatural: true, frequencia: 3, confiabilidade: 1 }), 6);
// mínimo 1: NH 12 (1), esporadicamente (×0,5), não confiável (×0,5) = 0,25 → 1
assert.equal(c.custoFormula('contatos', { nh_efetivo: 0, frequencia: 4, confiabilidade: 3 }), 1);
// grupo de contato NH 12 (1), com frequência (×1), meio confiável (×1) = 1 × 5 = 5
assert.equal(c.custoFormula('grupo-de-contato', { nh_efetivo: 0, frequencia: 3, confiabilidade: 2 }), 5);
// favor de um aliado que custaria 12 = 12/5 → 3
assert.equal(c.custoFormula('favor', { vantagem_subjacente: 0, custo_subjacente: 12 }), 3);
assert.equal(c.custoFormula('favor', { vantagem_subjacente: 0 }), null);
// falta escolher algo obrigatório
assert.equal(c.custoFormula('patronos', { poder: 0 }), null);
console.log('gurps-calculo ok');
