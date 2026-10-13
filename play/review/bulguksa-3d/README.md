# Bulguksa 3D courtyard

Replaces fixed 2D background with procedural Three.js scene using existing bundled renderer and geometry kit. Simplified temple composition, not a measured reconstruction. 180×150 ground, 94×85 courtyard, surrounding trees, hall, two distinct pagodas and colonnades. Camera orbit/pan/pinch, zoom buttons (12–240 camera distance), reset and CSS fullscreen for iPhone compatibility. Preserves 40 shared lantern slots, existing normalized avatar positions, room identity, chat, 10-person cap, day/night and canvas export. Networking/rules untouched. Pointer gesture threshold prevents orbit/pinch from becoming placement taps. Rendering only when state or camera changes.

Verified actual browser renders on desktop and mobile dimensions: no page errors, zoom 142.34→113.87, fullscreen canvas 388×844. Isolated QA room: create/read/remove wish and PNG snapshot succeeded. CDP touch rotation changes camera; pinch distance 240→141.82. Screenshots visually inspected for daylight, night, mobile and lit lantern. One live room participant connected; simultaneous 10-phone and physical iPhone were not tested. Existing network reliability constraints still apply.

Before: static background canvas. After: 3D scene with free camera and expanded ground. No AI-rendered screenshots used as evidence.
