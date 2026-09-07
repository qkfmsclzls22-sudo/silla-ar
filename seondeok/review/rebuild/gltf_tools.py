import json,struct,io,math,ctypes
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT=Path(__file__).parent
DTYPES={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
NCOMP={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def unit(x):return x/np.maximum(np.linalg.norm(x,axis=-1,keepdims=True),1e-12)
def load(path):
 b=Path(path).read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);return j,b[28+n:]
def accessor(j,blob,i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];dt=np.dtype(DTYPES[a['componentType']]);c=NCOMP[a['type']];off=v.get('byteOffset',0)+a.get('byteOffset',0)
 ar=np.ndarray((a['count'],c),dtype=dt,buffer=blob,offset=off,strides=(v.get('byteStride',dt.itemsize*c),dt.itemsize)).copy()
 return ar.ravel() if c==1 else ar
def textures(j,blob):
 out=[]
 for im in j.get('images',[]):
  v=j['bufferViews'][im['bufferView']];raw=blob[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']];out.append(np.asarray(Image.open(io.BytesIO(raw)).convert('RGB'),dtype=np.float32)/255)
 return out
def matrix(n):
 if 'matrix'in n:return np.array(n['matrix']).reshape(4,4).T
 M=np.eye(4);q=n.get('rotation',[0,0,0,1]);x,y,z,w=q
 M[:3,:3]=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])@np.diag(n.get('scale',[1,1,1]));M[:3,3]=n.get('translation',[0,0,0]);return M
def normals(v,f):
 n=np.zeros_like(v);fn=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
 for k in range(3):np.add.at(n,f[:,k],fn)
 return unit(n)
def tangents(v,n,uv,f):
 e1=v[f[:,1]]-v[f[:,0]];e2=v[f[:,2]]-v[f[:,0]];d1=uv[f[:,1]]-uv[f[:,0]];d2=uv[f[:,2]]-uv[f[:,0]]
 den=d1[:,0]*d2[:,1]-d1[:,1]*d2[:,0];r=np.where(np.abs(den)>1e-12,1/np.where(np.abs(den)>1e-12,den,1),0)
 ft=(e1*d2[:,1,None]-e2*d1[:,1,None])*r[:,None];fb=(e2*d1[:,0,None]-e1*d2[:,0,None])*r[:,None];ta=np.zeros_like(v);bt=np.zeros_like(v)
 for k in range(3):np.add.at(ta,f[:,k],ft);np.add.at(bt,f[:,k],fb)
 ta=unit(ta-n*np.sum(n*ta,axis=1,keepdims=True));bad=np.linalg.norm(ta,axis=1)<.1
 ta[bad]=unit(np.cross(n[bad],np.array([1,.123,.234])))
 return np.column_stack((ta,np.where(np.sum(np.cross(n,ta)*bt,axis=1)<0,-1,1)))
def scene(j,blob,include_colors=False):
 out=[]
 def visit(i,parent):
  node=j['nodes'][i];M=parent@matrix(node)
  if 'mesh'in node:
   for pr in j['meshes'][node['mesh']]['primitives']:
    a=pr['attributes'];v=accessor(j,blob,a['POSITION']);f=accessor(j,blob,pr['indices']).reshape(-1,3).astype(np.int32);uv=accessor(j,blob,a['TEXCOORD_0']) if 'TEXCOORD_0'in a else np.zeros((len(v),2));n=accessor(j,blob,a['NORMAL']) if 'NORMAL'in a else normals(v,f)
    t=accessor(j,blob,a['TANGENT']) if 'TANGENT'in a else tangents(v,n,uv,f)
    v=v@M[:3,:3].T+M[:3,3];n=unit(n@np.linalg.inv(M[:3,:3]));t=np.column_stack((unit(t[:,:3]@M[:3,:3].T),t[:,3]))
    item=(v,n,t,uv,f,pr.get('material',0))
    if include_colors:item=item+(accessor(j,blob,a['COLOR_0'])[:,:3] if 'COLOR_0'in a else np.ones_like(v),)
    out.append(item)
  for c in node.get('children',[]):visit(c,M)
 roots=j.get('scenes',[{'nodes':list(range(len(j['nodes'])))}])[j.get('scene',0)]['nodes']
 for i in roots:visit(i,np.eye(4))
 return out
def sample(im,uv):
 x=np.clip(uv[:,0]*im.shape[1]-.5,0,im.shape[1]-1);y=np.clip(uv[:,1]*im.shape[0]-.5,0,im.shape[0]-1);ix=x.astype(int);iy=y.astype(int);fx=(x-ix)[:,None];fy=(y-iy)[:,None]
 return (im[iy,ix]*(1-fx)+im[iy,np.minimum(ix+1,im.shape[1]-1)]*fx)*(1-fy)+(im[np.minimum(iy+1,im.shape[0]-1),ix]*(1-fx)+im[np.minimum(iy+1,im.shape[0]-1),np.minimum(ix+1,im.shape[1]-1)]*fx)*fy
