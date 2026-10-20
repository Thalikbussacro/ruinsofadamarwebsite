import sys
from rope import rope
def ell(cx,cy,rx,ry): return f'M{cx-rx} {cy} A{rx} {ry} 0 1 0 {cx+rx} {cy} A{rx} {ry} 0 1 0 {cx-rx} {cy} Z'
s='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img">
  <title>Laço</title>
  <g transform="translate(-7 0)" stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- rolo de corda -->
'''
for cx,cy,rx,ry in [(164,318,104,130),(186,310,100,126),(208,302,96,122)]:
    s+=rope(ell(cx,cy,rx,ry),w=17,dark=29)
s+='    <!-- laço corrediço -->\n'
s+=rope('M292 196 Q250 210 230 182 M292 196 Q268 120 340 82 Q420 50 456 104 Q484 160 430 214 Q380 254 304 210',w=17,dark=29)
s+='    <!-- olhal (nó) -->\n'
s+=rope('M286 188 Q278 218 304 222 Q326 216 316 194 Q302 180 286 188 Z',w=14,dark=24,twist=False)
s+='  </g>\n</svg>\n'
open('data/svgicons/laco.svg','w').write(s)
