import sys
from rope import rope
s='''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 512" role="img">
  <title>Funda</title>
  <defs>
    <path id="bolsa" d="M40 330 Q56 462 128 462 Q200 462 216 330 Q190 414 128 416 Q66 414 40 330 Z"/>
    <clipPath id="c-bolsa"><use xlink:href="#bolsa"/></clipPath>
  </defs>
  <g transform="translate(0 6)" stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- cordas -->
'''
s+=rope('M108 84 Q96 210 42 332',w=11,dark=20)
s+=rope('M152 96 Q164 210 214 332',w=11,dark=20)
s+='    <!-- alça para o dedo e nó -->\n'
s+=rope('M108 84 Q82 80 84 62 Q88 42 108 44 Q128 46 126 66 Q124 80 108 84',w=10,dark=19)
s+=rope('M152 96 Q148 78 160 64',w=10,dark=19)
s+='    <circle cx="152" cy="96" r="12" fill="#b5a98a"/>\n'
s+='''    <!-- pedra -->
    <circle cx="128" cy="370" r="48" fill="#8f9294"/>
    <path d="M128 418 Q164 414 172 378" fill="none" stroke="#6e7173" stroke-width="8"/>
    <path d="M92 366 Q96 336 124 330" fill="none" stroke="#b2b4b3" stroke-width="8"/>
    <circle cx="128" cy="370" r="48" fill="none"/>
    <!-- bolsa de couro -->
    <use xlink:href="#bolsa" fill="#7c5a3a"/>
    <g clip-path="url(#c-bolsa)" stroke="none">
      <path d="M30 320 L56 336 Q64 420 106 446 L96 470 H30 Z" fill="#a07850"/>
      <path d="M226 320 L204 350 Q196 426 150 448 L160 470 H226 Z" fill="#573d26"/>
    </g>
    <use xlink:href="#bolsa" fill="none"/>
  </g>
</svg>
'''
open('data/svgicons/funda.svg','w').write(s)
