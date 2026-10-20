from pole import *
blade='M-16 -126 C-14 -206 -18 -262 -34 -312 C24 -280 44 -228 22 -126 Z'
DW={'l':'#7a5a3a','m':'#5a3f26','d':'#3e2915'}
body=f'''<defs><clipPath id="c-lamina"><path d="{blade}"/></clipPath></defs>
    {haft(-110,296,26,DW)}
    <rect x="-16" y="236" width="32" height="64" rx="7" fill="#8a8579"/>
    <path d="M-8 246 V290" fill="none" stroke="#b5ae9c" stroke-width="6"/>
    <!-- lâmina curva -->
    <path d="{blade}" fill="#8a8579"/>
    <g clip-path="url(#c-lamina)" stroke="none">
      <path d="M-24 -126 C-22 -206 -26 -262 -42 -320 L-24 -320 C-8 -262 -2 -206 -2 -126 Z" fill="#b5ae9c"/>
      <path d="M-34 -312 C24 -280 44 -228 22 -126 L10 -126 C30 -228 14 -270 -34 -306 Z" fill="#5f5b52"/>
    </g>
    <path d="{blade}" fill="none"/>
    <path d="M0 -140 C2 -210 -4 -258 -24 -296" fill="none" stroke="#5f5b52" stroke-width="4"/>
    <!-- colar metálico -->
    <rect x="-17" y="-110" width="34" height="58" rx="6" fill="#8a8579"/>
    <path d="M-9 -100 V-62" fill="none" stroke="#b5ae9c" stroke-width="6"/>
    <!-- tsuba -->
    <rect x="-38" y="-130" width="76" height="20" rx="9" fill="#5f5b52"/>
    <path d="M-28 -124 H-4" fill="none" stroke="#8a8579" stroke-width="5"/>'''
svg('naginata-armas-de-haste','Naginata',body,'translate(264 266) scale(0.93) rotate(45)')
