# Kestrel showcase

A GitHub Pages site with a Tripo-generated Kestrel model, Babylon.js camera choreography, and the original Companion animation sheets. The native app continues to use 2D sprites. No Three.js is used.

## Work locally

Run from this directory:

```sh
npm ci
npm run dev
python3 verify-assets.py
node verify-tour.mjs
node verify-fight.mjs
npm run build
npm run preview
```

`public/assets/models/kestrel.glb` retains all 495,914 faces from the Tripo model. All three 4096×4096 textures retain the original export’s PNG/JPEG bytes unchanged. The browser model is about 12.2 MB, with geometry compression only. The original PBR maps are preserved; restrained fill and environment lighting with ACES tone mapping retain the black/red armour contrast. Geometry is Meshopt-compressed with 16-bit position/UV and 14-bit normal precision, without removing triangles. The decoder is hosted with the site. The original 4K export is retained locally as `~/Downloads/Kestrel.glb`; it is not needed to build this site. Generation used the approved first red idle cel with Tripo H3.1. The model is a website interpretation, not a replacement for the native sprite.

The selected sheets and manifest preserve the app's exact cels, pivots, playback rates, and one-shot/loop behavior. The verifier also checks them byte-for-byte when this directory is inside the Companion checkout. The web playground's tasks are synthetic, transient DOM state; it never calls a model, a sensor, the installed app, or the owner's task store.

The 3D canvas renders at device pixel density, capped at 2×, and uses up to 16× anisotropic texture filtering when supported. Resize refreshes the pixel density. Original 4K maps cover the whole model's UV atlas; their soft generated surface detail remains a source-art limitation, even with sharp rendering.

## Publishing

The public `yjay18/kestrel-showcase` repo holds only this website. `main` holds source; `gh-pages` holds the generated contents of `dist/`, including `.nojekyll`. GitHub Pages publishes `gh-pages` at `/`. Future source updates require rebuilding and updating the deployment branch, then verifying the live model, camera path and playground. The Vite base is relative so project Pages paths work.

Publish only website files and the selected public art assets. Never copy native private recording, audio saving, transcription, translation, owner data, credentials, or app repository Git history into this repo. Keep the app repositories' visibility unchanged. No public app installer is claimed or distributed here.

The story uses one continuous orbit close to the armour. Its full-body pullback happens only in the closing reveal; free orbit is offered there. The loading screen plays the original fishing cels with the native ledge, line and bobber until the 4K model and materials are ready. Skip opens the animation viewer; a model failure offers retry. No full-body 3D placeholder is shown. Small live pointer/touch camera offsets reveal depth while preserving the route and close framing; reduced motion disables those offsets.

Choose Dragon fight in the animation viewer to load the approved 24-second Ashen Serpent showdown. The fight uses original sheets and metadata, with play/pause, replay, scrub, beat selection and 1×/0.25× speed. The counter-shot releases at 15.00 seconds with the first hit cel and a world-locked impact. Fight assets load only when requested; hidden/background playback stops. Explicit Play resumes motion, and the global Pause motion control stops the fight.

Verify desktop/mobile layouts, both themes, reduced-motion behavior, model loading/fallback, free orbit/Escape, palette/action buttons and task completion before publishing. Respect OS reduced motion and the site's Pause motion control. Do not add telemetry or provider calls as part of a showcase edit.

## Asset origins

- Kestrel reference and animations: owner-approved Companion Kestrel art, selected from `art/kestrel/palette-pack-v1`.
- Model: [Tripo generation](https://studio.tripo3d.ai/workspace/generate/c32325d6-5bf8-4218-9c4a-abf8e490d58f), owner account, private workspace asset exported for this website.
- Environment lighting: [Babylon.js environment texture](https://playground.babylonjs.com/textures/environment.env).
- Space Grotesk and IBM Plex Mono: self-hosted through Fontsource; font license files included in the source repo.

Asset creation or an automated check is not owner visual approval. Preserve the original drawings and the native app boundary.
