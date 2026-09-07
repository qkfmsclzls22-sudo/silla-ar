"""Conservative geometry/material cleanup; encoded portrait images stay unchanged."""
import sys, copy, hashlib, json, struct
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix, diags
from scipy.spatial import cKDTree
sys.path.insert(0,str(Path(__file__).parent))
from gltf_tools import load, accessor, textures, sample, srgb, normals, tangents

BASE=Path(__file__).resolve().parents[2]
SOURCE=BASE/'queen_seondeok_refined_v4.glb'
DEST=BASE/'queen_seondeok_refined_v5.glb'

def build(source=SOURCE,dest=DEST):
 assert hashlib.sha256(source.read_bytes()).hexdigest()=='4ca123ce057890e0c7cfd9909a0da894e672709cd97675648c8e0c19d7eed81a', 'Expected original v4 input; do not apply to a later model'
 j,raw=load(source); old=copy.deepcopy(j); blob=bytearray(raw)
 body=[];vs=[];fs=[];off=0
 for mi in range(139,145):
  assert j['meshes'][mi]['name'].startswith('Seondeok_')
  pr=j['meshes'][mi]['primitives'][0];v=accessor(j,raw,pr['attributes']['POSITION']);f=accessor(j,raw,pr['indices']).reshape(-1,3)
  body.append((mi,pr,off,len(v)));vs.append(v);fs.append(f+off);off+=len(v)
 v=np.vstack(vs);f=np.vstack(fs);q,inv=np.unique(np.round(v,6),axis=0,return_inverse=True);origin=q.copy()
 wf=inv[f];e=np.vstack([wf[:,[0,1]],wf[:,[1,2]],wf[:,[2,0]]]);e=np.vstack([e,e[:,::-1]])
 A=coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(len(q),len(q))).tocsr();A.data[:]=1;A=diags(1/np.maximum(np.asarray(A.sum(1)).ravel(),1))@A
 # World-space masks act across material/UV seams, preventing cracks.
 x,y,z=q.T
 hand=np.clip((-.155-x)/.04,0,1)*np.clip((y-1.31)/.045,0,1)*np.clip((1.52-y)/.02,0,1)
 resting=np.exp(-((x-.065)/.09)**6-((y-1.018)/.065)**6)*np.clip((z-.17)/.035,0,1)
 chin=np.exp(-((y-(1.550+5*x*x))/.018)**4)*np.clip((.075-abs(x))/.018,0,1)*np.clip((z-.005)/.025,0,1)
 rear=np.clip((-z-.025)/.07,0,1)*np.clip((1.57-y)/.08,0,1)*np.clip((y-.05)/.1,0,1)
 weight=np.maximum.reduce([hand*.8,resting*.6,chin,rear*.35]);cap=np.maximum.reduce([hand*.002,resting*.0015,chin*.0035,rear*.001])
 # Protect eyes, mouth, forehead and crown seat exactly.
 protected=(y>1.59)&(abs(x)<.13);weight[protected]=0;cap[protected]=0
 for _ in range(18):
  q+=.46*weight[:,None]*(A@q-q);q-=.48*weight[:,None]*(A@q-q)
 delta=q-origin;dist=np.linalg.norm(delta,axis=1);q=origin+delta*np.minimum(1,cap/np.maximum(dist,1e-12))[:,None]
 # Keep original float positions exactly where no movement is allowed.
 outv=v+(q-origin)[inv];n=normals(q,wf)[inv]
 im=textures(j,raw)[j['textures'][4]['source']]
 uv=np.vstack([accessor(j,raw,p['attributes']['TEXCOORD_0']) for _,p,_,_ in body]);rgb=sample(im,uv)
 x,y,z=v.T;chin_band=np.exp(-((y-(1.550+5*x*x))/.018)**4)*np.clip((.077-abs(x))/.015,0,1)*np.clip((z-.006)/.02,0,1)
 hand_band=np.clip((-.17-x)/.035,0,1)*np.clip((y-1.33)/.025,0,1)*np.clip((1.51-y)/.02,0,1)
 region=np.maximum(chin_band,hand_band)
 rr=np.maximum(rgb[:,0],.001);gr=rgb[:,1]/rr;br=rgb[:,2]/rr
 chin_grey=np.clip((gr-.77)/.08,0,1)*np.clip((br-.67)/.12,0,1)
 hand_grey=np.clip((gr-.90)/.06,0,1)*np.clip((br-.85)/.08,0,1)
 correction=np.maximum(chin_band*chin_grey,hand_band*hand_grey)*np.clip((rr-.27)/.1,0,1)
 good=(region>.02)&(gr>.48)&(gr<np.where(hand_band>.1,.87,.76))&(br>.20)&(br<np.where(hand_band>.1,.81,.65))&(rr>.30)
 nearest=cKDTree(v[good]);dd,ii=nearest.query(v,k=12);w=1/np.maximum(dd,.002)**2
 target=(srgb(rgb[good][ii])*w[:,:,None]).sum(1)/w.sum(1)[:,None]
 factor=np.clip(target/np.maximum(srgb(rgb),.0001),0,1)
 tint=1+(factor-1)*correction[:,None]
 counts=[]
 def replace(ai,a):
  ac=j['accessors'][ai];bv=j['bufferViews'][ac['bufferView']];assert 'byteStride' not in bv
  buf=np.ascontiguousarray(a,dtype='<f4').tobytes();assert len(buf)==bv['byteLength'];st=bv.get('byteOffset',0)+ac.get('byteOffset',0);blob[st:st+len(buf)]=buf
  if ac['type']=='VEC3':ac['min']=a.min(0).tolist();ac['max']=a.max(0).tolist()
 def append_color(a):
  while len(blob)%4:blob.append(0)
  bv=len(j['bufferViews']);buf=np.ascontiguousarray(a,dtype='<f4').tobytes();j['bufferViews'].append({'buffer':0,'byteOffset':len(blob),'byteLength':len(buf)});blob.extend(buf)
  ai=len(j['accessors']);j['accessors'].append({'bufferView':bv,'componentType':5126,'count':len(a),'type':'VEC3','min':a.min(0).tolist(),'max':a.max(0).tolist()});return ai
 for mi,p,start,count in body:
  sl=slice(start,start+count);attrs=p['attributes'];vv=outv[sl];nn=n[sl];ff=accessor(j,raw,p['indices']).reshape(-1,3)
  replace(attrs['POSITION'],vv);replace(attrs['NORMAL'],nn);replace(attrs['TANGENT'],tangents(vv,nn,uv[sl],ff))
  colors=tint[sl]
  if 'COLOR_0' in attrs:
   prev=accessor(j,raw,attrs['COLOR_0']);colors=np.minimum(colors,prev);replace(attrs['COLOR_0'],colors)
  elif np.min(colors)<.999:attrs['COLOR_0']=append_color(colors)
  counts.append({'mesh':j['meshes'][mi]['name'],'tinted_vertices':int((colors.min(1)<.999).sum())})
 # Lower source normal-map amplification; no invented back texture detail.
 for mat,scale in [(4,.06),(5,.16),(6,.14),(7,.20)]:j['materials'][mat]['normalTexture']['scale']=scale
 j['asset']['generator']='Seondeok conservative boundary and surface cleanup v5'
 report={'source':source.name,'version':'v5','image_bytes_unchanged':True,'uvs_indices_pose_unchanged':True,'max_displacement_m':float(np.linalg.norm(outv-v,axis=1).max()),'vertices_moved':int((np.linalg.norm(outv-v,axis=1)>1e-8).sum()),'corrections':counts,'limitations':['Waving fingers remain fused/incomplete in source anatomy; no full hand reconstruction.','Rear/side source images remain blurred; normal artifacts reduced, not new image detail.','CPU-render validation only; mobile AR not tested.']}
 j.setdefault('extras',{})['v5_cleanup']=report
 while len(blob)%4:blob.append(0)
 j['buffers'][0]['byteLength']=len(blob);jb=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode();jb+=b' '*((-len(jb))%4)
 dest.write_bytes(struct.pack('<III',0x46546c67,2,28+len(jb)+len(blob))+struct.pack('<II',len(jb),0x4e4f534a)+jb+struct.pack('<II',len(blob),0x004e4942)+blob)
 print(json.dumps(report,ensure_ascii=False,indent=2));return report

if __name__=='__main__':build()
