import sys
from lib import *
G='<g stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">'
ITEMS={}
def item(fn): ITEMS[fn.__name__.replace('_','-')]=fn; return fn

def strap(d, col=LEA, w=22):
    return (f'<path d="{d}" fill="none" stroke-width="{w+12}"/>'
            f'<path d="{d}" fill="none" stroke="{col[1]}" stroke-width="{w}"/>')

def buckle(x,y,w=26,h=22,col=IRON):
    return f'<rect x="{f(x-w/2)}" y="{f(y-h/2)}" width="{w}" height="{h}" rx="5" fill="none" stroke-width="13"/><rect x="{f(x-w/2)}" y="{f(y-h/2)}" width="{w}" height="{h}" rx="5" fill="none" stroke="{col[1]}" stroke-width="6"/>'

def cuirass_bronze(cx, top, s, front_only=True):
    """s = escala relativa; retorna (defs, corpo)"""
    pass

@item
def peitoral_de_bronze():
    cx=192; top=66
    d=torso(cx,top,92,58,40,214,122,350,104,444,116,hem=24,sh_drop=10,acurve=26)
    b=G
    # correias das costas, vistas pelas laterais
    for s_ in (-1,1):
        b+=strap(f'M{cx+s_*108} 236 Q{cx+s_*146} 240 {cx+s_*150} 296',w=20)
        b+=f'<path d="M{cx+s_*150-13} 290 h26 l-3 24 h-20 Z" fill="{IRON[1]}" stroke-width="5"/>'
    b+=f'<defs><path id="pb" d="{d}"/><clipPath id="c-pb"><use xlink:href="#pb"/></clipPath></defs>'
    b+=f'<use xlink:href="#pb" fill="{BRZ[1]}"/>'
    b+=f'<g clip-path="url(#c-pb)" stroke="none"><rect x="0" y="0" width="{cx-58}" height="512" fill="{BRZ[0]}"/><rect x="{cx+66}" y="0" width="200" height="512" fill="{BRZ[2]}"/></g>'
    # anatomia
    b+=f'<path d="M{cx-96} 214 Q{cx-52} 262 {cx-4} 232 M{cx+4} 232 Q{cx+52} 262 {cx+96} 214" fill="none" stroke-width="5"/>'
    b+=f'<path d="M{cx} 238 V398" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+=f'<path d="M{cx-56} 306 Q{cx-28} 318 {cx-8} 312 M{cx+8} 312 Q{cx+28} 318 {cx+56} 306 M{cx-62} 360 Q{cx-32} 370 {cx-8} 366 M{cx+8} 366 Q{cx+32} 370 {cx+62} 360" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+=f'<path d="M{cx-88} 206 Q{cx-62} 188 {cx-24} 196" fill="none" stroke="{BRZ[0]}" stroke-width="7"/>'
    # bordas enroladas
    b+=f'<path d="M{cx-48} {top+12} Q{cx} {top+86} {cx+48} {top+12}" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+=f'<path d="M{cx-82} {top+22} Q{cx-70} 186 {cx-110} 206 M{cx+82} {top+22} Q{cx+70} 186 {cx+110} 206" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+=f'<path d="M{cx-110} 432 Q{cx} 454 {cx+110} 432" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+=f'<use xlink:href="#pb" fill="none"/>'
    # alças de ombro presas na frente
    b+=f'<path d="M{cx-96} {top+4} l34 6 l-2 50 q-14 8 -30 2 Z" fill="{LEA[1]}"/><path d="M{cx+96} {top+4} l-34 6 l2 50 q14 8 30 2 Z" fill="{LEA[2]}"/>'
    b+=f'<circle cx="{cx-78}" cy="{top+48}" r="7" fill="{BRZ[0]}" stroke-width="4"/><circle cx="{cx+78}" cy="{top+48}" r="7" fill="{BRZ[1]}" stroke-width="4"/>'
    b+='</g>'
    return svg(384,512,'Peitoral de Bronze',b)


def cuir(cx,top,k,kx=None,nd=40):
    kx=kx or k
    Y=lambda v: top+v*k
    return torso(cx,top,92*kx,58*kx,nd*k,Y(148),122*kx,Y(284),104*kx,Y(378),116*kx,hem=24*k,sh_drop=10*k,acurve=26*kx)

def shade(cid,x1,x2,cols,h=600):
    return f'<g clip-path="url(#{cid})" stroke="none"><rect x="-10" y="-10" width="{f(x1+10)}" height="{h}" fill="{cols[0]}"/><rect x="{f(x2)}" y="-10" width="600" height="{h}" fill="{cols[2]}"/></g>'

def shape(id_,d,cols,x1,x2):
    return (f'<defs><path id="{id_}" d="{d}"/><clipPath id="c-{id_}"><use xlink:href="#{id_}"/></clipPath></defs>'
            f'<use xlink:href="#{id_}" fill="{cols[1]}"/>'+shade('c-'+id_,x1,x2,cols))

def pteruges(cx,y0,y1,n,w,cols,gap=0,rowoff=0):
    out=''
    tot=n*w
    x=cx-tot/2
    for i in range(n):
        t=i/(n-1)
        c=cols[0] if t<0.25 else (cols[2] if t>0.7 else cols[1])
        out+=f'<rect x="{f(x+1)}" y="{f(y0)}" width="{f(w-2)}" height="{f(y1-y0)}" rx="7" fill="{c}"/>'
        x+=w
    return out

@item
def corselete_de_bronze():
    cx=256; top=52; k=0.74; kx=1.24
    Y=lambda v: top+v*k
    d=cuir(cx,top,k,kx,nd=62)
    back=torso(cx,top-4,92*kx,56*kx,6*k,Y(148),122*kx,Y(284),104*kx,Y(378),116*kx,hem=24*k,sh_drop=10*k,acurve=26*kx)
    b=G
    # faldas de couro (pteruges), duas camadas
    b+=pteruges(cx,Y(340),462,9,31,LEA)
    b+=pteruges(cx,Y(330),Y(330)+92,8,34,LEA)
    # placa das costas
    b+=f'<use xlink:href="#bk" fill="{BRZ[2]}"/>'.replace('#bk','#bk')
    b=b.replace('<use xlink:href="#bk"','<path d="'+back+'"')
    b+=shape('cb',d,BRZ,cx-66*kx,cx+74*kx)
    b+=f'<path d="M{cx-96*kx} {Y(214)} Q{cx-52*kx} {Y(262)} {cx-4} {Y(232)} M{cx+4} {Y(232)} Q{cx+52*kx} {Y(262)} {cx+96*kx} {Y(214)}" fill="none" stroke-width="5"/>'
    b+=f'<path d="M{cx} {Y(238)} V{Y(370)}" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+=f'<path d="M{cx-58} {Y(306)} Q{cx-30} {Y(318)} {cx-8} {Y(312)} M{cx+8} {Y(312)} Q{cx+30} {Y(318)} {cx+58} {Y(306)}" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+=f'<path d="M{cx-96} {Y(206)} Q{cx-66} {Y(188)} {cx-26} {Y(196)}" fill="none" stroke="{BRZ[0]}" stroke-width="7"/>'
    b+=f'<path d="M{cx-120} {Y(368)} Q{cx} {Y(392)} {cx+120} {Y(368)}" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+='<use xlink:href="#cb" fill="none"/>'
    # dobradiças laterais
    for s_ in (-1,1):
        b+=f'<rect x="{f(cx+s_*112*kx-9)}" y="{f(Y(200))}" width="18" height="34" rx="5" fill="{BRZ[0] if s_<0 else BRZ[2]}" stroke-width="5"/>'
        b+=f'<rect x="{f(cx+s_*108*kx-9)}" y="{f(Y(262))}" width="18" height="34" rx="5" fill="{BRZ[0] if s_<0 else BRZ[2]}" stroke-width="5"/>'
    b+='</g>'
    return svg(512,512,'Corselete de Bronze',b)


