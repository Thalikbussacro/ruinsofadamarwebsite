import assert from 'node:assert/strict';
import { hashDe, versionarHtml } from './versionar.mjs';

const hashes = { 'css/style.css': 'aaaa1111', 'js/site.js': 'bbbb2222' };
const ler = (a) => hashes[a] || null;

// acrescenta a versão, respeitando o "../" das subpastas
assert.equal(versionarHtml('<link href="../css/style.css">', ler), '<link href="../css/style.css?v=aaaa1111">');
assert.equal(versionarHtml('<script src="js/site.js" defer>', ler), '<script src="js/site.js?v=bbbb2222" defer>');
// troca uma versão velha
assert.equal(versionarHtml('<script src="js/site.js?v=0000">', ler), '<script src="js/site.js?v=bbbb2222">');
// não mexe em arquivo desconhecido nem em link externo
assert.equal(versionarHtml('<script src="js/outro.js">', ler), '<script src="js/outro.js">');
assert.equal(versionarHtml('<script src="https://assets.pinterest.com/js/pinit.js">', ler), '<script src="https://assets.pinterest.com/js/pinit.js">');
// hash estável e curto
assert.equal(hashDe('x'), hashDe('x'));
assert.equal(hashDe('x').length, 8);
console.log('versionar ok');
