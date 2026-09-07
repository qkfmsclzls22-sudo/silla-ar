/* npm install @gltf-transform/core@4.5.0 @gltf-transform/extensions@4.5.0
 * @gltf-transform/functions@4.5.0 draco3dgltf sharp
 * Usage: node compress_v6.cjs authored.glb shipped.glb [dependency-directory]
 * Also writes a decoded GLB for independent numerical/render verification.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createRequire} = require('node:module');
const deps = process.argv[4]
  ? createRequire(path.resolve(process.argv[4], 'package.json')) : require;
const {NodeIO} = deps('@gltf-transform/core');
const {ALL_EXTENSIONS} = deps('@gltf-transform/extensions');
const {draco} = deps('@gltf-transform/functions');
const draco3d = deps('draco3dgltf');
const sharp = deps('sharp');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || path.resolve(input) === path.resolve(output)) {
    throw new Error('Provide distinct authored input and delivery output paths.');
  }
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });
  const doc = await io.read(input);
  const converted = [];
  // Both color maps are fully opaque. Keep normal/roughness and new maps intact.
  for (const texture of doc.getRoot().listTextures()) {
    if (!['Original_T_24CL0003_C', 'Queen_2K_Color'].includes(texture.getName())) continue;
    const original = texture.getImage();
    const stats = await sharp(original).stats();
    if (!stats.isOpaque) throw new Error('Cannot discard transparent pixels.');
    const jpeg = await sharp(original).removeAlpha().jpeg({quality: 90, chromaSubsampling:'4:4:4'}).toBuffer();
    texture.setImage(jpeg).setMimeType('image/jpeg');
    converted.push({name:texture.getName(),original_bytes:original.length,delivery_bytes:jpeg.length,
      original_sha256:sha(original),delivery_sha256:sha(jpeg),quality:90,resized:false});
  }
  if (converted.length !== 2) throw new Error('Expected two opaque original color maps.');
  await doc.transform(draco({method:'edgebreaker',encodeSpeed:5,decodeSpeed:5,
    quantizePosition:16,quantizeNormal:16,quantizeTexcoord:16,
    quantizeColor:16,quantizeGeneric:16,quantizationVolume:'mesh'}));
  await io.write(output, doc);
  const roundtrip = await io.read(output);
  for (const ext of roundtrip.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  }
  const decoded = output.replace(/\.glb$/i, '.decoded.glb');
  await io.write(decoded, roundtrip);
  const data = fs.readFileSync(output);
  const report = {input_sha256:sha(fs.readFileSync(input)),bytes:data.length,sha256:sha(data),
    geometry_compression:'KHR_draco_mesh_compression',position_quantization_bits:16,
    simplification:false,converted_color_maps:converted,other_encoded_images_preserved:true,
    decoded_verification_file:path.basename(decoded)};
  fs.writeFileSync(output.replace(/\.glb$/i,'.compression.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
