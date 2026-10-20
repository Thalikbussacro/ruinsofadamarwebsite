import sys, os
from PIL import Image, ImageDraw
import tempfile
S = os.path.join(tempfile.gettempdir(), 'icones-svg')  # previews e folhas de revisão, fora do repositório
out=sys.argv[1]; ids=sys.argv[2:]
cell=200; cols=5; small=64
rows=(len(ids)+cols-1)//cols
sheet=Image.new('RGB',(cols*(cell+small+30)+10, rows*(cell+30)+10),'#14110e')
d=ImageDraw.Draw(sheet)
for n,i in enumerate(ids):
    r,c=divmod(n,cols); x=10+c*(cell+small+30); y=10+r*(cell+30)
    im=Image.open(f'{S}/preview/{i}-dark.png').convert('RGB'); im.thumbnail((cell,cell))
    sheet.paste(im,(x+(cell-im.width)//2,y+(cell-im.height)//2))
    sm=Image.open(f'{S}/preview/{i}-64.png').convert('RGBA'); bg=Image.new('RGBA',sm.size,'#14110e'); bg.alpha_composite(sm)
    sheet.paste(bg.convert('RGB'),(x+cell+8,y+(cell-sm.height)//2))
    d.text((x,y+cell+4),i[:40],fill='#c9a45c')
sheet.save(out)
