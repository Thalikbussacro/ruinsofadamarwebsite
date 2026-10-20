import math, sys
OUT='data/svgicons/'
K='#0a0806'
IRON=('#b5ae9c','#8a8579','#5f5b52','#4a463f')
LEA=('#a07850','#7c5a3a','#573d26')
CLO=('#d8cdb0','#b5a98a','#8f8468')
HORSE=('#4a4038','#372f29')

HEAD = "M92 474 C96 330 146 196 230 122 L224 64 Q240 72 262 106 C304 138 364 198 420 262 Q446 292 440 324 Q432 350 400 348 L372 340 Q326 330 298 304 Q276 284 274 264 C276 340 300 410 320 474 Z"
TAIL = "M112 136 Q74 150 62 204 Q56 236 48 256 Q60 264 74 240 Q92 204 104 180 Z"
FAR = "M340 236 L344 292 L344 340 L348 372 L322 372 L322 340 L320 292 L316 240 Z M228 246 L218 292 L214 340 L216 372 L192 372 L192 340 L194 292 L200 248 Z"
BODY = ("M114 130 Q160 118 220 128 Q290 134 326 112 C346 84 372 56 398 44 L398 22 Q414 28 422 46 "
        "Q440 58 458 86 L476 116 Q480 134 464 140 Q448 144 436 134 L418 118 Q404 118 400 130 "
        "C398 152 404 176 408 198 Q410 222 394 236 L390 292 L392 340 L396 372 L368 372 L368 340 L366 292 L364 246 "
        "Q344 252 316 252 Q250 260 196 248 L186 290 L180 316 L180 340 L182 372 L156 372 L156 340 L148 312 "
        "Q120 270 108 226 Q98 176 114 130 Z")

class Doc:
    def __init__(s): s.defs=[]; s.body=[]; s.n=0
    def piece(s, d, tones, off=14, tex=None, sw=6):
        """region with rim light (top-left) / rim shadow (bottom-right); tex = svg inside clip"""
        s.n+=1; i=f'p{s.n}'
        light,mid,dark=tones[:3]
        s.defs.append(f'<path id="{i}" d="{d}"/>'
            f'<clipPath id="c{i}"><use xlink:href="#{i}"/></clipPath>'
            f'<clipPath id="a{i}"><use xlink:href="#{i}" transform="translate({off} {off})"/></clipPath>'
            f'<clipPath id="b{i}"><use xlink:href="#{i}" transform="translate({-off} {-off})"/></clipPath>')
        b=[f'<use xlink:href="#{i}" fill="{light}"/>',
           f'<g clip-path="url(#c{i})" stroke="none"><g clip-path="url(#a{i})"><rect x="-50" y="-50" width="700" height="700" fill="{dark}"/>'
           f'<g clip-path="url(#b{i})"><rect x="-50" y="-50" width="700" height="700" fill="{mid}"/></g></g></g>']
        if tex: b.append(f'<g clip-path="url(#c{i})">{tex}</g>')
        b.append(f'<use xlink:href="#{i}" fill="none" stroke-width="{sw}"/>')
        s.body.append(''.join(b)); return i
    def add(s, x): s.body.append(x)
    def write(s, name, title, vb, shift=(0,0)):
        svg=(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{vb}" role="img">\n'
             f'  <title>{title}</title>\n  <defs>\n    '+'\n    '.join(s.defs)+'\n  </defs>\n'
             f'  <g stroke="{K}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"'+(f' transform="translate({shift[0]} {shift[1]})"' if shift!=(0,0) else '')+'>\n    '
             +'\n    '.join(s.body)+'\n  </g>\n</svg>\n')
        open(OUT+name+'.svg','w').write(svg)

def mail(x0,y0,x1,y1,step=12,col=IRON[3],sw=3):
    out=[]; r=0
    y=y0
    while y<y1:
        x=x0+(step/2 if r%2 else 0)
        segs=''.join(f' q{step/2:g} {-step*0.7:g} {step:g} 0' for _ in range(int((x1-x0)/step)+2))
        out.append(f'M{x:g} {y:g}{segs}')
        y+=step*0.55; r+=1
    return f'<path d="{" ".join(out)}" fill="none" stroke="{col}" stroke-width="{sw}"/>'

def scales(x0,y0,x1,y1,w=32,h=24,col=IRON[3],hi=IRON[0],sw=3.5):
    out=[]; hl=[]; r=0; y=y0
    while y<y1:
        x=x0+(w/2 if r%2 else 0)
        while x<x1+w:
            out.append(f'M{x-w/2:g} {y:g} Q{x-w/2:g} {y+h*0.75:g} {x:g} {y+h*0.75:g} Q{x+w/2:g} {y+h*0.75:g} {x+w/2:g} {y:g}')
            hl.append(f'M{x-w/2+5:g} {y+2:g} Q{x-w/2+5:g} {y+h*0.5:g} {x-2:g} {y+h*0.55:g}')
            x+=w
        y+=h; r+=1
    return (f'<path d="{" ".join(hl)}" fill="none" stroke="{hi}" stroke-width="3"/>'
            f'<path d="{" ".join(out)}" fill="none" stroke="{col}" stroke-width="{sw}"/>')

def hem(d, w=18, tones=CLO):
    """cloth padded border along an open path: double stroke"""
    return (f'<path d="{d}" fill="none" stroke-width="{w+12}"/>'
            f'<path d="{d}" fill="none" stroke="{tones[1]}" stroke-width="{w}"/>'
            )
def rivets(pts, r=6, fill=IRON[0]):
    return '<g fill="'+fill+'" stroke-width="3.5">'+''.join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x,y in pts)+'</g>'
