from pole import *
blade='M-16 -108 V-250 Q-12 -296 14 -318 Q56 -256 52 -186 Q48 -132 16 -108 Z'
body=f'''<defs><clipPath id="c-lamina"><path d="{blade}"/></clipPath></defs>
    {haft(-110,296)}
    {grip(150,240)}
    {butt(286,306)}
    <!-- esporão traseiro -->
    <path d="M-14 -200 Q-36 -206 -54 -232 Q-50 -196 -14 -166 Z" fill="#8a8579"/>
    <path d="M-16 -198 Q-36 -206 -50 -224 Q-44 -204 -24 -192 Z" fill="#b5ae9c" stroke="none"/>
    <path d="M-14 -200 Q-36 -206 -54 -232 Q-50 -196 -14 -166 Z" fill="none"/>
    <!-- lâmina larga de um gume -->
    <path d="{blade}" fill="#8a8579"/>
    <g clip-path="url(#c-lamina)" stroke="none">
      <rect x="-20" y="-330" width="22" height="230" fill="#b5ae9c"/>
      <path d="M14 -318 Q56 -256 52 -186 Q48 -132 16 -108 L4 -122 Q36 -140 38 -188 Q40 -250 6 -306 Z" fill="#5f5b52" transform="translate(0 0)"/>
    </g>
    <path d="{blade}" fill="none"/>
    <path d="M0 -270 Q4 -200 2 -124" fill="none" stroke="#5f5b52" stroke-width="4"/>
    <!-- alvado -->
    <rect x="-19" y="-116" width="38" height="70" rx="7" fill="#8a8579"/>
    <path d="M-10 -106 V-56" fill="none" stroke="#b5ae9c" stroke-width="6"/>
    <path d="M-19 -100 H19" fill="none" stroke-width="4"/>'''
svg('glaive','Glaive',body,'translate(252 252) scale(0.93) rotate(45)')
