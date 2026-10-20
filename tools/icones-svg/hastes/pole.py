OUT='data/svgicons/'
W={'l':'#9a7448','m':'#7a5a3a','d':'#55391f'}
I={'l':'#b5ae9c','m':'#8a8579','d':'#5f5b52','dd':'#4a463f'}
def haft(y0,y1,w=26,wood=W):
    h=w/2
    return f'''<rect x="{-h}" y="{y0}" width="{w}" height="{y1-y0}" rx="{min(10,h)}" fill="{wood['m']}"/>
    <path d="M{-h+7} {y0+12} V{y1-12}" fill="none" stroke="{wood['l']}" stroke-width="6"/>
    <path d="M{h-6} {y0+12} V{y1-12}" fill="none" stroke="{wood['d']}" stroke-width="4"/>'''
def grip(y0,y1,w=32):
    h=w/2; n=int((y1-y0-10)//24)
    lines=' '.join(f'M{-h} {y0+18+24*i} L{h} {y0+8+24*i}' for i in range(n))
    return f'''<rect x="{-h}" y="{y0}" width="{w}" height="{y1-y0}" rx="8" fill="#6b2a24"/>
    <path d="M{-h+7} {y0+8} V{y1-8}" fill="none" stroke="#8a3a32" stroke-width="6"/>
    <path d="{lines}" fill="none" stroke-width="4"/>'''
def band(y0,y1,w=34):
    h=w/2
    return f'''<rect x="{-h}" y="{y0}" width="{w}" height="{y1-y0}" rx="6" fill="#8a8579"/>
    <path d="M{-h+8} {y0+8} V{y1-8}" fill="none" stroke="#b5ae9c" stroke-width="6"/>'''
def butt(y0,y1,w=30):
    h=w/2
    return f'''<path d="M{-h} {y0} H{h} L{h-5} {y1} Q0 {y1+6} {-h+5} {y1} Z" fill="#8a8579"/>
    <path d="M{-h+8} {y0+8} L{-h+10} {y1-6}" fill="none" stroke="#b5ae9c" stroke-width="5"/>'''
def svg(name,title,body,tf='translate(256 256) rotate(45)'):
    s=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img">
  <title>{title}</title>
  <!-- Desenhado na vertical; rotate(45) leva a cabeça para o alto à direita
       e faz a luz local (vinda da esquerda) cair de cima à esquerda. -->
  <g transform="{tf}" stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    {body}
  </g>
</svg>
'''
    open(OUT+name+'.svg','w').write(s)
def bbox(name):
    from PIL import Image
    return Image.open(f'{__import__("tempfile").gettempdir()}/icones-svg/preview/{name}-512.png').getbbox()
