// js/whatsapp.js
(function (root) {
  function buildWhatsAppUrl(numero, mensagem) {
    var digits = String(numero || '').replace(/\D/g, '');
    var url = 'https://wa.me/' + digits;
    return mensagem ? url + '?text=' + encodeURIComponent(mensagem) : url;
  }
  root.buildWhatsAppUrl = buildWhatsAppUrl;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildWhatsAppUrl: buildWhatsAppUrl };
})(typeof window !== 'undefined' ? window : globalThis);
