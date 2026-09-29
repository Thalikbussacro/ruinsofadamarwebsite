import assert from 'node:assert/strict';
import { miolo, urlTabler } from './icones.mjs';

const svg = `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  class="icon"
>
  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M20 4v5l-9 7" />
  <path d="M6.5 11.5l6 6" />
</svg>`;
assert.equal(miolo(svg), '<path d="M20 4v5l-9 7"/><path d="M6.5 11.5l6 6"/>');
assert.throws(() => miolo('nada'));
assert.match(urlTabler('sword'), /@tabler\/icons@[\d.]+\/icons\/outline\/sword\.svg$/);
console.log('icones ok');
