import bpy, pathlib, math, json
from mathutils import Vector
root=pathlib.Path(__file__).resolve().parents[3]
out=root/'play/assets/museum-v3'; out.mkdir(parents=True,exist_ok=True)
assets={'pensive':'heritage/assets/pensive/model-v1.glb','wing':'heritage/assets/wing/model-v1.glb','earrings':'heritage/assets/earrings/model-v1.glb','smile':'smile/smile-textured-v1.glb','toou':'toou/toou-v2.glb'}
report=[]
for key,rel in assets.items():
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(root/rel))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 before=sum(len(o.data.polygons) for o in meshes)
 if key=='smile':
  for o in meshes:
   bpy.context.view_layer.objects.active=o
   if len(o.data.polygons)>10000:
    mod=o.modifiers.new('Mobile exhibition','DECIMATE');mod.ratio=min(1,120000/before);bpy.ops.object.modifier_apply(modifier=mod.name)
  bpy.ops.export_scene.gltf(filepath=str(out/'smile-v1.glb'),export_format='GLB',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
 points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
 low=Vector([min(p[i] for p in points) for i in range(3)]);high=Vector([max(p[i] for p in points) for i in range(3)]);mid=(low+high)/2;size=max(high-low)
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
 scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
 scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.8,.85,1,1);bg.inputs[1].default_value=.5
 scene.view_settings.view_transform='AgX'
 def aim(o,p):o.location=p;o.rotation_euler=(mid-o.location).to_track_quat('-Z','Y').to_euler()
 for name,offset,power in [('Key',(-2,-3,3),450),('Fill',(2,-1,2),250),('Rim',(0,2,3),350)]:
  d=bpy.data.lights.new(name,'AREA');d.energy=power*size*size;d.size=size*3;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);aim(o,mid+Vector(offset)*size)
 d=bpy.data.cameras.new('Camera');o=bpy.data.objects.new('Camera',d);scene.collection.objects.link(o);scene.camera=o;d.type='ORTHO';d.ortho_scale=size*1.15;aim(o,mid+Vector((.15,-4,.18))*size)
 scene.render.filepath=str(out/(key+'.png'));bpy.ops.render.render(write_still=True)
 report.append({'id':key,'source':rel,'polygonsBefore':before,'polygonsAfter':sum(len(o.data.polygons) for o in meshes),'blenderBounds':[list(low),list(high)]})
 print('ASSET',json.dumps(report[-1]),flush=True)
(out/'model-review.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
