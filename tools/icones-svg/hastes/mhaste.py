from pole import *
axe='M-16 -270 Q-50 -284 -84 -326 Q-134 -236 -98 -132 Q-62 -184 -16 -200 Z'
body=f'''<defs><clipPath id="c-lamina"><path d="{axe}"/></clipPath></defs>
    {haft(-284,250)}
    {grip(30,96)}
    {grip(170,236)}
    {butt(242,262)}
    <!-- lâmina grande em meia-lua -->
    <path d="{axe}" fill="#8a8579"/>
    <g clip-path="url(#c-lamina)" stroke="none">
      <path d="M-140 -340 L-84 -340 Q-118 -236 -84 -120 L-140 -120 Z" fill="#b5ae9c"/>
      <path d="M-140 -170 Q-70 -196 -10 -214 V-150 H-140 Z" fill="#5f5b52"/>
    </g>
    <path d="{axe}" fill="none"/>
    <path d="M-72 -300 Q-104 -236 -82 -164" fill="none" stroke="#5f5b52" stroke-width="4"/>
    <!-- talão -->
    <rect x="10" y="-262" width="26" height="46" rx="6" fill="#5f5b52"/>
    <!-- alvado e lingüetas -->
    <rect x="-18" y="-290" width="36" height="100" rx="8" fill="#8a8579"/>
    <path d="M-9 -280 V-200" fill="none" stroke="#b5ae9c" stroke-width="6"/>
    <path d="M10 -280 V-200" fill="none" stroke="#5f5b52" stroke-width="5"/>
    <rect x="-16" y="-192" width="32" height="70" rx="6" fill="#8a8579"/>
    <path d="M-8 -182 V-132" fill="none" stroke="#b5ae9c" stroke-width="5"/>'''
svg('machado-de-haste','Machado de haste',body,'translate(245 300) scale(0.88) rotate(45)')
