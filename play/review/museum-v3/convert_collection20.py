"""Convert licensed KHS files into exhibition derivatives and render the exported GLB."""
import bpy, pathlib, json, zipfile, sys
from mathutils import Vector,Matrix
root=pathlib.Path(__file__).resolve().parents[3]
key=sys.argv[sys.argv.index('--')+1]
out=root/'play/assets/museum-v5';out.mkdir(parents=True,exist_ok=True)
source_dir=root.parent/'source-assets/museum20'/('belt-geumnyeong' if key=='belt' else key);source_dir.mkdir(parents=True,exist_ok=True)
configs={
 'cheomseongdae':('국보_경주_첨성대_00001_모델링_서비스.zip',None,0),
 'dice':('서라벌_천년왕경_주사위_서비스본.zip','T_AR20003',0),
 'shoes':('서라벌_천년왕경_식리총_금동신발.zip','T_24RE0045',.7),
 'necklace':('서라벌_천년왕경_옥류연결_곡옥_목걸이_서비스본.zip','T_CL00095',.05),
 'belt':('서라벌_천년왕경_금령총_금허리띠.zip',None,.65),
 'cheonma':('서라벌_천년왕경_경주_천마총_장니_천마도.zip',None,0),
 'seosu':('서라벌_천년왕경_서수모양주전자.zip',None,0),
 'horseman':('서라벌_천년왕경_기마인물형토기_서비스본.zip',None,0),
 'phoenixglass':('서라벌_천년왕경_봉수형(봉황머리)유리병.zip',None,0),
 'buddha-plaque':('서라벌_천년왕경_금동아미타삼존불_판불_002_서비스본.zip',None,.7),
}
filename,prefix,metal=configs[key];archive=pathlib.Path.home()/'Downloads'/filename
with zipfile.ZipFile(archive) as z:
 for item in z.infolist():
  if not item.is_dir():
   dest=source_dir/pathlib.Path(item.filename).name
   if not dest.exists():dest.write_bytes(z.read(item))
models=[p for p in source_dir.iterdir() if p.suffix.lower() in ('.obj','.fbx')]
src=next((p for p in models if 'cage' in p.stem.lower()),next((p for p in models if p.suffix.lower()=='.fbx'),models[0]))
bpy.ops.wm.read_factory_settings(use_empty=True)
if src.suffix.lower()=='.fbx':bpy.ops.import_scene.fbx(filepath=str(src))
elif key=='cheomseongdae':bpy.ops.wm.obj_import(filepath=str(src),forward_axis='NEGATIVE_Y',up_axis='Z')
else:bpy.ops.wm.obj_import(filepath=str(src))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if key=='belt' and src.suffix.lower()=='.obj':
 image=bpy.data.images.load(str(next(source_dir.glob('*.jpg'))))
 for mat in bpy.data.materials:
  if mat.use_nodes:
   for node in mat.node_tree.nodes:
    if node.type=='TEX_IMAGE':node.image=image
print('SOURCE',key,[(o.name,len(o.data.polygons),[m.name for m in o.data.materials if m]) for o in meshes],flush=True)
before=sum(len(o.data.polygons) for o in meshes)
if src.suffix.lower()=='.fbx' and not prefix:
 colors=list(source_dir.glob('*_C.png'))
 if len(colors)==1:prefix=colors[0].stem[:-2]
