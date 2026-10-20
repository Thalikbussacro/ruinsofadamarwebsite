import sys
from chain import *
segs=[((128,92),(250,96),(262,186),(166,222)),((166,222),(56,262),(110,330),(214,338))]
step=34; w=11
lk=links(segs,step,w)
ch='\n      '.join(svg(lk,step,w))
out=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 341 512" role="img">
  <title>Kusari</title>
  <g transform="translate(8 -8)" stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- peso menor da outra ponta -->
    <g transform="rotate(-20 98 86)">
      <rect x="62" y="66" width="62" height="38" rx="12" fill="#8a8579"/>
      <path d="M72 77 H104" fill="none" stroke="#b5ae9c" stroke-width="5"/>
      <path d="M80 95 H116" fill="none" stroke="#5f5b52" stroke-width="5"/>
    </g>
    <!-- corrente (traço duplo por elo) -->
    <g fill="none">
      {ch}
    </g>
    <!-- argola e peso principal -->
    <ellipse cx="234" cy="344" rx="14" ry="12" fill="none" stroke-width="16"/>
    <ellipse cx="234" cy="344" rx="14" ry="12" fill="none" stroke="#8a8579" stroke-width="7"/>
    <path d="M216 360 H252 L266 376 V452 L252 468 H216 L202 452 V376 Z" fill="#8a8579"/>
    <path d="M216 360 H226 V468 H216 L202 452 V376 Z" fill="#b5ae9c" stroke="none"/>
    <path d="M244 360 H252 L266 376 V452 L252 468 H244 Z" fill="#5f5b52" stroke="none"/>
    <path d="M216 360 H252 L266 376 V452 L252 468 H216 L202 452 V376 Z" fill="none"/>
    <path d="M226 362 V466 M244 362 V466" fill="none" stroke-width="3.5"/>
  </g>
</svg>
'''
open('data/svgicons/kusari.svg','w').write(out)
