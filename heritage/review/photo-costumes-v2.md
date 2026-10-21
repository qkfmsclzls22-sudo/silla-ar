# Unified photo experience and creative Silla costumes — 2026-10-21

## Changes

The ten primary experiences now use the same full-screen photo camera as the Buddha-smile experience: white shutter, on-screen capture review, save and retake. Flat transparent overlays are used during photography; the separate 3D/AR pages retain real GLB models. Clothing and headwear can be adjusted separately. Tour query parameters are retained.

The former robe, Cheongwan outfit, helmet and standalone armour catalogue slots now become Silla king, Queen Seondeok, noblewoman and Hwarang. Old item IDs resolve to the replacement experiences. The original source assets are retained.

The four creative costumes derive from the official six-du-pum robe and assembled Cheongwan top/skirt. Materials, garment pose, original decorative facings, embroidery, jewellery and headwear were changed. These are explicitly labelled creative, drama-inspired experiences, not authentic royal-costume reconstructions. Source links remain in the catalogue and each asset folder includes provenance.

The pensive Bodhisattva photo uses a new actual-model render with the head removed at z=0.710 m. The complete original `pensive/model-v1.glb` is unchanged for 3D/AR. Its complete image remains in the educational museum quiz.

## Visual references

- MBC ART, 왕복4 / 신라 / 선덕여왕 / 진평왕: https://www.mbcart.com/ancient01/?idx=138
- Queen Seondeok drama still, red clothing and gold jewellery: https://news.nate.com/view/20091207n19343
- Hwarang costume reference, white sleeves, blue clothing and purple trim/headband: https://www.pinkvilla.com/stories/entertainment/park-seo-joons-10-most-iconic-k-drama-roles-1388740

These references informed the colours and decorative direction only. No actor photographs, drama stills or external costume-design files are distributed in the site.

## Verification

- Actual Blender renders inspected for all four costumes, including clean blue/white Hwarang seams; no generated illustration substituted for model validation.
- Four exported GLBs re-imported in Blender, with nonempty meshes, materials, embedded images and plausible metre dimensions. Detailed results: `model-validation-v2.json`.
- New models use versioned `model-v2.glb`; model-viewer generates iOS USDZ from the current model, with no obsolete USDZ attached.
- Chrome at 390 × 844: all ten configurations load their overlays and enable the common shutter using a local illustrated mannequin for fitting tests. King and pensive captures produce 900 × 1200 PNGs; the pensive PNG was downloaded and verified on disk. Individual layer selection and retake work.
- Queen model reaches the 3D-ready status in the browser. Three-dimensional view and common-photo navigation were exercised. The museum displays the updated 12-item collection without console errors.
- Syntax and whitespace checks pass.

## Limits

Phone hardware camera permissions, mobile file-sharing sheets, ARCore and iOS Quick Look require real-device testing. Desktop mobile-width checks are not reported as physical-phone AR verification. Overlay positioning is manual, with drag, pinch, rotation and separate costume/headwear controls.
