"""Convert already-downloaded KHS source files; never synthesize artifact geometry."""
import bpy, pathlib, math, json, sys, zipfile
from mathutils import Vector
root=pathlib.Path(__file__).resolve().parents[3]
downloads=pathlib.Path.home()/'Downloads'
out=root/'play/assets/museum-v4';out.mkdir(parents=True,exist_ok=True)
source_dir=root.parent/'source-assets/museum-expansion';source_dir.mkdir(parents=True,exist_ok=True)
key=sys.argv[sys.argv.index('--')+1]
configs={
 'crown':dict(path=downloads/'금관총_금관(내_외관)_원본/SM_24CL0003_Cage_High.fbx',prefix='T_24CL0003',metal=.8),
 'bell':dict(zip='서라벌_천년왕경_성덕대왕신종.zip',filename='SM_24RE0002_High_01.fbx',prefix='T_24RE0002',metal=.55),
 'amitabha':dict(path=downloads/'국보_경주_불국사_금동아미타여래좌상_00001_모델링_서비스/NT27_Gilt-bronze_Seated_Amitabha_Buddha_of_Bulguksa_Temple_Gyeongju_low.obj',metal=.45),
 'helmet':dict(path=root/'heritage/assets/helmet/model-v1.glb'),
 'armor':dict(path=root/'heritage/assets/armor/model-v1.glb'),
}
cfg=configs[key]
if 'zip' in cfg:
 dest=source_dir/key;dest.mkdir(exist_ok=True)
 with zipfile.ZipFile(downloads/cfg['zip']) as z:
  for n in z.namelist():
   if n==cfg['filename'] or n.lower().endswith('.png'):
    target=dest/pathlib.Path(n).name
    if not target.exists():target.write_bytes(z.read(n))
 cfg['path']=dest/cfg['filename']
src=cfg['path'];bpy.ops.wm.read_factory_settings(use_empty=True)
print('IMPORT',key,str(src),flush=True)
if src.suffix=='.fbx':bpy.ops.import_scene.fbx(filepath=str(src))
elif src.suffix=='.obj':bpy.ops.wm.obj_import(filepath=str(src))
else:bpy.ops.import_scene.gltf(filepath=str(src))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if key=='crown':
 # The source package lays unused ornament components alongside the crown.
 # Keep the eight assembled body meshes, with all their original transforms.
 keep={f'bake_{i}_cage' for i in range(1,9)}
 for o in meshes:
  if o.name not in keep:bpy.data.objects.remove(o,do_unlink=True)
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
before=sum(len(o.data.polygons) for o in meshes)
print('IMPORTED',key,before,flush=True)
for o in meshes:
 bpy.context.view_layer.objects.active=o
 o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);o.select_set(False)
 if before>100000:
  mod=o.modifiers.new('Mobile exhibition','DECIMATE');mod.ratio=min(1,95000/before);bpy.ops.object.modifier_apply(modifier=mod.name)
 if cfg.get('prefix'):
  mat=bpy.data.materials.new(key+'_official_texture');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=cfg['metal'];bs.inputs['Roughness'].default_value=.4
  for suffix,socket in [('_C.png','Base Color'),('_N.png','Normal')]:
   p=src.parent/(cfg['prefix']+suffix)
   if p.exists():
    im=bpy.data.images.load(str(p),check_existing=True)
    if socket=='Normal':im.colorspace_settings.name='Non-Color'
    if max(im.size)>2048:im.scale(2048,2048)
    im.pack();tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im
    if socket=='Normal':
     norm=mat.node_tree.nodes.new('ShaderNodeNormalMap');norm.inputs['Strength'].default_value=.6;mat.node_tree.links.new(tex.outputs['Color'],norm.inputs['Color']);mat.node_tree.links.new(norm.outputs[0],bs.inputs[socket])
    else:mat.node_tree.links.new(tex.outputs['Color'],bs.inputs[socket])
  o.data.materials.clear();o.data.materials.append(mat)
 elif key=='amitabha':
  for mat in o.data.materials:
   if mat and mat.use_nodes:
    bs=mat.node_tree.nodes.get('Principled BSDF')
    if bs:bs.inputs['Metallic'].default_value=.45;bs.inputs['Roughness'].default_value=.48
    for n in mat.node_tree.nodes:
     if n.type=='TEX_IMAGE' and n.image:
      if max(n.image.size)>2048:n.image.scale(2048,2048)
      n.image.pack()
 for p in o.data.polygons:p.use_smooth=True
points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
lo=Vector([min(p[i] for p in points) for i in range(3)]);hi=Vector([max(p[i] for p in points) for i in range(3)]);mid=(lo+hi)/2;extent=max(hi-lo)
print('BOUNDS',key,list(lo),list(hi),flush=True)
# Keep source orientation and original texture mapping. Normalize scale in the web viewer.
bpy.ops.export_scene.gltf(filepath=str(out/(key+'-v1.glb')),export_format='GLB',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_animations=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=True
scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.8,.85,1,1);bg.inputs[1].default_value=.5;scene.view_settings.view_transform='AgX'
def aim(o,p):o.location=p;o.rotation_euler=(mid-o.location).to_track_quat('-Z','Y').to_euler()
for name,offset,power in [('Key',(-2,-3,3),450),('Fill',(2,-1,2),250),('Rim',(0,2,3),350)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power*extent*extent;d.size=extent*3;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);aim(o,mid+Vector(offset)*extent)
d=bpy.data.cameras.new('Camera');o=bpy.data.objects.new('Camera',d);scene.collection.objects.link(o);scene.camera=o;d.type='ORTHO';d.ortho_scale=extent*1.15;d.clip_start=extent*.001;d.clip_end=extent*30;aim(o,mid+Vector((.15,-4,.25))*extent)
scene.render.filepath=str(out/(key+'.png'));bpy.ops.render.render(write_still=True)
report={'id':key,'originalFile':src.name,'polygonsBefore':before,'polygonsAfter':sum(len(o.data.polygons) for o in meshes),'blenderBounds':[list(lo),list(hi)],'glbBytes':(out/(key+'-v1.glb')).stat().st_size,'processing':'Official source geometry, original texture maps; mobile decimation and texture resize. Thumbnail is a render of the exported geometry.'}
(out/(key+'-provenance.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print('DONE',key,json.dumps(report),flush=True)
