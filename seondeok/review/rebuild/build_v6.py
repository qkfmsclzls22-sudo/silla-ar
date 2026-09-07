"""Rebuild portrait geometry and bake generated reference textures into the GLB.

MediaPipe canonical face topology is distributed with its Apache 2.0 license.
The generated portrait is a creative character design, not a historical likeness.
"""
from pathlib import Path
import sys, json, copy, struct, io, hashlib
import numpy as np
from scipy.interpolate import CubicSpline
from scipy.sparse import coo_matrix, diags
from scipy.spatial import cKDTree
from scipy.ndimage import map_coordinates, gaussian_filter, distance_transform_edt
from PIL import Image
from skimage.measure import marching_cubes
from gltf_tools import load, accessor, unit, normals, tangents, sample, srgb, render

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'v6_assets'
SOURCE = ROOT.parents[1] / 'queen_seondeok_refined_v5.glb'
DEST = ROOT.parents[1] / 'queen_seondeok_refined_v6.glb'


class Builder:
    def __init__(self, j, b):
        self.j = copy.deepcopy(j)
        self.b = bytearray(b)

    def view(self, b):
        self.b.extend(b'\0' * (-len(self.b) % 4))
        idx = len(self.j['bufferViews'])
        self.j['bufferViews'].append({'buffer': 0, 'byteOffset': len(self.b), 'byteLength': len(b)})
        self.b.extend(b)
        return idx

    def acc(self, a, kind):
        dtype = '<u4' if kind == 'SCALAR' else '<f4'
        a = np.asarray(a, dtype=dtype)
        d = {'bufferView': self.view(a.tobytes()), 'componentType': 5125 if kind == 'SCALAR' else 5126, 'count': len(a), 'type': kind}
        if kind == 'VEC3':
            d.update(min=a.min(0).tolist(), max=a.max(0).tolist())
        self.j['accessors'].append(d)
        return len(self.j['accessors'])-1

    def texture(self, path, name):
        im = Image.open(path).convert('RGB')
        stream = io.BytesIO()
        im.save(stream, format='JPEG', quality=96, subsampling=0)
        ii = len(self.j['images'])
        self.j['images'].append({'bufferView': self.view(stream.getvalue()), 'mimeType': 'image/jpeg', 'name': name})
        self.j['textures'].append({'source': ii})
        return len(self.j['textures'])-1

    def material(self, name, color, rough=.6, metal=0, tex=None):
        p = {'baseColorFactor': list(color)+[1], 'roughnessFactor': rough, 'metallicFactor': metal}
        if tex is not None:
            p['baseColorTexture'] = {'index': tex}
        self.j['materials'].append({'name': name, 'doubleSided': True, 'pbrMetallicRoughness': p})
        return len(self.j['materials'])-1

    def mesh(self, name, v, f, mat, uv=None, colors=None, nn=None, replace=None):
        v = np.asarray(v, np.float32)
        f = np.asarray(f, np.uint32)
        uv = np.zeros((len(v),2), np.float32) if uv is None else np.asarray(uv, np.float32)
        nn = normals(v,f) if nn is None else np.asarray(nn,np.float32)
        attrs = {'POSITION': self.acc(v,'VEC3'), 'NORMAL':self.acc(nn,'VEC3'), 'TANGENT':self.acc(tangents(v,nn,uv,f),'VEC4'), 'TEXCOORD_0':self.acc(uv,'VEC2')}
        if colors is not None:
            attrs['COLOR_0'] = self.acc(colors,'VEC3')
        m = {'name':name,'primitives':[{'attributes':attrs,'indices':self.acc(f.ravel(),'SCALAR'),'material':mat}]}
        if replace is not None:
            self.j['meshes'][replace] = m
            return
        mi = len(self.j['meshes']); self.j['meshes'].append(m)
        ni = len(self.j['nodes']); self.j['nodes'].append({'name':name,'mesh':mi})
        self.j['scenes'][0]['nodes'].append(ni)

    def write(self, path):
        # Remove inaccessible old buffer ranges and accessors while retaining scene objects.
        used_acc = set()
        for m in self.j['meshes']:
            for p in m['primitives']:
                used_acc.update(p['attributes'].values()); used_acc.add(p['indices'])
        used_views = {self.j['accessors'][i]['bufferView'] for i in used_acc}
        used_views.update(im['bufferView'] for im in self.j['images'])
        buf = bytearray(); views = []; vm = {}
        for i in sorted(used_views):
            bv = self.j['bufferViews'][i]; start = bv.get('byteOffset',0)
            buf.extend(b'\0' * (-len(buf)%4)); vm[i] = len(views)
            new = copy.deepcopy(bv); new['byteOffset'] = len(buf); views.append(new)
            buf.extend(self.b[start:start+bv['byteLength']])
        am = {}; aa = []
        for i in sorted(used_acc):
            a = copy.deepcopy(self.j['accessors'][i]); a['bufferView'] = vm[a['bufferView']]
            am[i] = len(aa); aa.append(a)
        j = copy.deepcopy(self.j)
        for m in j['meshes']:
            for p in m['primitives']:
                p['attributes'] = {k:am[v] for k,v in p['attributes'].items()}; p['indices'] = am[p['indices']]
        for im in j['images']: im['bufferView'] = vm[im['bufferView']]
        buf.extend(b'\0' * (-len(buf)%4))
        j['accessors'] = aa; j['bufferViews'] = views; j['buffers'] = [{'byteLength':len(buf)}]
        jb = json.dumps(j,ensure_ascii=False,separators=(',',':')).encode(); jb += b' ' * (-len(jb)%4)
        path.write_bytes(struct.pack('<III',0x46546c67,2,28+len(jb)+len(buf))+struct.pack('<II',len(jb),0x4e4f534a)+jb+struct.pack('<II',len(buf),0x004e4942)+buf)


