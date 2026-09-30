# Kestrel showcase

A GitHub Pages site with a Tripo-generated Kestrel model, Babylon.js camera choreography, and the original Companion animation sheets. The native app continues to use 2D sprites. No Three.js is used.

## Work locally

Run from this directory:

```sh
npm ci
npm run dev
python3 verify-assets.py
npm run build
npm run preview
```

`public/assets/models/kestrel.glb` retains all 495,914 faces from the Tripo model. Its textures are resized to 2048 pixels and encoded as WebP for the browser. Geometry is Meshopt-compressed with 16-bit position/UV and 14-bit normal precision, without removing triangles. The decoder is hosted with the site. The original 4K export is retained locally as `~/Downloads/Kestrel.glb`; it is not needed to build this site. Generation used the approved first red idle cel with Tripo H3.1. The model is a website interpretation, not a replacement for the native sprite.

The selected sheets and manifest preserve the app's exact cels, pivots, playback rates, and one-shot/loop behavior. The verifier also checks them byte-for-byte when this directory is inside the Companion checkout. The web playground's tasks are synthetic, transient DOM state; it never calls a model, a sensor, the installed app, or the owner's task store.

## Publishing

The public `yjay18/kestrel-showcase` repo holds only this website. `main` holds source; `gh-pages` holds the generated contents of `dist/`, including `.nojekyll`. GitHub Pages publishes `gh-pages` at `/`. Future source updates require rebuilding and updating the deployment branch, then verifying the live model, camera path and playground. The Vite base is relative so project Pages paths work.

Publish only website files and the selected public art assets. Never copy native private recording, audio saving, transcription, translation, owner data, credentials, or app repository Git history into this repo. Keep the app repositories' visibility unchanged. No public app installer is claimed or distributed here.

Verify desktop/mobile layouts, both themes, reduced-motion behavior, model loading/fallback, free orbit/Escape, palette/action buttons and task completion before publishing. Respect OS reduced motion and the site's Pause motion control. Do not add telemetry or provider calls as part of a showcase edit.

## Asset origins

- Kestrel reference and animations: owner-approved Companion Kestrel art, selected from `art/kestrel/palette-pack-v1`.
- Model: [Tripo generation](https://studio.tripo3d.ai/workspace/generate/c32325d6-5bf8-4218-9c4a-abf8e490d58f), owner account, private workspace asset exported for this website.
- Environment lighting: [Babylon.js environment texture](https://playground.babylonjs.com/textures/environment.env).
- Space Grotesk and IBM Plex Mono: self-hosted through Fontsource; font license files included in the source repo.

Asset creation or an automated check is not owner visual approval. Preserve the original drawings and the native app boundary.
