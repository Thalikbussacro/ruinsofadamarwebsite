import math,sys
from geo import *
OUT='data/svgicons/'
W=('#9a7448','#7a5a3a','#55391f'); H=('#d6bf8a','#b89c66','#8c7346'); L=('#8a3a32','#6b2a24','#4a1b17')
def mirror(segs,cy):
    out=[]
    for s in reversed(segs):
        out.append(tuple((p[0],2*cy-p[1]) for p in reversed(s)))
    return out
# deslocamento horizontal para centralizar o arco na tela (medido nas folhas de revisão)
DX={'arco-composto':-2,'arco-comum':-2,'arco-curto':-3,'arco-longo':-2}
def bow(id,title,vb,top,tipw,gripw,string,grip=(0.43,0.57),kind='wood',sw=6,expo=0.8,strlast=False):
    vw,vh=vb; segs=top+mirror(top,256)
    pts=chain(segs,60)
    wf=lambda s: tipw+(gripw-tipw)*(math.sin(math.pi*s)**expo)
    o=[]
    o.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}" role="img">\n  <title>{title}</title>')
    o.append(f'  <g transform="translate({DX[id]} 0)" stroke="#0a0806" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round">')
    cs=f'    <!-- corda -->\n    <path d="{string}" fill="none" stroke-width="9"/>\n    <path d="{string}" fill="none" stroke="#d8cdb0" stroke-width="3.5"/>'
    if not strlast: o.append(cs)
    full=shape(pts,wf)
    if kind=='wood':
        o.append(f'    <!-- haste -->\n    <path d="{full}" fill="{W[1]}"/>')
        o.append(f'    <path d="{band(pts,wf,0.2,0.85)}" fill="{W[0]}" stroke="none"/>')
        o.append(f'    <path d="{band(pts,wf,-0.95,-0.4)}" fill="{W[2]}" stroke="none"/>')
        o.append(f'    <path d="{full}" fill="none"/>')
    else:
        o.append(f'    <!-- haste: ventre de chifre, dorso de madeira -->\n    <path d="{full}" fill="{H[1]}"/>')
        o.append(f'    <path d="{band(pts,wf,0.35,0.85)}" fill="{H[0]}" stroke="none"/>')
        o.append(f'    <path d="{band(pts,wf,-1,-0.05)}" fill="{W[1]}" stroke="none"/>')
        o.append(f'    <path d="{band(pts,wf,-1,-0.5)}" fill="{W[2]}" stroke="none"/>')
        n=len(pts); a=int(n*0.08); b=int(n*0.92)
        o.append(f'    <path d="{poly(off(pts,wf,-0.05)[a:b])}" fill="none" stroke-width="3.5"/>')
        o.append(f'    <path d="{full}" fill="none"/>')
    # empunhadura
    n=len(pts); a=int(n*grip[0]); b=int(n*grip[1]); gp=pts[a:b+1]
    gw=lambda s: wf(grip[0]+s*(grip[1]-grip[0]))*1.25+1.5
    o.append(f'    <!-- empunhadura -->\n    <path d="{shape(gp,gw)}" fill="{L[1]}"/>')
    o.append(f'    <path d="{band(gp,gw,0.25,0.8)}" fill="{L[0]}" stroke="none"/>')
    o.append(f'    <path d="{shape(gp,gw)}" fill="none"/>')
    if strlast: o.append(cs)
    o.append('  </g>\n</svg>\n')
    open(OUT+id+'.svg','w').write('\n'.join(o))

bow('arco-comum','Arco comum',(102,512),
    [((24,38),(48,82),(70,170),(70,256))],4.5,11,'M24 38 V474')
bow('arco-curto','Arco curto',(128,512),
    [((24,52),(74,86),(96,170),(96,256))],5,12,'M24 52 V460',grip=(0.42,0.58))
bow('arco-longo','Arco longo',(96,512),
    [((28,30),(46,90),(62,170),(62,256))],4,9.5,'M28 30 V482',grip=(0.45,0.55))
bow('arco-composto','Arco composto',(102,512),
    [((52,32),(46,50),(36,72),(30,100)),((30,100),(30,150),(70,182),(70,256))],4,11,
    'M50 34 Q30 60 25 104 V408 Q30 452 50 478',kind='horn',expo=0.6,strlast=True,grip=(0.44,0.56))
