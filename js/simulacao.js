// js/simulacao.js — motor da simulação do jogo (sistema próprio, números em data/jogo/*.json).
// Funções puras sobre o estado "sim" de um personagem: tempo, clima, necessidades, saúde por parte do corpo,
// inventário em grade, desgaste e receitas. Serve à página (window.criarSimulacao) e aos testes em Node.
(function (root) {
  function limitar(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }

  function criarSimulacao(J) {
    var S = J.saude, N = J.necessidades, M = J.mundo, RC = J.receitas;
    var DIA = 24 * 60;
    var BIOMA = {};
    M.biomas.forEach(function (b) { BIOMA[b.id] = b; });
    var PARTE = {};
    S.partes.forEach(function (p) { PARTE[p.id] = p; });

    // ---------- estado e relógio ----------
    function estadoInicial(opcoes) {
      opcoes = opcoes || {};
      return {
        minutos: (opcoes.dia_do_ano != null ? opcoes.dia_do_ano : 60) * DIA + 8 * 60, // dia 60 (primavera), 8h
        fome: 10, sede: 10, cansaco: 5, temp_corpo: N.temperatura.normal, sangue: S.sangue.maximo, molhado: 0,
        ferimentos: [], bioma: opcoes.bioma || 'floresta-temperada', abrigo: opcoes.abrigo || 'ao-ar-livre',
        clima: null, seq: 1
      };
    }
    function relogio(e) {
      var total = Math.floor(e.minutos);
      var diaAbs = Math.floor(total / DIA);
      var dia = diaAbs % N.calendario.dias_no_ano;
      var est = N.calendario.estacoes.slice().reverse().filter(function (x) { return dia >= x.inicio; })[0];
      var min = total % DIA;
      var h = Math.floor(min / 60), m = min % 60;
      return {
        dia_absoluto: diaAbs, dia_do_ano: dia, ano: Math.floor(diaAbs / N.calendario.dias_no_ano) + 1,
        hora: h, minuto: m, estacao: est.nome, indice_estacao: N.calendario.estacoes.indexOf(est),
        noite: h < 6 || h >= 19,
        texto: 'Dia ' + (dia + 1) + ' (' + est.nome.toLowerCase() + '), ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0')
      };
    }

    // ---------- clima: temperatura pela estação e pela hora; chuva e vento sorteados a cada hora ----------
    function clima(e, rng) {
      var b = BIOMA[e.bioma] || M.biomas[0];
      var r = relogio(e);
      var base = b.temperatura[r.indice_estacao];
      // mais frio às 5h, mais quente às 15h
      var curva = Math.cos(((r.hora + r.minuto / 60) - 15) / 24 * 2 * Math.PI);
      var temperatura = base + curva * b.variacao_dia / 2 + (rng() - 0.5) * 3;
      var chovendo = rng() < b.chuva[r.indice_estacao];
      var vento = limitar(b.vento + (rng() - 0.5) * 0.4, 0, 1);
      return { temperatura: Math.round(temperatura * 10) / 10, chovendo: chovendo, vento: Math.round(vento * 100) / 100 };
    }

    // ---------- roupas: pontos de isolamento do que está vestido ----------
    function materialDe(nome) {
      var n = String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      if (/malha|cota|anel/.test(n)) return 'malha';
      if (/couro|pele|gibao|jaqueta|acolchoad/.test(n)) return 'couro';
      if (/placa|escama|lamel|brigant|segment|peitoral|elmo|capacete/.test(n)) return 'placas';
      return 'tecido';
    }
    function isolamento(vestidos) {
      return vestidos.reduce(function (t, it) {
        var v = N.isolamento.por_item[it.id];
        if (v == null) v = N.isolamento.por_material[materialDe(it.nome)] || 0;
        return t + v;
      }, 0);
    }

    // ---------- avançar o tempo ----------
    // ctx: { atividade, isolamento, rng }. Devolve { estado, eventos: [{ tipo, texto }], dano_pv }.
    function avancar(e0, minutos, ctx) {
      var e = copia(e0);
      var rng = ctx.rng || Math.random;
      var a = N.atividades[ctx.atividade] || N.atividades.repouso;
      var abrigo = M.abrigo[e.abrigo] || M.abrigo['ao-ar-livre'];
      var eventos = [], dano = 0;
      var faixasAntes = condicoes(e).map(function (c) { return c.origem + ':' + c.nome; });
      var resto = minutos;
      while (resto > 0) {
        var passo = Math.min(resto, 60 - (Math.floor(e.minutos) % 60) || 60);
        var h = passo / 60;
        // clima novo a cada hora cheia
        var horaAbs = Math.floor(e.minutos / 60);
        if (!e.clima || e.clima.hora !== horaAbs) { e.clima = clima(e, rng); e.clima.hora = horaAbs; }
        // necessidades
        e.fome = limitar(e.fome + a.fome * h, 0, 100);
        e.sede = limitar(e.sede + a.sede * h, 0, 100);
        e.cansaco = limitar(e.cansaco + a.cansaco * h, 0, 100);
        // chuva molha (menos sob abrigo); sem chuva, seca
        if (e.clima.chovendo && abrigo.chuva > 0) e.molhado = limitar(e.molhado + 0.6 * h * abrigo.chuva, 0, 1);
        else e.molhado = limitar(e.molhado - (abrigo.temperatura >= 10 ? 0.6 : 0.25) * h, 0, 1);
        // temperatura do corpo segue o ambiente sentido (com vento, abrigo, roupa seca e esforço)
        var ambiente = e.clima.temperatura + abrigo.temperatura - e.clima.vento * 6 * abrigo.vento;
        var isol = (ctx.isolamento || 0) * (1 - e.molhado * N.temperatura.molhado_tira_isolamento);
        var sentido = ambiente + isol * N.temperatura.isolamento_por_ponto + a.calor_gerado;
        var alvo = limitar(N.temperatura.normal + (sentido - N.temperatura.conforto_ambiente) * 0.09, 28, 42);
        e.temp_corpo = Math.round((e.temp_corpo + (alvo - e.temp_corpo) * Math.min(1, N.temperatura.ajuste_por_hora * h * 4)) * 100) / 100;
        // ferimentos: sangram, infeccionam, curam
        var sangrando = false;
        e.ferimentos = e.ferimentos.filter(function (f) {
          var tipo = S.tipos[f.tipo];
          var grav = S.gravidades[f.gravidade - 1];
          if (f.sangrando) { e.sangue -= tipo.sangra[f.gravidade - 1] * h; sangrando = true; }
          var protegido = f.limpo || f.tratamento === 'bandagem' || f.tratamento === 'sutura';
          if (tipo.infeccao_por_hora > 0 && !protegido) f.infeccao = limitar(f.infeccao + tipo.infeccao_por_hora * h, 0, 100);
          else f.infeccao = limitar(f.infeccao - S.infeccao.cai_por_hora_tratada * h, 0, 100);
          var tratado = f.tratamento || tipo.trata.indexOf('repouso') !== -1;
          var bemCuidado = e.fome < 70 && e.sede < 70 && f.infeccao < S.infeccao.febre_a_partir;
          if (tratado && !f.sangrando) f.cura += h * (bemCuidado ? 1 : 0.3) * (ctx.atividade === 'dormindo' ? 1.5 : 1) * (f.tratamento === 'sutura' ? 1.5 : 1);
          if (f.cura >= grav.cura_horas) { eventos.push({ tipo: 'sarou', texto: PARTE[f.parte].nome + ': ' + tipo.nome.toLowerCase() + ' sarou.' }); return false; }
          if (f.infeccao >= S.infeccao.grave_a_partir) dano += 0.5 * h;
          return true;
        });
        if (!sangrando && e.fome < 70) e.sangue += S.sangue.recupera_por_hora * h;
        e.sangue = limitar(e.sangue, 0, S.sangue.maximo);
        // dano das faixas extremas (fome, sede, temperatura)
        condicoes(e).forEach(function (c) { if (c.dano_pv_por_hora) dano += c.dano_pv_por_hora * h; });
        e.minutos += passo;
        resto -= passo;
      }
      var faixasDepois = condicoes(e);
      faixasDepois.forEach(function (c) {
        if (faixasAntes.indexOf(c.origem + ':' + c.nome) === -1) eventos.push({ tipo: 'condicao', texto: c.origem + ': ' + c.nome + '.' });
      });
      return { estado: e, eventos: eventos, dano_pv: Math.round(dano * 10) / 10 };
    }

    // ---------- condições: viram modificadores nas rolagens ----------
    function faixaDe(lista, valor) {
      return lista.filter(function (f) { return f.a_partir != null ? valor >= f.a_partir : f.abaixo != null ? valor < f.abaixo : valor > f.acima; }).pop();
    }
    function condicoes(e) {
      var lista = [];
      ['fome', 'sede', 'cansaco'].forEach(function (k) {
        var f = faixaDe(N.faixas[k], e[k]);
        if (f) lista.push({ origem: { fome: 'Fome', sede: 'Sede', cansaco: 'Cansaço' }[k], nome: f.nome, valor: f.modificador, alvos: ['qualquer'], dano_pv_por_hora: f.dano_pv_por_hora || 0 });
      });
      // temperatura: a faixa mais extrema que vale
      var frios = N.temperatura.faixas.filter(function (f) { return f.abaixo != null && e.temp_corpo < f.abaixo; });
      var quentes = N.temperatura.faixas.filter(function (f) { return f.acima != null && e.temp_corpo > f.acima; });
      var ft = frios[0] || quentes[quentes.length - 1];
      if (ft) lista.push({ origem: 'Temperatura', nome: ft.nome, valor: ft.modificador, alvos: ['qualquer'], dano_pv_por_hora: ft.dano_pv_por_hora || 0 });
      var fs = S.sangue.faixas.filter(function (f) { return e.sangue < f.abaixo; }).pop();
      if (fs) lista.push({ origem: 'Sangue', nome: fs.nome, valor: fs.modificador, alvos: ['qualquer'] });
      // dor: soma dos ferimentos (tala e sutura aliviam)
      var dor = e.ferimentos.reduce(function (t, f) { return t + S.gravidades[f.gravidade - 1].dor * (f.tratamento === 'tala' || f.tratamento === 'sutura' ? 0.5 : 1); }, 0);
      var fd = S.dor.faixas.filter(function (f) { return dor >= f.a_partir; }).pop();
      if (fd) lista.push({ origem: 'Dor', nome: 'dor ' + (fd.modificador <= -4 ? 'forte' : fd.modificador <= -2 ? 'moderada' : 'leve'), valor: fd.modificador, alvos: ['qualquer'] });
      var febre = e.ferimentos.some(function (f) { return f.infeccao >= S.infeccao.febre_a_partir; });
      if (febre) lista.push({ origem: 'Infecção', nome: 'febre', valor: -2, alvos: ['qualquer'] });
      // ferimentos em braços e mãos atrapalham a destreza; em pernas e pés, o movimento e a esquiva
      var bracos = 0, pernas = 0;
      e.ferimentos.forEach(function (f) {
        var p = PARTE[f.parte];
        if (p.efeito === 'destreza') bracos = Math.max(bracos, f.gravidade);
        if (p.efeito === 'movimento' && f.tratamento !== 'tala') pernas = Math.max(pernas, f.gravidade);
      });
      if (bracos) lista.push({ origem: 'Braço ou mão ferido', nome: 'mão fraca', valor: -bracos, alvos: ['atributo:dx', 'ataque', 'defesa:aparar', 'defesa:bloqueio'] });
      if (pernas) lista.push({ origem: 'Perna ou pé ferido', nome: 'mancando (deslocamento ' + (pernas >= 3 ? 'pela metade' : '−1') + ')', valor: -pernas, alvos: ['defesa:esquiva'] });
      return lista;
    }

    // ---------- ferir e tratar ----------
    function ferir(e0, parte, tipo, gravidade) {
      var e = copia(e0);
      var t = S.tipos[tipo];
      e.ferimentos.push({
        id: 'f' + (e.seq++), parte: parte, tipo: tipo, gravidade: limitar(gravidade, 1, 3),
        sangrando: t.sangra[limitar(gravidade, 1, 3) - 1] > 0, limpo: false, tratamento: null, infeccao: 0, cura: 0, desde: e.minutos
      });
      return e;
    }
    // o que dá para fazer num ferimento (e com quais itens)
    function tratamentosPossiveis(f) {
      var tipo = S.tipos[f.tipo];
      var lista = [];
      if (!f.limpo && tipo.infeccao_por_hora > 0) lista.push('limpar');
      tipo.trata.forEach(function (t) { if (t !== 'repouso' && S.tratamentos[t] && f.tratamento !== t) lista.push(t); });
      return lista.map(function (id) { return Object.assign({ id: id }, S.tratamentos[id]); });
    }
    // aplica o tratamento (o teste de perícia e o gasto do item ficam com quem chama)
    function tratar(e0, idFerimento, tratamento, sucesso) {
      var e = copia(e0);
      var f = e.ferimentos.filter(function (x) { return x.id === idFerimento; })[0];
      if (!f) return e;
      var t = S.tratamentos[tratamento];
      if (tratamento === 'limpar') { f.limpo = true; f.infeccao = limitar(f.infeccao - 20, 0, 100); return e; }
      if (!sucesso) return e;
      f.tratamento = tratamento;
      if (t.para_sangue_ate && f.gravidade <= t.para_sangue_ate) f.sangrando = false;
      return e;
    }

    // ---------- comer e beber ----------
    function consumir(e0, dados) {
      var e = copia(e0);
      if (dados.calorias) e.fome = limitar(e.fome - dados.calorias / 20, 0, 100); // 2000 calorias ≈ fome zerada
      if (dados.agua) e.sede = limitar(e.sede - dados.agua * 25, 0, 100);
      return e;
    }

    // ---------- inventário em grade: encaixe automático (maiores primeiro, podendo girar) ----------
    // itens: [{ uid, largura, altura, quantidade, empilha }] → { posicoes: { uid: [{ x, y, largura, altura }] }, sobra: [uid] }
    function encaixar(largura, altura, itens) {
      var ocupado = [];
      for (var y = 0; y < altura; y++) { ocupado.push([]); for (var x = 0; x < largura; x++) ocupado[y].push(false); }
      function cabe(x0, y0, w, h) {
        if (x0 + w > largura || y0 + h > altura) return false;
        for (var y = y0; y < y0 + h; y++) for (var x = x0; x < x0 + w; x++) if (ocupado[y][x]) return false;
        return true;
      }
      function marca(x0, y0, w, h) { for (var y = y0; y < y0 + h; y++) for (var x = x0; x < x0 + w; x++) ocupado[y][x] = true; }
      function achar(w, h) {
        for (var y = 0; y < altura; y++) for (var x = 0; x < largura; x++) {
          if (cabe(x, y, w, h)) return { x: x, y: y, largura: w, altura: h };
          if (w !== h && cabe(x, y, h, w)) return { x: x, y: y, largura: h, altura: w };
        }
        return null;
      }
      var pecas = [];
      itens.forEach(function (it) {
        var n = it.empilha ? Math.ceil((it.quantidade || 1) / it.empilha) : (it.quantidade || 1);
        for (var k = 0; k < n; k++) pecas.push(it);
      });
      pecas.sort(function (a, b) { return b.largura * b.altura - a.largura * a.altura; });
      var posicoes = {}, sobra = [];
      pecas.forEach(function (it) {
        var p = achar(it.largura, it.altura);
        if (!p) { if (sobra.indexOf(it.uid) === -1) sobra.push(it.uid); return; }
        marca(p.x, p.y, p.largura, p.altura);
        (posicoes[it.uid] = posicoes[it.uid] || []).push(p);
      });
      return { posicoes: posicoes, sobra: sobra };
    }

    // ---------- desgaste e conserto ----------
    function desgastar(cond, qualidade, rng) {
      var c = Object.assign({ atual: 100, maximo: 100 }, cond || {});
      var chance = RC.desgaste.por_qualidade[String(qualidade || 0)];
      if (chance == null) chance = RC.desgaste.por_qualidade['0'];
      if (rng() < chance) c.atual = Math.max(0, c.atual - Math.round(RC.desgaste.perde[0] + rng() * (RC.desgaste.perde[1] - RC.desgaste.perde[0])));
      return c;
    }
    function consertar(cond, sucesso) {
      var c = Object.assign({ atual: 100, maximo: 100 }, cond || {});
      if (!sucesso) return c;
      c.maximo = Math.max(20, c.maximo - RC.conserto.maximo_cai);
      c.atual = Math.min(c.maximo, c.atual + RC.conserto.recupera);
      return c;
    }

    // ---------- receitas ----------
    // tem: { id: quantidade } do que o personagem leva; bioma: id do bioma atual
    function avaliarReceita(rec, tem, bioma) {
      var faltam = [];
      rec.ingredientes.forEach(function (i) { if ((tem[i.id] || 0) < i.quantidade) faltam.push({ tipo: 'ingrediente', id: i.id, quantidade: i.quantidade - (tem[i.id] || 0) }); });
      rec.ferramentas.forEach(function (grupo) { if (!grupo.some(function (id) { return tem[id] > 0; })) faltam.push({ tipo: 'ferramenta', ids: grupo }); });
      if (rec.requer_recurso) {
        var b = BIOMA[bioma];
        if (!b || b.recursos.indexOf(rec.requer_recurso) === -1) faltam.push({ tipo: 'recurso', id: rec.requer_recurso });
      }
      return { pode: !faltam.length, faltam: faltam };
    }
    // o que a receita gasta, conforme o resultado do teste: sucesso gasta tudo e produz; falha gasta metade; falha crítica, tudo
    function resultadoReceita(rec, teste) {
      if (!teste || teste.sucesso) return { gasta: rec.ingredientes.slice(), produz: [rec.resultado], melhor: !!(teste && teste.critico) };
      var gasta = rec.ingredientes.map(function (i) { return { id: i.id, quantidade: teste.falha_critica ? i.quantidade : Math.ceil(i.quantidade / 2) }; });
      return { gasta: gasta, produz: [], melhor: false };
    }

    return {
      estadoInicial: estadoInicial, relogio: relogio, clima: clima, isolamento: isolamento, avancar: avancar,
      condicoes: condicoes, ferir: ferir, tratar: tratar, tratamentosPossiveis: tratamentosPossiveis, consumir: consumir,
      encaixar: encaixar, desgastar: desgastar, consertar: consertar, avaliarReceita: avaliarReceita, resultadoReceita: resultadoReceita,
      PARTES: S.partes, TIPOS: S.tipos, GRAVIDADES: S.gravidades, ATIVIDADES: N.atividades, BIOMAS: M.biomas, ABRIGOS: M.abrigo,
      RECEITAS: RC.receitas
    };
  }

  root.criarSimulacao = criarSimulacao;
  if (typeof module !== 'undefined' && module.exports) module.exports = { criarSimulacao: criarSimulacao };
})(typeof window !== 'undefined' ? window : globalThis);