def rivet(x,y,c=IRON[0],r=6):
    return f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}" fill="{c}" stroke-width="3.5"/>'

def steel_plate(cx,top,k,kx,id_,nd=40):
    """peito de aço medieval: quilha central, borda do pescoço enrolada."""
    Y=lambda v: top+v*k
    d=cuir(cx,top,k,kx,nd=nd)
    b=shape(id_,d,IRON,cx-60*kx,cx+66*kx)
    # quilha
    b+=f'<path d="M{cx} {f(top+nd*k+4)} L{cx} {f(Y(300))}" fill="none" stroke="{IRON[0]}" stroke-width="7" transform="translate(-5 0)"/>'
    b+=f'<path d="M{cx} {f(top+nd*k+4)} L{cx} {f(Y(300))}" fill="none" stroke="{IRON[2]}" stroke-width="7" transform="translate(5 0)"/>'
    b+=f'<path d="M{cx} {f(top+nd*k+4)} L{cx} {f(Y(300))}" fill="none" stroke-width="4"/>'
    # lâmina da cintura
    b+=f'<path d="M{f(cx-106*kx)} {f(Y(300))} Q{cx} {f(Y(326))} {f(cx+106*kx)} {f(Y(300))}" fill="none" stroke-width="5"/>'
    b+=f'<path d="M{f(cx-100*kx)} {f(Y(312))} Q{cx-40} {f(Y(334))} {cx-6} {f(Y(336))}" fill="none" stroke="{IRON[0]}" stroke-width="6"/>'
    b+=f'<use xlink:href="#{id_}" fill="none"/>'
    # borda enrolada do pescoço (traço duplo)
    neck=f'M{f(cx-58*kx+4)} {f(top+3)} Q{cx} {f(top+2*nd*k+2)} {f(cx+58*kx-4)} {f(top+3)}'
    b+=f'<path d="{neck}" fill="none" stroke-width="18"/><path d="{neck}" fill="none" stroke="{IRON[0]}" stroke-width="8"/>'
    for s_ in (-1,1):
        arm=f'M{f(cx+s_*(92*kx-6))} {f(top+10*k+4)} Q{f(cx+s_*66*kx)} {f(Y(118))} {f(cx+s_*(122*kx-4))} {f(Y(148)-2)}'
        b+=f'<path d="{arm}" fill="none" stroke-width="16"/><path d="{arm}" fill="none" stroke="{IRON[0] if s_<0 else IRON[1]}" stroke-width="7"/>'
    return b

@item
def peitoral_de_aco():
    cx=192; top=66
    b=G
    for s_ in (-1,1):
        b+=strap(f'M{cx+s_*108} 236 Q{cx+s_*146} 240 {cx+s_*150} 296',w=20)
        b+=f'<path d="M{cx+s_*150-13} 290 h26 l-3 24 h-20 Z" fill="{IRON[1]}" stroke-width="5"/>'
    b+=steel_plate(cx,top,1,1,'pa')
    for s_ in (-1,1):
        b+=f'<path d="M{cx+s_*96} {top+4} l{-s_*34} 6 l{s_*2} 50 q{s_*14} 8 {s_*30} 2 Z" fill="{LEA[1] if s_<0 else LEA[2]}"/>'
        b+=rivet(cx+s_*78,top+48)
    b+=rivet(cx-96,340)+rivet(cx+96,340,IRON[1])
    b+='</g>'
    return svg(384,512,'Peitoral de Aço',b)

def tasset(x,y,w,h,cols,n=3):
    out=''
    for i in range(n-1,-1,-1):
        yy=y+i*h*0.3
        out+=f'<path d="M{f(x-w/2)} {f(yy)} H{f(x+w/2)} L{f(x+w/2-4)} {f(yy+h*0.42)} Q{f(x)} {f(yy+h*0.5)} {f(x-w/2+4)} {f(yy+h*0.42)} Z" fill="{cols}"/>'
    return out

@item
def corselete_de_aco():
    cx=256; top=64; k=0.74; kx=1.12
    Y=lambda v: top+v*k
    back=torso(cx,top-4,92*kx,56*kx,6*k,Y(148),122*kx,Y(284),104*kx,Y(378),116*kx,hem=24*k,sh_drop=10*k,acurve=26*kx)
    b=G
    b+=f'<path d="{back}" fill="{IRON[3]}"/>'
    # saia de lâminas (faldas), em sino
    for i in range(3,-1,-1):
        yy=Y(352)+i*30; w=118*kx+i*10
        b+=f'<path d="M{f(cx-w)} {f(yy-14)} Q{cx} {f(yy+10)} {f(cx+w)} {f(yy-14)} L{f(cx+w+6)} {f(yy+26)} Q{cx} {f(yy+50)} {f(cx-w-6)} {f(yy+26)} Z" fill="{IRON[1]}"/>'
        b+=f'<path d="M{f(cx-w+2)} {f(yy+2)} L{f(cx-w+6)} {f(yy+22)}" fill="none" stroke="{IRON[0]}" stroke-width="9"/>'
        b+=f'<path d="M{f(cx+w-2)} {f(yy+2)} L{f(cx+w-6)} {f(yy+22)}" fill="none" stroke="{IRON[2]}" stroke-width="9"/>'
        b+=rivet(cx-w+26,yy+10,IRON[0],5)+rivet(cx+w-26,yy+10,IRON[1],5)
    b+=steel_plate(cx,top,k,kx,'ca',nd=62)
    for s_ in (-1,1):
        b+=f'<rect x="{f(cx+s_*100*kx-10)}" y="{f(top-2)}" width="20" height="46" rx="5" fill="{LEA[1] if s_<0 else LEA[2]}"/>'
        b+=rivet(cx+s_*100*kx,top+32)
    b+='</g>'
    return svg(512,512,'Corselete de Aço',b)


