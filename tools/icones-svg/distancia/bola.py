import sys,math
from rope import rope
def circ(cx,cy,r): return f'M{cx-r} {cy} a{r} {r} 0 1 0 {2*r} 0 a{r} {r} 0 1 0 {-2*r} 0 Z'
def domed(cid,cx,cy,r,tones,k=0.16):
    l,m,d=tones; o=int(r*k)
    s=f'    <defs><clipPath id="{cid}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs>\n'
    s+=f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{m}"/>\n'
    s+=f'    <g clip-path="url(#{cid})" stroke="none">\n'
    s+=f'      <path d="{circ(cx,cy,r+2)} {circ(cx+o,cy+o,r)}" fill="{l}" fill-rule="evenodd"/>\n'
    s+=f'      <path d="{circ(cx,cy,r+2)} {circ(cx-o,cy-o,r)}" fill="{d}" fill-rule="evenodd"/>\n    </g>\n'
    s+=f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="none"/>\n'
    return s
K=(250,236); B=[(102,108),(414,170),(214,410)]; R=50
s='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img">
  <title>Boleadeira</title>
  <g stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- cordas -->
'''
C=[((210,160),(130,200)),((320,250),(350,140)),((200,300),(290,340))]
for (x,y),(c1,c2) in zip(B,C):
    s+=rope(f'M{K[0]} {K[1]} C{c1[0]} {c1[1]} {c2[0]} {c2[1]} {x} {y}',w=14,dark=25)
s+='    <!-- pedras envoltas -->\n'
for i,(x,y) in enumerate(B):
    s+=domed(f'c-b{i}',x,y,R,('#a07850','#7c5a3a','#573d26'),k=0.2)
    s+=f'    <path d="M{x-R+8} {y-6} Q{x} {y+22} {x+R-8} {y-6}" fill="none" stroke-width="4"/>\n'
    a=math.atan2(K[1]-y,K[0]-x); cx=x+math.cos(a)*(R-10); cy=y+math.sin(a)*(R-10)
    s+=f'    <circle cx="{cx:.0f}" cy="{cy:.0f}" r="15" fill="#b5a98a"/>\n'
    s+=f'    <path d="M{cx-8:.0f} {cy+1:.0f} Q{cx-9:.0f} {cy-9:.0f} {cx+1:.0f} {cy-11:.0f}" fill="none" stroke="#d8cdb0" stroke-width="4"/>\n'
s+='    <!-- nó central -->\n'
s+=f'    <circle cx="{K[0]}" cy="{K[1]}" r="17" fill="#b5a98a"/>\n    <path d="M{K[0]-9} {K[1]+1} Q{K[0]-7} {K[1]-8} {K[0]+1} {K[1]-9}" fill="none" stroke="#d8cdb0" stroke-width="4.5"/>\n'
s+='  </g>\n</svg>\n'
open('data/svgicons/boleadeira.svg','w').write(s)
