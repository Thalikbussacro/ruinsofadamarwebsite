from flail import *
cx,cy,r=150,138,58
s=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 341 512" role="img">
  <title>Maça-estrela</title>
  <defs><clipPath id="c-bola"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs>
  <g transform="translate(10 -8)" stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- corrente -->
    {chain((214,296),(222,236),(cx+28,cy+48),5)}
    <!-- cabo -->
    <rect x="198" y="308" width="32" height="150" rx="9" fill="#7a5a3a"/>
    <path d="M206 320 V450" fill="none" stroke="#9a7448" stroke-width="6"/>
    <rect x="194" y="362" width="40" height="92" rx="8" fill="#6b2a24"/>
    <path d="M203 370 V446" fill="none" stroke="#8a3a32" stroke-width="6"/>
    <path d="M194 386 L234 376 M194 410 L234 400 M194 434 L234 424" fill="none" stroke-width="4"/>
    <path d="M192 452 H236 L230 474 Q214 482 198 474 Z" fill="#8a8579"/>
    <!-- ponteira com argola -->
    <path d="M214 304 Q214 284 214 284" fill="none"/>
    <rect x="194" y="296" width="40" height="30" rx="7" fill="#8a8579"/>
    <path d="M202 304 H222" fill="none" stroke="#b5ae9c" stroke-width="5"/>
    <!-- cravos -->
    {spikes(cx,cy,r,10,32,13,-90)}
    <!-- bola -->
    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#8a8579"/>
    <g clip-path="url(#c-bola)" stroke="none">
      <circle cx="{cx}" cy="{cy}" r="{r}" fill="#5f5b52"/>
      <circle cx="{cx-9}" cy="{cy-9}" r="{r-5}" fill="#8a8579"/>
      <circle cx="{cx-22}" cy="{cy-22}" r="{r-28}" fill="#b5ae9c"/>
    </g>
    <circle cx="{cx}" cy="{cy}" r="{r}" fill="none"/>
  </g>
</svg>
'''
open('data/svgicons/maca-estrela.svg','w').write(s)
