import math
OUT='data/svgicons/'
def mesh(sp,ox=0):
    d=''
    for i in range(-12,14):
        c=i*sp+ox
        d+=f'M{c-600} {-600+256+256} L{c+600} {600+256-256} '  # placeholder
    return d
SAG=36
def diag(sp,off=0):
    d=''
    for k in range(-14,15):
        b=k*sp+off
        # lines y = x + b  and y = -x + b'
        d+=f'M0 {b} Q256 {256+b+SAG} 512 {512+b} '
        d+=f'M0 {512-b} Q256 {256-b+SAG} 512 {-b} '
    return d
def weight(x,y,r):
    return (f'    <path d="M{x} {y-r-8} V{y}" fill="none" stroke-width="5"/>\n'
            f'    <circle cx="{x}" cy="{y}" r="{r}" fill="#6e7173"/>\n'
            f'    <path d="M{x-r*0.55:.1f} {y-r*0.1:.1f} Q{x-r*0.45:.1f} {y-r*0.6:.1f} {x:.1f} {y-r*0.62:.1f}" fill="none" stroke="#b2b4b3" stroke-width="4"/>\n')
def net(id,title,outline,sp,off,weights,r,extra='',pre='',tf=''):
    s=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" role="img">
  <title>{title}</title>
  <defs>
    <path id="borda" d="{outline}"/>
    <clipPath id="c-borda"><use xlink:href="#borda"/></clipPath>
  </defs>
  <g {tf}stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
{pre}    <!-- malha -->
    <g clip-path="url(#c-borda)" fill="none">
      <path d="{diag(sp,off)}" stroke-width="9"/>
      <path d="{diag(sp,off)}" stroke="#b5a98a" stroke-width="4"/>
    </g>
    <!-- corda da borda -->
    <use xlink:href="#borda" fill="none" stroke-width="16"/>
    <use xlink:href="#borda" fill="none" stroke="#b5a98a" stroke-width="7"/>
{extra}    <!-- pesos de chumbo -->
'''
    for x,y in weights: s+=weight(x,y,r)
    s+='  </g>\n</svg>\n'
    open(OUT+id+'.svg','w').write(s)
net('rede-grande','Rede grande',
    'M66 72 Q182 107 256 58 Q330 107 446 72 Q410 184 462 256 Q410 328 446 440 Q330 405 256 454 Q182 405 66 440 Q102 328 50 256 Q102 184 66 72 Z',
    38,0,[(66, 72), (256, 58), (446, 72), (462, 256), (446, 440), (256, 454), (66, 440), (50, 256)],19,tf='transform="translate(256 261) scale(0.9) translate(-256 -256)" ')
net('rede-de-combate','Rede de combate',
    'M110 120 Q193 123 250 70 Q305 127 390 130 Q369 211 410 280 Q341 314 320 388 Q245 354 170 380 Q148 307 76 270 Q124 203 110 120 Z',
    54,10,[(110, 120), (250, 70), (390, 130), (410, 280), (320, 388), (170, 380), (76, 270)],17,
    extra='''    <!-- corda de recolher -->
    <path d="M320 388 Q360 446 410 430 Q452 414 432 384 Q410 360 390 392 Q380 420 420 456" fill="none" stroke-width="13"/>
    <path d="M320 388 Q360 446 410 430 Q452 414 432 384 Q410 360 390 392 Q380 420 420 456" fill="none" stroke="#d8cdb0" stroke-width="5"/>
''')
