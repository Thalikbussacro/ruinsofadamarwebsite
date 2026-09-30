// js/sistemas.js — os sistemas de regras do site: GURPS (a mesa) e Adamar RPG (o sistema próprio, que vai para o jogo).
// O Adamar RPG é uma cópia viva do GURPS: data/adamar-rpg/ guarda só o que muda (regras, itens alterados, novos ou
// removidos) e montar() junta tudo num conjunto completo, no mesmo formato de window.GURPS.
// No navegador: Sistemas.obter('adamar-rpg'). Em Node: require('./sistemas.js').montar(base, diferencas).
(function (root) {
  var LISTAS = ['pericias', 'vantagens', 'desvantagens', 'equipamento'];
  var LISTA = [
    { id: 'gurps', nome: 'GURPS 4ª ed.', resumo: 'O sistema da mesa: regras do Módulo Básico.' },
    { id: 'adamar-rpg', nome: 'Adamar RPG', resumo: 'O sistema próprio de Adamar (em construção a partir do GURPS), que vai para o jogo.' }
  ];

  function ehObjeto(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  // junta objetos em profundidade; listas e valores simples são trocados inteiros
  function mesclarObjeto(base, dif) {
    if (!ehObjeto(base) || !ehObjeto(dif)) return dif === undefined ? base : dif;
    var saida = Object.assign({}, base);
    Object.keys(dif).forEach(function (k) {
      if (dif[k] === null) delete saida[k];
      else saida[k] = ehObjeto(dif[k]) && ehObjeto(base[k]) ? mesclarObjeto(base[k], dif[k]) : dif[k];
    });
    return saida;
  }
  // lista de itens: { itens: [parcial ou novo, por id], remover: [ids] }
  function mesclarLista(base, dif) {
    dif = dif || {};
    var remover = {};
    (dif.remover || []).forEach(function (id) { remover[id] = true; });
    var mudancas = {};
    (dif.itens || []).forEach(function (d) { mudancas[d.id] = d; });
    var existentes = {};
    var saida = (base || []).filter(function (i) { return !remover[i.id]; }).map(function (i) {
      existentes[i.id] = true;
      return mudancas[i.id] ? Object.assign({}, mesclarObjeto(i, mudancas[i.id]), { proprio: 'mudado' }) : i;
    });
    (dif.itens || []).forEach(function (d) { if (!existentes[d.id] && !remover[d.id]) saida.push(Object.assign({}, d, { proprio: 'novo' })); });
    return saida;
  }
  function montar(base, dif) {
    dif = dif || {};
    var g = Object.assign({}, base, {
      sistema: 'adamar-rpg',
      nome_sistema: (dif.meta && dif.meta.nome) || 'Adamar RPG',
      termos: mesclarObjeto(base.termos || {}, (dif.meta && dif.meta.termos) || {}),
      regras: mesclarObjeto(base.regras, dif.regras || {}),
      tabela_dano: dif.tabela_dano || base.tabela_dano
    });
    LISTAS.forEach(function (l) { g[l] = mesclarLista(base[l], dif[l]); });
    return g;
  }

  var cache = {};
  function obter(id) {
    var base = root.GURPS;
    if (!base) return null;
    if (!base.sistema) { base.sistema = 'gurps'; base.nome_sistema = LISTA[0].nome; }
    if (!id || id === 'gurps' || !root.ADAMAR_RPG_DIF) return base;
    if (!cache[id]) cache[id] = montar(base, root.ADAMAR_RPG_DIF);
    return cache[id];
  }
  function nome(id) { var s = LISTA.filter(function (x) { return x.id === (id || 'gurps'); })[0]; return s ? s.nome : id; }
  // para quem precisa mexer em todos os conjuntos já montados (ex.: juntar os textos longos quando chegam)
  function cada(fazer) { if (root.GURPS) fazer(root.GURPS); Object.keys(cache).forEach(function (k) { fazer(cache[k]); }); }

  var Sistemas = { LISTA: LISTA, LISTAS: LISTAS, obter: obter, nome: nome, cada: cada, montar: montar, mesclarLista: mesclarLista, mesclarObjeto: mesclarObjeto };
  root.Sistemas = Sistemas;
  if (typeof module !== 'undefined' && module.exports) module.exports = Sistemas;
})(typeof window !== 'undefined' ? window : globalThis);
