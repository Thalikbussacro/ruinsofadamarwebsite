from pole import *
head='''<path d="M0 -306 L23 -232 L12 -196 H-12 L-23 -232 Z" fill="#8a8579"/>
    <path d="M0 -302 L-21 -232 L-11 -199 H0 Z" fill="#b5ae9c" stroke="none"/>
    <path d="M0 -302 L21 -232 L11 -199 H4 Z" fill="#5f5b52" stroke="none"/>
    <path d="M0 -306 L23 -232 L12 -196 H-12 L-23 -232 Z" fill="none"/>
    <path d="M0 -290 V-204" fill="none" stroke-width="4"/>'''
sock='''<path d="M-11 -200 H11 L13 -170 H-13 Z" fill="#8a8579"/>
    <rect x="-14" y="-172" width="28" height="96" rx="5" fill="#8a8579"/>
    <path d="M-7 -164 V-84" fill="none" stroke="#b5ae9c" stroke-width="5"/>
    <path d="M-15 -176 H15" fill="none" stroke-width="4"/>'''
body=f'''{haft(-180,296,22)}
    {grip(70,130,28)}
    {grip(200,260,28)}
    <path d="M-10 288 H10 L4 308 H-4 Z" fill="#8a8579"/>
    {sock}
    {head}'''
svg('lanca-longa','Lança longa',body,'translate(258 254) scale(0.96) rotate(45)')