@item
def armadura_de_placas_laminadas_de_aco():
    cx=192; top=56
    d=torso(cx,top,90,56,36,196,124,330,108,458,132,hem=26,sh_drop=10,acurve=26)
    b=G+shape('pl',d,IRON,cx-62,cx+68)
    b+='<g clip-path="url(#c-pl)">'
    ys=[150,196,240,284,328,372,414]
    for i,y in enumerate(ys):
        sag=14+i*1.5
        # sombra sob a borda e brilho logo acima
        b+=f'<path d="M0 {y+10} Q{cx} {y+sag*2+10} 384 {y+10}" fill="none" stroke="{IRON[3]}" stroke-width="12" stroke-linecap="butt"/>'
        b+=f'<path d="M0 {y} Q{cx} {y+sag*2} 384 {y}" fill="none" stroke-width="5"/>'
    b+='</g>'
    b+=f'<defs><clipPath id="c-pll"><rect x="0" y="0" width="{cx-10}" height="512"/></clipPath></defs>'
    # rebites nas pontas de cada lâmina
    for i,y in enumerate(ys[1:]):
        w=[118,112,108,112,120,126][i]
        b+=rivet(cx-w+16,y-10,IRON[0],5)+rivet(cx+w-16,y-10,IRON[1],5)
    b+=f'<path d="M{cx-54} {top+10} Q{cx} {top+70} {cx+54} {top+10}" fill="none" stroke-width="16"/><path d="M{cx-54} {top+10} Q{cx} {top+70} {cx+54} {top+10}" fill="none" stroke="{IRON[0]}" stroke-width="7"/>'
    b+='<use xlink:href="#pl" fill="none"/>'
    for s_ in (-1,1):
        b+=f'<rect x="{f(cx+s_*76-10)}" y="{top-4}" width="20" height="48" rx="5" fill="{LEA[1] if s_<0 else LEA[2]}"/>'
        b+=rivet(cx+s_*76,top+30)
    b+='</g>'
    return svg(384,512,'Armadura de Placas Laminadas de Aço',b)

@item
def loriga_segmentada():
    cx=192; top=104
    d=torso(cx,top,74,50,30,206,118,330,112,438,116,hem=12,sh_drop=8,acurve=10)
    b=G
    b+=f'<defs><path id="lo" d="{d}"/><clipPath id="c-lo"><use xlink:href="#lo"/></clipPath></defs>'
    b+=f'<use xlink:href="#lo" fill="{IRON[1]}"/>'
    b+='<g clip-path="url(#c-lo)">'
    b+=f'<rect x="-10" y="0" width="{cx-58}" height="512" fill="{IRON[0]}" stroke="none"/><rect x="{cx+64}" y="0" width="200" height="512" fill="{IRON[2]}" stroke="none"/>'
    hoops=[244,282,320,358,396]
    for y in hoops:
        b+=f'<path d="M0 {y+7} H384" fill="none" stroke="{IRON[3]}" stroke-width="8" stroke-linecap="butt"/>'
        b+=f'<path d="M0 {y} H384" fill="none" stroke-width="5"/>'
    # placas do peito
    b+=f'<path d="M0 {top+70} Q{cx} {top+92} 384 {top+70} M0 {top+104} H384" fill="none" stroke-width="5"/>'
    b+='</g>'
    # abertura frontal
    b+=f'<path d="M{cx} {top+60} V{438+6}" fill="none" stroke-width="6"/>'
    b+='<use xlink:href="#lo" fill="none"/>'
    # tiras e fivelas de bronze atravessando a abertura
    for y in (top+86, 263, 339, 417):
        b+=f'<rect x="{cx-22}" y="{y-8}" width="44" height="16" rx="4" fill="{LEA[1]}" stroke-width="4"/>'
        b+=f'<rect x="{cx-8}" y="{y-11}" width="16" height="22" rx="4" fill="{BRZ[0]}" stroke-width="4"/>'
    for y in hoops[:-1]:
        b+=rivet(cx-96,y+19,BRZ[0],5)+rivet(cx+96,y+19,BRZ[1],5)
    # ombreiras: lâminas em arco, a de cima sobrepõe as de baixo
    import math
    for s_ in (-1,1):
        Cx=cx+s_*40; Cy=top+96
        for i in range(3,-1,-1):
            r1=34+i*20; r2=r1+26
            a0=math.radians(-90); a1=math.radians(-200 if s_<0 else 20)
            P=lambda r,a: (Cx+r*math.cos(a), Cy+r*math.sin(a))
            o0=P(r2,a0); o1=P(r2,a1); i1=P(r1,a1); i0=P(r1,a0)
            sw=0 if s_<0 else 1
            c=[IRON[0],IRON[0],IRON[1],IRON[1]][i] if s_<0 else [IRON[1],IRON[2],IRON[2],IRON[2]][i]
            p=f'M{f(o0[0])} {f(o0[1])} A{r2} {r2} 0 0 {sw} {f(o1[0])} {f(o1[1])} L{f(i1[0])} {f(i1[1])} A{r1} {r1} 0 0 {1-sw} {f(i0[0])} {f(i0[1])} Z'
            b+=f'<path d="{p}" fill="{c}"/>'
        b+=rivet(Cx,Cy-47,BRZ[0] if s_<0 else BRZ[1],5)
    b+='</g>'
    return svg(384,512,'Loriga Segmentada',b)


def jag(x0,x1,y,amp,n,seed=1):
    """borda irregular de pele, de x0 para x1"""
    import random
    r=random.Random(seed)
    pts=''
    for i in range(1,n+1):
        x=x0+(x1-x0)*i/n
        yy=y+(amp if i%2 else -amp*0.3)+r.uniform(-amp*0.4,amp*0.4)
        if i==n: yy=y
        pts+=f' L{f(x)} {f(yy)}'
    return pts

def cord(d,col=LIN,w=12):
    return (f'<path d="{d}" fill="none" stroke-width="{w+12}"/>'
            f'<path d="{d}" fill="none" stroke="{col[1]}" stroke-width="{w}"/>')

@item
def tanga_de_pele():
    cx=256; by=100
    b=G
    # aba de trás (mais larga, mais escura)
    back=f'M{cx-120} {by+20} L{cx+120} {by+20} L{cx+138} {by+150}'+jag(cx+138,cx-138,by+190,16,8,5)+' Z'
    b+=f'<path d="{back}" fill="{FUR[2]}"/>'
    # aba da frente
    flap=f'M{cx-92} {by+20} L{cx+92} {by+20} L{cx+80} {by+200}'+jag(cx+80,cx-80,by+290,20,6,3)+' Z'
    b+=f'<defs><path id="tf" d="{flap}"/><clipPath id="c-tf"><use xlink:href="#tf"/></clipPath></defs>'
    b+=f'<use xlink:href="#tf" fill="{FUR[1]}"/>'
    b+=shade('c-tf',cx-36,cx+40,FUR)
    b+=f'<path d="M{cx-50} {by+70} l10 22 M{cx-10} {by+130} l8 20 M{cx+40} {by+90} l8 20 M{cx+30} {by+200} l6 18 M{cx-52} {by+190} l8 18" fill="none" stroke="{FUR[2]}" stroke-width="5"/>'
    b+='<use xlink:href="#tf" fill="none"/>'
    # faixa dobrada sobre o cordão
    band=f'M{cx-104} {by} Q{cx} {by+12} {cx+104} {by} L{cx+98} {by+50} Q{cx} {by+62} {cx-98} {by+50} Z'
    b+=f'<defs><path id="tb" d="{band}"/><clipPath id="c-tb"><use xlink:href="#tb"/></clipPath></defs><use xlink:href="#tb" fill="{FUR[1]}"/>'
    b+=shade('c-tb',cx-44,cx+48,FUR)+'<use xlink:href="#tb" fill="none"/>'
    # cordão de couro cru
    b+=cord(f'M{cx-196} {by+14} Q{cx} {by+40} {cx+196} {by+14}',LIN,12)
    b+=cord(f'M{cx+136} {by+28} Q{cx+160} {by+70} {cx+150} {by+130}',LIN,10)+cord(f'M{cx+146} {by+28} Q{cx+190} {by+60} {cx+192} {by+112}',LIN,10)
    b+=f'<circle cx="{cx+140}" cy="{by+28}" r="14" fill="{LIN[1]}" stroke-width="5"/>'
    b+='</g>'
    return svg(512,512,'Tanga de Pele',b)

