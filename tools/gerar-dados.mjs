// tools/gerar-dados.mjs — gera js/dados-gurps.js a partir de data/gurps/*.json.
// Uso: node tools/gerar-dados.mjs          (valida e grava)
//      node tools/gerar-dados.mjs --check  (valida e falha se o JS estiver desatualizado)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARQUIVOS = ['livros', 'pericias', 'vantagens', 'desvantagens', 'regras'];
const OPCIONAIS = ['equipamento'];
const SAIDA = join(RAIZ, 'js', 'dados-gurps.js');

const ADAMAR = ['livre', 'narrador', 'nao'];
const TIPOS = ['mental', 'fisica', 'social', 'exotica', 'sobrenatural'];
const CATEGORIAS = {
  vantagens: ['vantagem', 'qualidade'],
  desvantagens: ['desvantagem', 'peculiaridade'],
  equipamento: ['arma-corpo-a-corpo', 'arma-distancia', 'arma-de-fogo', 'arma-pesada', 'municao', 'armadura', 'armadura-cavalo', 'escudo', 'equipamento']
};
const LISTAS = ['pericias', 'vantagens', 'desvantagens', 'equipamento'];
const OBRIGATORIOS = {
  pericias: ['id', 'nome', 'atributo', 'dificuldade', 'grupo', 'adamar', 'resumo'],
  vantagens: ['id', 'nome', 'categoria', 'custo', 'adamar', 'resumo'],
  desvantagens: ['id', 'nome', 'categoria', 'custo', 'adamar', 'resumo'],
  equipamento: ['id', 'nome', 'categoria', 'nt', 'adamar', 'resumo']
};

export function validar(dados) {
  const erros = [];
  const livros = new Set((dados.livros.itens || []).map((l) => l.id));
  for (const lista of LISTAS) {
    if (!dados[lista]) continue;
    const vistos = new Set();
    for (const it of dados[lista].itens || []) {
      const onde = `${lista}/${it.id}`;
      if (vistos.has(it.id)) erros.push(`${lista}: id repetido "${it.id}"`);
      vistos.add(it.id);
      for (const campo of OBRIGATORIOS[lista]) {
        if (it[campo] == null || it[campo] === '') erros.push(`${onde}: falta "${campo}"`);
      }
      if (it.adamar && !ADAMAR.includes(it.adamar)) erros.push(`${onde}: adamar inválido "${it.adamar}"`);
      if (!it.ref || !livros.has(it.ref.livro)) erros.push(`${onde}: livro desconhecido "${it.ref && it.ref.livro}"`);
      if (!it.ref || !Number.isInteger(it.ref.pagina) || it.ref.pagina < 1) erros.push(`${onde}: página inválida`);
      if (CATEGORIAS[lista]) {
        if (!CATEGORIAS[lista].includes(it.categoria)) erros.push(`${onde}: categoria inválida "${it.categoria}"`);
        for (const t of it.tipo || []) if (!TIPOS.includes(t)) erros.push(`${onde}: tipo inválido "${t}"`);
      }
    }
  }
  if (dados.regras) {
    const refs = [];
    (function coletar(no, caminho) {
      if (Array.isArray(no)) no.forEach((x, i) => coletar(x, `${caminho}[${i}]`));
      else if (no && typeof no === 'object') {
        if (no.ref) refs.push([caminho, no.ref]);
        for (const k of Object.keys(no)) if (k !== 'ref') coletar(no[k], caminho ? `${caminho}.${k}` : k);
      }
    })(dados.regras, '');
    for (const [caminho, ref] of refs) {
      if (!livros.has(ref.livro)) erros.push(`regras/${caminho}: livro desconhecido "${ref.livro}"`);
      if (!Number.isInteger(ref.pagina) || ref.pagina < 1) erros.push(`regras/${caminho}: página inválida`);
    }
  }
  return erros;
}

export function montarJs(dados) {
  const livros = {};
  for (const l of dados.livros.itens) livros[l.id] = l;
  const GURPS = {
    livros, regras: dados.regras || null,
    pericias: dados.pericias.itens, vantagens: dados.vantagens.itens, desvantagens: dados.desvantagens.itens,
    equipamento: dados.equipamento ? dados.equipamento.itens : []
  };
  return '// ARQUIVO GERADO por tools/gerar-dados.mjs a partir de data/gurps/*.json. Não edite à mão.\n' +
    'window.GURPS = ' + JSON.stringify(GURPS) + ';\n';
}

function carregar() {
  const dados = {};
  for (const nome of ARQUIVOS) dados[nome] = JSON.parse(readFileSync(join(RAIZ, 'data', 'gurps', nome + '.json'), 'utf8'));
  for (const nome of OPCIONAIS) {
    const arq = join(RAIZ, 'data', 'gurps', nome + '.json');
    if (existsSync(arq)) dados[nome] = JSON.parse(readFileSync(arq, 'utf8'));
  }
  return dados;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dados = carregar();
  const erros = validar(dados);
  if (erros.length) {
    for (const e of erros) console.error(e);
    process.exit(1);
  }
  const js = montarJs(dados);
  if (process.argv.includes('--check')) {
    const atual = existsSync(SAIDA) ? readFileSync(SAIDA, 'utf8') : '';
    if (atual !== js) {
      console.error('js/dados-gurps.js está desatualizado: rode node tools/gerar-dados.mjs');
      process.exit(1);
    }
    console.log('dados em dia');
  } else {
    writeFileSync(SAIDA, js);
    const n = (k) => dados[k].itens.length;
    const eq = dados.equipamento ? dados.equipamento.itens.length : 0;
    console.log(`js/dados-gurps.js gerado: ${n('pericias')} perícias, ${n('vantagens')} vantagens, ${n('desvantagens')} desvantagens, ${eq} itens de equipamento`);
  }
}