def subdivide(v,uv,f):
    edges = np.sort(np.vstack([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1)
    e, ix = np.unique(edges,axis=0,return_inverse=True); m = len(f)
    ab,bc,ca = [ix[k*m:(k+1)*m]+len(v) for k in range(3)]; a,b,c = f.T
    return np.vstack([v,v[e].mean(1)]), np.vstack([uv,uv[e].mean(1)]), np.vstack([np.c_[a,ab,ca],np.c_[ab,b,bc],np.c_[ca,bc,c],np.c_[ab,bc,ca]])


def loop_subdivide(v, uv, f):
    """Loop subdivision rounds the original facial facets, including their interiors."""
    directed=np.vstack([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]])
    edges=np.sort(directed,axis=1);e,ix=np.unique(edges,axis=0,return_inverse=True)
    opposite=np.r_[f[:,2],f[:,0],f[:,1]];opp=np.zeros((len(e),3));np.add.at(opp,ix,v[opposite])
    ev=.375*(v[e[:,0]]+v[e[:,1]])+.125*opp
    nei=np.vstack([e,e[:,::-1]]);count=np.bincount(nei[:,0],minlength=len(v));su=np.zeros_like(v);np.add.at(su,nei[:,0],v[nei[:,1]])
    beta=np.where(count==3,3/16,3/(8*np.maximum(count,1)))
    nv=v*(1-count*beta)[:,None]+su*beta[:,None]
    m=len(f);ab,bc,ca=[ix[k*m:(k+1)*m]+len(v) for k in range(3)];a,b,c=f.T
    return np.vstack([nv,ev]),np.vstack([uv,uv[e].mean(1)]),np.vstack([np.c_[a,ab,ca],np.c_[ab,b,bc],np.c_[ca,bc,c],np.c_[ab,bc,ca]])


def smooth(v, f, iterations=3, weight=.35):
    e = np.vstack([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]); e=np.vstack([e,e[:,::-1]])
    A = coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(len(v),len(v))).tocsr(); A.data[:]=1
    A = diags(1/np.maximum(np.asarray(A.sum(1)).ravel(),1))@A
    v=v.copy()
    for _ in range(iterations):
        v += weight*(A@v-v); v -= (weight+.015)*(A@v-v)
    return v