@item
def tunica_de_pele():
    cx=256; top=72
    d=torso(cx,top,74,46,26,176,120,300,116,420,134,hem=0,sh_drop=10,acurve=20)
    # trocar a barra por borda irregular
    i=d.index(' Q256 420')
    d=d[:i]+jag(cx-134,cx+134,420,20,9,7)+d[d.index(' L',i+5):] if False else d
    import re
    m=re.search(r' Q256 420 390 420',d)
    d=d[:m.start()]+jag(cx-134,cx+134,436,18,9,7)+d[m.end():]
    d=d.replace('L122 420','L118 436')
    d=d.replace('L390 420','L394 436')
    b=G
    b+=f'<defs><path id="tp" d="{d}"/><clipPath id="c-tp"><use xlink:href="#tp"/></clipPath></defs><use xlink:href="#tp" fill="{FUR[1]}"/>'
    b+=shade('c-tp',cx-62,cx+66,FUR)
    b+=f'<path d="M{cx-74} 140 l10 22 M{cx-30} 200 l8 20 M{cx+48} 150 l8 20 M{cx+70} 230 l8 18 M{cx-64} 360 l8 20 M{cx+20} 370 l8 20 M{cx+84} 380 l8 18 M{cx-14} 120 l6 16" fill="none" stroke="{FUR[2]}" stroke-width="5"/>'
    b+='<use xlink:href="#tp" fill="none"/>'
    # cordão na cintura
    b+=cord(f'M{cx-120} 304 Q{cx} 322 {cx+120} 304',LIN,12)
    b+=cord(f'M{cx-50} 316 Q{cx-56} 348 {cx-48} 380',LIN,9)+cord(f'M{cx-38} 316 Q{cx-26} 346 {cx-28} 372',LIN,9)
    b+=f'<circle cx="{cx-44}" cy="316" r="12" fill="{LIN[1]}" stroke-width="5"/>'
    b+='</g>'
    return svg(512,512,'Túnica de Pele',b)

@item
def tunica_armadura():
    cx=170.5; top=56
    d=torso(cx,top,62,34,18,166,80,300,80,456,92,hem=10,sh_drop=14,sleeve=(52,96,26,124),acurve=20)
    b=G+f'<defs><path id="ta" d="{d}"/><clipPath id="c-ta"><use xlink:href="#ta"/></clipPath></defs><use xlink:href="#ta" fill="{LIN[1]}"/>'
    b+=shade('c-ta',cx-48,cx+52,LIN)
    b+='<g clip-path="url(#c-ta)" fill="none">'
    xs=[cx-60,cx-36,cx-12,cx+12,cx+36,cx+60]
    b+='<path d="'+' '.join(f'M{f(x)} 110 V470' for x in xs if abs(x-cx)>1)+f'" stroke="{LIN[2]}" stroke-width="4"/>'
    b+=f'<path d="M0 {top+80} L{cx-36} {top+48} M341 {top+80} L{cx+36} {top+48}" stroke="{LIN[2]}" stroke-width="4"/>'
    b+='</g>'
    b+=f'<path d="M{cx} {top+36} V462" fill="none" stroke-width="5"/>'
    b+='<use xlink:href="#ta" fill="none"/>'
    # gola
    b+=f'<path d="M{cx-34} {top} Q{cx} {top+44} {cx+34} {top}" fill="none" stroke-width="20"/><path d="M{cx-34} {top} Q{cx} {top+44} {cx+34} {top}" fill="none" stroke="{LIN[0]}" stroke-width="9"/>'
    for y in (140,200,260):
        b+=f'<rect x="{cx-10}" y="{y-5}" width="20" height="10" rx="4" fill="{LEA[1]}" stroke-width="4"/>'
    b+='</g>'
    return svg(341,512,'Túnica',b)

@item
def jaqueta_de_couro():
    cx=170.5; top=60
    d=torso(cx,top,60,32,16,150,74,300,72,430,80,hem=6,sh_drop=14,sleeve=(58,290,24,304),acurve=20)
    b=G+f'<defs><path id="jq" d="{d}"/><clipPath id="c-jq"><use xlink:href="#jq"/></clipPath></defs><use xlink:href="#jq" fill="{LEA[1]}"/>'
    b+=shade('c-jq',cx-50,cx+54,LEA)
    # costuras das mangas
    b+=f'<path d="M{cx-74} 150 L{cx-62} {top+14} M{cx+74} 150 L{cx+62} {top+14}" fill="none" stroke-width="4.5"/>'
    # punhos
    b+=f'<path d="M{cx-112} 330 L{cx-82} 342 M{cx+112} 330 L{cx+82} 342" fill="none" stroke-width="4.5"/>'
    b+=f'<path d="M{cx} {top+34} V{436}" fill="none" stroke-width="5"/>'
    b+=f'<path d="M{cx-70} 394 Q{cx} 410 {cx+70} 394" fill="none" stroke-width="4.5"/>'
    b+='<use xlink:href="#jq" fill="none"/>'
    b+=f'<path d="M{cx-32} {top} L{cx-46} {top-4} L{cx-16} {top+66} L{cx} {top+32} Z" fill="{LEA[0]}"/>'
    b+=f'<path d="M{cx+32} {top} L{cx+46} {top-4} L{cx+16} {top+66} L{cx} {top+32} Z" fill="{LEA[2]}"/>'
    for y in (170,250,330):
        b+=f'<path d="M{cx-22} {y} H{cx+14}" fill="none" stroke-width="18"/><path d="M{cx-22} {y} H{cx+14}" fill="none" stroke="{LEA[2]}" stroke-width="8"/>'
        b+=buckle(cx+16,y,16,20)
    b+='</g>'
    return svg(341,512,'Jaqueta de Couro',b)

