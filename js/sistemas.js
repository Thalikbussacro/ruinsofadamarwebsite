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
    // remover por regra: todo item cujos campos batem (ex.: { "adamar": "nao" } tira o que não existe no cenário)
    if (dif.remover_se) {
      (base || []).forEach(function (i) {
        if (Object.keys(dif.remover_se).every(function (k) { return i[k] === dif.remover_se[k]; })) remover[i.id] = true;
      });
      (dif.itens || []).forEach(function (d) { delete remover[d.id]; }); // o que foi mudado de propósito fica
    }
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
    podar(g, base);
    return g;
  }
  // o que saiu do sistema sai também das referências: pré-definidos, efeitos, pré-requisitos e talentos
  function podar(g, base) {
    var existe = {}, saiu = {};
    LISTAS.forEach(function (l) { g[l].forEach(function (i) { existe[i.id] = true; }); });
    LISTAS.forEach(function (l) { (base[l] || []).forEach(function (i) { if (!existe[i.id]) saiu[i.id] = true; }); });
    if (!Object.keys(saiu).length) return;
    function copiaSeMudar(item, campo, novo) {
      if (JSON.stringify(item[campo]) === JSON.stringify(novo)) return item;
      var c = Object.assign({}, item);
      c[campo] = novo;
      return c;
    }
    g.pericias = g.pericias.map(function (p) {
      var pr = p.predefinidos;
      if (!pr || !pr.caminhos) return p;
      return copiaSeMudar(p, 'predefinidos', Object.assign({}, pr, { caminhos: pr.caminhos.filter(function (c) { return !(c.tipo === 'pericia' && saiu[c.id]); }) }));
    });
    ['vantagens', 'desvantagens'].forEach(function (l) {
      g[l] = g[l].map(function (t) {
        var novo = t;
        if (t.efeitos) {
          var ef = t.efeitos.map(function (e) {
            return Array.isArray(e.ref) ? Object.assign({}, e, { ref: e.ref.filter(function (id) { return !saiu[id]; }) }) : e;
          }).filter(function (e) { return Array.isArray(e.ref) ? e.ref.length > 0 : !saiu[e.ref]; });
          novo = copiaSeMudar(novo, 'efeitos', ef);
        }
        if (t.prerequisitos) novo = copiaSeMudar(novo, 'prerequisitos', t.prerequisitos.filter(function (q) { return !saiu[q.id]; }));
        return novo;
      });
    });
    // "veja também" das descrições
    LISTAS.forEach(function (l) {
      g[l] = g[l].map(function (i) {
        return i.relacionados ? copiaSeMudar(i, 'relacionados', i.relacionados.filter(function (id) { return !saiu[id]; })) : i;
      });
    });
    if (g.regras && g.regras.talentos) {
      g.regras = Object.assign({}, g.regras, {
        talentos: g.regras.talentos.map(function (t) { return Object.assign({}, t, { pericias: t.pericias.filter(function (id) { return !saiu[id]; }) }); })
      });
    }
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
