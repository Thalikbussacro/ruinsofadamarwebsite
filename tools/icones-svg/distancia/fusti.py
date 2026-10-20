import sys
from rope import rope
s='''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" role="img">
  <title>Fustíbalo</title>
  <defs>
    <path id="bolsa" d="M350 300 Q362 398 400 398 Q438 398 450 300 Q432 360 400 362 Q368 360 350 300 Z"/>
    <clipPath id="c-bolsa"><use xlink:href="#bolsa"/></clipPath>
  </defs>
  <g transform="translate(245 256) scale(1.06) translate(-256 -264)" stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- bastão (desenhado na vertical e girado) -->
    <g transform="translate(232 272) rotate(40.5)">
      <rect x="-16" y="-224" width="32" height="448" rx="12" fill="#7a5a3a"/>
      <path d="M-7 -200 V120" fill="none" stroke="#9a7448" stroke-width="7"/>
      <path d="M9 -200 V120" fill="none" stroke="#55391f" stroke-width="5"/>
      <!-- empunhadura -->
      <rect x="-19" y="120" width="38" height="96" rx="9" fill="#6b2a24"/>
      <path d="M-10 130 V206" fill="none" stroke="#8a3a32" stroke-width="7"/>
      <path d="M-19 150 L19 138 M-19 176 L19 164 M-19 202 L19 190" fill="none" stroke-width="4.5"/>
      <!-- ponteira com gancho -->
      <path d="M4 -222 Q6 -256 30 -262" fill="none" stroke-width="20"/>
      <path d="M4 -222 Q6 -256 30 -262" fill="none" stroke="#8a8579" stroke-width="9"/>
      <rect x="-19" y="-232" width="38" height="44" rx="7" fill="#8a8579"/>
      <path d="M-9 -224 V-196" fill="none" stroke="#b5ae9c" stroke-width="6"/>
    </g>
    <!-- cordas -->
'''
s+=rope('M352 128 Q344 220 352 302',w=10,dark=19)
s+=rope('M412 92 Q446 200 448 302',w=10,dark=19)
s+='''    <!-- pedra e bolsa -->
    <circle cx="400" cy="320" r="38" fill="#8f9294"/>
    <path d="M400 358 Q430 354 436 326" fill="none" stroke="#6e7173" stroke-width="7"/>
    <path d="M370 316 Q374 292 396 286" fill="none" stroke="#b2b4b3" stroke-width="7"/>
    <circle cx="400" cy="320" r="38" fill="none"/>
    <use xlink:href="#bolsa" fill="#7c5a3a"/>
    <g clip-path="url(#c-bolsa)" stroke="none">
      <path d="M340 290 L364 316 Q372 380 392 392 L386 410 H340 Z" fill="#a07850"/>
      <path d="M460 290 L436 330 Q428 384 414 396 L420 410 H460 Z" fill="#573d26"/>
    </g>
    <use xlink:href="#bolsa" fill="none"/>
  </g>
</svg>
'''
open('data/svgicons/fustibalo.svg','w').write(s)
