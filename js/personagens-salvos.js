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

    return { listar: listar, obter: obter, salvar: salvar, remover: remover };
  }

  root.criarArquivo = criarArquivo;
  if (typeof module !== 'undefined' && module.exports) module.exports = { criarArquivo: criarArquivo, CHAVE: CHAVE };
})(typeof window !== 'undefined' ? window : globalThis);