@item
def armadura_de_couro():
    cx=256; top=50; k=0.76; kx=1.18
    Y=lambda v: top+v*k
    d=cuir(cx,top,k,kx,nd=56)
    b=G
    # faldas largas de couro
    n=6; w=40
    x0=cx-n*w/2
    for i in range(n):
        t=i/(n-1); c=LEA[0] if t<0.25 else (LEA[2] if t>0.7 else LEA[1])
        x=x0+i*w
        b+=f'<path d="M{f(x+2)} {f(Y(330))} H{f(x+w-2)} V452 Q{f(x+w/2)} 466 {f(x+2)} 452 Z" fill="{c}"/>'
        b+=f'<path d="M{f(x+9)} {f(Y(350))} V444" fill="none" stroke="{LEA[2] if t<0.7 else WINE[2]}" stroke-width="3.5" stroke-dasharray="9 8"/>'
    b+=shape('ac',d,LEA,cx-64*kx,cx+70*kx)
    # costura da borda
    b+=f'<g clip-path="url(#c-ac)"><use xlink:href="#ac" fill="none" stroke="{LEA[2]}" stroke-width="30"/><use xlink:href="#ac" fill="none" stroke="{LEA[1]}" stroke-width="20"/></g>'
    b+=f'<g clip-path="url(#c-ac)"><rect x="0" y="0" width="{f(cx-64*kx)}" height="512" fill="{LEA[0]}" stroke="none" clip-path="url(#c-acin)"/></g>'
    b+=f'<g clip-path="url(#c-ac)"><use xlink:href="#ac" fill="none" stroke="{LEA[2]}" stroke-width="22" stroke-dasharray="1 0"/></g>' if False else ''
    b+='<use xlink:href="#ac" fill="none"/>'
    # cinto
    b+=f'<path d="M{f(cx-104*kx)} {f(Y(296))} Q{cx} {f(Y(316))} {f(cx+104*kx)} {f(Y(296))}" fill="none" stroke-width="34"/><path d="M{f(cx-104*kx)} {f(Y(296))} Q{cx} {f(Y(316))} {f(cx+104*kx)} {f(Y(296))}" fill="none" stroke="{WINE[1]}" stroke-width="22"/>'
    b+=buckle(cx,Y(306),36,34)
    for s_ in (-1,1):
        b+=f'<rect x="{f(cx+s_*92*kx-11)}" y="{top-6}" width="22" height="52" rx="5" fill="{LEA[0] if s_<0 else LEA[2]}"/>'
        b+=rivet(cx+s_*92*kx,top+34,IRON[1],5)
    b+=f'<path d="M{cx-60} {f(Y(140))} Q{cx-34} {f(Y(126))} {cx-6} {f(Y(138))}" fill="none" stroke="{LEA[0]}" stroke-width="8"/>'
    b+='</g>'
    return svg(512,512,'Armadura de Couro',b)


def mailbody(id_,d,x0,x1,y0,y1,step=20):
    b=f'<defs><path id="{id_}" d="{d}"/><clipPath id="c-{id_}"><use xlink:href="#{id_}"/></clipPath></defs><use xlink:href="#{id_}" fill="{IRON[1]}"/>'
    b+=shade('c-'+id_,x0,x1,IRON)
    b+=f'<g clip-path="url(#c-{id_})">'+rings(0,520,y0,y1,step,IRON[3],3)+'</g>'
    return b

@item
def camisa_de_cota_de_malha():
    cx=256; top=62
    d=torso(cx,top,74,42,16,180,104,320,100,438,112,hem=8,sh_drop=14,sleeve=(78,104,50,140),acurve=20)
    b=G+mailbody('cm',d,cx-66,cx+70,top-10,460,15)
    b+='<use xlink:href="#cm" fill="none"/>'
    neck=f'M{cx-42} {top} Q{cx} {top+32} {cx+42} {top}'
    b+=f'<path d="{neck}" fill="none" stroke-width="20"/><path d="{neck}" fill="none" stroke="{LEA[1]}" stroke-width="9"/>'
    b+='</g>'
    return svg(512,512,'Camisa de Cota de Malha',b)

@item
def cota_de_malha_longa():
    cx=192; top=44
    d=torso(cx,top,62,36,14,156,88,290,86,464,122,hem=10,sh_drop=12,sleeve=(70,118,44,148),acurve=18)
    # fenda frontal na barra
    import re
    m=re.search(r' Q192 476 304 464',d) or re.search(r' Q192 [0-9.]+ 304 464',d)
    b=G+mailbody('cl',d,cx-56,cx+60,top-10,490,14)
    b+='<use xlink:href="#cl" fill="none"/>'
    neck=f'M{cx-36} {top} Q{cx} {top+28} {cx+36} {top}'
    b+=f'<path d="{neck}" fill="none" stroke-width="20"/><path d="{neck}" fill="none" stroke="{LEA[1]}" stroke-width="9"/>'
    # cinto
    b+=f'<path d="M{cx-88} 284 Q{cx} 298 {cx+88} 284" fill="none" stroke-width="30"/><path d="M{cx-88} 284 Q{cx} 298 {cx+88} 284" fill="none" stroke="{LEA[1]}" stroke-width="18"/>'
    b+=buckle(cx-10,292,28,30)
    b+='</g>'
    return svg(384,512,'Cota de Malha Longa',b)

@item
def armadura_de_escamas_leve():
    cx=256; top=68
    d=torso(cx,top,84,48,24,184,128,320,120,420,126,hem=10,sh_drop=12,acurve=24)
    b=G+f'<defs><path id="el" d="{d}"/><clipPath id="c-el"><use xlink:href="#el"/></clipPath></defs><use xlink:href="#el" fill="{IRON[1]}"/>'
    b+=f'<g clip-path="url(#c-el)">'+scales(cx-150,cx+150,top+10,440,26,32,IRON,band=(cx-128,cx+128))+'</g>'
    b+='<use xlink:href="#el" fill="none"/>'
    # bordas de couro
    b+=f'<g clip-path="url(#c-el)"><use xlink:href="#el" fill="none" stroke-width="34"/><use xlink:href="#el" fill="none" stroke="{LEA[1]}" stroke-width="22"/></g>'
    b+='<use xlink:href="#el" fill="none"/>'
    b+='</g>'
    return svg(512,512,'Armadura de Escamas Leve',b)

@item
def armadura_de_escamas():
    cx=256; top=46
    d=torso(cx,top,74,44,18,170,112,310,108,462,126,hem=8,sh_drop=14,sleeve=(78,98,50,130),acurve=20)
    DK=(IRON[1],IRON[2],IRON[3])
    b=G+f'<defs><path id="ep" d="{d}"/><clipPath id="c-ep"><use xlink:href="#ep"/></clipPath></defs><use xlink:href="#ep" fill="{DK[1]}"/>'
    b+=f'<g clip-path="url(#c-ep)">'+scales(cx-200,cx+200,top-6,480,32,40,DK,band=(cx-150,cx+150))+'</g>'
    b+='<use xlink:href="#ep" fill="none"/>'
    neck=f'M{cx-44} {top} Q{cx} {top+36} {cx+44} {top}'
    b+=f'<path d="{neck}" fill="none" stroke-width="22"/><path d="{neck}" fill="none" stroke="{LEA[2]}" stroke-width="11"/>'
    b+=f'<path d="M{cx-106} 300 Q{cx} 316 {cx+106} 300" fill="none" stroke-width="32"/><path d="M{cx-106} 300 Q{cx} 316 {cx+106} 300" fill="none" stroke="{LEA[2]}" stroke-width="20"/>'
    b+=buckle(cx,310,32,32)
    b+='</g>'
    return svg(512,512,'Armadura de Escamas',b)


