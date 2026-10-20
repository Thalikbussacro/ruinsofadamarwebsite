from gen import *
MASK = "M246 126 L266 100 C310 130 370 190 428 254 Q438 274 420 290 Q380 298 338 284 Q294 268 270 232 Q252 196 246 160 Z"
EYE=(298,184)
def strap(d):
    d.add(f'<path d="M238 116 Q216 196 268 262" fill="none" stroke-width="22"/>')
    d.add(f'<path d="M238 116 Q216 196 268 262" fill="none" stroke="#6b2a24" stroke-width="10"/>')
def headbase(d):
    d.add(f'<path d="{HEAD}" fill="{HORSE[0]}"/>')
    d.add(f'<path d="M420 300 Q432 304 432 318" fill="none" stroke-width="5"/>')  # narina
    d.add(f'<path d="M222 140 L226 72" fill="none" stroke="{HORSE[1]}" stroke-width="5"/>')
def eyehole(d, ring=None):
    x,y=EYE
    if ring: d.add(f'<circle cx="{x}" cy="{y}" r="24" fill="{ring}" stroke-width="5"/>')
    d.add(f'<circle cx="{x}" cy="{y}" r="14" fill="{K}"/>')

def mask(mat):
    d=Doc(); headbase(d); strap(d)
    if mat=='couro':
        d.piece(MASK, LEA, off=16)
        d.add(hem(MASK, 14))
        d.add(f'<path d="M280 120 C320 150 370 200 410 248" fill="none" stroke="{LEA[0]}" stroke-width="5"/>')
        eyehole(d, CLO[1])
    elif mat=='malha':
        d.piece(MASK, IRON, off=16, tex=mail(230,90,450,300))
        eyehole(d, IRON[1])
    elif mat=='escamas':
        d.piece(MASK, IRON, off=16, tex=scales(232,92,450,300))
        eyehole(d, IRON[1])
    else:
        d.piece(MASK, IRON, off=18)
        d.add(f'<path d="M268 118 C312 148 366 202 418 262" fill="none" stroke="{IRON[0]}" stroke-width="5"/>')
        d.add(f'<path d="M262 134 C306 164 360 214 410 272" fill="none" stroke-width="4"/>')
        eyehole(d, IRON[1])
        d.add(rivets([(262,170),(330,262),(394,276)]))
    return d

HOOD = ("M98 434 C102 330 152 196 228 126 L262 104 C300 132 346 174 390 214 "
        "Q398 282 352 334 Q322 324 300 304 Q280 286 278 264 C282 330 296 392 308 434 Z")
HEM_BOT = "M98 434 Q204 448 308 434"
HEM_FRONT = "M390 214 Q398 282 352 334"
def hood(mat):
    d=Doc(); headbase(d)
    if mat=='couro':
        d.piece(HOOD, LEA, off=18)
        d.add(hem(HOOD,14))
        # costura central do pescoço
        d.add(f'<path d="M180 260 Q220 360 214 440" fill="none" stroke="{LEA[2]}" stroke-width="5"/>')
        eyehole(d, CLO[1])
    elif mat=='malha':
        d.piece(HOOD, IRON, off=18, tex=mail(80,90,450,470))
        d.add(hem(HEM_BOT,10,LEA)); d.add(hem(HEM_FRONT,10,LEA))
        eyehole(d, IRON[1])
    elif mat=='escamas':
        d.piece(HOOD, IRON, off=18, tex=scales(80,92,450,470))
        d.add(hem(HEM_BOT,10,LEA)); d.add(hem(HEM_FRONT,10,LEA))
        eyehole(d, IRON[1])
    else:
        # crinet de lâminas + chanfron
        import gen
        lames=[]
        crest=lambda t: bez((92,474),(96,330),(146,196),(230,122),t)
        throat=lambda t: bez((274,264),(276,340),(300,410),(320,474),t)
        n=5
        for k in range(n):
            t0=0.06+k*(0.66/n); t1=t0+0.66/n+0.05
            f=lambda t: 0.9-(t-0.06)*(0.83/0.71)
            a0=crest(f(t0)); a1=crest(f(t1))
            b0=throat(t0); b1=throat(t1)
            # extend outward
            p=f"M{a0[0]-6:.0f} {a0[1]-2:.0f} L{b0[0]+8:.0f} {b0[1]:.0f} L{b1[0]+8:.0f} {b1[1]:.0f} L{a1[0]-6:.0f} {a1[1]-2:.0f} Z"
            lames.append(p)
        for p in lames: d.piece(p, IRON, off=10)
        d.piece(MASK, IRON, off=18)
        d.add(f'<path d="M268 118 C312 148 366 202 418 262" fill="none" stroke="{IRON[0]}" stroke-width="5"/>')
        eyehole(d, IRON[1])
        d.add(rivets([(262,170),(394,276)]))
    return d

def bez(p0,p1,p2,p3,t):
    u=1-t
    return tuple(u**3*a+3*u*u*t*b+3*u*t*t*c+t**3*e for a,b,c,e in zip(p0,p1,p2,p3))

T={'couro':'Couro e Tecido','malha':'Malha','escamas':'Escamas','placas':'Placas'}
for m,slug in [('couro','couro-tecido'),('malha','malha'),('escamas','escamas'),('placas','placas')]:
    mask(m).write(f'barda-mascara-{slug}', f'Máscara de {T[m]} (Barda)', '0 0 512 512', (-9,-13))
    hood(m).write(f'barda-cabeca-pescoco-{slug}', f'Cabeça e Pescoço de {T[m]} (Barda)', '0 0 512 512', (-9,-13))
