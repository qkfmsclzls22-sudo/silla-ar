"""Verify the authored GLB and optionally a compressed delivery/decoded pair."""
from pathlib import Path
import json, hashlib, struct
import numpy as np
import trimesh
from scipy.spatial import cKDTree
from gltf_tools import load, accessor, matrix

ROOT=Path(__file__).resolve().parents[1]
MODEL=ROOT.parent/'queen_seondeok_refined_v6.glb'
SOURCE=ROOT.parent/'queen_seondeok_refined_v5.glb'

def verify(delivered=None, decoded=None):
    j,b=load(MODEL);old,ob=load(SOURCE)
    assert struct.unpack_from('<I',MODEL.read_bytes(),8)[0]==MODEL.stat().st_size
    for bv in j['bufferViews']:assert bv.get('byteOffset',0)+bv['byteLength']<=len(b)
    for i in range(len(j['accessors'])):assert np.isfinite(accessor(j,b,i)).all(),i
    for mi in range(139):
        for pi,p in enumerate(j['meshes'][mi]['primitives']):
            q=old['meshes'][mi]['primitives'][pi]
            for k,ai in p['attributes'].items():assert np.array_equal(accessor(j,b,ai),accessor(old,ob,q['attributes'][k])),(mi,k)
            assert np.array_equal(accessor(j,b,p['indices']),accessor(old,ob,q['indices']))
    assert old['nodes']==j['nodes'][:len(old['nodes'])]
    checks={}
    for mi,m in enumerate(j['meshes']):
        for p in m['primitives']:
            a=p['attributes'];v=accessor(j,b,a['POSITION']);f=accessor(j,b,p['indices']).reshape(-1,3)
            assert f.min()>=0 and f.max()<len(v)
            n=accessor(j,b,a['NORMAL']);assert np.max(abs(np.linalg.norm(n,axis=1)-1))<.015
            if m['name'] in ['V6_closed_anatomical_head','V6_closed_neck','V6_five_finger_waving_hand']:
                mesh=trimesh.Trimesh(v,f,process=False)
                checks[m['name']]={'watertight':bool(mesh.is_watertight),'components':len(mesh.split(only_watertight=False)),'vertices':len(v),'triangles':len(f)}
                assert mesh.is_watertight
                assert checks[m['name']]['components']==1
    images=[]
    for i,im in enumerate(j['images']):
        view=j['bufferViews'][im['bufferView']];start=view.get('byteOffset',0);digest=hashlib.sha256(b[start:start+view['byteLength']]).hexdigest();images.append(digest)
        if i<len(old['images']):
            ov=old['bufferViews'][old['images'][i]['bufferView']];st=ov.get('byteOffset',0)
            assert digest==hashlib.sha256(ob[st:st+ov['byteLength']]).hexdigest()
    report={'valid':True,'bytes':MODEL.stat().st_size,'sha256':hashlib.sha256(MODEL.read_bytes()).hexdigest(),'crown_meshes_unchanged':139,'existing_node_transforms_unchanged':True,'closed_surface_checks':checks,'embedded_images':len(images),'original_encoded_images_preserved':True,'new_generated_material_images':len(images)-len(old['images']),'skins':len(j.get('skins',[])),'animations':len(j.get('animations',[])),'visual_checks':'CPU renders of front, three-quarter, side, rear, face, profile and hand','browser_webgl_available':False,'mobile_AR_tested':False}
    if delivered:
        assert decoded, 'Pass the GLB decoded by compress_v6.cjs.'
        dj,db=load(decoded)
        assert len(dj['meshes'])==len(j['meshes'])
        assert len(dj['nodes'])==len(j['nodes'])
        for n,dn in zip(j['nodes'],dj['nodes']):
            assert np.allclose(matrix(n),matrix(dn),atol=1e-9)
            assert n.get('mesh')==dn.get('mesh')
            assert n.get('children',[])==dn.get('children',[])
        assert j['scenes']==dj['scenes']
        distance=0.;triangles=0;removed_degenerates=0
        for m,dm in zip(j['meshes'],dj['meshes']):
            assert m.get('name')==dm.get('name')
            assert len(m['primitives'])==len(dm['primitives'])
            for p,dp in zip(m['primitives'],dm['primitives']):
                v=accessor(j,b,p['attributes']['POSITION']);dv=accessor(dj,db,dp['attributes']['POSITION'])
                f=accessor(j,b,p['indices']);df=accessor(dj,db,dp['indices'])
                if len(f)!=len(df):
                    t=v[f.reshape(-1,3)]
                    area2=np.linalg.norm(np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]),axis=1)
                    degenerate_count=int((area2==0).sum())
                    assert (len(f)-len(df))//3==degenerate_count
                    removed_degenerates+=degenerate_count
                assert np.isfinite(dv).all() and df.min()>=0 and df.max()<len(dv)
                triangles+=len(df)//3
                error=max(cKDTree(v).query(dv)[0].max(),cKDTree(dv).query(v)[0].max())
                distance=max(distance,float(error))
                assert error<.00004,(m.get('name'),error)
        assert len(dj['images'])==len(j['images'])
        changed_images=[]
        for i,im in enumerate(dj['images']):
            view=dj['bufferViews'][im['bufferView']];st=view.get('byteOffset',0)
            digest=hashlib.sha256(db[st:st+view['byteLength']]).hexdigest()
            if digest!=images[i]:changed_images.append(im.get('name'))
        assert changed_images==['Original_T_24CL0003_C','Queen_2K_Color']
        report['authored_model']={'sha256':report['sha256'],'bytes':report['bytes'],
            'crown_meshes_exactly_preserved':report.pop('crown_meshes_unchanged'),
            'original_encoded_images_preserved':report.pop('original_encoded_images_preserved')}
        report.update({'bytes':delivered.stat().st_size,'sha256':hashlib.sha256(delivered.read_bytes()).hexdigest(),
            'geometry_compression':'KHR_draco_mesh_compression','delivery_max_vertex_distance_m':distance,
            'delivery_triangle_count':triangles,'delivery_removed_zero_area_triangles':removed_degenerates,
            'delivery_node_transforms_preserved':True,'delivery_reencoded_color_maps':changed_images,
            'other_encoded_images_preserved':True,'visual_checks':'CPU renders of the delivery GLB after Draco decoding'})
    (ROOT/'queen_v6_validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
    return report

if __name__=='__main__':
    import argparse
    ap=argparse.ArgumentParser()
    ap.add_argument('--authored',type=Path,default=MODEL)
    ap.add_argument('--delivered',type=Path)
    ap.add_argument('--decoded',type=Path)
    args=ap.parse_args();MODEL=args.authored
    verify(args.delivered,args.decoded)
