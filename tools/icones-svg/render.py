import sys, cairosvg, subprocess, os
root='data/svgicons'
import tempfile
S = os.path.join(tempfile.gettempdir(), 'icones-svg')  # previews e folhas de revisão, fora do repositório
for slug in sys.argv[1:]:
    svg=f'{root}/{slug}.svg'; os.makedirs(S+'/preview',exist_ok=True); p=f'{S}/preview/{slug}'
    # lado maior = 512
    cairosvg.svg2png(url=svg, write_to=p+'-512.png', output_width=None, scale=1)
    from PIL import Image
    im=Image.open(p+'-512.png'); w,h=im.size; k=512/max(w,h)
    cairosvg.svg2png(url=svg, write_to=p+'-512.png', scale=k)
    cairosvg.svg2png(url=svg, write_to=p+'-dark.png', scale=k, background_color='#14110e')
    cairosvg.svg2png(url=svg, write_to=p+'-64.png', scale=k/8)
    # folha de revisão: dark 512 + 64 em dark ampliado 4x (nearest)
    d=Image.open(p+'-dark.png').convert('RGBA')
    s=Image.open(p+'-64.png').convert('RGBA'); bg=Image.new('RGBA',s.size,'#14110e'); bg.alpha_composite(s)
    big=bg.resize((s.width*4,s.height*4),Image.NEAREST)
    sheet=Image.new('RGBA',(d.width+big.width+20+64+20,max(d.height,big.height)),'#2a2520')
    sheet.paste(d,(0,0)); sheet.paste(big,(d.width+20,0)); sheet.paste(bg,(d.width+40+big.width,0))
    sheet.save(f'{S}/{slug}-sheet.png'); print(slug, d.size, s.size)
