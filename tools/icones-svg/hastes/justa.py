from pole import *
# lança de justa: haste grossa afunilada, vamplate cônico, ponta rombuda (coronel não; ponta simples)
shaft='''<path d="M-9 -290 Q-12 -200 -22 -60 H22 Q12 -200 9 -290 Z" fill="#7a5a3a"/>
    <path d="M-4 -280 Q-7 -200 -14 -70" fill="none" stroke="#9a7448" stroke-width="6"/>
    <path d="M6 -280 Q8 -200 14 -70" fill="none" stroke="#55391f" stroke-width="4"/>'''
tip='''<path d="M-10 -292 L0 -312 L10 -292 L9 -270 H-9 Z" fill="#8a8579"/>
    <path d="M-5 -292 L0 -304 M-5 -288 V-276" fill="none" stroke="#b5ae9c" stroke-width="4"/>'''
vamp='''<path d="M-22 -64 L-62 6 Q0 26 62 6 L22 -64 Z" fill="#8a8579"/>
    <path d="M-22 -62 L-62 6 Q-40 14 -30 16 L-8 -62 Z" fill="#b5ae9c" stroke="none"/>
    <path d="M14 -62 L44 14 Q56 10 62 6 L22 -64 Z" fill="#5f5b52" stroke="none"/>
    <path d="M-22 -64 L-62 6 Q0 26 62 6 L22 -64 Z" fill="none"/>
    <path d="M-62 6 Q0 -10 62 6" fill="none" stroke-width="4"/>'''
body=f'''{haft(0,300,28)}
    {grip(40,140,34)}
    <path d="M-20 140 Q-24 200 -16 290 H16 Q24 200 20 140 Z" fill="#7a5a3a"/>
    <path d="M-10 150 Q-14 200 -8 280" fill="none" stroke="#9a7448" stroke-width="6"/>
    {butt(286,306,30)}
    {shaft}
    {tip}
    {vamp}'''
svg('lanca-de-justa','Lança de justa',body,'translate(258 254) scale(0.96) rotate(45)')