def srgb(c):return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
def linear_to_srgb(c):return np.where(c<=.0031308,c*12.92,1.055*np.maximum(c,0)**(1/2.4)-.055)
def render(path,out,az=0,el=6,size=(1000,1250),target=None,span=None,albedo=False,gbuffer=False):
 j,blob=load(path);data=scene(j,blob,True);images=textures(j,blob);allv=np.vstack([d[0]for d in data]);lo=allv.min(0);hi=allv.max(0)
 target=np.asarray(target if target is not None else (lo+hi)/2);span=span or (hi[1]-lo[1])*1.12;W,H=size
 az=math.radians(az);el=math.radians(el);view=np.array([math.sin(az)*math.cos(el),math.sin(el),math.cos(az)*math.cos(el)]);right=unit(np.cross([0,1,0],view));up=np.cross(view,right);M=np.stack((right,up,view));scale=H/span
 depth=np.full((H,W),-1e8,np.float32);N=np.zeros((H,W,3),np.float32);T=np.zeros((H,W,4),np.float32);UV=np.zeros((H,W,2),np.float32);ids=np.full((H,W),-1,np.int32)
 C=np.ones((H,W,3),np.float32)
 lib=ctypes.CDLL(str(ROOT/'raster.so'));fn=lib.raster;ptr=lambda a:a.ctypes.data_as(ctypes.c_void_p)
 for v,n,t,uv,f,mat,col in data:
  cam=(v-target)@M.T;s=np.column_stack((W/2+cam[:,0]*scale,H*.51-cam[:,1]*scale,cam[:,2])).astype(np.float32);cn=np.ascontiguousarray(n@M.T,dtype=np.float32);ct=np.column_stack((t[:,:3]@M.T,t[:,3])).astype(np.float32);u=np.ascontiguousarray(uv,dtype=np.float32);f=np.ascontiguousarray(f,dtype=np.int32)
  col=np.ascontiguousarray(col,dtype=np.float32)
  fn(len(v),len(f),ptr(s),ptr(cn),ptr(ct),ptr(u),ptr(col),ptr(f),mat,W,H,ptr(depth),ptr(N),ptr(T),ptr(UV),ptr(C),ptr(ids))
 if gbuffer:np.savez_compressed(str(out)+'.npz',depth=depth,normal=N,uv=UV,ids=ids,M=M,target=target,scale=scale)
 mask=ids>=0;ns=unit(N[mask]);ts=T[mask];ts0=unit(ts[:,:3]-ns*np.sum(ts[:,:3]*ns,axis=1,keepdims=True));bs=np.cross(ns,ts0)*ts[:,3,None];us=UV[mask];mi=ids[mask];base=np.zeros_like(ns);rough=np.ones(len(ns))*.7;metal=np.zeros(len(ns));em=np.zeros_like(ns)
 def tex(desc,coords):return sample(images[j['textures'][desc['index']]['source']],coords)
 for i,mat in enumerate(j.get('materials',[{}])):
  sel=mi==i
  if not sel.any():continue
  p=mat.get('pbrMetallicRoughness',{});base[sel]=np.array(p.get('baseColorFactor',[1,1,1,1]))[:3]
  if 'baseColorTexture'in p:base[sel]*=srgb(tex(p['baseColorTexture'],us[sel]))
  rough[sel]=p.get('roughnessFactor',1);metal[sel]=p.get('metallicFactor',1)
  if 'metallicRoughnessTexture'in p:
   mr=tex(p['metallicRoughnessTexture'],us[sel]);rough[sel]*=mr[:,1];metal[sel]*=mr[:,2]
  if 'normalTexture'in mat:
   nn=tex(mat['normalTexture'],us[sel])*2-1;nn[:,:2]*=mat['normalTexture'].get('scale',1);ns[sel]=unit(ts0[sel]*nn[:,0,None]+bs[sel]*nn[:,1,None]+ns[sel]*nn[:,2,None])
  em[sel]=mat.get('emissiveFactor',[0,0,0])
  if 'emissiveTexture'in mat:em[sel]*=srgb(tex(mat['emissiveTexture'],us[sel]))
 base*=C[mask]
 ns=np.where(ns[:,2,None]<0,-ns,ns);rough=np.clip(rough,.07,1);V=np.array([0,0,1.]);R=2*ns[:,2,None]*ns-V;L=unit(np.array([-.5,.65,.85]));F=unit(np.array([.7,.2,.8]));nl=np.clip(ns@L,0,1);nf=np.clip(ns@F,0,1);width=.02+rough**2*.42
 env=.26+np.maximum(R[:,1],0)*.16+np.exp((R@L-1)/width)*2.2+np.exp((R@F-1)/(width*1.7))*.85
 dielectric=base*(.36+.7*nl[:,None]+.23*nf[:,None])+(np.exp((R@L-1)/width)*.095+np.exp((R@F-1)/(width*1.6))*.035)[:,None]
 color=base if albedo else metal[:,None]*(base*env[:,None])+(1-metal[:,None])*dielectric+em
 if not albedo:color=color/(1+color*.45)
 yy,xx=np.mgrid[:H,:W];bg=np.ones((H,W,3))*np.array([.036,.046,.061]);halo=np.exp(-(((xx-W*.5)/(W*.7))**2+((yy-H*.35)/(H*.8))**2)*2);bg+=halo[:,:,None]*.038;bg[mask]=color
 im=Image.fromarray(np.uint8(np.clip(linear_to_srgb(bg),0,1)*255));im.save(out);print('rendered',out,flush=True);return im
if __name__=='__main__':
 import argparse
 ap=argparse.ArgumentParser();ap.add_argument('input');ap.add_argument('output');ap.add_argument('--az',type=float,default=0);ap.add_argument('--el',type=float,default=4);ap.add_argument('--albedo',action='store_true');ap.add_argument('--gbuffer',action='store_true');a=ap.parse_args();render(a.input,a.output,az=a.az,el=a.el,albedo=a.albedo,gbuffer=a.gbuffer)
