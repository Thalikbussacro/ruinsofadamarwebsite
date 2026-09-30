// js/personagens-salvos.js — personagens guardados no navegador (localStorage), um registro por ficha.
// criarArquivo(storage) recebe o localStorage (ou um substituto nos testes).
(function (root) {
  var CHAVE = 'adamar-personagens';

  function criarArquivo(storage) {
    function ler() {
      try {
        var lista = JSON.parse(storage.getItem(CHAVE) || '[]');
        return Array.isArray(lista) ? lista : [];
      } catch (e) { return []; }
    }
    function gravar(lista) {
      try { storage.setItem(CHAVE, JSON.stringify(lista)); return true; } catch (e) { return false; }
    }
    function novoId() {
      return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    // Lista resumida, mais recente primeiro.
    function listar() {
      return ler().map(function (r) {
        return { id: r.id, nome: r.ficha.nome || 'Sem nome', conceito: r.ficha.conceito || '', atualizado: r.atualizado };
      }).sort(function (a, b) { return b.atualizado - a.atualizado; });
    }

    function obter(id) {
      var r = ler().filter(function (x) { return x.id === id; })[0];
      return r ? r.ficha : null;
    }

    // Salva a ficha; se ela já tem id_salvo e ele existe, substitui. Devolve o id, ou null se não deu para gravar.
    function salvar(ficha, agora) {
      var lista = ler();
      var copia = JSON.parse(JSON.stringify(ficha));
      var i = copia.id_salvo ? lista.map(function (x) { return x.id; }).indexOf(copia.id_salvo) : -1;
      if (i === -1) copia.id_salvo = novoId();
      var reg = { id: copia.id_salvo, atualizado: agora || Date.now(), ficha: copia };
      if (i === -1) lista.push(reg); else lista[i] = reg;
      return gravar(lista) ? copia.id_salvo : null;
    }

    function remover(id) {
      return gravar(ler().filter(function (x) { return x.id !== id; }));
    }

    // Cópia de segurança: todos os personagens num arquivo só.
    function exportar(agora) {
      return { tipo: 'adamar-cofre', versao: 1, gerado: agora || Date.now(), personagens: ler() };
    }
    // Restaura uma cópia: personagem novo entra; o que já existe fica com a versão mais recente.
    // Devolve { novos, atualizados, mantidos } ou null se o arquivo não é uma cópia do cofre ou não coube.
    function importar(copia) {
      if (!copia || copia.tipo !== 'adamar-cofre' || !Array.isArray(copia.personagens)) return null;
      var lista = ler();
      var conta = { novos: 0, atualizados: 0, mantidos: 0 };
      copia.personagens.forEach(function (reg) {
        if (!reg || !reg.id || !reg.ficha || typeof reg.ficha !== 'object') return;
        reg.ficha.id_salvo = reg.id;
        var i = lista.map(function (x) { return x.id; }).indexOf(reg.id);
        if (i === -1) { lista.push(reg); conta.novos++; }
        else if ((reg.atualizado || 0) > (lista[i].atualizado || 0)) { lista[i] = reg; conta.atualizados++; }
        else conta.mantidos++;
      });
      return gravar(lista) ? conta : null;
    }
    // Quanto o cofre ocupa (em caracteres; os navegadores guardam por volta de 5 milhões por site).
    function espaco() {
      try { return (storage.getItem(CHAVE) || '').length; } catch (e) { return 0; }
    }

    return { listar: listar, obter: obter, salvar: salvar, remover: remover, exportar: exportar, importar: importar, espaco: espaco };
  }

  root.criarArquivo = criarArquivo;
  if (typeof module !== 'undefined' && module.exports) module.exports = { criarArquivo: criarArquivo, CHAVE: CHAVE };
})(typeof window !== 'undefined' ? window : globalThis);
