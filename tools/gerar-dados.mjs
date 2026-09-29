// tools/gerar-dados.mjs — gera js/dados-gurps.js a partir de data/gurps/*.json.
// Uso: node tools/gerar-dados.mjs          (valida e grava)
//      node tools/gerar-dados.mjs --check  (valida e falha se o JS estiver desatualizado)
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conferirEfeito, conferirPrerequisito } from './importar-efeitos.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARQUIVOS = ['livros', 'pericias', 'vantagens', 'desvantagens', 'regras'];
const OPCIONAIS = ['equipamento', 'icones', 'tabela-dano'];
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
        const ce = it.custo_estruturado;
        if (lista !== 'equipamento' && ce && !['fixo', 'opcoes', 'faixa', 'niveis', 'minimo', 'variavel'].includes(ce.tipo)) {
          erros.push(`${onde}: custo_estruturado com tipo inválido "${ce.tipo}"`);
        }
      }
    }
  }
  // pré-definidos das perícias apontam para perícias que existem
  const idsPericias = new Set((dados.pericias.itens || []).map((p) => p.id));
  for (const p of dados.pericias.itens || []) {
    for (const c of (p.predefinidos && p.predefinidos.caminhos) || []) {
      if (c.tipo === 'pericia' && !idsPericias.has(c.id)) erros.push(`pericias/${p.id}: pré-definido aponta para perícia inexistente "${c.id}"`);
      if (c.tipo === 'atributo' && !['st', 'dx', 'iq', 'ht', 'per', 'vontade'].includes(c.atributo)) erros.push(`pericias/${p.id}: pré-definido com atributo inválido "${c.atributo}"`);
    }
  }
  // efeitos e pré-requisitos dos traços
  const idsTracos = new Set([...(dados.vantagens.itens || []), ...(dados.desvantagens.itens || [])].map((t) => t.id));
  const ids = { pericias: idsPericias, tracos: idsTracos };
  const catalogo = dados.regras && dados.regras.catalogo_testes;
  for (const lista of ['vantagens', 'desvantagens']) {
    for (const t of dados[lista].itens || []) {
      for (const e of t.efeitos || []) {
        for (const p of conferirEfeito(e, ids)) erros.push(`${lista}/${t.id}: efeito com ${p}`);
        if (catalogo && e.alvo === 'teste' && !catalogo[e.ref]) erros.push(`${lista}/${t.id}: teste "${e.ref}" fora do catálogo`);
      }
      for (const r of t.prerequisitos || []) for (const p of conferirPrerequisito(r, ids)) erros.push(`${lista}/${t.id}: pré-requisito com ${p}`);
      // variantes: uma por opção de custo, na mesma ordem; efeitos podem apontar para uma delas
      if (t.variantes) {
        const valores = (t.custo_estruturado && t.custo_estruturado.valores) || [];
        if (t.variantes.length !== valores.length || t.variantes.some((v, k) => v.custo !== valores[k] || !v.nome)) {
          erros.push(`${lista}/${t.id}: variantes não batem com as opções de custo`);
        }
      }
      for (const e of t.efeitos || []) {
        if (e.variante != null && !(t.variantes && t.variantes[e.variante])) erros.push(`${lista}/${t.id}: efeito aponta para variante inexistente ${e.variante}`);
      }
    }
  }

  // enriquecimento: só campos conhecidos, com o tipo certo
  const todosIds = new Set(LISTAS.flatMap((l) => ((dados[l] && dados[l].itens) || []).map((it) => it.id)));
  for (const lista of LISTAS) {
    for (const it of (dados[lista] && dados[lista].itens) || []) {
      const onde = `${lista}/${it.id}`;
      if (it.descricao != null && !(typeof it.descricao === 'string' && it.descricao.trim().length >= 80)) erros.push(`${onde}: descrição curta demais ou inválida`);
      if (it.exemplos != null && !(Array.isArray(it.exemplos) && it.exemplos.length && it.exemplos.every((x) => typeof x === 'string' && x.trim()))) erros.push(`${onde}: exemplos inválidos`);
      for (const c of ['em_adamar', 'dica_mesa']) if (it[c] != null && !(typeof it[c] === 'string' && it[c].trim())) erros.push(`${onde}: ${c} inválido`);
      if (it.relacionados != null) {
        if (!Array.isArray(it.relacionados)) erros.push(`${onde}: relacionados inválido`);
        else for (const r of it.relacionados) if (!todosIds.has(r) || r === it.id) erros.push(`${onde}: relacionado inexistente "${r}"`);
      }
    }
  }
  for (const lista of LISTAS) {
    for (const it of (dados[lista] && dados[lista].itens) || []) {
      if (it.gcs && !(typeof it.gcs.id === 'string' && it.gcs.id && typeof it.gcs.nome === 'string' && it.gcs.nome)) erros.push(`${lista}/${it.id}: vínculo com o GCS sem id ou nome`);
    }
  }
  for (const e of dados.erros_enriquecimento || []) erros.push(e);

  // todo ícone usado precisa ter desenho em icones.json (gerado por tools/icones.mjs)
  if (dados.icones) {
    for (const lista of LISTAS) {
      for (const it of (dados[lista] && dados[lista].itens) || []) {
        if (it.icone && !(dados.icones.icones || {})[it.icone]) erros.push(`${lista}/${it.id}: ícone sem desenho "${it.icone}" (rode node tools/icones.mjs)`);
      }
    }
  }

  // grade do inventário de Adamar (equipamento)
  for (const it of (dados.equipamento && dados.equipamento.itens) || []) {
    if (it.grade && !['grade', 'longo', 'montaria', 'vestido'].includes(it.grade.porte)) erros.push(`equipamento/${it.id}: porte inválido "${it.grade.porte}"`);
    if (it.preco && !(typeof it.preco.valor === 'number' && it.preco.valor >= 0)) erros.push(`equipamento/${it.id}: preço inválido`);
    if (it.preco && it.adamar === 'nao') erros.push(`equipamento/${it.id}: item fora de Adamar não leva preço`);
    if (it.grade && it.grade.porte === 'grade' && !(it.grade.largura >= 1 && it.grade.altura >= 1)) erros.push(`equipamento/${it.id}: grade sem largura/altura`);
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
    equipamento: dados.equipamento ? dados.equipamento.itens : [],
    adamar: dados.adamar || {},
    tabela_dano: dados['tabela-dano'] || null,
    // só o desenho: nome do ícone → miolo do SVG 24×24
    icones: dados.icones ? Object.fromEntries(Object.entries(dados.icones.icones).map(([k, v]) => [k, v.svg])) : {}
  };
  return '// ARQUIVO GERADO por tools/gerar-dados.mjs a partir de data/gurps/*.json. Não edite à mão.\n' +
    'window.GURPS = ' + JSON.stringify(GURPS) + ';\n';
}

