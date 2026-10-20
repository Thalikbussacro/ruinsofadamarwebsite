from flail import *
cx,cy,r=124,128,60
s=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 341 512" role="img">
  <title>Mangual</title>
  <defs><clipPath id="c-bola"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs>
  <g transform="translate(170 256) scale(0.92) translate(-147 -263)" stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- corrente -->
    {chain((236,208),(250,150),(cx+44,cy+30),5,30,16)}
    <!-- cabo longo -->
    <rect x="220" y="218" width="32" height="250" rx="10" fill="#7a5a3a"/>
    <path d="M228 236 V458" fill="none" stroke="#9a7448" stroke-width="6"/>
    <path d="M244 236 V458" fill="none" stroke="#55391f" stroke-width="4"/>
    <rect x="216" y="290" width="40" height="52" rx="7" fill="#6b2a24"/>
    <path d="M216 310 L256 300 M216 332 L256 322" fill="none" stroke-width="4"/>
    <rect x="216" y="384" width="40" height="80" rx="8" fill="#6b2a24"/>
    <path d="M225 392 V456" fill="none" stroke="#8a3a32" stroke-width="6"/>
    <path d="M216 404 L256 394 M216 428 L256 418 M216 452 L256 442" fill="none" stroke-width="4"/>
    <path d="M214 462 H258 L252 482 Q236 490 220 482 Z" fill="#8a8579"/>
    <!-- ponteira -->
    <rect x="214" y="206" width="44" height="36" rx="7" fill="#8a8579"/>
    <path d="M222 214 H244" fill="none" stroke="#b5ae9c" stroke-width="5"/>
    <!-- cravos -->
    {spikes(cx,cy,r,12,28,12,-90)}
    <!-- bola -->
    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#8a8579"/>
    <g clip-path="url(#c-bola)" stroke="none">
      <circle cx="{cx}" cy="{cy}" r="{r}" fill="#5f5b52"/>
      <circle cx="{cx-9}" cy="{cy-9}" r="{r-5}" fill="#8a8579"/>
      <circle cx="{cx-23}" cy="{cy-23}" r="{r-30}" fill="#b5ae9c"/>
    </g>
    <circle cx="{cx}" cy="{cy}" r="{r}" fill="none"/>
    <!-- aro de reforço -->
    <path d="M{cx-r} {cy} Q{cx} {cy+22} {cx+r} {cy}" fill="none" stroke-width="5"/>
  </g>
</svg>
'''
open('data/svgicons/mangual-duas-maos.svg','w').write(s)
