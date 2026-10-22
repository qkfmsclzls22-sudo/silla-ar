import bpy, pathlib, json
from mathutils import Vector, Matrix
root=pathlib.Path(__file__).resolve().parents[3]
out=root/'play/assets/museum-v4'
report=[]
for key in ['crown','bell','amitabha','helmet','armor']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(out/(key+'-v1.glb')))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
 lo=Vector([min(p[i] for p in points) for i in range(3)]);hi=Vector([max(p[i] for p in points) for i in range(3)]);mid=(lo+hi)/2;extent=max(hi-lo)
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=True
 scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
 scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.8,.85,1,1);bg.inputs[1].default_value=.5;scene.view_settings.view_transform='AgX'
 def aim(o,p):o.location=p;o.rotation_euler=(mid-o.location).to_track_quat('-Z','Y').to_euler()
 for name,offset,power in [('Key',(-2,-3,3),450),('Fill',(2,-1,2),250),('Rim',(0,2,3),350)]:
  d=bpy.data.lights.new(name,'AREA');d.energy=power*extent*extent;d.size=extent*3;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);aim(o,mid+Vector(offset)*extent)
 d=bpy.data.cameras.new('Camera');o=bpy.data.objects.new('Camera',d);scene.collection.objects.link(o);scene.camera=o;d.type='ORTHO';d.ortho_scale=extent*1.15;d.clip_start=extent*.001;d.clip_end=extent*30;aim(o,mid+Vector((.15,-4,.25))*extent)
 scene.render.filepath=str(out/(key+'.png'));bpy.ops.render.render(write_still=True)
 report.append(dict(id=key,triangles=sum(len(o.data.polygons) for o in meshes),dimensions=list(hi-lo),bytes=(out/(key+'-v1.glb')).stat().st_size))
 print('VERIFIED',key,report[-1],flush=True)
(out/'render-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
