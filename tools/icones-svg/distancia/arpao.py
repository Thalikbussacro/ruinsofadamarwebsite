import sys
from rope import rope
head='M0 -334 L28 -270 L16 -266 L50 -204 L16 -228 L17 -160 H-17 L-16 -228 L-50 -204 L-16 -266 L-28 -270 Z'
s=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img">
  <title>Arpão</title>
  <!-- Desenhado na vertical e girado 45 graus: ponta no alto à direita. -->
  <g transform="translate(258 222) scale(0.8) translate(-26 30) rotate(45)" stroke="#0a0806" stroke-width="7.5" stroke-linejoin="round" stroke-linecap="round">
    <!-- haste -->
    <rect x="-15" y="-160" width="30" height="420" rx="11" fill="#7a5a3a"/>
    <path d="M-6 -130 V246" fill="none" stroke="#9a7448" stroke-width="7"/>
    <path d="M8 -130 V246" fill="none" stroke="#55391f" stroke-width="5"/>
    <!-- ponta farpada -->
    <path d="{head}" fill="#8a8579"/>
    <path d="M0 -334 L-28 -270 L-16 -266 L-50 -204 L-16 -228 L-17 -160 H-4 V-306 Z" fill="#b5ae9c" stroke="none"/>
    <path d="M6 -300 L16 -266 L50 -204 L16 -228 L17 -160 H7 Z" fill="#5f5b52" stroke="none"/>
    <path d="{head}" fill="none"/>
    <!-- corda amarrada no alvado -->
'''
s+=rope('M18 -176 C100 -110 40 20 96 90 C130 130 150 190 110 204 C70 216 56 160 96 150 C132 142 150 200 122 236',w=13,dark=24)
s+='''    <rect x="-21" y="-190" width="42" height="36" rx="8" fill="#b5a98a"/>
    <path d="M-21 -178 H21 M-21 -166 H21" fill="none" stroke-width="4"/>
    <path d="M-13 -186 V-160" fill="none" stroke="#d8cdb0" stroke-width="4"/>
  </g>
</svg>
'''
open('data/svgicons/arpao.svg','w').write(s)
