import math
ROOT='data/svgicons'
K='#0a0806'
IRON=('#b5ae9c','#8a8579','#5f5b52','#4a463f')
BRZ=('#c4a066','#9a7a46','#6e5530')
LEA=('#a07850','#7c5a3a','#573d26')
WINE=('#8a3a32','#6b2a24','#4a1b17')
LIN=('#d8cdb0','#b5a98a','#8f8468')
WOOL=('#7a7264','#5e574b','#433e35')
FUR=('#a08a6a','#7e6a4e','#5a4a36')

def f(v): 
    return ('%.1f'%v).rstrip('0').rstrip('.')

def svg(w,h,title,body,sw=6):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}" role="img">
  <title>{title}</title>
{body}
</svg>
'''

def save(id_, s):
    open(f'{ROOT}/{id_}.svg','w').write(s)

def mir(pts, cx):
    return [(2*cx-x,y) for x,y in pts]

def torso(cx, top, sh, nw, nd, arm_y, ar, waist_y, wa, bot_y, hw, hem=0, sleeve=None, sh_drop=16, notch=None, acurve=30):
    """Silhueta frontal de peça de tronco. sleeve=(dx, dy, cuff) vetor do ombro até a ponta da manga e largura do punho."""
    def side(sign):
        s=sign
        pts=[]
        X=lambda d: cx+s*d
        out=[]
        out.append(('L',X(sh),top+sh_drop))
        if sleeve:
            dx,dy,dx2,dy2=sleeve
            out.append(('L',X(sh+dx),top+sh_drop+dy))
            out.append(('L',X(sh+dx2),top+sh_drop+dy2))
            out.append(('L',X(ar),arm_y))
        else:
            out.append(('Q',X(sh-acurve),arm_y-30,X(ar),arm_y))
        out.append(('L',X(wa),waist_y))
        out.append(('L',X(hw),bot_y))
        return out
    L=side(-1); R=side(1)
    d=f'M{f(cx-nw)} {f(top)}'
    for seg in L:
        if seg[0]=='L': d+=f' L{f(seg[1])} {f(seg[2])}'
        else: d+=f' Q{f(seg[1])} {f(seg[2])} {f(seg[3])} {f(seg[4])}'
    d+=f' Q{f(cx)} {f(bot_y+hem)} {f(cx+hw)} {f(bot_y)}'
    # lado direito ao contrário
    rev=[]
    pts=[(cx-nw,top)]
    # reconstruir pontos do lado direito em ordem reversa
    segs=R
    # pontos finais de cada seg
    ends=[(s[1],s[2]) if s[0]=='L' else (s[3],s[4]) for s in segs]
    start=(cx+nw,top)
    seq=[start]+ends
    for i in range(len(segs)-1,-1,-1):
        s=segs[i]; tgt=seq[i]
        if s[0]=='L': d+=f' L{f(tgt[0])} {f(tgt[1])}'
        else: d+=f' Q{f(s[1])} {f(s[2])} {f(tgt[0])} {f(tgt[1])}'
    d+=f' Q{f(cx)} {f(top+2*nd)} {f(cx-nw)} {f(top)} Z'
    return d

def mail(x0,x1,y0,y1,step=18,col='#5f5b52',sw=3.5):
    r=step/2
    rows=[]
    y=y0; i=0
    while y<y1:
        off=0 if i%2==0 else r
        d=''
        x=x0-off
        while x<x1:
            d+=f'M{f(x)} {f(y)} a{f(r)} {f(r*0.8)} 0 0 0 {f(step)} 0 '
            x+=step
        rows.append(d)
        y+=step*0.62; i+=1
    return f'<path d="{" ".join(rows)}" fill="none" stroke="{col}" stroke-width="{sw}"/>'

def scales(x0,x1,y0,y1,w,h,cols,cx=None,stroke='#0a0806',sw=3.5,band=None):
    """Escamas em U; fileiras de baixo para cima (de cima sobrepõe). cols=(claro,medio,escuro) por coluna."""
    out=[]
    rows=[]
    y=y0; i=0
    while y<y1:
        rows.append((y,i)); y+=h*0.62; i+=1
    r=w/2
    for y,i in reversed(rows):
        off=0 if i%2==0 else r
        x=x0-off
        while x<x1+w:
            xc=x+r
            if band:
                t=(xc-band[0])/(band[1]-band[0])
                c=cols[0] if t<0.3 else (cols[2] if t>0.72 else cols[1])
            else: c=cols[1]
            out.append(f'<path d="M{f(x)} {f(y)} V{f(y+h-r)} A{f(r)} {f(r)} 0 0 0 {f(x+w)} {f(y+h-r)} V{f(y)} Z" fill="{c}"/>')
            x+=w
    return f'<g stroke="{stroke}" stroke-width="{sw}">'+''.join(out)+'</g>'

def rings(x0,x1,y0,y1,step=14,col='#4a463f',sw=3):
    r=step*0.42
    d=''
    y=y0;i=0
    while y<y1:
        off=0 if i%2==0 else step/2
        x=x0-off
        while x<x1:
            d+=f'M{f(x-r)} {f(y)} a{f(r)} {f(r*0.75)} 0 1 0 {f(2*r)} 0 a{f(r)} {f(r*0.75)} 0 1 0 {f(-2*r)} 0 '
            x+=step
        y+=step*0.55; i+=1
    return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{sw}"/>'
