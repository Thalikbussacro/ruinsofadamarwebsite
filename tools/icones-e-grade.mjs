// tools/icones-e-grade.mjs — dá um ícone (chave genérica) a perícias, traços e itens,
// e um tamanho de grade (inventário de Adamar) aos itens que existem em Adamar.
// Uso: node tools/icones-e-grade.mjs            (só preenche o que falta)
//      node tools/icones-e-grade.mjs --refazer  (recalcula tudo, perdendo ajustes manuais)
// Os ícones são chaves ("espada", "escudo"…); o app decide o desenho de cada uma.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ---------- ícones ----------
const ICONE_PERICIA = {
  combate: 'espadas-cruzadas', corpo: 'pegada', natureza: 'folha', oficio: 'martelo', social: 'mascaras',
  saber: 'livro', ladinagem: 'gazua', misterio: 'olho', tecnologia: 'engrenagem'
};
export function iconeTraco(t) {
  if (t.categoria === 'qualidade') return 'estrela-pequena';
  if (t.categoria === 'peculiaridade') return 'espiral';
  if (t.tipo.includes('sobrenatural')) return t.categoria === 'vantagem' ? 'sol' : 'lua-negra';
  if (t.tipo.includes('exotica')) return 'garra';
  const base = t.tipo.includes('social') ? 'coroa' : t.tipo.includes('fisica') ? 'punho' : 'mente';
  return t.categoria === 'desvantagem' ? base + '-rachado' : base;
}

// ---------- tamanho na grade (itens) ----------
// Regras em ordem: a primeira que casar vence. [padrão no nome, resultado]
const POR_NOME = [
  // longos: não cabem em mochila
  [/lanca longa|lanca de justa|glaive|naginata|alabarda|machado de haste|bordao|arpao|arco longo|vara, [23] m|^lanca$|fustibalo|pa$/, { porte: 'longo' }],
  // montaria, carroça, grandes demais
  [/barda|sela|estribos|arado|carrinho de mao|roca de tear|barraca, (4|20) pessoas|scorpion/, { porte: 'montaria' }],
  // armas curtas
  [/soco ingles|garrote|shuriken|gazuas|anzol|esporas|agulhas|correia de couro|pedra de amolar|espigos|cordel/, { largura: 1, altura: 1 }],
  [/^adaga|^faca( pequena)?$|estaca de madeira|cassetete|nunchaku|vela|oleo|garrafa|bandagens/, { largura: 1, altura: 2 }],
  [/facao|faca grande|bastao curto|espada curta|cutelo|tercado|machadinha|maca pequena|tocha|telescopio|picareta$/, { largura: 1, altura: 3 }],
  [/sabre|rapieira|espada larga|porrete|zarabatana|pe-de-cabra|serra|arco curto/, { largura: 1, altura: 4 }],
  [/espada bastarda|katana|arco (comum|composto)|azagaia/, { largura: 1, altura: 5 }],
  [/espada grande/, { largura: 1, altura: 6 }],
  [/malho|segadeira|^machado$/, { largura: 2, altura: 4 }],
  [/martelo de guerra|mangual$|maca-estrela|^maca$|machado de arremesso|kusari/, { largura: 2, altura: 3 }],
  [/besta de alavanca/, { largura: 1, altura: 2 }],
  [/besta/, { largura: 3, altura: 3 }],
  [/funda$|arremessador de lanca/, { largura: 1, altura: 2 }],
  [/boleadeira|laco|chicote|rede de combate|odre|lampiao|balanca|ferraduras|bridao|tablete de cera|kit de escriba|equipamento basico pessoal|arpeu|corda, 3\/8|kit de primeiros socorros/, { largura: 2, altura: 2 }],
  [/rede grande|pelagem de animal|equipamento de alpinismo|corda, 3\/4|tambor|instrumentos cirurgicos|caixa de ferramentas|laboratorio portatil/, { largura: 3, altura: 3 }],
  [/cobertor|kit de emergencia/, { largura: 3, altura: 2 }],
  [/barraca, 1 pessoa/, { largura: 2, altura: 4 }],
  [/barraca, 2 pessoas/, { largura: 3, altura: 4 }],
  [/equipamento basico para grupo/, { largura: 4, altura: 4 }],
  [/racao de viagem/, { largura: 1, altura: 1, empilha: 3 }],
  // recipientes: tamanho vazio
  [/algibeira/, { largura: 1, altura: 1 }],
  [/mochila pequena/, { largura: 2, altura: 3 }],
  [/^mochila$/, { largura: 3, altura: 3 }],
  [/alforjes/, { porte: 'montaria' }],
  [/aljava/, { largura: 1, altura: 4 }],
  // escudos e capas (vão nas costas ou no braço; guardados ocupam a grade)
  [/escudo leve|capa leve/, { largura: 2, altura: 2 }],
  [/escudo pequeno|capa pesada/, { largura: 3, altura: 3 }],
  [/escudo medio/, { largura: 3, altura: 4 }],
  [/escudo grande/, { largura: 4, altura: 5 }]
];
// Armadura: vestida; guardada, o tamanho vem do peso.
function guardadoPorPeso(pesoKg, subcategoria) {
  if (/cabeca/i.test(subcategoria || '')) return pesoKg >= 4 ? { largura: 3, altura: 3 } : { largura: 2, altura: 2 };
  if (/luvas/i.test(subcategoria || '')) return { largura: 1, altura: 2 };
  if (/calcados/i.test(subcategoria || '')) return { largura: 2, altura: 2 };
  if (pesoKg <= 1) return { largura: 2, altura: 2 };
  if (pesoKg <= 3) return { largura: 2, altura: 3 };
  if (pesoKg <= 8) return { largura: 3, altura: 3 };
  if (pesoKg <= 15) return { largura: 3, altura: 4 };
  return { largura: 4, altura: 4 };
}
function numeroPeso(peso) {
  const m = /([\d]+(?:,\d+)?)/.exec(String(peso || ''));
  return m ? parseFloat(m[1].replace(',', '.')) : 0;
}

