OUT='data/svgicons/'
I=('#b5ae9c','#8a8579','#5f5b52')
import math
def arc(r,a0,a1,col,w=5,cx=256,cy=256):
    p=lambda a:(cx+r*math.cos(math.radians(a)),cy+r*math.sin(math.radians(a)))
    x0,y0=p(a0);x1,y1=p(a1)
    return f'    <path d="M{x0:.1f} {y0:.1f} A{r} {r} 0 0 1 {x1:.1f} {y1:.1f}" fill="none" stroke="{col}" stroke-width="{w}"/>\n'
def rimhl(r): return arc(r-1,155,265,'#b5ae9c')+arc(r,-15,95,'#5f5b52')
def circ(cx,cy,r): return f'M{cx-r} {cy} a{r} {r} 0 1 0 {2*r} 0 a{r} {r} 0 1 0 {-2*r} 0 Z'
def domed(cid,cx,cy,r,tones,k=0.12,lw=0.16):
    l,m,d=tones; o=int(r*k)
    s=f'    <defs><clipPath id="{cid}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs>\n'
    s+=f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{m}"/>\n'
    s+=f'    <g clip-path="url(#{cid})" stroke="none">\n'
    s+=f'      <path d="{circ(cx,cy,r+2)} {circ(cx+o,cy+o,r)}" fill="{l}" fill-rule="evenodd"/>\n'
    s+=f'      <path d="{circ(cx,cy,r+2)} {circ(cx-o,cy-o,r)}" fill="{d}" fill-rule="evenodd"/>\n    </g>\n'
    s+=f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="none"/>\n'
    return s

# escudo leve: broquel
r=196
s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img">\n  <title>Escudo leve</title>\n  <g stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">\n'
s+='    <!-- face de couro sobre madeira -->\n'+domed('c-face',256,256,186,('#a07850','#7c5a3a','#573d26'),k=0.15)
s+='    <!-- costura -->\n    <circle cx="256" cy="256" r="160" fill="none" stroke="#573d26" stroke-width="4" stroke-dasharray="10 12"/>\n'
s+='    <!-- aro de ferro -->\n'
s+='    <circle cx="256" cy="256" r="190" fill="none" stroke-width="26"/>\n    <circle cx="256" cy="256" r="190" fill="none" stroke="#8a8579" stroke-width="13"/>\n'
s+=rimhl(190)
s+='    <!-- umbo -->\n'+domed('c-aba',256,256,104,I,k=0.06)
s+=''.join(f'    <circle cx="{256+x}" cy="{256+y}" r="8" fill="#8a8579" stroke-width="3.5"/>\n' for x,y in [(0,-88),(88,0),(0,88),(-88,0)])
s+=domed('c-umbo',256,256,68,I,k=0.16)
s+='  </g>\n</svg>\n'
open(OUT+'escudo-leve.svg','w').write(s)

# escudo pequeno: redondo de tábuas
s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img">\n  <title>Escudo pequeno</title>\n'
s+='  <defs><clipPath id="c-tab"><circle cx="256" cy="256" r="210"/></clipPath></defs>\n'
s+='  <g stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">\n'
s+='    <circle cx="256" cy="256" r="210" fill="#7a5a3a"/>\n'
s+='    <g clip-path="url(#c-tab)">\n      <g stroke="none">\n'
s+='        <rect x="30" y="30" width="110" height="460" fill="#9a7448"/>\n'
s+='        <rect x="372" y="30" width="110" height="460" fill="#55391f"/>\n      </g>\n'
s+='      <!-- tábuas -->\n      <path d="M140 30 V490 M214 30 V490 M298 30 V490 M372 30 V490" fill="none" stroke-width="5"/>\n'
s+=''
s+='    </g>\n'
s+='    <!-- aro de ferro -->\n    <circle cx="256" cy="256" r="206" fill="none" stroke-width="26"/>\n    <circle cx="256" cy="256" r="206" fill="none" stroke="#8a8579" stroke-width="13"/>\n'
s+=rimhl(206)
s+='    <!-- umbo -->\n'+domed('c-aba',256,256,82,I,k=0.06)
s+=''.join(f'    <circle cx="{256+x}" cy="{256+y}" r="7" fill="#8a8579" stroke-width="3.5"/>\n' for x,y in [(0,-68),(68,0),(0,68),(-68,0)])
s+=domed('c-umbo',256,256,52,I,k=0.18)
s+='  </g>\n</svg>\n'
open(OUT+'escudo-pequeno.svg','w').write(s)
