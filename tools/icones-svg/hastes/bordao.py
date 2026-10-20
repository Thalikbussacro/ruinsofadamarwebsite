from pole import *
body=f'''{haft(-292,292,34)}
    <!-- ponteiras de ferro -->
    <path d="M-19 -312 Q0 -322 19 -312 V-262 H-19 Z" fill="#8a8579"/>
    <path d="M-10 -306 V-270" fill="none" stroke="#b5ae9c" stroke-width="6"/>
    <path d="M-19 -276 H19" fill="none" stroke-width="4"/>
    <path d="M-19 262 H19 V312 Q0 322 -19 312 Z" fill="#8a8579"/>
    <path d="M-10 270 V306" fill="none" stroke="#b5ae9c" stroke-width="6"/>
    <path d="M-19 276 H19" fill="none" stroke-width="4"/>'''
svg('bordao-bastao','Bordão',body,'translate(256 256) scale(0.88) rotate(45)')
