OUT='data/svgicons/'
def capa(id,title,T,heavy):
    l,m,d=T
    body=('M204 118 Q150 220 70 444 Q112 472 158 452 Q204 478 256 458 Q308 478 354 452 Q400 472 442 444 Q362 220 308 118 Z' if heavy else
          'M212 118 Q170 220 104 444 Q140 468 180 452 Q218 474 256 458 Q294 474 332 452 Q372 468 408 444 Q342 220 300 118 Z')
    s=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" role="img">
  <title>{title}</title>
  <defs>
    <path id="corpo" d="{body}"/>
    <clipPath id="c-corpo"><use xlink:href="#corpo"/></clipPath>
  </defs>
  <g stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- capuz caído nas costas -->
    <path d="M186 134 Q180 72 256 38 Q332 72 326 134 Z" fill="{m}"/>
    <path d="M198 124 Q196 80 246 50" fill="none" stroke="{l}" stroke-width="8"/>
    <path d="M214 134 Q216 96 256 74 Q296 96 298 134 Z" fill="{"#2c2823" if heavy else "#6e6552"}"/>
    <!-- corpo da capa -->
    <use xlink:href="#corpo" fill="{m}"/>
    <g clip-path="url(#c-corpo)" stroke="none">
      <path d="M200 100 Q140 230 40 480 H150 Q170 300 222 120 Z" fill="{l}"/>
      <path d="M312 100 Q372 230 472 480 H372 Q342 300 290 120 Z" fill="{d}"/>
      <!-- abertura frontal mostrando o forro -->
      <path d="M256 124 Q236 300 226 470 H286 Q276 300 256 124 Z" fill="{d}"/>
    </g>
    <!-- dobras -->
    <path d="M226 150 Q196 300 158 452 M286 150 Q316 300 354 452 M256 140 Q240 300 232 462 M256 140 Q272 300 280 462" fill="none" stroke-width="4.5"/>
    <use xlink:href="#corpo" fill="none"/>
'''
    if heavy:
        s+=f'''    <!-- gola de pele -->
    <path d="M182 108 Q256 84 330 108 Q350 140 334 170 Q256 192 178 170 Q162 140 182 108 Z" fill="#7e6a4e"/>
    <path d="M186 118 Q182 140 192 160 M214 104 Q206 128 214 150" fill="none" stroke="#a08a6a" stroke-width="6"/>
    <path d="M326 118 Q332 140 322 160" fill="none" stroke="#5a4a36" stroke-width="6"/>
    <path d="M178 170 Q196 178 210 172 Q228 184 246 176 Q262 186 280 176 Q298 184 316 172 Q326 178 334 170" fill="none" stroke-width="4"/>
    <!-- fecho de bronze -->
    <circle cx="256" cy="150" r="20" fill="#9a7a46"/>
    <path d="M243 146 Q246 135 256 133" fill="none" stroke="#c4a066" stroke-width="5"/>
    <circle cx="256" cy="150" r="7" fill="#6e5530" stroke-width="3.5"/>
'''
    else:
        s+=f'''    <!-- cordão -->
    <path d="M226 128 Q256 142 286 128" fill="none" stroke-width="10"/>
    <path d="M226 128 Q256 142 286 128" fill="none" stroke="#b5a98a" stroke-width="4"/>
    <path d="M256 136 Q248 160 240 182 M256 136 Q266 160 272 184" fill="none" stroke-width="10"/>
    <path d="M256 136 Q248 160 240 182 M256 136 Q266 160 272 184" fill="none" stroke="#b5a98a" stroke-width="4"/>
    <circle cx="256" cy="136" r="8" fill="#b5a98a" stroke-width="4"/>
'''
    s+='  </g>\n</svg>\n'
    open(OUT+id+'.svg','w').write(s)
capa('capa-pesada','Capa pesada',('#7a7264','#5e574b','#433e35'),True)
capa('capa-leve','Capa leve',('#d8cdb0','#b5a98a','#8f8468'),False)