def body(id_,d,cols,x1,x2):
    return shape(id_,d,cols,x1,x2)

@item
def barrete_de_tecido():
    cx=256
    d=f'M{cx-128} 330 Q{cx-138} 120 {cx} 112 Q{cx+138} 120 {cx+128} 330 Q{cx+130} 380 {cx+98} 386 Q{cx+76} 386 {cx+74} 352 Q{cx} 336 {cx-74} 352 Q{cx-76} 386 {cx-98} 386 Q{cx-130} 380 {cx-128} 330 Z'
    b=G
    b+=cord(f'M{cx-100} 380 Q{cx-96} 420 {cx-80} 446',LIN,9)+cord(f'M{cx+100} 380 Q{cx+96} 420 {cx+80} 446',LIN,9)
    b+=shape('bt',d,LIN,cx-62,cx+66)
    b+='<g clip-path="url(#c-bt)" fill="none" stroke-width="4">'
    for k in (-2,-1,1,2):
        b+=f'<path d="M{cx} 112 Q{cx+k*46} 150 {cx+k*58} 380" stroke="{LIN[2]}"/>'
    b+=f'<path d="M{cx} 112 V350" stroke="{LIN[2]}"/>'
    b+='</g>'
    b+=f'<path d="M{cx-124} 316 Q{cx} 290 {cx+124} 316" fill="none" stroke-width="4.5"/>'
    b+='<use xlink:href="#bt" fill="none"/>'
    b+='</g>'
    return svg(512,512,'Barrete de Tecido',b)

@item
def barrete_de_couro():
    cx=256
    d=f'M{cx-134} 336 Q{cx-140} 140 {cx} 132 Q{cx+140} 140 {cx+134} 336 Q{cx} 316 {cx-134} 336 Z'
    b=G.replace('stroke-width="6"','stroke-width="5" transform="translate(256 256) scale(1.2) translate(-256 -250)"')+shape('bc',d,LEA,cx-64,cx+68)
    b+='<g clip-path="url(#c-bc)" fill="none" stroke-width="4.5">'
    b+=f'<path d="M{cx} 132 Q{cx-70} 170 {cx-80} 330 M{cx} 132 Q{cx+70} 170 {cx+80} 330"/>'
    b+=f'<path d="M{cx-14} 150 Q{cx-74} 190 {cx-94} 320" stroke="{LEA[2]}" stroke-dasharray="8 9"/>'
    b+='</g>'
    b+='<use xlink:href="#bc" fill="none"/>'
    # aro
    rim=f'M{cx-142} 330 Q{cx} 302 {cx+142} 330 L{cx+144} 370 Q{cx} 342 {cx-144} 370 Z'
    b+=shape('br',rim,LEA,cx-70,cx+74)
    b+=f'<path d="M{cx-130} 348 Q{cx} 322 {cx+130} 348" fill="none" stroke="{LEA[2]}" stroke-width="4" stroke-dasharray="8 9"/>'
    b+='<use xlink:href="#br" fill="none"/>'
    b+=f'<circle cx="{cx}" cy="128" r="14" fill="{LEA[1]}"/>'
    b+='</g>'
    return svg(512,512,'Barrete de Couro',b)

@item
def elmo_de_bronze():
    cx=256
    # coríntio, de frente
    d=(f'M{cx} 60 Q{cx+150} 62 {cx+152} 220 Q{cx+152} 330 {cx+176} 420 Q{cx+120} 452 {cx+40} 446 '
       f'Q{cx+30} 380 {cx+14} 300 L{cx-14} 300 Q{cx-30} 380 {cx-40} 446 Q{cx-120} 452 {cx-176} 420 '
       f'Q{cx-152} 330 {cx-152} 220 Q{cx-150} 62 {cx} 60 Z')
    b=G+shape('eb',d,BRZ,cx-84,cx+88)
    b+=f'<path d="M{cx-132} 200 Q{cx} 170 {cx+132} 200" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+=f'<path d="M{cx-120} 110 Q{cx-80} 76 {cx-30} 74" fill="none" stroke="{BRZ[0]}" stroke-width="8"/>'
    # aberturas dos olhos ligadas à fenda
    eyes=(f'M{cx-104} 232 Q{cx-64} 204 {cx-20} 222 L{cx-14} 304 L{cx-20} 304 Q{cx-28} 262 {cx-50} 258 Q{cx-84} 256 {cx-104} 232 Z '
          f'M{cx+104} 232 Q{cx+64} 204 {cx+20} 222 L{cx+14} 304 L{cx+20} 304 Q{cx+28} 262 {cx+50} 258 Q{cx+84} 256 {cx+104} 232 Z')
    b+=f'<path d="{eyes}" fill="{K}"/>'
    b+='<use xlink:href="#eb" fill="none"/>'
    # nasal
    b+=f'<path d="M{cx-20} 218 L{cx+20} 218 L{cx+14} 312 Q{cx} 322 {cx-14} 312 Z" fill="{BRZ[1]}"/>'
    b+=f'<path d="M{cx-8} 228 L{cx-6} 300" fill="none" stroke="{BRZ[0]}" stroke-width="6"/>'
    b+=f'<path d="M{cx-150} 408 Q{cx-100} 432 {cx-50} 432" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+=f'<path d="M{cx+150} 408 Q{cx+100} 432 {cx+50} 432" fill="none" stroke="{BRZ[2]}" stroke-width="5"/>'
    b+='</g>'
    return svg(512,512,'Elmo de Bronze',b)

@item
def celada_de_bronze():
    cx=170.5
    d=f'M{cx} 116 Q{cx+30} 120 {cx+60} 190 Q{cx+102} 280 {cx+112} 356 Q{cx} 372 {cx-112} 356 Q{cx-102} 280 {cx-60} 190 Q{cx-30} 120 {cx} 116 Z'
    b=G+shape('cbz',d,BRZ,cx-50,cx+54)
    b+=f'<path d="M{cx-50} 220 Q{cx-40} 170 {cx-14} 136" fill="none" stroke="{BRZ[0]}" stroke-width="8"/>'
    b+='<use xlink:href="#cbz" fill="none"/>'
    rim=f'M{cx-136} 352 Q{cx} 330 {cx+136} 352 Q{cx+142} 378 {cx+126} 384 Q{cx} 366 {cx-126} 384 Q{cx-142} 378 {cx-136} 352 Z'
    b+=shape('cbr',rim,BRZ,cx-70,cx+74)+'<use xlink:href="#cbr" fill="none"/>'
    b+=f'<path d="M{cx-14} 116 Q{cx} 92 {cx+14} 116 Z" fill="{BRZ[1]}"/>'
    b+='</g>'
    return svg(341,512,'Celada de Bronze',b)

