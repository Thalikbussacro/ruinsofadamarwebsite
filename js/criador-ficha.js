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
      equipamento: [],   // { id, quantidade }
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

    function custoIdiomas(ficha) {
      return ficha.idiomas.reduce(function (s, i) { return s + calc.custoIdioma(i.fala, i.escrita); }, 0);
    }

    function resumir(ficha) {
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
      var restante = ficha.orcamento - total;
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
        var preco = it && it.preco ? it.preco.valor * (sel.quantidade || 1) : null;
        if (preco != null) gasto += preco;
        return { sel: sel, item: it, preco: preco };
      });
      gasto = Math.round(gasto * 100) / 100;
      if (gasto > base.recursos) {
        erro('equipamento', 'O equipamento custa ' + gasto.toLocaleString('pt-BR') + ' coroas, mais que o dinheiro inicial (' + base.recursos.toLocaleString('pt-BR') + ').');
      }

      return {
        valores: valores,
        custos: custos,
        total: total,
        restante: restante,
        pontos_devolvidos: devolvidos,
        pontos_gastos: total + devolvidos,
        desvantagens: desvantagens,
        limite: limite,
        peculiaridades: -peculiaridades,
        recursos: base.recursos,
        gasto_equipamento: gasto,
        dinheiro_restante: Math.round((base.recursos - gasto) * 100) / 100,
        equipamento: equipamento,
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
      L.push('');
      L.push('Pontos: começou com ' + ficha.orcamento + ', gastou ' + r.pontos_gastos + ', recebeu ' + r.pontos_devolvidos + ' de desvantagens · ' +
        (r.restante >= 0 ? 'guardados ' + r.restante : 'saldo negativo ' + r.restante));
      L.push('ST ' + v.st + ' · DX ' + v.dx + ' · IQ ' + v.iq + ' · HT ' + v.ht);
      L.push('PV ' + v.pv + ' · Vontade ' + v.vontade + ' · Per ' + v.per + ' · PF ' + v.pf + ' · Velocidade ' + num(v.velocidade) + ' · Deslocamento ' + v.deslocamento + ' · Esquiva ' + r.esquiva);
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

    // Aplica um modelo (ponto de partida) mantendo quem o personagem é: nome, jogador, era, origem, textos e orçamento.
    function aplicarModelo(atual, modelo) {
      var m = modelo.ficha || {};
      var f = carregar(JSON.parse(JSON.stringify(m)));
      ['id_salvo', 'nome', 'jogador', 'era', 'origem', 'aparencia_fisica', 'historia', 'notas', 'orcamento', 'idioma_materno'].forEach(function (k) {
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
      f.versao = 1;
      return f;
    }

    return {
      fichaNova: function () { return fichaNova(R); },
      carregar: carregar,
      aplicarModelo: aplicarModelo,
      resumir: resumir,
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
