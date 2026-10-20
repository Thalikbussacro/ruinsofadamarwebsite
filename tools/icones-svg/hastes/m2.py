from flail import *
# Mangual de duas mãos: fora da grade 2x3, na diagonal como as outras armas de duas mãos,
# para o cabo longo separá-lo da maça-estrela (me.py).
cx,cy,r=404,292,46
s=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img">
  <title>Mangual de duas mãos</title>
  <defs><clipPath id="c-bola"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs>
  <g transform="translate(0 -40)" stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- cabo longo: desenhado em pé e girado 45° (a luz local da esquerda vira cima-esquerda) -->
    <g transform="translate(200 300) rotate(45)">
      <rect x="-15" y="-196" width="30" height="400" rx="10" fill="#7a5a3a"/>
      <path d="M-7 -160 V30" fill="none" stroke="#9a7448" stroke-width="6"/>
      <path d="M8 -160 V30" fill="none" stroke="#55391f" stroke-width="4"/>
      <rect x="-19" y="30" width="38" height="56" rx="7" fill="#6b2a24"/>
      <path d="M-19 52 L19 42 M-19 76 L19 66" fill="none" stroke-width="4"/>
      <rect x="-19" y="112" width="38" height="84" rx="8" fill="#6b2a24"/>
      <path d="M-10 120 V188" fill="none" stroke="#8a3a32" stroke-width="6"/>
      <path d="M-19 134 L19 124 M-19 158 L19 148 M-19 182 L19 172" fill="none" stroke-width="4"/>
      <path d="M-21 194 H21 L16 214 Q0 222 -16 214 Z" fill="#8a8579"/>
      <!-- ponteira -->
      <rect x="-21" y="-214" width="42" height="40" rx="7" fill="#8a8579"/>
      <path d="M-12 -206 V-182" fill="none" stroke="#b5ae9c" stroke-width="5"/>
    </g>
    <!-- corrente -->
    {chain((352,150),(404,160),(cx,cy-r-8),5,28,15)}
    <!-- cravos -->
    {spikes(cx,cy,r,12,22,10,-90)}
    <!-- bola -->
    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#8a8579"/>
    <g clip-path="url(#c-bola)" stroke="none">
      <circle cx="{cx}" cy="{cy}" r="{r}" fill="#5f5b52"/>
      <circle cx="{cx-7}" cy="{cy-7}" r="{r-4}" fill="#8a8579"/>
      <circle cx="{cx-18}" cy="{cy-18}" r="{r-24}" fill="#b5ae9c"/>
    </g>
    <circle cx="{cx}" cy="{cy}" r="{r}" fill="none"/>
    <path d="M{cx-r} {cy} Q{cx} {cy+18} {cx+r} {cy}" fill="none" stroke-width="5"/>
  </g>
</svg>
'''
open('data/svgicons/mangual-duas-maos.svg','w').write(s)