// data/gurps/enriquecimento/<fatia>.json = { lista, itens: { id: { descricao, exemplos, em_adamar?, dica_mesa?, relacionados? } } }
// Os textos ficam em arquivos separados por fatia para não inchar as listas; aqui entram nos itens.
export const CAMPOS_ENRIQUECIMENTO = ['descricao', 'exemplos', 'em_adamar', 'dica_mesa', 'relacionados'];
export function juntarEnriquecimento(dados, pasta = join(RAIZ, 'data', 'gurps', 'enriquecimento')) {
  dados.erros_enriquecimento = [];
  if (!existsSync(pasta)) return;
  for (const f of readdirSync(pasta).filter((x) => x.endsWith('.json')).sort()) {
    const arq = JSON.parse(readFileSync(join(pasta, f), 'utf8'));
    const alvo = dados[arq.lista] && dados[arq.lista].itens;
    if (!alvo) { dados.erros_enriquecimento.push(`enriquecimento/${f}: lista desconhecida "${arq.lista}"`); continue; }
    const porId = new Map(alvo.map((it) => [it.id, it]));
    for (const [id, extra] of Object.entries(arq.itens || {})) {
      const it = porId.get(id);
      if (!it) { dados.erros_enriquecimento.push(`enriquecimento/${f}: item inexistente "${id}"`); continue; }
      for (const k of Object.keys(extra)) {
        if (!CAMPOS_ENRIQUECIMENTO.includes(k)) dados.erros_enriquecimento.push(`enriquecimento/${f}/${id}: campo desconhecido "${k}"`);
        else it[k] = extra[k];
      }
    }
  }
}

// data/gurps/gcs.json = { pericias: { id: { id, nome, ref } }, vantagens, desvantagens, equipamento }:
// o item correspondente na biblioteca do GCS (Basic Set, em inglês). Vira o campo "gcs" do item.
export function juntarGcs(dados, arquivo = join(RAIZ, 'data', 'gurps', 'gcs.json')) {
  if (!existsSync(arquivo)) return;
  const v = JSON.parse(readFileSync(arquivo, 'utf8'));
  for (const lista of LISTAS) {
    const porId = new Map(((dados[lista] && dados[lista].itens) || []).map((it) => [it.id, it]));
    for (const [id, g] of Object.entries(v[lista] || {})) {
      const it = porId.get(id);
      if (!it) { (dados.erros_enriquecimento = dados.erros_enriquecimento || []).push(`gcs.json: ${lista}/${id} não existe`); continue; }
      it.gcs = { id: g.id, nome: g.nome, ref: g.ref };
    }
  }
}

function carregar() {
  const dados = {};
  for (const nome of ARQUIVOS) dados[nome] = JSON.parse(readFileSync(join(RAIZ, 'data', 'gurps', nome + '.json'), 'utf8'));
  for (const nome of OPCIONAIS) {
    const arq = join(RAIZ, 'data', 'gurps', nome + '.json');
    if (existsSync(arq)) dados[nome] = JSON.parse(readFileSync(arq, 'utf8'));
  }
  juntarEnriquecimento(dados);
  juntarGcs(dados);
  // regras do cenário: data/adamar/<nome>.json → GURPS.adamar.<nome>
  const pastaAdamar = join(RAIZ, 'data', 'adamar');
  dados.adamar = {};
  if (existsSync(pastaAdamar)) {
    for (const f of readdirSync(pastaAdamar).filter((x) => x.endsWith('.json')).sort()) {
      dados.adamar[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(pastaAdamar, f), 'utf8'));
    }
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