export function gradeItem(item, pesoTexto) {
  if (item.adamar === 'nao') return null;
  const nome = semAcento(item.nome);
  if (item.categoria === 'armadura') return { porte: 'vestido', guardado: guardadoPorPeso(numeroPeso(pesoTexto), item.subcategoria) };
  if (item.categoria === 'armadura-cavalo') return { porte: 'montaria' };
  if (/^(soco|chute|dentes|presas|bico|golpeador|golpe com)/.test(nome)) return null; // ataques naturais, não são itens
  if (item.categoria === 'equipamento' && /picareta/.test(nome)) return { porte: 'grade', largura: 2, altura: 4 }; // a ferramenta, maior que a arma
  for (const [padrao, r] of POR_NOME) if (padrao.test(nome)) return r.porte ? { porte: r.porte } : { porte: 'grade', ...r };
  return { porte: 'grade', largura: 2, altura: 2, revisar: true };
}

const ICONE_ITEM = [
  [/\bsoco\b|\bchute\b|dentes|presas|\bbico\b|golpeador/, 'punho'],
  [/escudo|golpe com/, 'escudo'], [/capa/, 'capa'],
  [/espada|sabre|rapieira|tercado|cutelo|katana/, 'espada'], [/faca|facao|adaga|estaca/, 'faca'],
  [/machad|picareta/, 'machado'], [/maca|malho|martelo|porrete|cassetete|bastao|bordao|nunchaku/, 'maca'],
  [/mangual|kusari|maca-estrela/, 'mangual'], [/\blanca\b|azagaia|arpao|glaive|naginata|alabarda|haste/, 'lanca'],
  [/arco/, 'arco'], [/besta/, 'besta'], [/\bfunda\b|fustibalo|zarabatana|boleadeira|\blaco\b|\brede\b|chicote|shuriken|garrote|arremessador/, 'arremesso'],
  [/scorpion/, 'catapulta'], [/barda/, 'cavalo'], [/balanca/, 'balanca'], [/segadeira/, 'foice'],
  [/\bpa\b|pe-de-cabra|serra|pedra de amolar|agulhas|ferramentas|laboratorio|arado|carrinho|roca/, 'ferramenta'],
  [/elmo|celada|barrete|coifa|mascara|capacete/, 'elmo'], [/luva|manopla/, 'luva'], [/sandalia|sapato|bota|solleret/, 'bota'],
  [/tocha|vela|lampiao|oleo/, 'chama'], [/corda|cordel|arpeu/, 'corda'], [/mochila|algibeira|alforje|aljava/, 'mochila'],
  [/barraca|cobertor|pelagem/, 'barraca'], [/racao|odre|garrafa/, 'comida'], [/bandage|cirurg|socorros|emergencia/, 'cura'],
  [/\bsela\b|bridao|estribo|espora|ferradura/, 'ferradura'], [/escriba|tablete|tambor/, 'pergaminho'], [/gazua/, 'gazua'],
  [/telescopio/, 'luneta']
];
export function iconeItem(item) {
  const nome = semAcento(item.nome);
  for (const [p, ic] of ICONE_ITEM) if (p.test(nome)) return ic;
  if (item.categoria === 'armadura') return 'armadura';
  if (/arma/.test(item.categoria)) return 'arma';
  return 'bau';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
  const refazer = process.argv.includes('--refazer');
  const ler = (a) => JSON.parse(readFileSync(join(RAIZ, 'data', 'gurps', a + '.json'), 'utf8'));
  const gravar = (a, d) => writeFileSync(join(RAIZ, 'data', 'gurps', a + '.json'), JSON.stringify(d, null, 2) + '\n');

  const pericias = ler('pericias');
  for (const p of pericias.itens) if (refazer || !p.icone) p.icone = ICONE_PERICIA[p.grupo] || 'livro';
  gravar('pericias', pericias);
  for (const a of ['vantagens', 'desvantagens']) {
    const d = ler(a);
    for (const t of d.itens) if (refazer || !t.icone) t.icone = iconeTraco(t);
    gravar(a, d);
  }

  // o peso vem da base local, quando existir
  let pesos = {};
  try {
    const local = JSON.parse(readFileSync(join(RAIZ, 'data-local', 'gurps', 'equipamento-completo.json'), 'utf8'));
    for (const i of local.itens) pesos[i.id] = (i.estatisticas || {}).peso;
  } catch (e) { /* sem base local: armaduras ficam com tamanho de peso 0 */ }
  const eq = ler('equipamento');
  const revisar = [];
  for (const i of eq.itens) {
    if (refazer || !i.icone) i.icone = iconeItem(i);
    if (refazer || i.grade === undefined) i.grade = gradeItem(i, pesos[i.id]);
    if (i.grade && i.grade.revisar) revisar.push(i.nome);
  }
  gravar('equipamento', eq);
  console.log('ícones e grade preenchidos.' + (revisar.length ? ' Tamanho padrão 2×2 (revisar): ' + revisar.join(', ') : ''));
}
