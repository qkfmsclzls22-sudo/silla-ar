"""Numerical preservation checks; not a substitute for device AR testing."""
import hashlib,json,struct
from pathlib import Path
import numpy as np
from gltf_tools import load,accessor,normals,render

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'queen_seondeok_refined_v4.glb'
MODEL=ROOT.parent/'queen_seondeok_refined_v5.glb'

def verify():
 old,ob=load(SOURCE);j,b=load(MODEL);errors=[]
 assert struct.unpack_from('<I',MODEL.read_bytes(),8)[0]==MODEL.stat().st_size
 assert j['nodes']==old['nodes'] and j['scenes']==old['scenes']
 for bv in j['bufferViews']:assert bv.get('byteOffset',0)+bv['byteLength']<=len(b)
 for i,a in enumerate(j['accessors']):assert np.isfinite(accessor(j,b,i)).all(),i
 def images(doc,buf):
  return [hashlib.sha256(buf[(v:=doc['bufferViews'][im['bufferView']]).get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]).hexdigest() for im in doc['images']]
 assert images(old,ob)==images(j,b)
 maxmove=0;vv=[];ff=[];offset=0;flips=0
 for mi,m in enumerate(j['meshes']):
  for pi,p in enumerate(m['primitives']):
   prior=old['meshes'][mi]['primitives'][pi];a=p['attributes'];v=accessor(j,b,a['POSITION']);v0=accessor(old,ob,prior['attributes']['POSITION']);idx=accessor(j,b,p['indices']);f=idx.reshape(-1,3)
   assert np.array_equal(idx,accessor(old,ob,prior['indices']))
   assert np.array_equal(accessor(j,b,a['TEXCOORD_0']),accessor(old,ob,prior['attributes']['TEXCOORD_0']))
   assert idx.min()>=0 and idx.max()<len(v)
   n=accessor(j,b,a['NORMAL']);t=accessor(j,b,a['TANGENT'])
   assert np.max(abs(np.linalg.norm(n,axis=1)-1))<.015
   assert np.max(abs((n*t[:,:3]).sum(1)))<.025
   if 'COLOR_0'in a:
    c=accessor(j,b,a['COLOR_0']);assert c.min()>=0 and c.max()<=1
   if 139<=mi<=144:
    maxmove=max(maxmove,float(np.linalg.norm(v-v0,axis=1).max()))
    protected=(v0[:,1]>1.59)&(abs(v0[:,0])<.13);assert np.array_equal(v[protected],v0[protected])
    cross0=np.cross(v0[f[:,1]]-v0[f[:,0]],v0[f[:,2]]-v0[f[:,0]]);cross=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
    valid=np.linalg.norm(cross0,axis=1)>1e-10;flips+=int(((cross0[valid]*cross[valid]).sum(1)<0).sum())
    vv.append(v);ff.append(f+offset);offset+=len(v)
   else:
    assert m==old['meshes'][mi]
    for ai in [*a.values(),p['indices']]:assert np.array_equal(accessor(j,b,ai),accessor(old,ob,ai))
 assert maxmove<.00351
 assert flips==0
 v=np.vstack(vv);f=np.vstack(ff);q,inv=np.unique(np.round(v,6),axis=0,return_inverse=True);wf=inv[f]
 e=np.sort(np.vstack([wf[:,[0,1]],wf[:,[1,2]],wf[:,[2,0]]]),axis=1);e,counts=np.unique(e,axis=0,return_counts=True)
 scalp_open=int(((counts==1)&(q[e][...,1].min(1)>1.59)).sum());assert scalp_open==0
 triangles=sum(len(accessor(j,b,p['indices']))//3 for n in j['nodes'] if 'mesh'in n for p in j['meshes'][n['mesh']]['primitives'])
 report={'valid':True,'bytes':MODEL.stat().st_size,'sha256':hashlib.sha256(MODEL.read_bytes()).hexdigest(),'scene_triangles':triangles,'embedded_images':len(j['images']),'all_embedded_image_bytes_preserved':True,'all_uvs_and_indices_preserved':True,'crown_and_jewellery_geometry_unchanged':True,'node_transforms_unchanged':True,'protected_face_positions_unchanged':True,'max_displacement_m':maxmove,'scalp_open_edges_after_weld':scalp_open,'local_triangle_orientation_reversals':flips,'materials':len(j['materials']),'skins':len(j.get('skins',[])),'animations':len(j.get('animations',[])),'verification_scope':'custom numerical tests and CPU renders; not Khronos certification or mobile AR test','cleanup':j['extras']['v5_cleanup']}
 (ROOT/'queen_v5_validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2));return report

def previews():
 for label,p in [('v4',SOURCE),('v5',MODEL)]:
  render(p,ROOT/f'queen_{label}_chin.jpg',target=[0,1.565,.035],span=.24,size=(750,750),el=0)
  render(p,ROOT/f'queen_{label}_hand.jpg',target=[-.235,1.40,.03],span=.26,size=(650,750),el=0)
  render(p,ROOT/f'queen_{label}_rear.jpg',az=180,size=(650,850))
 render(MODEL,ROOT/'queen_v5_front.jpg',size=(700,950))
 render(MODEL,ROOT/'queen_v5_threequarter.jpg',az=40,size=(700,950))

if __name__=='__main__':
 import sys
 verify()
 if '--render' in sys.argv:previews()
