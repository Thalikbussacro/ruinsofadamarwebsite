from pole import *
head='''<path d="M0 -300 Q36 -238 30 -196 Q26 -170 13 -160 H-13 Q-26 -170 -30 -196 Q-36 -238 0 -300 Z" fill="#8a8579"/>
    <path d="M0 -296 Q-34 -238 -28 -196 Q-24 -172 -12 -162 H0 Z" fill="#b5ae9c" stroke="none"/>
    <path d="M0 -296 Q32 -238 28 -196 Q24 -172 12 -162 H6 Z" fill="#5f5b52" stroke="none"/>
    <path d="M0 -300 Q36 -238 30 -196 Q26 -170 13 -160 H-13 Q-26 -170 -30 -196 Q-36 -238 0 -300 Z" fill="none"/>
    <path d="M0 -280 V-168" fill="none" stroke-width="4"/>'''
sock='''<path d="M-13 -164 H13 L16 -100 H-16 Z" fill="#8a8579"/>
    <path d="M-7 -156 L-9 -108" fill="none" stroke="#b5ae9c" stroke-width="6"/>
    <path d="M-16 -118 H16" fill="none" stroke-width="4"/>'''
body=f'''{haft(-110,292)}
    {grip(20,120)}
    {butt(284,306)}
    {sock}
    {head}'''
svg('lanca','Lança',body,'translate(262 250) scale(0.96) rotate(45)')
