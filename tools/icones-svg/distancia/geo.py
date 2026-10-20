import math
def cubic(p0,p1,p2,p3,n=40):
    out=[]
    for i in range(n+1):
        t=i/n; a=(1-t)**3; b=3*(1-t)**2*t; c=3*(1-t)*t*t; d=t**3
        out.append((a*p0[0]+b*p1[0]+c*p2[0]+d*p3[0], a*p0[1]+b*p1[1]+c*p2[1]+d*p3[1]))
    return out
def chain(segs,n=40):
    pts=[]
    for s in segs:
        p=cubic(*s,n=n)
        pts+= p if not pts else p[1:]
    return pts
def normals(pts):
    ns=[]
    for i in range(len(pts)):
        a=pts[max(i-1,0)]; b=pts[min(i+1,len(pts)-1)]
        dx,dy=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dy) or 1
        ns.append((-dy/L,dx/L))
    return ns
def off(pts,wf,k):
    """offset pts by k*halfwidth along normal; wf(s)->halfwidth, s in [0,1]"""
    ns=normals(pts); n=len(pts)
    return [(p[0]+nn[0]*k*wf(i/(n-1)), p[1]+nn[1]*k*wf(i/(n-1))) for i,(p,nn) in enumerate(zip(pts,ns))]
def poly(a,b=None):
    pts=a+(list(reversed(b)) if b else [])
    return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)+(' Z' if b else '')
def band(pts,wf,k0,k1):
    return poly(off(pts,wf,k0),off(pts,wf,k1))
def shape(pts,wf):
    return band(pts,wf,-1,1)