@item
def elmo_de_couro():
    cx=256
    b=G
    # abas das bochechas
    for s_ in (-1,1):
        X=lambda v: cx+s_*v
        p=f'M{X(138)} 270 L{X(144)} 380 Q{X(130)} 432 {X(80)} 430 L{X(74)} 300 Z'
        b+=f'<path d="{p}" fill="{LEA[0] if s_<0 else LEA[2]}"/>'
        b+=f'<path d="M{X(124)} 300 L{X(128)} 380 Q{X(118)} 414 {X(90)} 414" fill="none" stroke="{LEA[2] if s_<0 else WINE[2]}" stroke-width="4" stroke-dasharray="8 9"/>'
        b+=rivet(X(116),296,IRON[1],6)
    d=f'M{cx-140} 300 Q{cx-146} 90 {cx} 84 Q{cx+146} 90 {cx+140} 300 Q{cx} 270 {cx-140} 300 Z'
    b+=shape('ec',d,LEA,cx-66,cx+70)
    b+='<g clip-path="url(#c-ec)" fill="none" stroke-width="4.5">'
    b+=f'<path d="M{cx-60} 300 Q{cx-60} 120 {cx} 84 M{cx+60} 300 Q{cx+60} 120 {cx} 84"/>'
    b+='</g>'
    b+='<use xlink:href="#ec" fill="none"/>'
    rim=f'M{cx-146} 288 Q{cx} 256 {cx+146} 288 L{cx+148} 322 Q{cx} 290 {cx-148} 322 Z'
    b+=shape('er',rim,LEA,cx-70,cx+74)
    b+=f'<path d="M{cx-134} 302 Q{cx} 272 {cx+134} 302" fill="none" stroke="{LEA[2]}" stroke-width="4" stroke-dasharray="8 9"/>'
    b+='<use xlink:href="#er" fill="none"/>'
    # nasal de couro
    b+=f'<path d="M{cx-18} 274 H{cx+18} L{cx+14} 392 Q{cx} 402 {cx-14} 392 Z" fill="{LEA[1]}"/>'
    b+=f'<path d="M{cx-6} 284 V384" fill="none" stroke="{LEA[0]}" stroke-width="6"/>'
    b+=rivet(cx,288,IRON[1],6)
    b+=f'<path d="M{cx-112} 140 Q{cx-80} 104 {cx-30} 98" fill="none" stroke="{LEA[0]}" stroke-width="8"/>' if False else ''
    b+='</g>'
    return svg(512,512,'Elmo de Couro',b)


@item
def elmo_de_legionario():
    # perfil 3/4 olhando para a esquerda
    cx=140
    b=G
    # protetor de nuca largo, inclinado para trás
    neck=f'M{cx+60} 236 Q{cx+112} 250 {cx+162} 298 L{cx+168} 328 Q{cx+112} 314 {cx+40} 306 Z'
    b+=shape('ln',neck,IRON,cx+70,cx+150)
    b+=f'<path d="M{cx+70} 270 Q{cx+116} 280 {cx+160} 310" fill="none" stroke-width="4.5"/>'
    b+='<use xlink:href="#ln" fill="none"/>'
    # calota
    d=f'M{cx-104} 262 Q{cx-118} 104 {cx} 100 Q{cx+112} 102 {cx+106} 262 Q{cx} 282 {cx-104} 262 Z'
    b+=shape('lg',d,IRON,cx-52,cx+56)
    b+=f'<path d="M{cx-90} 170 Q{cx-80} 128 {cx-34} 116" fill="none" stroke="{IRON[0]}" stroke-width="10" stroke-linecap="round"/>' if False else ''
    # reforço da testa (sobrancelha)
    b+=f'<path d="M{cx-104} 214 Q{cx-30} 196 {cx+60} 210" fill="none" stroke-width="22"/><path d="M{cx-104} 214 Q{cx-30} 196 {cx+60} 210" fill="none" stroke="{BRZ[0]}" stroke-width="10"/>'
    # reforço cruzado no topo
    b+=f'<path d="M{cx-60} 128 Q{cx+10} 108 {cx+90} 150" fill="none" stroke-width="20"/><path d="M{cx-60} 128 Q{cx+10} 108 {cx+90} 150" fill="none" stroke="{IRON[0]}" stroke-width="9"/>'
    b+='<use xlink:href="#lg" fill="none"/>'
    # recorte da orelha
    b+=f'<path d="M{cx+24} 274 Q{cx+44} 236 {cx+66} 270 Z" fill="{K}"/>'
    # protetor de bochecha articulado
    cheek=f'M{cx-84} 258 L{cx+16} 262 Q{cx+26} 340 {cx-2} 396 Q{cx-28} 418 {cx-50} 398 Q{cx-66} 360 {cx-62} 330 Q{cx-86} 300 {cx-84} 258 Z'
    b+=shape('lc',cheek,IRON,cx-46,cx+2)
    b+='<use xlink:href="#lc" fill="none"/>'
    b+=f'<rect x="{cx-50}" y="248" width="30" height="20" rx="5" fill="{BRZ[1]}" stroke-width="4"/>'
    b+=rivet(cx-20,370,BRZ[0],6)
    # botão da crista
    b+=f'<path d="M{cx-10} 102 L{cx-6} 80 H{cx+14} L{cx+18} 102 Z" fill="{BRZ[1]}"/>'
    b+=f'<circle cx="{cx+4}" cy="76" r="12" fill="{BRZ[0]}"/>'
    b+='</g>'
    return svg(341,512,'Elmo de Legionário',b)

@item
def coifa_de_cota_de_malha():
    cx=170.5
    d=(f'M{cx} 70 Q{cx+112} 72 {cx+110} 220 L{cx+110} 300 Q{cx+138} 330 {cx+138} 420 Q{cx} 444 {cx-138} 420 Q{cx-138} 330 {cx-110} 300 L{cx-110} 220 Q{cx-112} 72 {cx} 70 Z')
    b=G+mailbody('cf',d,cx-56,cx+60,60,460,14)
    b+='<use xlink:href="#cf" fill="none"/>'
    face=f'M{cx} 150 Q{cx+66} 152 {cx+66} 236 Q{cx+64} 316 {cx} 320 Q{cx-64} 316 {cx-66} 236 Q{cx-66} 152 {cx} 150 Z'
    b+=f'<path d="{face}" fill="{IRON[3]}" stroke-width="18"/><path d="{face}" fill="{K}" stroke="{LEA[1]}" stroke-width="8"/>'
    b+=f'<path d="{face}" fill="none" stroke-width="3"/>'
    b+='</g>'
    return svg(341,512,'Coifa de Cota de Malha',b)