for o in meshes:
 bpy.context.view_layer.objects.active=o
 if before>80000:
  mod=o.modifiers.new('Exhibition simplification','DECIMATE');mod.ratio=80000/before;bpy.ops.object.modifier_apply(modifier=mod.name)
 if prefix:
  mat=bpy.data.materials.new(key+'_original_maps');mat.use_nodes=True
  bs=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=.5
  for suffix,socket in [('_C.png','Base Color'),('_N.png','Normal'),('_R.png','Roughness'),('_M.png','Metallic')]:
   p=source_dir/(prefix+suffix)
   if not p.exists():continue
   image=bpy.data.images.load(str(p),check_existing=True)
   if socket!='Base Color':image.colorspace_settings.name='Non-Color'
   if max(image.size)>2048:image.scale(round(image.size[0]*2048/max(image.size)),round(image.size[1]*2048/max(image.size)))
   image.pack();tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
   if socket=='Normal':
    norm=mat.node_tree.nodes.new('ShaderNodeNormalMap');norm.inputs['Strength'].default_value=.7;mat.node_tree.links.new(tex.outputs['Color'],norm.inputs['Color']);mat.node_tree.links.new(norm.outputs[0],bs.inputs[socket])
   else:mat.node_tree.links.new(tex.outputs['Color'],bs.inputs[socket])
  o.data.materials.clear();o.data.materials.append(mat)
 for mat in o.data.materials:
  if mat and mat.use_nodes:
   bs=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
   if bs:bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=.5 if metal else .72
   for node in mat.node_tree.nodes:
    if node.type=='TEX_IMAGE' and node.image:
     image=node.image
     if not image.has_data:
      candidate=source_dir/pathlib.Path(image.filepath.replace('\\','/')).name
      if candidate.exists():image.filepath=str(candidate);image.reload()
     if max(image.size)>2048:image.scale(round(image.size[0]*2048/max(image.size)),round(image.size[1]*2048/max(image.size)))
     if image.has_data:
      optimized=source_dir/'optimized';optimized.mkdir(exist_ok=True)
      image.filepath_raw=str(optimized/(pathlib.Path(image.name).stem+'.png'));image.file_format='PNG';image.save();image.pack()
points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
lo=Vector([min(p[i] for p in points) for i in range(3)]);hi=Vector([max(p[i] for p in points) for i in range(3)])
scale=2/(hi.z-lo.z);mid=(lo+hi)/2
transform=Matrix.Scale(scale,4)@Matrix.Translation(-Vector((mid.x,mid.y,lo.z)))
for o in meshes:o.matrix_world=transform@o.matrix_world
bpy.ops.export_scene.gltf(filepath=str(out/(key+'-v1.glb')),export_format='GLB',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_animations=False)
# Start again from the delivered file; the thumbnail verifies that its geometry and maps reload.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(out/(key+'-v1.glb')))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
lo=Vector([min(p[i] for p in points) for i in range(3)]);hi=Vector([max(p[i] for p in points) for i in range(3)]);mid=(lo+hi)/2;extent=max(hi-lo)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.8,.85,1,1);bg.inputs[1].default_value=.5;scene.view_settings.view_transform='AgX'
def aim(o,p):o.location=p;o.rotation_euler=(mid-o.location).to_track_quat('-Z','Y').to_euler()
for name,offset,power in [('Key',(-2,-3,3),450),('Fill',(2,-1,2),250),('Rim',(0,2,3),350)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power*extent*extent;d.size=extent*3;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);aim(o,mid+Vector(offset)*extent)
d=bpy.data.cameras.new('Camera');o=bpy.data.objects.new('Camera',d);scene.collection.objects.link(o);scene.camera=o;d.type='ORTHO';d.ortho_scale=extent*1.15;d.clip_start=extent*.001;d.clip_end=extent*30;aim(o,mid+Vector((.3,-4,.35))*extent)
scene.render.filepath=str(out/(key+'.png'));bpy.ops.render.render(write_still=True)
report={'id':key,'archive':archive.name,'originalFile':src.name,'polygonsBefore':before,'triangles':sum(len(o.data.polygons) for o in meshes),'dimensions':list(hi-lo),'bytes':(out/(key+'-v1.glb')).stat().st_size,'processing':'Official KHS source model and original texture maps. Uniform scaling, mesh reduction and texture resize. Thumbnail rendered after re-importing exported GLB.'}
(out/(key+'-provenance.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False),flush=True)
