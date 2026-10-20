from gen import *
IRONF=('#a29b8a','#76716a','#55514a','#45413b')  # ferro na sombra (pernas do lado oposto)
def horse(d, tail=True):
    if tail: d.add(f'<path d="{TAIL}" fill="{HORSE[1]}"/>')
    d.add(f'<path d="{FAR}" fill="{HORSE[1]}"/>')
    d.add(f'<path d="{BODY}" fill="{HORSE[0]}"/>')
    d.add(f'<circle cx="432" cy="76" r="7" fill="{K}" stroke="none"/>')
    d.add(f'<path d="M462 120 Q470 122 470 130" fill="none" stroke-width="4"/>')

PARC = "M282 136 Q306 130 326 112 Q344 94 360 82 Q384 118 404 150 Q420 192 414 232 Q410 256 398 276 Q340 286 282 276 Q272 206 282 136 Z"
PARC_HEM = "M398 276 Q340 286 282 276"
COMP = ("M112 126 Q160 112 220 122 Q290 128 324 106 Q344 90 360 82 Q384 118 404 150 Q420 192 414 232 Q410 256 398 280 "
        "Q300 294 200 288 Q140 286 102 272 Q90 222 98 172 Q102 144 112 126 Z")
COMP_HEM = "M398 280 Q300 294 200 288 Q140 286 102 272"
# placas
PEYT = "M290 130 Q308 126 326 110 Q344 94 360 82 Q384 118 404 150 Q420 192 414 232 Q410 256 398 276 Q344 286 292 276 Q282 204 290 130 Z"
FLAN = "M196 178 Q252 186 306 178 L306 288 Q252 296 196 290 Z"
CRUP = "M112 126 Q160 112 218 122 Q228 124 236 126 Q230 210 238 282 Q160 286 102 272 Q90 222 98 172 Q102 144 112 126 Z"

def parcial(mat):
    d=Doc(); horse(d)
    if mat=='couro':
        d.piece(PARC, LEA, off=14)
        d.add(f'<path d="M318 150 Q340 210 330 270 M362 128 Q384 196 368 272" fill="none" stroke="{LEA[2]}" stroke-width="4"/>')
        d.add(hem(PARC_HEM,14)); d.add(hem("M282 276 Q272 206 282 136",12))
    elif mat=='malha':
        d.piece(PARC, IRON, off=14, tex=mail(270,76,430,300,step=11))
        d.add(hem(PARC_HEM,10,LEA)); d.add(hem("M282 276 Q272 206 282 136",8,LEA))
    else:
        d.piece(PARC, IRON, off=14, tex=scales(270,76,430,300,w=26,h=20))
        d.add(hem(PARC_HEM,10,LEA)); d.add(hem("M282 276 Q272 206 282 136",8,LEA))
    return d

def completa(mat):
    d=Doc(); horse(d, tail=False)
    if mat=='couro':
        d.piece(COMP, LEA, off=14)
        d.add(f'<path d="M170 128 Q176 210 168 282 M240 132 Q246 210 240 286 M318 120 Q326 200 320 286" fill="none" stroke="{LEA[2]}" stroke-width="4"/>')
        d.add(hem(COMP_HEM,14))
    elif mat=='malha':
        d.piece(COMP, IRON, off=14, tex=mail(80,70,430,300,step=11))
        d.add(hem(COMP_HEM,10,LEA))
    else:
        d.piece(FLAN, IRON, off=12)
        d.piece(CRUP, IRON, off=14)
        d.piece(PEYT, IRON, off=14)
        d.add(f'<path d="M300 140 Q382 120 404 160" fill="none" stroke="{IRON[0]}" stroke-width="5"/>')
        d.add(f'<path d="M124 150 Q170 136 220 142" fill="none" stroke="{IRON[0]}" stroke-width="5"/>')
        d.add(rivets([(130,256),(220,258),(306,256),(392,258)], r=5))
    d.add(f'<path d="{TAIL}" fill="{HORSE[1]}"/>')
    return d

LEGS_NEAR=[ "M356 250 Q378 244 402 246 L400 350 Q382 354 360 350 Z", "M136 290 Q166 282 196 284 L190 350 Q170 354 146 350 Z" ]
LEGS_FAR =[ "M308 248 Q330 242 352 244 L354 350 Q334 354 314 350 Z", "M188 262 Q212 256 236 260 L224 350 Q204 354 182 350 Z" ]
def perneiras():
    d=Doc()
    d.add(f'<path d="{TAIL}" fill="{HORSE[1]}"/>')
    d.add(f'<path d="{FAR}" fill="{HORSE[1]}"/>')
    for p in LEGS_FAR: d.piece(p, IRONF, off=8)
    d.add(f'<path d="{BODY}" fill="{HORSE[0]}"/>')
    d.add(f'<circle cx="432" cy="76" r="7" fill="{K}" stroke="none"/>')
    d.add(f'<path d="M462 120 Q470 122 470 130" fill="none" stroke-width="4"/>')
    for p in LEGS_NEAR: d.piece(p, IRON, off=8)
    for x0,y0,x1,y1 in [(312,298,350,296),(186,306,228,304),(360,298,400,296),(142,318,192,316)]:
        d.add(f'<path d="M{x0} {y0} Q{(x0+x1)/2} {y0+8} {x1} {y1}" fill="none" stroke-width="4.5"/>')
    return d

T={'couro':'Couro e Tecido','malha':'Malha','escamas':'Escamas','placas':'Placas'}
VB='-22 -25 568 444'; SH=(0,0)
for m,slug in [('couro','couro-tecido'),('malha','malha'),('escamas','escamas')]:
    parcial(m).write(f'barda-parcial-{slug}', f'Barda Parcial de {T[m]}', VB, SH)
for m,slug in [('couro','couro-tecido'),('malha','malha'),('placas','placas')]:
    completa(m).write(f'barda-completa-{slug}', f'Barda Completa de {T[m]}', VB, SH)
perneiras().write('barda-perneiras-placas','Perneiras de Placas (Barda)', VB, SH)