@item
def elmo_circular():
    cx=256
    b=G
    d=f'M{cx} 64 Q{cx+164} 68 {cx+164} 236 Q{cx+164} 360 {cx+120} 410 L{cx+140} 450 Q{cx} 470 {cx-140} 450 L{cx-120} 410 Q{cx-164} 360 {cx-164} 236 Q{cx-164} 68 {cx} 64 Z'
    b+=shape('ci',d,IRON,cx-96,cx+100)
    b+=f'<path d="M{cx-120} 410 Q{cx} 432 {cx+120} 410" fill="none" stroke-width="4.5"/>'
    b+=f'<path d="M{cx-118} 120 Q{cx-84} 86 {cx-34} 82" fill="none" stroke="{IRON[0]}" stroke-width="10"/>'
    b+='<use xlink:href="#ci" fill="none"/>'
    # viseira arredondada
    v=f'M{cx-150} 196 Q{cx} 160 {cx+150} 196 Q{cx+158} 330 {cx+100} 384 Q{cx} 410 {cx-100} 384 Q{cx-158} 330 {cx-150} 196 Z'
    b+=shape('cv',v,IRON,cx-90,cx+96)
    b+=f'<path d="M{cx} 182 V400" fill="none" stroke="{IRON[0]}" stroke-width="8" transform="translate(-5 0)"/><path d="M{cx} 182 V400" fill="none" stroke="{IRON[2]}" stroke-width="8" transform="translate(5 0)"/><path d="M{cx} 180 V402" fill="none" stroke-width="4"/>'
    b+='<use xlink:href="#cv" fill="none"/>'
    # fendas
    b+=f'<path d="M{cx-126} 232 Q{cx-70} 218 {cx-14} 216 V232 Q{cx-70} 234 {cx-124} 248 Z M{cx+126} 232 Q{cx+70} 218 {cx+14} 216 V232 Q{cx+70} 234 {cx+124} 248 Z" fill="{K}"/>'
    b+=f'<path d="M{cx-120} 264 Q{cx-70} 252 {cx-14} 250 V262 Q{cx-70} 264 {cx-118} 276 Z M{cx+120} 264 Q{cx+70} 252 {cx+14} 250 V262 Q{cx+70} 264 {cx+118} 276 Z" fill="{K}"/>'
    # respiros
    g='<g fill="#0a0806" stroke="none">'
    for y in (310,336,362):
        for x in (cx+30,cx+56,cx+82):
            if y==362 and x==cx+82: continue
            g+=f'<circle cx="{x}" cy="{y}" r="6"/>'
    b+=g+'</g>'
    b+=rivet(cx-150,206,IRON[0],9)+rivet(cx+150,206,IRON[1],9)
    b+='</g>'
    return svg(512,512,'Elmo Circular',b)

@item
def mascara_facial_nt3():
    cx=256
    b=G
    for s_ in (-1,1):
        for y in (206,318):
            b+=strap(f'M{cx+s_*110} {y} L{cx+s_*196} {y+8}',LEA,22)
            b+=buckle(cx+s_*176,y+6,20,30)
    d=(f'M{cx} 96 Q{cx+122} 98 {cx+128} 210 Q{cx+130} 330 {cx+76} 392 Q{cx+36} 428 {cx} 430 Q{cx-36} 428 {cx-76} 392 Q{cx-130} 330 {cx-128} 210 Q{cx-122} 98 {cx} 96 Z')
    b+=shape('mf',d,IRON,cx-70,cx+76)
    # nariz
    b+=f'<path d="M{cx} 196 L{cx+26} 302 Q{cx} 316 {cx-26} 302 Z" fill="{IRON[1]}"/>'
    b+=f'<path d="M{cx} 196 L{cx-26} 302 Q{cx-12} 308 {cx-4} 308 Z" fill="{IRON[0]}" stroke="none"/>'
    b+=f'<path d="M{cx} 196 L{cx+26} 302 Q{cx} 316 {cx-26} 302 Z" fill="none"/>'
    # sobrancelha
    b+=f'<path d="M{cx-104} 186 Q{cx-56} 160 {cx-6} 186 M{cx+6} 186 Q{cx+56} 160 {cx+104} 186" fill="none" stroke-width="5"/>'
    b+=f'<path d="M{cx-98} 120 Q{cx-60} 104 {cx-20} 104" fill="none" stroke="{IRON[0]}" stroke-width="9"/>' if False else ''
    # olhos
    b+=f'<path d="M{cx-96} 222 Q{cx-58} 196 {cx-22} 222 Q{cx-58} 242 {cx-96} 222 Z M{cx+96} 222 Q{cx+58} 196 {cx+22} 222 Q{cx+58} 242 {cx+96} 222 Z" fill="{K}"/>'
    # boca e respiros
    b+=f'<path d="M{cx-50} 352 Q{cx} 342 {cx+50} 352 Q{cx} 362 {cx-50} 352 Z" fill="{K}"/>'
    b+='<use xlink:href="#mf" fill="none"/>'
    b+=rivet(cx-120,200,IRON[0],6)+rivet(cx-118,320,IRON[0],6)+rivet(cx+120,200,IRON[1],6)+rivet(cx+118,320,IRON[1],6)
    b+='</g>'
    return svg(512,512,'Máscara',b)

@item
def celada():
    # celada (sallet) de perfil, olhando para a esquerda, com aba de nuca longa
    cx=130
    b=G
    d=(f'M{cx-98} 320 Q{cx-118} 130 {cx+20} 124 Q{cx+120} 124 {cx+130} 240 Q{cx+140} 310 {cx+190} 348 '
       f'Q{cx+130} 362 {cx+80} 346 Q{cx} 330 {cx-98} 320 Z')
    b+=shape('sl',d,IRON,cx-44,cx+70)
    # quilha do crânio
    b+=f'<path d="M{cx-74} 176 Q{cx+10} 118 {cx+108} 176" fill="none" stroke-width="18"/><path d="M{cx-74} 176 Q{cx+10} 118 {cx+108} 176" fill="none" stroke="{IRON[0]}" stroke-width="8"/>'
    b+=f'<path d="M{cx-96} 300 Q{cx} 312 {cx+84} 328 Q{cx+140} 340 {cx+180} 344" fill="none" stroke-width="4.5"/>'
    b+='<use xlink:href="#sl" fill="none"/>'
    b+=rivet(cx-70,296,IRON[0],6)+rivet(cx,304,IRON[1],6)+rivet(cx+70,316,IRON[1],6)
    b+='</g>'
    return svg(341,512,'Celada',b)

def center(svgs):
    import cairosvg, io, re
    from PIL import Image
    png=cairosvg.svg2png(bytestring=svgs.encode())
    im=Image.open(io.BytesIO(png)); w,h=im.size; bb=im.getbbox()
    dx=round(((w-bb[2])-bb[0])/2); dy=round(((h-bb[3])-bb[1])/2)
    if abs(dx)<=2 and abs(dy)<=2: return svgs
    i=svgs.index('</title>')+len('</title>')
    j=svgs.rindex('</svg>')
    return svgs[:i]+f'\n<g transform="translate({dx} {dy})">'+svgs[i:j]+'</g>\n'+svgs[j:]

if __name__=='__main__':
    for a in sys.argv[1:]:
        save(a, center(ITEMS[a]()))
