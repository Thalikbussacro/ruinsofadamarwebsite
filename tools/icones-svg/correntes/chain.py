import math, re
def cubic(p0,p1,p2,p3,t):
    u=1-t
    return tuple(u**3*a+3*u*u*t*b+3*u*t*t*c+t**3*d for a,b,c,d in zip(p0,p1,p2,p3))
def sample(segs,n=400):
    pts=[]
    for s in segs:
        for i in range(n+1): pts.append(cubic(*s,i/n))
    return pts
def links(segs,step,w,start_flat=True,skip_ends=0):
    """segs: lista de cúbicas (p0,p1,p2,p3). Retorna lista de (tipo,x,y,ang)."""
    pts=sample(segs); acc=[0]
    for a,b in zip(pts,pts[1:]): acc.append(acc[-1]+math.dist(a,b))
    L=acc[-1]; out=[]; k=0
    n=max(1,round(L/step)); step=L/n; d=step/2
    while d<=L-step/2+1e-6:
        i=next(j for j,v in enumerate(acc) if v>=d)
        a,b=pts[max(i-1,0)],pts[min(i+1,len(pts)-1)]
        ang=math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))
        out.append(('flat' if (k%2==0)==start_flat else 'edge',pts[i][0],pts[i][1],ang))
        d+=step; k+=1
    return out
def svg(lks,step,w,iron=('#b5ae9c','#8a8579','#5f5b52'),ol='#0a0806'):
    s=[]
    rx=step*0.62; ry=w
    for t,x,y,a in lks:
        if t=='edge':
            dx=math.cos(math.radians(a))*rx*0.8; dy=math.sin(math.radians(a))*rx*0.8
            d=f'M{x-dx:.1f} {y-dy:.1f} L{x+dx:.1f} {y+dy:.1f}'
            s.append(f'<path d="{d}" stroke="{ol}" stroke-width="{ry*1.6:.1f}"/>')
            s.append(f'<path d="{d}" stroke="{iron[1]}" stroke-width="{ry*1.6-10:.1f}"/>')
        else:
            s.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" transform="rotate({a:.1f} {x:.1f} {y:.1f})" stroke="{ol}" stroke-width="16"/>')
            s.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" transform="rotate({a:.1f} {x:.1f} {y:.1f})" stroke="{iron[1]}" stroke-width="7"/>')
    return s
