import sys
from chain import *
segs=[((80,152),(62,20),(194,20),(176,152))]
step=32; w=10
lk=links(segs,step,w)
ch='\n      '.join(svg(lk,step,w))
def stick(cx,cy,ang):
    return f'''    <g transform="rotate({ang} {cx} {cy})">
      <rect x="{cx-23}" y="{cy-160}" width="46" height="320" rx="14" fill="#7a5a3a"/>
      <path d="M{cx-12} {cy-120} V{cy+146}" fill="none" stroke="#9a7448" stroke-width="8"/>
      <path d="M{cx+12} {cy-120} V{cy+146}" fill="none" stroke="#55391f" stroke-width="6"/>
      <path d="M{cx-23} {cy+60} H{cx+23} M{cx-23} {cy+100} H{cx+23}" fill="none" stroke-width="4"/>
      <rect x="{cx-25}" y="{cy-164}" width="50" height="36" rx="10" fill="#8a8579"/>
      <path d="M{cx-15} {cy-156} V{cy-136}" fill="none" stroke="#b5ae9c" stroke-width="5"/>
      <path d="M{cx+15} {cy-156} V{cy-136}" fill="none" stroke="#5f5b52" stroke-width="5"/>
    </g>'''
out=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" role="img">
  <title>Nunchaku</title>
  <g stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- corrente curta (traço duplo por elo) -->
    <g fill="none">
      {ch}
    </g>
    <!-- clavas de madeira com ponteira de ferro -->
{stick(80,312,2)}
{stick(176,312,-2)}
  </g>
</svg>
'''
open('data/svgicons/nunchaku.svg','w').write(out)
