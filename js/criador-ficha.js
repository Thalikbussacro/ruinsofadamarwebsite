// js/criador-ficha.js — lógica do criador de personagem: custo, NH, limites e avisos de uma ficha inteira.
// Funções puras sobre (ficha, GURPS, calc): servem à página (window.criarCriador) e aos testes em Node.
(function (root) {
  // Traços que o criador trata no bloco de Sociedade, não na lista de vantagens/desvantagens.
  var TRACOS_SOCIAIS = ['aparencia', 'aparencia-desvantagem', 'riqueza', 'pobreza-riqueza-baixa', 'status', 'status-baixo', 'idiomas', 'familiaridade-cultural'];

  function fichaNova(regras) {
    var pontos = (regras.campanha && regras.campanha.pontos_iniciais) || { padrao: 80 };
    return {
      versao: 1,
      id_salvo: '',
      nome: '', jogador: '', conceito: '', era: '', origem: '', aparencia_fisica: '', historia: '',
      idade: '', altura: '', peso_corporal: '',
      retrato: '',       // imagem pequena (data URL) do rosto do personagem
      em_jogo: {},       // { pv, pf, pontos, dinheiro, notas, usados: { uid: n }, situacoes: [chave] } — estado durante as sessões
      orcamento: pontos.padrao,
      atributos: { st: 10, dx: 10, iq: 10, ht: 10 },
      ajustes: {},
      social: { aparencia: 'comum', status: 0, riqueza: 'medio', multimilionario: 0, alfabetizacao: 'alfabetizado', analfabetismoRegra: true },
      idioma_materno: '',
      idiomas: [],       // { nome, fala, escrita } — além da língua materna, que é grátis
      tracos: [],        // { id, escolha: { nivel, opcao, quantidade, valor, autocontrole }, nota }
      talentos: [],      // { id, nivel }
      qualidades: [],    // textos; +1 ponto cada
      peculiaridades: [], // textos; -1 ponto cada, até 5
      pericias: [],      // { id, especializacao, pontos }
      equipamento: [],   // { id, quantidade, uid, local: equipado|levado|guardado, dentro: uid, qualidade }
      notas: ''
    };
  }

  var Efeitos = root.GurpsEfeitos || (typeof require === 'function' ? require('./gurps-efeitos.js') : null);

  function criarCriador(G, calc) {
    var R = G.regras;
    var PERICIA = {}, TRACO = {}, TALENTO = {}, ITEM = {};
    G.pericias.forEach(function (p) { PERICIA[p.id] = p; });
    G.vantagens.concat(G.desvantagens).forEach(function (t) { TRACO[t.id] = t; });
    (R.talentos || []).forEach(function (t) { TALENTO[t.id] = t; });
    (G.equipamento || []).forEach(function (i) { ITEM[i.id] = i; });
    var LIMITE_PECULIARIDADES = 5;

    function nomeVariante(t, opcao) {
      var v = t.variantes && t.variantes[opcao || 0];
      return v ? v.nome : null;
    }

    function custoDoTraco(sel) {
      var t = TRACO[sel.id];
      if (!t || !t.custo_estruturado) return 0;
      try { return calc.custoTraco(t.custo_estruturado, sel.escolha || {}); } catch (e) { return 0; }
    }

    // Nível do traço para efeitos "por nível" (1 quando o traço não tem níveis).
    function nivelDoTraco(sel) {
      var t = TRACO[sel.id];
      return t && t.custo_estruturado && t.custo_estruturado.tipo === 'niveis' ? ((sel.escolha || {}).nivel || 0) : 1;
    }

    // Efeito vale para a variante escolhida? (efeitos sem "variante" valem para todas)
    function efeitoValeParaEscolha(e, sel) {
      return e.variante == null || e.variante === ((sel.escolha || {}).opcao || 0);
    }

    function valorAtributo(ficha, valores, sigla) {
      var mapa = { DX: 'dx', IQ: 'iq', HT: 'ht', ST: 'st', Per: 'per', Vontade: 'vontade' };
      return valores[mapa[sigla]];
    }

    // Bônus de perícia vindos de traços e talentos: fixos (somados ao NH) e situacionais (só listados).
    function bonusDePericias(ficha) {
      var fixos = {}, situacionais = {};
      function somar(id, valor, origem, condicao) {
        if (condicao) (situacionais[id] = situacionais[id] || []).push({ valor: valor, origem: origem, condicao: condicao });
        else (fixos[id] = fixos[id] || []).push({ valor: valor, origem: origem });
      }
      ficha.tracos.forEach(function (sel) {
        var t = TRACO[sel.id];
        if (!t) return;
        var nivel = nivelDoTraco(sel);
        (t.efeitos || []).forEach(function (e) {
          if (e.alvo !== 'pericia' && e.alvo !== 'grupo_pericias') return;
          if (typeof e.valor !== 'number' || !efeitoValeParaEscolha(e, sel)) return;
          var valor = e.por_nivel ? e.valor * nivel : e.valor;
          if (!valor) return;
          var origem = nomeVariante(t, (sel.escolha || {}).opcao) || t.nome;
          [].concat(e.ref).forEach(function (id) { somar(id, valor, origem, e.condicao); });
        });
      });
      ficha.talentos.forEach(function (sel) {
        var t = TALENTO[sel.id];
        if (!t || !sel.nivel) return;
        t.pericias.forEach(function (id) { somar(id, sel.nivel, t.nome); });
      });
      return { fixos: fixos, situacionais: situacionais };
    }

    // Efeitos sem condição em atributos, secundárias e defesas (ex.: Reflexos em Combate, Nanismo).
    // Os com condição valem só em certas situações e ficam na descrição do traço.
    function efeitosFixos(ficha) {
      var r = { atributos: {}, secundarias: {}, esquiva: 0, origens: [] };
      ficha.tracos.forEach(function (sel) {
        var t = TRACO[sel.id];
        if (!t) return;
        var nivel = nivelDoTraco(sel);
        (t.efeitos || []).forEach(function (e) {
          if (e.condicao || typeof e.valor !== 'number' || !efeitoValeParaEscolha(e, sel)) return;
          var valor = e.por_nivel ? e.valor * nivel : e.valor;
          if (!valor) return;
          if (e.alvo === 'atributo') r.atributos[e.ref] = (r.atributos[e.ref] || 0) + valor;
          else if (e.alvo === 'secundaria') r.secundarias[e.ref] = (r.secundarias[e.ref] || 0) + valor;
          else if (e.alvo === 'defesa' && (e.ref === 'esquiva' || e.ref === 'todas')) r.esquiva += valor;
          else return;
          r.origens.push({ traco: t.nome, alvo: e.alvo, ref: e.ref, valor: valor });
        });
      });
      return r;
    }

    // Efeitos do traço já com a versão e o nível escolhidos, cada um com seu tipo (aplicado, sempre, condicional, regra).
    function efeitosDoTraco(sel) {
      var t = TRACO[sel.id];
      if (!t) return [];
      var nivel = nivelDoTraco(sel);
      return (t.efeitos || []).filter(function (e) { return efeitoValeParaEscolha(e, sel); })
        .filter(function (e) { return !(e.por_nivel && typeof e.valor === 'number' && !nivel); })
        .map(function (e) { return { tipo: Efeitos.tipoEfeito(e), texto: Efeitos.textoEfeito(e, G, nivel) }; })
        .filter(function (x) { return x.texto; });
    }


    // ---------- perícias sem treino e combate ----------
    var ATRIBUTO_DE = { DX: 'dx', IQ: 'iq', HT: 'ht', ST: 'st', Per: 'per', Vontade: 'vontade' };
    var TIPO_CURTO = {
      contusao: 'cont', corte: 'corte', perfuracao: 'perf', queimadura: 'qmd', corrosao: 'cor', toxico: 'tox', fadiga: 'fad',
      perfurante: 'pa', 'perfurante-pequeno': 'pa-', 'perfurante-grande': 'pa+', 'perfurante-enorme': 'pa++'
    };

    // NH de quem usa a perícia sem ter treinado (o "pré-definido"): o melhor caminho entre atributo−X e outra perícia−X.
    function nhSemTreino(p, valores, nhTreinado) {
      var melhor = null;
      ((p.predefinidos || {}).caminhos || []).forEach(function (c) {
        var v = null;
        if (c.tipo === 'atributo') v = valores[c.atributo] != null ? valores[c.atributo] + c.mod : null;
        else if (c.tipo === 'pericia' && nhTreinado[c.id] != null) v = nhTreinado[c.id] + c.mod;
        if (v != null && (melhor == null || v > melhor)) melhor = v;
      });
      return melhor;
    }

    function nhParaUso(uso, valores, nhTreinado) {
      if (uso.tipo === 'atributo') return valores[uso.atributo] != null ? { nh: valores[uso.atributo] + (uso.mod || 0), como: uso.atributo.toUpperCase() + (uso.mod ? (uso.mod > 0 ? '+' : '') + uso.mod : '') } : null;
      if (uso.tipo !== 'pericia') return null;
      var p = PERICIA[uso.id];
      if (!p) return null;
      if (nhTreinado[uso.id] != null) return { nh: nhTreinado[uso.id] + (uso.mod || 0), como: p.nome, treinada: true };
      var st = nhSemTreino(p, valores, nhTreinado);
      return st == null ? null : { nh: st + (uso.mod || 0), como: p.nome + ' sem treino' };
    }

    // ---------- equipamento: onde está (equipado, levado, guardado ou dentro de outro), quanto sobrou e qualidade ----------
    function classeDoItem(it) {
      if (it && it.combate && it.combate.modos && it.combate.modos.length) return 'armas';
      if (it && (it.protecao || it.escudo)) return 'armaduras';
      return 'equipamento';
    }
    function qualidadeDe(sel, it) {
      var tabela = (R.qualidade_itens || {})[classeDoItem(it)] || [];
      var n = sel.qualidade || 0;
      return tabela.filter(function (q) { return q.nivel === n; })[0] || { nivel: 0, nome: 'Normal', preco: 1 };
    }
    // arma, armadura, escudo e recipientes (mochila, bolsa, aljava) entram no corpo; o resto vai levado
    function localPadrao(it) { return classeDoItem(it) === 'equipamento' && !(it && RECIPIENTE.test(it.nome)) ? 'levado' : 'equipado'; }

    // ---------- lugares do corpo: cada item equipado ocupa um ----------
    var LUGARES = {
      mao_d: { nome: 'Mão direita', cabe: 1 }, mao_e: { nome: 'Mão esquerda', cabe: 1 }, maos: { nome: 'Duas mãos', cabe: 1 },
      costas: { nome: 'Costas', cabe: 2 }, cinto: { nome: 'Cinto', cabe: 4 }, corpo: { nome: 'Vestido', cabe: 99 }
    };
    function modosDuasMaos(it) {
      var modos = (it.combate && it.combate.modos) || [];
      var algum = modos.some(function (m) { return m.st && m.st.duas_maos; });
      var todos = modos.length && modos.every(function (m) { return m.st && m.st.duas_maos; });
      return { algum: algum, todos: todos };
    }
    // onde este item pode ficar quando está equipado
    function lugaresPossiveis(it) {
      if (!it) return [];
      if (it.protecao) return ['corpo'];
      if (it.escudo) return ['mao_e', 'mao_d', 'costas'];
      if (classeDoItem(it) === 'armas') {
        var dm = modosDuasMaos(it);
        // arma só de duas mãos (arco, montante) não vai no cinto
        return dm.todos ? ['maos', 'costas'] : ['mao_d', 'mao_e'].concat(dm.algum ? ['maos'] : []).concat(['cinto', 'costas']);
      }
      return ['mao_d', 'mao_e', 'costas', 'cinto', 'corpo'];
    }
    function lugarPadrao(it) {
      if (!it) return 'corpo';
      if (it.protecao) return 'corpo';
      if (it.escudo) return 'mao_e';
      if (classeDoItem(it) === 'armas') return modosDuasMaos(it).todos ? 'maos' : 'mao_d';
      if (/algibeira|bolsa|bainha|cintura|bornal/i.test(it.nome)) return 'cinto';
      return RECIPIENTE.test(it.nome) ? 'costas' : 'corpo';
    }
    var RECIPIENTE = /mochila|bolsa|algibeira|aljava|saco|bainha|bornal|cesto|caixa|baú|alforje/i;
    // mãos que o lugar ocupa (duas mãos ocupa as duas)
    function maosDe(lugar) { return lugar === 'maos' ? ['mao_d', 'mao_e'] : lugar === 'mao_d' || lugar === 'mao_e' ? [lugar] : []; }
    // Põe um item num lugar do corpo; quem estava na mão (ou sobrando nas costas/cinto) vai para "levado".
    // Devolve os itens que saíram, para avisar. lugar: mao_d | mao_e | maos | costas | cinto | corpo.
    function equipar(ficha, uid, lugar) {
      normalizarEquipamento(ficha.equipamento);
      var sel = ficha.equipamento.filter(function (x) { return x.uid === uid; })[0];
      if (!sel || !LUGARES[lugar]) return [];
      var saiu = [];
      var maos = maosDe(lugar);
      var mesmos = ficha.equipamento.filter(function (x) {
        return x !== sel && x.local === 'equipado' && !x.dentro && x.lugar && (x.lugar === lugar || maosDe(x.lugar).some(function (m) { return maos.indexOf(m) !== -1; }));
      });
      var sobra = maos.length ? mesmos.length : Math.max(0, mesmos.length - (LUGARES[lugar].cabe - 1));
      mesmos.slice(0, sobra).forEach(function (x) { x.local = 'levado'; delete x.lugar; saiu.push(x); });
      delete sel.dentro;
      sel.local = 'equipado';
      sel.lugar = lugar;
      return saiu.map(function (x) { return (ITEM[x.id] || {}).nome || x.id; });
    }
    function novoUid() { return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
    function novoItem(id) {
      var it = ITEM[id];
      // o lugar do corpo é escolhido ao resumir a ficha: o primeiro livre (ver normalizarEquipamento)
      return { id: id, quantidade: 1, uid: novoUid(), local: localPadrao(it), qualidade: 0 };
    }
    // fichas antigas: cada item ganha um uid, um local e qualidade 0
    function normalizarEquipamento(lista) {
      (lista || []).forEach(function (sel) {
        if (!sel.uid) sel.uid = novoUid();
        if (!sel.local) sel.local = localPadrao(ITEM[sel.id]);
        if (sel.qualidade == null) sel.qualidade = 0;
      });
      // quem está equipado sem lugar ganha o primeiro lugar livre (arma na mão; se a mão estiver ocupada, cinto ou costas)
      var ocupado = {};
      function marcar(l) { (maosDe(l).length ? maosDe(l) : [l]).forEach(function (k) { ocupado[k] = (ocupado[k] || 0) + 1; }); }
      function livre(l) { return (maosDe(l).length ? maosDe(l) : [l]).every(function (k) { return (ocupado[k] || 0) < LUGARES[k].cabe; }); }
      (lista || []).forEach(function (sel) { if (sel.local === 'equipado' && !sel.dentro && sel.lugar) marcar(sel.lugar); });
      (lista || []).forEach(function (sel) {
        if (sel.local !== 'equipado' || sel.dentro || sel.lugar) return;
        var it = ITEM[sel.id];
        // preferência: o lugar padrão; depois cinto, costas e vestido; a outra mão por último (fica para escudo ou tocha)
        var opcoes = [lugarPadrao(it)].concat(lugaresPossiveis(it).filter(function (l) { return !maosDe(l).length; }), lugaresPossiveis(it));
        sel.lugar = opcoes.filter(livre)[0] || lugarPadrao(it);
        marcar(sel.lugar);
      });
    }
    // dentro de algo guardado, está guardado; dentro de algo carregado, está só levado (não pronto para usar)
    function localEfetivo(sel, lista) {
      var vistos = {};
      var atual = sel;
      while (atual) {
        if (atual.local === 'guardado') return 'guardado';
        if (!atual.dentro || vistos[atual.dentro]) break;
        vistos[atual.dentro] = true;
        atual = lista.filter(function (x) { return x.uid === atual.dentro; })[0];
      }
      return sel.dentro ? 'levado' : (sel.local || 'levado');
    }
    // quantidade que ainda existe (flechas, rações e tochas gastam em jogo)
    function quantidadeAtual(sel, ficha) {
      var usados = (((ficha.em_jogo || {}).usados) || {})[sel.uid] || 0;
      return Math.max(0, (sel.quantidade || 1) - usados);
    }

    // ---------- situações: bônus que só valem em certos momentos; a ficha liga e desliga, a rolagem soma ----------
    // testes do catálogo que são um atributo com outro nome (Visão é Per, Verificação de Pânico é Vontade…)
    var TESTE_BASE = {
      visao: 'per', audicao: 'per', olfato_paladar: 'per', tato: 'per',
      verificacao_panico: 'vontade', resistir_medo: 'vontade', resistir_influencia: 'vontade', resistir_tortura: 'vontade',
      vontade_autocontrole: 'vontade', autocontrole: 'vontade', perceber_interrupcao: 'vontade', resistir_telepatia: 'vontade',
      testes_ht: 'ht', ht_morte: 'ht', ht_nocaute: 'ht', ht_sangramento: 'ht', ht_bebida: 'ht', ht_alcoolismo: 'ht',
      ht_comida_bebida: 'ht', ht_resistir_suscetibilidade: 'ht', resistir_doenca: 'ht', resistir_veneno: 'ht',
      resistir_elixires: 'ht', resistir_categoria_escolhida: 'ht', recuperar_doenca_veneno: 'ht',
      recuperar_lesao_incapacitante: 'ht', ressaca: 'ht',
      testes_iq: 'iq', pericias_iq: 'iq', recuperar_surpresa: 'iq', interpretar_visoes: 'iq', aprender_assunto: 'iq',
      st_resistir_derrubada: 'st', manter_equilibrio: 'dx', nao_ser_derrubado: 'dx', destreza_manual: 'dx', escapar_agarrao: 'dx'
    };
    var TESTE_ALVO = { ataque_distancia: 'ataque:distancia', pericias_combate: 'ataque', iniciativa: 'iniciativa' };
    function semAcentos(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
    var PERICIA_POR_NOME = {};
    (G.pericias || []).forEach(function (p) { PERICIA_POR_NOME[semAcentos(p.nome)] = p; });
    function situacoes(ficha) {
      var lista = [];
      ficha.tracos.forEach(function (sel) {
        var t = TRACO[sel.id];
        if (!t) return;
        var nivel = nivelDoTraco(sel);
        var origem = nomeVariante(t, (sel.escolha || {}).opcao) || t.nome;
        (t.efeitos || []).forEach(function (e, k) {
          if (!e.condicao || typeof e.valor !== 'number' || !efeitoValeParaEscolha(e, sel)) return;
          var valor = e.por_nivel ? e.valor * nivel : e.valor;
          if (!valor) return;
          var alvos = [];
          if (e.alvo === 'pericia' || e.alvo === 'grupo_pericias') [].concat(e.ref).forEach(function (id) { alvos.push('pericia:' + id); });
          else if (e.alvo === 'atributo' || e.alvo === 'secundaria') alvos.push('atributo:' + e.ref);
          else if (e.alvo === 'defesa') (e.ref === 'todas' ? ['esquiva', 'aparar', 'bloqueio'] : [e.ref]).forEach(function (d) { alvos.push('defesa:' + d); });
          else if (e.alvo === 'dano') alvos.push('dano');
          else if (e.alvo === 'reacao') alvos.push('reacao');
          else if (e.alvo === 'teste') alvos.push(TESTE_BASE[e.ref] ? 'atributo:' + TESTE_BASE[e.ref] : TESTE_ALVO[e.ref] || 'qualquer');
          else return;
          lista.push({ chave: sel.id + '#' + k, origem: origem, condicao: e.condicao, valor: valor, alvos: alvos, por_dado: /por dado/.test(e.condicao) });
        });
      });
      // equipamento bom ou improvisado: soma na perícia do item quando ele é usado
      ficha.equipamento.forEach(function (sel) {
        var it = ITEM[sel.id];
        if (!it || !sel.qualidade || classeDoItem(it) !== 'equipamento') return;
        var q = qualidadeDe(sel, it);
        if (!q.nh) return;
        var p = PERICIA_POR_NOME[semAcentos(it.pericia)];
        lista.push({ chave: 'item:' + sel.uid, origem: it.nome + ' (' + q.nome.toLowerCase() + ')', condicao: 'usando este item', valor: q.nh, alvos: p ? ['pericia:' + p.id] : ['qualquer'] });
      });
      return lista;
    }

    function textoDano(d, basico) {
      if (!d) return '—';
      if (d.especial) return 'especial';
      var tipo = TIPO_CURTO[d.tipo] || d.tipo || '';
      var div = d.divisor_armadura ? ' (' + String(d.divisor_armadura).replace('.', ',') + ')' : '';
      if (d.base) {
        var b = basico && basico[d.base];
        var soma = b ? calc.somarDano(b, d.mod) : null;
        return (soma || (d.base === 'gdp' ? 'GdP' : 'GeB') + (d.mod ? (d.mod > 0 ? '+' : '') + d.mod : '')) + div + ' ' + tipo;
      }
      if (d.dados != null) return d.dados + 'd' + (d.mod ? (d.mod > 0 ? '+' : '') + d.mod : '') + div + ' ' + tipo;
      return d.texto || '—';
    }
    function textoAlcance(a, st) {
      if (!a) return '—';
      if (a.especial) return 'especial';
      if (a.meio_st != null || a.max_st != null) {
        var mx = a.max_st != null ? Math.round(a.max_st * st) : null, mt = a.meio_st != null ? Math.round(a.meio_st * st) : null;
        return (mt != null ? mt + ' / ' : '') + (mx != null ? mx : '') + ' m';
      }
      if (a.min != null) {
        var ini = a.min === 0 ? 'C' : String(a.min), fim = a.max === 0 ? 'C' : String(a.max);
        return (ini === fim ? fim : ini + '–' + fim) + (a.preparar ? '*' : '');
      }
      return a.texto || '—';
    }

    function combate(ficha, valores, pericias, avisos) {
      var nhTreinado = {};
      pericias.forEach(function (x) { if (x.pericia && x.nh != null && (nhTreinado[x.pericia.id] == null || x.nh > nhTreinado[x.pericia.id])) nhTreinado[x.pericia.id] = x.nh; });
      var basico = calc.danoBasico(valores.st, G.tabela_dano) || null;
      var armas = [], protecao = {}, pesoTotal = 0, db = 0, bloqueio = null;
      ficha.equipamento.forEach(function (sel) {
        var it = ITEM[sel.id];
        if (!it) return;
        var onde = localEfetivo(sel, ficha.equipamento);
        if (onde === 'guardado') return; // ficou em casa: não pesa nem protege
        var q = quantidadeAtual(sel, ficha);
        if (it.peso) pesoTotal += it.peso.kg * q;
        if (onde !== 'equipado') return; // levado na mochila: pesa, mas não está pronto
        var naMao = maosDe(sel.lugar).length > 0;
        if (it.escudo && naMao) {
          db = Math.max(db, it.escudo.bd || 0);
          var usoEsc = nhParaUso({ tipo: 'pericia', id: 'escudo' }, valores, nhTreinado);
          if (usoEsc) bloqueio = Math.max(bloqueio || 0, Math.floor(usoEsc.nh / 2) + 3);
        }
        if (it.protecao) {
          String(it.protecao.local || '').split(/,\s*/).filter(Boolean).forEach(function (l) {
            var atual = protecao[l] || { rd: 0, itens: [] };
            atual.rd += it.protecao.rd || 0;
            if (it.protecao.so_frente) atual.so_frente = true;
            if (it.protecao.flexivel) atual.flexivel = true;
            atual.itens.push(it.nome + ' (' + it.protecao.texto + ')');
            protecao[l] = atual;
          });
        }
        if (it.combate) adicionarArma(it, false, qualidadeDe(sel, it), naMao ? null : (LUGARES[sel.lugar] || {}).nome);
      });
      // ataques desarmados: todo mundo tem soco e chute (com botas, o chute é mais forte)
      var calcado = ficha.equipamento.some(function (sel) { return /^(botas|sollerets)$/.test(sel.id) && localEfetivo(sel, ficha.equipamento) === 'equipado'; });
      [ITEM.soco, calcado ? ITEM['chute-com-botas'] : ITEM.chute].forEach(function (it) {
        if (it && it.combate) adicionarArma(it, true);
      });
      function adicionarArma(it, natural, qualidade, guardadaEm) {
        {
          it.combate.modos.forEach(function (m) {
            // qualidade boa ou excelente soma no dano dos ataques corpo a corpo
            var extra = qualidade && qualidade.dano && m.alcance && m.alcance.min != null ? qualidade.dano : 0;
            var dano = extra && m.dano ? Object.assign({}, m.dano, { mod: (m.dano.mod || 0) + extra }) : m.dano;
            var melhor = null;
            (it.combate.pericias || []).forEach(function (u) {
              var r = nhParaUso(u, valores, nhTreinado);
              if (r && (!melhor || r.nh > melhor.nh)) melhor = r;
            });
            var nh = melhor ? melhor.nh : null;
            var stMin = m.st && m.st.min;
            if (stMin && valores.st < stMin) {
              avisos.push({ etapa: 'equipamento', texto: it.nome + ': pede ST ' + stMin + '; com ST ' + valores.st + ' o personagem tem -' + (stMin - valores.st) + ' no NH.' });
              if (nh != null) nh -= stMin - valores.st;
            }
            armas.push({
              item: it, nome: it.nome + (qualidade && qualidade.nivel ? ' (' + qualidade.nome.toLowerCase() + ')' : '') + (m.nome ? ' — ' + m.nome : ''), dano: textoDano(dano, basico),
              distancia: !!(m.alcance && (m.alcance.meio_st != null || m.alcance.max_st != null)),
              sacar: guardadaEm || null, // nas costas ou no cinto: precisa de Preparar (ou Sacar Rápido) antes
              alcance: textoAlcance(m.alcance, valores.st), nh: nh, pericia: melhor ? melhor.como : 'sem perícia',
              aparar: m.aparar && m.aparar.mod != null && nh != null ? Math.floor(nh / 2) + 3 + m.aparar.mod + (m.aparar.desbalanceada ? 'D' : '') : null,
              st: stMin || null, precisao: m.precisao != null ? m.precisao : null, natural: !!natural
            });
          });
        }
      }
      pesoTotal = Math.round(pesoTotal * 100) / 100;
      var nivel = calc.nivelDeCarga(valores.st, pesoTotal);
      var niveis = R.carga.niveis;
      var nomeNivel = nivel < niveis.length ? niveis[nivel].nome : 'Não consegue se mover';
      if (nivel >= niveis.length) avisos.push({ etapa: 'equipamento', texto: 'Peso demais: ' + String(pesoTotal).replace('.', ',') + ' kg passa de 10× a Base de Carga.' });
      var aparar = armas.filter(function (a) { return !a.sacar; }).reduce(function (m, a) { var v = parseInt(a.aparar, 10); return !isNaN(v) && (m == null || v > m) ? v : m; }, null);
      return {
        dano_basico: basico,
        armas: armas,
        protecao: protecao,
        peso_total: pesoTotal,
        carga: { nivel: nivel, nome: nomeNivel, deslocamento: nivel < niveis.length ? calc.deslocamentoComCarga(valores.deslocamento, nivel) : 0 },
        db: db,
        defesas: {
          esquiva: nivel < niveis.length ? calc.esquiva(valores.velocidade, nivel) : 0,
          aparar: aparar,
          bloqueio: bloqueio
        },
        sem_treino: function (p) { return nhSemTreino(p, valores, nhTreinado); }
      };
    }

    function custoIdiomas(ficha) {
      return ficha.idiomas.reduce(function (s, i) { return s + calc.custoIdioma(i.fala, i.escrita); }, 0);
    }

    function resumir(ficha) {
      normalizarEquipamento(ficha.equipamento);
      var base = calc.calcularFicha({ atributos: ficha.atributos, ajustes: ficha.ajustes, social: ficha.social });
      var fixos = efeitosFixos(ficha);
      var atrEfetivo = {};
      Object.keys(ficha.atributos).forEach(function (k) { atrEfetivo[k] = ficha.atributos[k] + (fixos.atributos[k] || 0); });
      var valores = calc.secundarias(atrEfetivo, ficha.ajustes);
      Object.keys(atrEfetivo).forEach(function (k) { valores[k] = atrEfetivo[k]; });
      Object.keys(fixos.secundarias).forEach(function (k) { valores[k] += fixos.secundarias[k]; });

      // erros impedem salvar a ficha como pronta e enviar; avisos só informam (coisas para combinar com o narrador)
      var erros = [], avisos = [];
      // incompleto: falta preencher algo (só aparece na revisão e ao salvar); erro: algo está contra as regras
      function erro(etapa, texto) { erros.push({ etapa: etapa, texto: texto, tipo: 'erro' }); }
      function incompleto(etapa, texto) { erros.push({ etapa: etapa, texto: texto, tipo: 'incompleto' }); }
      function aviso(etapa, texto) { avisos.push({ etapa: etapa, texto: texto }); }
      function virgula(v) { return String(v).replace('.', ','); }

      if (!String(ficha.nome || '').trim()) incompleto('conceito', 'Falta o nome do personagem.');

      // atributos e secundárias
      R.atributos.forEach(function (a) {
        var x = ficha.atributos[a.id];
        if (!(x >= 1)) erro('atributos', a.nome + ' precisa ser pelo menos 1.');
        else if (x < 8) aviso('atributos', a.nome + ' ' + x + ': abaixo de 8 o narrador pode vetar para aventureiros.');
        else if (x > 20) erro('atributos', a.nome + ' ' + x + ': acima de 20 não existe em humanos de Adamar.');
      });
      R.secundarias.forEach(function (s) {
        var lim = calc.limitesSecundaria(s.id, ficha.atributos);
        var v = base.valores[s.id];
        if (v < lim.min || v > lim.max) {
          erro('atributos', s.nome + ' ' + virgula(v) + ' está fora da faixa permitida (' + virgula(lim.min) + ' a ' + virgula(lim.max) + ').');
        }
      });
      if (ficha.social.aparencia === 'lindo') aviso('sociedade', 'Aparência Lindo: o livro reserva para anjos e divindades. Com o narrador.');
      ficha.idiomas.forEach(function (i) {
        if (!String(i.nome || '').trim()) incompleto('sociedade', 'Há um idioma sem nome.');
        if (i.fala === 'nenhum' && i.escrita === 'nenhum') incompleto('sociedade', (i.nome || 'Um idioma') + ': escolha como fala ou escreve, ou remova.');
      });

      // traços: vantagens, desvantagens, qualidades e peculiaridades do catálogo
      var vant = 0, desv = 0, qualidades = 0, peculiaridades = 0;
      var tracos = ficha.tracos.map(function (sel) {
        var t = TRACO[sel.id];
        if (!t) { erro('vantagens', 'Traço desconhecido: ' + sel.id + '.'); return { sel: sel, custo: 0 }; }
        var custo = custoDoTraco(sel);
        if (t.categoria === 'qualidade') qualidades += custo;
        else if (t.categoria === 'peculiaridade') peculiaridades += custo;
        else if (custo >= 0) vant += custo;
        else desv += custo;
        var etapa = t.categoria === 'desvantagem' || t.categoria === 'peculiaridade' ? 'desvantagens' : 'vantagens';
        if (t.adamar === 'nao') erro(etapa, t.nome + ' não existe em Adamar.');
        if (t.adamar === 'narrador') aviso(etapa, t.nome + ': só com o narrador.');
        var c = t.custo_estruturado || {};
        var e = sel.escolha || {};
        if (c.tipo === 'niveis' && t.nivel_max != null && e.nivel > t.nivel_max) erro(etapa, t.nome + ': nível máximo ' + t.nivel_max + ' em Adamar.');
        if (c.tipo === 'niveis' && !e.nivel) incompleto(etapa, t.nome + ': escolha o nível.');
        if ((c.tipo === 'variavel' || c.tipo === 'minimo') && !e.valor) incompleto(etapa, t.nome + ': custo a combinar com o narrador.');
        if (c.tipo === 'minimo' && e.valor && Math.abs(e.valor) < Math.abs(c.valor)) erro(etapa, t.nome + ': custa no mínimo ' + c.valor + '.');
        if (c.tipo === 'faixa' && (e.valor == null || e.valor < Math.min(c.min, c.max) || e.valor > Math.max(c.min, c.max))) {
          erro(etapa, t.nome + ': pontos fora da faixa ' + c.min + ' a ' + c.max + '.');
        }
        (t.prerequisitos || []).forEach(function (p) {
          var msg = prerequisitoFalho(p, ficha, valores);
          if (msg) erro(etapa, t.nome + ': ' + msg);
        });
        return { sel: sel, traco: t, custo: custo };
      });

      var talentos = ficha.talentos.map(function (sel) {
        var t = TALENTO[sel.id];
        var custo = t ? t.custo_por_nivel * (sel.nivel || 0) : 0;
        vant += custo;
        if (t && (!(sel.nivel >= 1) || sel.nivel > (t.nivel_max || 4))) erro('vantagens', 'Talento ' + t.nome + ': de 1 a ' + (t.nivel_max || 4) + ' níveis.');
        return { sel: sel, talento: t, custo: custo };
      });

      function preenchido(q) { return String(q || '').trim() !== ''; }
      qualidades += ficha.qualidades.filter(preenchido).length;
      peculiaridades -= ficha.peculiaridades.filter(preenchido).length;
      if (ficha.qualidades.some(function (q) { return !preenchido(q); })) incompleto('vantagens', 'Há uma qualidade em branco: escreva ou remova.');
      if (ficha.peculiaridades.some(function (q) { return !preenchido(q); })) incompleto('desvantagens', 'Há uma peculiaridade em branco: escreva ou remova.');
      if (-peculiaridades > LIMITE_PECULIARIDADES) {
        erro('desvantagens', 'No máximo ' + LIMITE_PECULIARIDADES + ' peculiaridades; você tem ' + (-peculiaridades) + '.');
      }
      var idiomas = custoIdiomas(ficha);

      // perícias
      var bonus = bonusDePericias(ficha);
      var custoPericias = 0;
      var vistas = {};
      var pericias = ficha.pericias.map(function (sel) {
        var p = PERICIA[sel.id];
        if (!p) { erro('pericias', 'Perícia desconhecida: ' + sel.id + '.'); return { sel: sel, nh: null }; }
        custoPericias += sel.pontos || 0;
        var rotulo = p.nome + (sel.especializacao ? ' (' + sel.especializacao + ')' : '');
        if (p.adamar === 'nao') erro('pericias', p.nome + ' não existe em Adamar.');
        if (p.adamar === 'narrador') aviso('pericias', p.nome + ': só com o narrador.');
        if (p.especializacao && !preenchido(sel.especializacao)) incompleto('pericias', p.nome + ': escolha a especialização.');
        var chave = p.id + '|' + String(sel.especializacao || '').trim().toLowerCase();
        if (vistas[chave]) erro('pericias', rotulo + ' aparece duas vezes.');
        vistas[chave] = true;
        var esp = (p.especializacoes || []).filter(function (x) { return x.nome === sel.especializacao; })[0];
        if (esp && esp.adamar === 'narrador') aviso('pericias', rotulo + ': só com o narrador.');
        if (esp && esp.adamar === 'nao') erro('pericias', rotulo + ' não existe em Adamar.');
        var rel = sel.pontos ? calc.nivelPorPontos(p.dificuldade, sel.pontos) : null;
        var atributo = valorAtributo(ficha, valores, p.atributo);
        var extra = (bonus.fixos[p.id] || []).reduce(function (s, b) { return s + b.valor; }, 0);
        var nh = rel == null ? null : atributo + rel + extra;
        if (rel == null) erro('pericias', rotulo + ': pontos insuficientes para o primeiro nível.');
        return {
          sel: sel, pericia: p, relativo: rel, nh: nh, atributo: p.atributo,
          nivel_relativo: nh == null ? null : p.atributo + (nh - atributo > 0 ? '+' + (nh - atributo) : nh - atributo < 0 ? '−' + (atributo - nh) : ''),
          bonus: bonus.fixos[p.id] || [], situacional: bonus.situacionais[p.id] || []
        };
      });

      // limites
      var desvantagens = base.desvantagens + desv; // atributos/secundárias/sociedade negativos + desvantagens (peculiaridades à parte)
      var limite = calc.limiteDesvantagens(ficha.orcamento, ((R.campanha || {}).limite_desvantagens || {}).percentual_padrao);
      if (desvantagens < limite) erro('desvantagens', 'As desvantagens somam ' + desvantagens + ', além do limite de ' + limite + '.');

      var custos = {
        atributos: base.custos.atributos,
        secundarias: base.custos.secundarias,
        social: base.custos.social + idiomas,
        vantagens: vant,
        desvantagens: desv,
        qualidades: qualidades,
        peculiaridades: peculiaridades,
        pericias: custoPericias
      };
      var total = Object.keys(custos).reduce(function (s, k) { return s + custos[k]; }, 0);
      // o que voltou ao saldo: tudo que tem custo negativo (desvantagens, atributos baixos, peculiaridades, analfabetismo)
      var alf = calc.custoAlfabetizacao(ficha.social.alfabetizacao);
      var devolvidos = -desvantagens - peculiaridades + (alf < 0 && ficha.social.analfabetismoRegra ? -alf : 0);
      // pontos ganhos em jogo somam ao orçamento (o limite de desvantagens continua pelos pontos iniciais)
      var ganhos = Math.max(0, parseInt((ficha.em_jogo || {}).pontos, 10) || 0);
      var restante = ficha.orcamento + ganhos - total;
      // saldo: começa no orçamento; o que custa tira, desvantagem devolve. Sobrar é permitido (fica guardado).
      if (restante < 0) erro('geral', 'Saldo negativo: faltam ' + (-restante) + ' pontos. Tire algo ou pegue desvantagens.');

      // equipamento: preço em coroas (1 coroa = $1 do GURPS)
      var gasto = 0;
      var equipamento = ficha.equipamento.map(function (sel) {
        var it = ITEM[sel.id];
        if (!it) erro('equipamento', 'Item desconhecido: ' + sel.id + '.');
        else if (it.adamar === 'nao') erro('equipamento', it.nome + ' não existe em Adamar.');
        else if (it.adamar === 'narrador') aviso('equipamento', it.nome + ': só com o narrador.');
        if (!(sel.quantidade >= 1)) erro('equipamento', (it ? it.nome : sel.id) + ': quantidade inválida.');
        var qualidade = it ? qualidadeDe(sel, it) : null;
        var preco = it && it.preco ? Math.round(it.preco.valor * (sel.quantidade || 1) * (qualidade ? qualidade.preco : 1) * 100) / 100 : null;
        if (preco != null) gasto += preco;
        return { sel: sel, item: it, preco: preco, qualidade: qualidade, local: localEfetivo(sel, ficha.equipamento), atual: quantidadeAtual(sel, ficha) };
      });
      gasto = Math.round(gasto * 100) / 100;
      // lugares do corpo: uma coisa por mão; costas e cinto têm limite
      var ocupa = {};
      ficha.equipamento.forEach(function (sel) {
        if (sel.local !== 'equipado' || sel.dentro || !ITEM[sel.id]) return;
        var lugar = sel.lugar || lugarPadrao(ITEM[sel.id]);
        if (lugaresPossiveis(ITEM[sel.id]).indexOf(lugar) === -1) erro('equipamento', ITEM[sel.id].nome + ' não pode ficar em: ' + ((LUGARES[lugar] || {}).nome || lugar) + '.');
        (maosDe(lugar).length ? maosDe(lugar) : [lugar]).forEach(function (l) { (ocupa[l] = ocupa[l] || []).push(ITEM[sel.id].nome); });
      });
      Object.keys(ocupa).forEach(function (l) {
        var cabe = LUGARES[l].cabe;
        if (ocupa[l].length > cabe) erro('equipamento', LUGARES[l].nome + ': ' + ocupa[l].join(', ') + (cabe === 1 ? ' ao mesmo tempo. Deixe só um.' : ' — cabem ' + cabe + '.'));
      });
      if (gasto > base.recursos) {
        erro('equipamento', 'O equipamento custa ' + gasto.toLocaleString('pt-BR') + ' coroas, mais que o dinheiro inicial (' + base.recursos.toLocaleString('pt-BR') + ').');
      }

      var cb = combate(ficha, valores, pericias, avisos);
      // bônus fixos (Reflexos em Combate…) e o bônus do escudo valem para todas as defesas
      cb.defesas.esquiva += fixos.esquiva + cb.db;
      if (cb.defesas.aparar != null) cb.defesas.aparar += cb.db;
      if (cb.defesas.bloqueio != null) cb.defesas.bloqueio += cb.db;
      return {
        valores: valores,
        combate: cb,
        custos: custos,
        total: total,
        restante: restante,
        pontos_ganhos: ganhos,
        pontos_devolvidos: devolvidos,
        pontos_gastos: total + devolvidos,
        desvantagens: desvantagens,
        limite: limite,
        peculiaridades: -peculiaridades,
        recursos: base.recursos,
        gasto_equipamento: gasto,
        dinheiro_restante: Math.round((base.recursos - gasto) * 100) / 100,
        equipamento: equipamento,
        situacoes: situacoes(ficha),
        efeitos_fixos: fixos.origens,
        tracos: tracos,
        talentos: talentos,
        pericias: pericias,
        esquiva: calc.esquiva(valores.velocidade) + fixos.esquiva,
        base_carga: calc.baseDeCarga(valores.st),
        erros: erros,
        avisos: avisos,
        valida: erros.length === 0,
        problemas: erros.filter(function (e) { return e.tipo === 'erro'; }),
        incompletos: erros.filter(function (e) { return e.tipo === 'incompleto'; })
      };
    }

    function prerequisitoFalho(p, ficha, valores) {
      if (p.tipo === 'traco') {
        var tem = ficha.tracos.filter(function (s) { return s.id === p.id; })[0];
        if (!tem) return 'precisa de ' + ((TRACO[p.id] || {}).nome || p.id) + '.';
        if (p.nivel_min && ((tem.escolha || {}).nivel || 0) < p.nivel_min) return 'precisa de ' + TRACO[p.id].nome + ' ' + p.nivel_min + ' ou mais.';
        return null;
      }
      if (p.tipo === 'exclui') {
        return ficha.tracos.some(function (s) { return s.id === p.id; }) ? 'não combina com ' + ((TRACO[p.id] || {}).nome || p.id) + '.' : null;
      }
      if (p.tipo === 'pericia') {
        var s = ficha.pericias.filter(function (x) { return x.id === p.id; })[0];
        return s ? null : 'precisa da perícia ' + ((PERICIA[p.id] || {}).nome || p.id) + '.';
      }
      if (p.tipo === 'atributo') {
        var v = valores[p.ref];
        if (p.min != null && v < p.min) return 'precisa de ' + p.ref.toUpperCase() + ' ' + p.min + ' ou mais.';
        if (p.max != null && v > p.max) return 'precisa de ' + p.ref.toUpperCase() + ' ' + p.max + ' ou menos.';
        return null;
      }
      return null; // pré-requisitos em texto ficam só na descrição
    }

    function sinal(v) { return v > 0 ? '+' + v : String(v); }
    function num(v) { return String(v).replace('.', ','); }

    function descricaoTraco(item) {
      var t = item.traco, e = item.sel.escolha || {};
      if (!t) return item.sel.id;
      var c = t.custo_estruturado || {};
      var nome = t.nome;
      if (c.tipo === 'niveis') nome += ' ' + (e.nivel || 0);
      if (c.tipo === 'opcoes' && nomeVariante(t, e.opcao) && nomeVariante(t, e.opcao) !== t.nome) nome += ' (' + nomeVariante(t, e.opcao) + ')';
      if (c.unidade && (e.quantidade || 1) > 1) nome += ' ×' + e.quantidade;
      if (e.autocontrole && e.autocontrole !== R.autocontrole.padrao) nome += ' (' + e.autocontrole + ')';
      if (item.sel.nota) nome += ' — ' + item.sel.nota;
      return nome + ' [' + item.custo + ']';
    }

    // Texto da ficha para WhatsApp ou para copiar.
    function textoFicha(ficha, r) {
      var v = r.valores, L = [];
      L.push('*' + (ficha.nome || 'Personagem sem nome') + '*' + (ficha.jogador ? ' (jogador: ' + ficha.jogador + ')' : ''));
      if (ficha.conceito) L.push(ficha.conceito);
      if (ficha.era || ficha.origem) L.push([ficha.era, ficha.origem].filter(Boolean).join(' · '));
      var fis = [ficha.idade ? ficha.idade + ' anos' : '', ficha.altura, ficha.peso_corporal].filter(Boolean);
      if (fis.length) L.push(fis.join(' · '));
      L.push('');
      L.push('Pontos: começou com ' + ficha.orcamento + (r.pontos_ganhos ? ' (+' + r.pontos_ganhos + ' ganhos em jogo)' : '') + ', gastou ' + r.pontos_gastos + ', recebeu ' + r.pontos_devolvidos + ' de desvantagens · ' +
        (r.restante >= 0 ? 'guardados ' + r.restante : 'saldo negativo ' + r.restante));
      L.push('ST ' + v.st + ' · DX ' + v.dx + ' · IQ ' + v.iq + ' · HT ' + v.ht);
      L.push('PV ' + v.pv + ' · Vontade ' + v.vontade + ' · Per ' + v.per + ' · PF ' + v.pf + ' · Velocidade ' + num(v.velocidade) + ' · Deslocamento ' + v.deslocamento);
      var so = ficha.social;
      var ap = R.aparencia.niveis.filter(function (n) { return n.id === so.aparencia; })[0];
      var rq = R.riqueza.niveis.filter(function (n) { return n.id === so.riqueza; })[0];
      var alf = R.idiomas.alfabetizacao_materna.filter(function (n) { return n.id === so.alfabetizacao; })[0];
      L.push('Aparência ' + (ap ? ap.nome : so.aparencia) + ' · Status ' + sinal(so.status) + ' · Riqueza ' + (so.multimilionario ? 'Multimilionário ' + so.multimilionario : (rq ? rq.nome : so.riqueza)) + ' · ' + (alf ? alf.nome : so.alfabetizacao));
      var idiomas = [ficha.idioma_materno ? ficha.idioma_materno + ' (materna)' : null].concat(ficha.idiomas.map(function (i) {
        return i.nome + ' (fala ' + i.fala + ', escrita ' + i.escrita + ')';
      })).filter(Boolean);
      if (idiomas.length) L.push('Idiomas: ' + idiomas.join(', '));
      var vs = r.tracos.filter(function (x) { return x.custo >= 0; }).map(descricaoTraco)
        .concat(r.talentos.filter(function (x) { return x.talento; }).map(function (x) { return 'Talento ' + x.talento.nome + ' ' + x.sel.nivel + ' [' + x.custo + ']'; }));
      var ds = r.tracos.filter(function (x) { return x.custo < 0; }).map(descricaoTraco);
      if (vs.length) { L.push(''); L.push('*Vantagens:* ' + vs.join('; ')); }
      if (ds.length) { L.push(''); L.push('*Desvantagens:* ' + ds.join('; ')); }
      var q = ficha.qualidades.filter(Boolean), pq = ficha.peculiaridades.filter(Boolean);
      if (q.length) L.push('*Qualidades:* ' + q.join('; '));
      if (pq.length) L.push('*Peculiaridades:* ' + pq.join('; '));
      var ps = r.pericias.filter(function (x) { return x.pericia; }).map(function (x) {
        var nome = x.pericia.nome + (x.sel.especializacao ? ' (' + x.sel.especializacao + ')' : '');
        return nome + ' ' + (x.nh == null ? '—' : x.nh) + ' [' + (x.sel.pontos || 0) + ']';
      });
      if (ps.length) { L.push(''); L.push('*Perícias:* ' + ps.join('; ')); }
      var cb = r.combate;
      if (cb) {
        L.push('');
        L.push('*Combate:* dano básico GdP ' + (cb.dano_basico ? cb.dano_basico.gdp : '—') + ', GeB ' + (cb.dano_basico ? cb.dano_basico.geb : '—') +
          ' · Esquiva ' + cb.defesas.esquiva + (cb.defesas.aparar != null ? ' · Aparar ' + cb.defesas.aparar : '') +
          (cb.defesas.bloqueio != null ? ' · Bloqueio ' + cb.defesas.bloqueio : '') + ' · carga ' + cb.carga.nome + ' (' + num(cb.peso_total) + ' kg, deslocamento ' + cb.carga.deslocamento + ')');
        cb.armas.forEach(function (a) { L.push('- ' + a.nome + ': ' + a.dano + ', NH ' + (a.nh == null ? '—' : a.nh) + (a.aparar != null ? ', aparar ' + a.aparar : '') + ', alcance ' + a.alcance); });
        var locais = Object.keys(cb.protecao);
        if (locais.length) L.push('RD: ' + locais.map(function (l) { return l + ' ' + cb.protecao[l].rd + (cb.protecao[l].so_frente ? ' (só frente)' : ''); }).join(', '));
      }
      var eq = ficha.equipamento.map(function (e) {
        var it = ITEM[e.id];
        return (it ? it.nome : e.id) + (e.quantidade > 1 ? ' ×' + e.quantidade : '');
      });
      if (eq.length) {
        L.push('');
        L.push('*Equipamento:* ' + eq.join(', '));
        var fmt = function (v) { return v.toLocaleString('pt-BR'); };
        L.push('Gasto: ' + fmt(r.gasto_equipamento) + ' de ' + fmt(r.recursos) + ' coroas (' + (r.dinheiro_restante >= 0 ? 'sobram ' + fmt(r.dinheiro_restante) : 'faltam ' + fmt(-r.dinheiro_restante)) + ')');
      }
      if (ficha.aparencia_fisica) { L.push(''); L.push('*Aparência:* ' + ficha.aparencia_fisica); }
      if (ficha.historia) { L.push(''); L.push('*História:* ' + ficha.historia); }
      if (ficha.notas) { L.push(''); L.push('*Notas:* ' + ficha.notas); }
      var lembrar = [];
      r.tracos.forEach(function (x) {
        if (!x.traco) return;
        efeitosDoTraco(x.sel).forEach(function (e) {
          if (e.tipo === 'condicional' || e.tipo === 'sempre') lembrar.push(x.traco.nome + ': ' + e.texto + (e.tipo === 'condicional' ? ' [CONDICIONAL]' : ''));
        });
      });
      if (lembrar.length) { L.push(''); L.push('*Lembrar na mesa:*'); lembrar.forEach(function (a) { L.push('- ' + a); }); }
      if (r.erros.length) { L.push(''); L.push('*Pendências (ficha incompleta):*'); r.erros.forEach(function (a) { L.push('- ' + a.texto); }); }
      if (r.avisos.length) { L.push(''); L.push('*Para conversar com o narrador:*'); r.avisos.forEach(function (a) { L.push('- ' + a.texto); }); }
      return L.join('\n');
    }

    // Estado "em jogo": PV e PF atuais e o que eles causam (Módulo Básico, págs. 327–328).
    // Os efeitos de ferimento e de fadiga se acumulam.
    function estadoEmJogo(ficha, r) {
      var v = r.valores, j = ficha.em_jogo || {};
      var pvMax = v.pv, pfMax = v.pf;
      var pv = typeof j.pv === 'number' ? j.pv : pvMax;
      var pf = typeof j.pf === 'number' ? j.pf : pfMax;
      var desl = r.combate ? r.combate.carga.deslocamento : v.deslocamento;
      var esq = r.combate ? r.combate.defesas.esquiva : r.esquiva;
      var st = v.st;
      var efeitos = [];
      var metade = function (x) { return Math.ceil(x / 2); };
      if (pv <= -5 * pvMax) efeitos.push({ grave: 3, texto: 'Morto: chegou a −5× os PV.' });
      else {
        if (pv < pvMax / 3) { desl = metade(desl); esq = metade(esq); efeitos.push({ grave: 1, texto: 'Menos de 1/3 dos PV: cambaleando, deslocamento e esquiva pela metade.' }); }
        if (pv <= 0) efeitos.push({ grave: 2, texto: 'PV zero ou negativo: teste de HT a cada turno para não desmaiar.' });
        if (pv <= -pvMax) {
          var mult = Math.floor(-pv / pvMax);
          efeitos.push({ grave: 3, texto: 'Risco de morte: a −' + mult + '× os PV, teste de HT para não morrer (de novo a cada novo múltiplo; −5× é morte).' });
        }
      }
      if (pf <= -pfMax) efeitos.push({ grave: 3, texto: 'Inconsciente de exaustão (−1× os PF); acorda quando os PF voltarem a ser positivos.' });
      else {
        if (pf < pfMax / 3) { desl = metade(desl); esq = metade(esq); st = metade(st); efeitos.push({ grave: 1, texto: 'Menos de 1/3 dos PF: muito cansado, deslocamento, esquiva e ST pela metade (não muda PV nem dano).' }); }
        if (pf <= 0) efeitos.push({ grave: 2, texto: 'PF zero ou negativo: à beira do colapso; cada PF perdido tira também 1 PV, e é preciso um teste de Vontade antes de qualquer manobra que não seja Fazer Nada.' });
      }
      return {
        pv: pv, pv_max: pvMax, pf: pf, pf_max: pfMax,
        deslocamento: desl, esquiva: esq, st: st,
        pontos: j.pontos || 0, historico: j.historico || [], diario: j.diario || [], dinheiro: typeof j.dinheiro === 'number' ? j.dinheiro : r.dinheiro_restante, notas: j.notas || '',
        efeitos: efeitos
      };
    }

    // Aplica um modelo (ponto de partida) mantendo quem o personagem é: nome, jogador, era, origem, textos e orçamento.
    function aplicarModelo(atual, modelo) {
      var m = modelo.ficha || {};
      var f = carregar(JSON.parse(JSON.stringify(m)));
      ['id_salvo', 'nome', 'jogador', 'era', 'origem', 'aparencia_fisica', 'historia', 'notas', 'orcamento', 'idioma_materno', 'idade', 'altura', 'peso_corporal', 'retrato'].forEach(function (k) {
        if (atual[k] != null && atual[k] !== '') f[k] = atual[k];
      });
      if (atual.conceito) f.conceito = atual.conceito;
      f.social = Object.assign({}, fichaNova(R).social, m.social || {});
      return f;
    }

    // Normaliza uma ficha importada (JSON de outra versão ou incompleto).
    function carregar(obj) {
      var f = fichaNova(R);
      if (!obj || typeof obj !== 'object') return f;
      Object.keys(f).forEach(function (k) {
        if (obj[k] == null) return;
        if (Array.isArray(f[k])) f[k] = Array.isArray(obj[k]) ? obj[k] : f[k];
        else if (typeof f[k] === 'object') f[k] = Object.assign({}, f[k], obj[k]);
        else f[k] = obj[k];
      });
      normalizarEquipamento(f.equipamento);
      f.versao = 1;
      return f;
    }

    return {
      fichaNova: function () { return fichaNova(R); },
      carregar: carregar,
      aplicarModelo: aplicarModelo,
      estadoEmJogo: estadoEmJogo,
      resumir: resumir,
      novoItem: novoItem,
      equipar: equipar,
      arrumarEquipamento: function (ficha) { normalizarEquipamento(ficha.equipamento); },
      // "Faca e Escudo saíram das mãos e foram para a mochila."
      avisoDeTroca: function (saiu, lugar) {
        if (!saiu.length) return '';
        var DE = { mao_d: 'da mão direita', mao_e: 'da mão esquerda', maos: 'das mãos', costas: 'das costas', cinto: 'do cinto', corpo: 'do corpo' };
        var nomes = saiu.length > 1 ? saiu.slice(0, -1).join(', ') + ' e ' + saiu[saiu.length - 1] : saiu[0];
        return nomes + (saiu.length > 1 ? ' saíram ' : ' saiu ') + (DE[lugar] || '') + (saiu.length > 1 ? ' e foram' : ' e foi') + ' para a mochila.';
      },
      lugaresPossiveis: function (id) { return lugaresPossiveis(ITEM[id]); },
      LUGARES: LUGARES,
      qualidadeDe: qualidadeDe,
      textoFicha: textoFicha,
      custoDoTraco: custoDoTraco,
      efeitosDoTraco: efeitosDoTraco,
      nomeVariante: nomeVariante,
      tracoSocial: function (id) { return TRACOS_SOCIAIS.indexOf(id) !== -1; },
      LIMITE_PECULIARIDADES: LIMITE_PECULIARIDADES
    };
  }

  root.criarCriador = criarCriador;
  if (typeof module !== 'undefined' && module.exports) module.exports = { criarCriador: criarCriador, TRACOS_SOCIAIS: TRACOS_SOCIAIS };
})(typeof window !== 'undefined' ? window : globalThis);
