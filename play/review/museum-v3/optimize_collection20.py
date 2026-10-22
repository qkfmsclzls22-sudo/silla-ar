"""Optimize verified exported derivatives; render each delivered GLB again."""
import bpy, pathlib, sys, json, math
from mathutils import Matrix, Vector
root=pathlib.Path(__file__).resolve().parents[3]
key=sys.argv[sys.argv.index('--')+1]
out=root/'play/assets/museum-v5'
path=out/(key+'-v1.glb')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(path))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
angle=0 if '--orientation-applied' in sys.argv else {'cheonma':-90,'shoes':45}.get(key,0)
if '--flip-front' in sys.argv:angle+=180
for obj in meshes:obj.matrix_world=Matrix.Rotation(math.radians(angle),4,'Z')@obj.matrix_world
optimized=root.parent/'source-assets/museum20'/key/'web-maps';optimized.mkdir(parents=True,exist_ok=True)
colors=set()
for mat in bpy.data.materials:
 if not mat.use_nodes:continue
 for link in mat.node_tree.links:
  if link.to_socket.name=='Base Color' and link.from_node.type=='TEX_IMAGE':colors.add(link.from_node.image)
replacements={}
for i,img in enumerate(list(bpy.data.images)):
 original=img
 if img.packed_file:
  packed=bytes(img.packed_file.data);original_path=optimized/(str(i)+'-original'+('.png' if packed.startswith(b'\x89PNG') else '.jpg'));original_path.write_bytes(packed)
  img=bpy.data.images.load(str(original_path),check_existing=False);img.colorspace_settings.name=original.colorspace_settings.name
 if len(img.pixels)==0:continue
 limit=1536 if original in colors else 1024
 if max(img.size)>limit:img.scale(round(img.size[0]*limit/max(img.size)),round(img.size[1]*limit/max(img.size)))
 ext='jpg' if original in colors else 'png'
 img.filepath_raw=str(optimized/(str(i)+'.'+ext));img.file_format='JPEG' if ext=='jpg' else 'PNG';img.save()
 fresh=bpy.data.images.load(img.filepath_raw,check_existing=False);fresh.colorspace_settings.name=img.colorspace_settings.name;fresh.pack();replacements[original]=fresh
for mat in bpy.data.materials:
 if mat.use_nodes:
  for node in mat.node_tree.nodes:
   if node.type=='TEX_IMAGE' and node.image in replacements:node.image=replacements[node.image]
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_animations=False,export_image_quality=90)
# Reuse the same actual-GLB render recipe, without importing the large originals again.
source=(root/'play/review/museum-v3/convert_collection20.py').read_text(encoding='utf-8')
render=source.split('# Start again from the delivered file;')[1].split('\n',1)[1].split("report={'id':")[0]
exec(render)
report_path=out/(key+'-provenance.json');report=json.loads(report_path.read_text(encoding='utf-8'))
report.update(bytes=path.stat().st_size,dimensions=list(hi-lo),triangles=sum(len(o.data.polygons) for o in meshes),processing='Official KHS model and original texture maps. Uniform scale, mesh reduction when necessary, 1536px color / 1024px data textures; display orientation adjusted for cheonma and shoes. Thumbnail rendered from the final exported GLB.')
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False),flush=True)
