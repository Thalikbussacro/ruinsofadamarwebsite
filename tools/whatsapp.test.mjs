// tools/whatsapp.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { buildWhatsAppUrl } = require('../js/whatsapp.js');
assert.equal(buildWhatsAppUrl('', 'Oi'), 'https://wa.me/?text=Oi');
assert.equal(buildWhatsAppUrl('+55 (49) 99999-0000', 'Quero jogar'), 'https://wa.me/5549999990000?text=Quero%20jogar');
assert.equal(buildWhatsAppUrl(undefined, ''), 'https://wa.me/');
console.log('whatsapp ok');
