from pole import *
axe='M-14 -210 L-58 -216 Q-80 -222 -94 -244 Q-110 -176 -88 -112 Q-70 -132 -56 -138 L-14 -144 Z'
body=f'''<defs><clipPath id="c-lamina"><path d="{axe}"/></clipPath></defs>
    {haft(-200,296)}
    {grip(150,240)}
    {butt(286,306)}
    <!-- lingüetas -->
    <rect x="-17" y="-150" width="34" height="96" rx="6" fill="#8a8579"/>
    <path d="M-9 -140 V-64" fill="none" stroke="#b5ae9c" stroke-width="6"/>
    <!-- espigão (ponta de lança) -->
    <path d="M-13 -200 L0 -326 L13 -200 Z" fill="#8a8579"/>
    <path d="M-11 -202 L0 -318 V-202 Z" fill="#b5ae9c" stroke="none"/>
    <path d="M-13 -200 L0 -326 L13 -200 Z" fill="none"/>
    <!-- gancho traseiro -->
    <path d="M12 -204 L44 -200 Q74 -190 92 -150 Q62 -170 12 -168 Z" fill="#5f5b52"/>
    <path d="M12 -204 L44 -200 Q74 -190 92 -150 Q64 -184 12 -190 Z" fill="#8a8579" stroke="none"/>
    <path d="M12 -204 L44 -200 Q74 -190 92 -150 Q62 -170 12 -168 Z" fill="none"/>
    <!-- lâmina de machado -->
    <path d="{axe}" fill="#8a8579"/>
    <g clip-path="url(#c-lamina)" stroke="none">
      <path d="M-120 -260 L-80 -250 Q-96 -180 -70 -110 L-110 -100 Z" fill="#b5ae9c"/>
      <path d="M-120 -150 L-56 -152 L-10 -160 V-130 H-120 Z" fill="#5f5b52"/>
    </g>
    <path d="{axe}" fill="none"/>
    <path d="M-66 -214 Q-76 -176 -62 -136" fill="none" stroke="#5f5b52" stroke-width="4"/>
    <!-- alvado -->
    <rect x="-18" y="-216" width="36" height="82" rx="7" fill="#8a8579"/>
    <path d="M-9 -206 V-144" fill="none" stroke="#b5ae9c" stroke-width="6"/>
    <path d="M10 -206 V-144" fill="none" stroke="#5f5b52" stroke-width="5"/>'''
svg('alabarda','Alabarda',body,'translate(253 262) scale(0.93) rotate(45)')