def loops(f):
    e=np.sort(np.vstack([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1)
    e,ct=np.unique(e,axis=0,return_counts=True); e=e[ct==1]
    neighbors={}
    for a,b in e:neighbors.setdefault(int(a),[]).append(int(b));neighbors.setdefault(int(b),[]).append(int(a))
    assert all(len(n)==2 for n in neighbors.values())
    remaining=set(neighbors); out=[]
    while remaining:
        first=min(remaining); loop=[first]; prev=-1; cur=first
        while True:
            nxt=next(x for x in neighbors[cur] if x!=prev)
            if nxt==first:break
            loop.append(nxt);prev,cur=cur,nxt
        remaining.difference_update(loop);out.append(np.array(loop))
    return sorted(out,key=len,reverse=True)


def face_geometry(B, face_tex, skin_mat):
    lines=(ASSETS/'canonical_face_model.obj').read_text().splitlines()
    canonical=np.array([[float(x) for x in l.split()[1:]] for l in lines if l.startswith('v ')])
    f=np.array([[int(x.split('/')[0])-1 for x in l.split()[1:]] for l in lines if l.startswith('f ')])
    lm=np.load(ASSETS/'face_landmarks.npy')[:468]; uv=lm[:,:2].copy()
    v=np.c_[(uv[:,0]-.535)*.40, 1.55+(.47151941-uv[:,1])*.42, .039+canonical[:,2]*.0095]
    # Match the almost closed lip pose, retaining anatomical lip and nose depth.
    for idx in [13,14]:v[idx,2]=.092
    boundary=loops(f);outer=boundary[0]
    # Seal the eye/mouth openings with texture-matched geometry, no transparency holes.
    for lp in boundary[1:]:
        ci=len(v);v=np.vstack([v,v[lp].mean(0)]);uv=np.vstack([uv,uv[lp].mean(0)])
        f=np.vstack([f,np.c_[lp,np.roll(lp,-1),np.full(len(lp),ci)]])
    edge=v[outer].copy(); edge_uv=uv[outer].copy(); prev=outer.copy()
    # Continue the same face boundary into a rounded, closed cranium.
    center=np.array([0,1.642,-.107]); skin_uv=np.array([.547,.532])
    for theta in np.linspace(0,np.pi/2,17)[1:-1]:
        ring=edge.copy(); c=np.cos(theta); s=np.sin(theta)
        ring[:,:2]=center[:2]+(edge[:,:2]-center[:2])*(c+.055*np.sin(2*theta))
        ring[:,2]=edge[:,2]*(1-s)+center[2]*s
        ru=edge_uv*(1-min(1,s*3))+skin_uv*min(1,s*3)
        curr=np.arange(len(v),len(v)+len(outer));v=np.vstack([v,ring]);uv=np.vstack([uv,ru])
        f=np.vstack([f,np.c_[prev,np.roll(prev,-1),curr],np.c_[np.roll(prev,-1),np.roll(curr,-1),curr]])
        prev=curr
    tip=len(v);v=np.vstack([v,center]);uv=np.vstack([uv,skin_uv]);f=np.vstack([f,np.c_[prev,np.roll(prev,-1),np.full(len(prev),tip)]])
    # Fix winding across the closed surface before subdivision.
    import trimesh
    tm=trimesh.Trimesh(vertices=v,faces=f,process=False);trimesh.repair.fix_normals(tm,multibody=True);f=tm.faces
    for _ in range(2):v,uv,f=loop_subdivide(v,uv,f)
    v=smooth(v,f,2,.24)
    # Suppress crown pixels in the extrapolated forehead; the real crown covers most.
    top=uv[:,1]<.136
    uv[top]=[.61,.26]
    mat=B.material('V6_rebuilt_face_generated_portrait',[1,1,1],.64,tex=face_tex)
    B.mesh('V6_closed_anatomical_head',v,f,mat,uv)
    return {'vertices':len(v),'triangles':len(f),'closed':bool(trimesh.Trimesh(v,f,process=False).is_watertight)}


def ring_surface(ys, xs, fronts, backs, count=96, steps=75):
    y=np.linspace(ys[0],ys[-1],steps); x=CubicSpline(ys,xs)(y);fr=CubicSpline(ys,fronts)(y);ba=CubicSpline(ys,backs)(y)
    a=np.arange(count)*2*np.pi/count
    v=np.stack(np.broadcast_arrays(x[:,None]*np.sin(a),y[:,None]+np.zeros_like(a),(fr+ba)[:,None]/2+(fr-ba)[:,None]/2*np.cos(a)),axis=-1).reshape(-1,3)
    f=[]
    for k in range(steps-1):
        for m in range(count):
            i=k*count+m;n=k*count+(m+1)%count;f.extend([[i,n,i+count],[n,n+count,i+count]])
    for k,sgn in [(0,-1),(steps-1,1)]:
        c=len(v);v=np.vstack([v,[0,y[k],(fr[k]+ba[k])/2]])
        for m in range(count):
            a0=k*count+m;b0=k*count+(m+1)%count;f.append([a0,b0,c] if sgn>0 else [b0,a0,c])
    return v,np.asarray(f)


def sweep(points, widths, depths, segments=48, steps=100, ridges=False):
    t=np.linspace(0,1,len(points));s=np.linspace(0,1,steps);p=CubicSpline(t,points,axis=0)(s)
    w=CubicSpline(t,widths)(s);d=CubicSpline(t,depths)(s)
    dirs=unit(np.gradient(p,axis=0));u=unit(np.cross(dirs,[0,0,1]));vv=np.cross(dirs,u)
    a=np.arange(segments)*2*np.pi/segments
    relief=1+(.003*np.sin(a[None,:]*17+s[:,None]*12)+.002*np.sin(a[None,:]*31-s[:,None]*5) if ridges else 0)
    verts=(p[:,None]+u[:,None]*np.cos(a)[None,:,None]*w[:,None,None]*np.asarray(relief)[...,None]+vv[:,None]*np.sin(a)[None,:,None]*d[:,None,None]*np.asarray(relief)[...,None]).reshape(-1,3)
    faces=[]
    for k in range(steps-1):
        for m in range(segments):
            i=k*segments+m;n=k*segments+(m+1)%segments;faces.extend([[i,n,i+segments],[n,n+segments,i+segments]])
    for k in [0,steps-1]:
        c=len(verts);verts=np.vstack([verts,p[k]])
        for m in range(segments):faces.append([k*segments+m,k*segments+(m+1)%segments,c])
    import trimesh
    tm=trimesh.Trimesh(verts,faces,process=False);trimesh.repair.fix_normals(tm,multibody=True)
    return verts,tm.faces


def hair_and_neck(B, face_tex, skin, hair):
    v,f=ring_surface([1.34,1.38,1.45,1.51,1.57],[.052,.046,.038,.038,.044],[.110,.093,.058,.051,.055],[-.045,-.049,-.057,-.058,-.047])
    # Use neck-only texels so the side and back never contain a second face.
    uv=np.c_[np.clip(v[:,0]/.40+.535,.485,.59),.47151941-(v[:,1]-1.55)/.42]
    uv[:,1]=np.maximum(uv[:,1],.512)
    nmat=B.material('V6_continuous_neck_skin',[1,1,1],.67,tex=face_tex)
    B.mesh('V6_closed_neck',v,f,nmat,uv)
    # A rounded rear hair volume, behind the new skin head; individual front locks.
    points=[[0,1.745,-.028],[0,1.704,-.063],[0,1.62,-.073],[0,1.53,-.067],[0,1.435,-.075],[0,1.37,-.09]]
    v,f=sweep(points,[.03,.083,.088,.091,.094,.063],[.035,.066,.060,.057,.054,.027],segments=128,steps=130,ridges=True)
    def hairuv(v):
        return np.c_[.08+.84*(.5+.5*np.sin(v[:,0]*35+v[:,2]*21)),.05+np.clip((1.745-v[:,1])/.425,0,1)*.90]
    B.mesh('V6_closed_rear_hair',v,f,hair,hairuv(v))
    # Join the temple and rear hair across the side of the cranium.
    ys=np.linspace(1.382,1.716,66); ang=np.linspace(.89,2*np.pi-.89,112)
    rx=np.interp(ys,[1.382,1.55,1.68,1.716],[.102,.094,.089,.078])
    rz=np.interp(ys,[1.382,1.55,1.68,1.716],[.132,.125,.116,.099])
    vv=np.stack(np.broadcast_arrays(rx[:,None]*np.sin(ang),ys[:,None]+np.zeros_like(ang),-.014+rz[:,None]*np.cos(ang)),axis=-1).reshape(-1,3)
    ff=[]
    for k in range(len(ys)-1):
        for a in range(len(ang)-1):
            i=k*len(ang)+a;ff.extend([[i,i+1,i+len(ang)],[i+1,i+len(ang)+1,i+len(ang)]])
    uv=np.c_[np.tile(np.linspace(.05,.95,len(ang)),len(ys)),np.repeat(np.linspace(.95,.05,len(ys)),len(ang))]
    B.mesh('V6_continuous_temple_hair',vv,np.asarray(ff),hair,uv)
    liner=B.material('V6_crown_inner_velvet',[.021,.009,.008],.94)
    v,f=ring_surface([1.686,1.705],[.0875,.0875],[.108,.108],[-.112,-.112],steps=8)
    B.mesh('V6_crown_inner_liner',v,f,liner)
    for sign in [-1,1]:
        points=np.array([[sign*.071,1.694,.025],[sign*.081,1.62,.016],[sign*.087,1.55,.047],[sign*.098,1.47,.098],[sign*.102,1.385,.124],[sign*.077,1.322,.139]])
        v,f=sweep(points,[.019,.022,.026,.032,.032,.014],[.023,.025,.028,.030,.028,.014],segments=64,steps=130,ridges=True)
        B.mesh('V6_front_hair_lock_'+str(sign),v,f,hair,hairuv(v))
        # Ear and physically separate gold/jade pendant; no portrait cutout strips.
        ep=np.array([[sign*.071,1.66,.002],[sign*.076,1.642,.003],[sign*.075,1.616,.006]])
        v,f=sweep(ep,[.009,.013,.007],[.008,.009,.006],segments=24,steps=28)
        B.mesh('V6_ear_'+str(sign),v,f,skin)
        necklace=[]
        for k in range(16):
            y=1.656-k*.0104;cen=np.array([sign*(.085+.001*np.sin(k)),y,.047])
            a=np.linspace(0,2*np.pi,21);pts=cen+np.c_[np.cos(a)*.0037,np.sin(a)*.0048,np.cos(a)*(.0013 if k%2 else -.0013)]
            ev,ef=sweep(pts,[.0009]*len(pts),[.0009]*len(pts),segments=8,steps=24)
            necklace.append((ev,ef))
        vv=[];ff=[];off=0
        for ev,ef in necklace:vv.append(ev);ff.append(ef+off);off+=len(ev)
        B.mesh('V6_gold_ear_chain_'+str(sign),np.vstack(vv),np.vstack(ff),9)
        v,f=sweep([[sign*.085,1.492,.050],[sign*.084,1.484,.052],[sign*.082,1.474,.052]],[.002,.005,.002],[.002,.0035,.002],segments=24,steps=24)
        B.mesh('V6_jade_drop_'+str(sign),v,f,10)


def hand_geometry(B, skin):
    # A closed, smoothly joined palm, wrist and five individually separated digits.
    pitch=.00125
    axes=[np.arange(-.072,.073,pitch),np.arange(-.085,.140,pitch),np.arange(-.026,.029,pitch)]
    grid=np.stack(np.meshgrid(*axes,indexing='ij'),axis=-1).astype(np.float32)
    def ell(c,r):return (np.linalg.norm((grid-c)/r,axis=-1)-1)*min(r)
    field=ell([0,0,0],[.031,.044,.0118])
    def smin(a,b,k=.005):
        h=np.clip(.5+.5*(b-a)/k,0,1);return b*(1-h)+a*h-k*h*(1-h)
    field=smin(field,ell([0,-.044,-.001],[.018,.037,.011]),.013)
    fingers=[([-.025,.023,0],[-.050,.052,.000],[-.059,.067,-.003],.0070),
             ([-.020,.031,0],[-.029,.074,.000],[-.032,.103,-.004],.0067),
             ([-.006,.037,0],[-.008,.082,.000],[-.007,.111,-.008],.0069),
             ([.009,.033,0],[.015,.078,.001],[.021,.109,-.006],.0066),
             ([.023,.026,0],[.036,.060,.001],[.043,.084,-.004],.0057)]
    def capsule(a,b,r0,r1):
        a=np.array(a);b=np.array(b);p=grid-a;t=np.clip((p*(b-a)).sum(-1)/np.sum((b-a)**2),0,1)
        return np.linalg.norm(p-t[...,None]*(b-a),axis=-1)-(r0+(r1-r0)*t)
    for a,b,c,r in fingers:
        d=np.minimum(capsule(a,b,r,r*.91),capsule(b,c,r*.91,r*.74));field=smin(field,d,.005)
    verts,faces,_,_=marching_cubes(field,0,spacing=(pitch,pitch,pitch));verts+=np.array([a[0] for a in axes]);verts=smooth(verts,faces,3,.27)
    # Gentle lean to the character's right, palm facing the viewer.
    ang=np.deg2rad(12);R=np.array([[np.cos(ang),-np.sin(ang),0],[np.sin(ang),np.cos(ang),0],[0,0,1]])
    verts=verts@R.T+[-.233,1.401,.173]
    B.mesh('V6_five_finger_waving_hand',verts,faces,skin)
    return {'vertices':len(verts),'triangles':len(faces),'digits':5,'method':'smooth union signed distance surface'}


def project_back(B,j,b):
    tex=B.texture(ASSETS/'rear_projection_v6.png','Generated rear crimson silk and brocade')
    mat=B.material('V6_rear_crimson_silk_and_gold',[1,1,1],.58,metal=.06,tex=tex)
    total=0
    for mi in [139,140,141,142]:
        p=B.j['meshes'][mi]['primitives'][0]
        # Read from B because the head/hand clipping has already changed these meshes.
        v=accessor(B.j,B.b,p['attributes']['POSITION']);uv=accessor(B.j,B.b,p['attributes']['TEXCOORD_0']);f=accessor(B.j,B.b,p['indices']).reshape(-1,3)
        ctr=v[f].mean(1)
        sel=(ctr[:,2]<-.055)&(ctr[:,1]<1.50)
        if not sel.any():continue
        fs=f[sel];used,ix=np.unique(fs,return_inverse=True);vv=v[used]
        # Match the observed 1024x1536, 2.16m orthographic source view exactly.
        buv=np.c_[.5-vv[:,0]*1536/(2.16*1024),.51-(vv[:,1]-.95)/2.16]
        # Keep projections inside cloth silhouette at its outer edge.
        buv[:,0]=.5+(buv[:,0]-.5)*.985
        B.mesh('V6_rear_fabric_'+str(mi),vv,ix.reshape(-1,3),mat,buv)
        keep=f[~sel];used,ix=np.unique(keep,return_inverse=True)
        cols=accessor(B.j,B.b,p['attributes']['COLOR_0'])[used] if 'COLOR_0' in p['attributes'] else None
        B.mesh(B.j['meshes'][mi]['name'],v[used],ix.reshape(-1,3),p['material'],uv[used],cols,replace=mi)
        total+=len(fs)
    return total


def build():
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()=='0b9b8086b0ff1d3964b6b8a149b9c86d9320e18dc603217c990de38d1cd28c6b'
    j,b=load(SOURCE);B=Builder(j,b)
    ftex=B.texture(ASSETS/'face_projection_v6.png','Generated portrait projection, creative queen design')
    skin=B.material('V6_skin_soft_satin',srgb(np.array([.83,.65,.53])).tolist(),.68)
    htex=B.texture(ASSETS/'hair_texture_v6.png','Generated black hair fiber material')
    hair=B.material('V6_hair_dark_brown_strands',[1,1,1],.78,tex=htex)
    removed=0
    for mi in range(139,144):
        p=j['meshes'][mi]['primitives'][0];v=accessor(j,b,p['attributes']['POSITION']);uv=accessor(j,b,p['attributes']['TEXCOORD_0']);f=accessor(j,b,p['indices']).reshape(-1,3)
        c=v[f].mean(1)
        head=((abs(c[:,0])<.165)&(c[:,1]>1.515))|((abs(c[:,0])<.105)&(c[:,1]>1.43))|((abs(c[:,0])<.053)&(c[:,1]>1.355))
        lx=np.interp(c[:,1],[1.322,1.385,1.47,1.55],[.077,.102,.098,.087])
        lw=np.interp(c[:,1],[1.322,1.385,1.47,1.55],[.014,.032,.032,.026])
        head|=(c[:,1]>1.325)&(c[:,1]<1.515)&(abs(abs(c[:,0])-lx)<lw*.96)&(c[:,2]>.025)
        hand=(c[:,0]<-.175)&(c[:,1]>1.343)&(c[:,2]>.038)
        keep=~(head|hand);removed+=int((~keep).sum())
        ff=f[keep]
        if not len(ff):
            # These scalp-only objects are removed from the scene below.
            continue
        used,ix=np.unique(ff,return_inverse=True)
        cols=accessor(j,b,p['attributes']['COLOR_0'])[used] if 'COLOR_0' in p['attributes'] else None
        B.mesh(j['meshes'][mi]['name'],v[used],ix.reshape(-1,3),p['material'],uv[used],cols,replace=mi)
    B.j['scenes'][0]['nodes']=[i for i in B.j['scenes'][0]['nodes'] if B.j['nodes'][i].get('mesh') not in [143,144]]
    head=face_geometry(B,ftex,skin)
    hair_and_neck(B,ftex,skin,hair)
    hand=hand_geometry(B,skin)
    backfaces=project_back(B,j,b)
    B.j['asset']['generator']='Seondeok v6, rebuilt face and hand with referenced creative materials'
    report={'version':'v6','source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'removed_source_triangles':removed,'head':head,'waving_hand':hand,'rear_retextured_triangles':backfaces,'portrait_and_rear_textures':'generated reference-assisted material designs','historical_accuracy_required':False,'existing_crown_geometry_preserved':True,'mobile_ar_tested':False}
    B.j.setdefault('extras',{})['v6_rebuild']=report
    B.write(DEST)
    (ROOT.parent/'queen_v6_build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2)); print('GLB bytes',DEST.stat().st_size)


if __name__=='__main__':build()
