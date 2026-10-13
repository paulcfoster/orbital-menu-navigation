# Orbital Menu Navigation

Animated website menu where menu items are satellites orbiting a large central
sphere. Built with React 18 + Vite. Pure CSS/`requestAnimationFrame` animation —
no 3D or animation libraries.

## Behavior

- Satellites continuously orbit the central sphere. The orbital plane is
  tilted into depth (configurable), so satellites pass in front of and behind
  the sphere, scaling and fading with their z-position.
- **Hover** a satellite → freezes it in orbit and shows its description in a panel.
- **Click** a satellite with children → zooms into it until it becomes the
  central sphere; its submenu items appear as new orbiting satellites.
- **Click the core sphere** (or the back button) → zooms back out to the parent.
- Leaf items (no children) with a `link` open that URL in a new tab.

## Menu data

The entire menu is defined in `public/menu.csv` — edit that file to change the
menu, no code changes needed. Columns:

`id, parentId, label, description, link`
(blank `parentId` = top-level item; quote `description` if it contains commas.)

## Orbit tuning

All orbit parameters live in `src/orbitConfig.js` — edit that file, no other
code changes needed. Notably:

- `tiltX` / `tiltY` — orientation of the orbital plane (angles in radians; use
  the `DEG` helper). `tiltX: 0` = flat circle facing the viewer (original look),
  `90*DEG` = fully edge-on, `~65*DEG` = Saturn-ring tilt (default).
- `radiusFactor`, `centerXOffset`, `centerYOffset` — size and position.
- `depthScale`, `minOpacity` — near/far size and fade cues.
- `baseSpeed`, `speedVariation` — orbit speed.

The projection is plain trig (rotate the orbit circle's plane about X then Y,
then project to 2D); depth drives each satellite's CSS scale, opacity, and
z-index. The core sphere has `z-index: 2` so satellites pass behind it.

## Layout

```
public/menu.csv      # menu definition (edit this)
src/main.jsx         # React entry point
src/App.jsx          # fetches + parses CSV, renders the menu
src/OrbitalMenu.jsx  # orbit animation, tilt projection, hover-freeze, zoom
src/orbitConfig.js   # tunable orbit parameters (tilt, radius, depth, speed)
src/csv.js           # dependency-free CSV parser + tree builder
src/index.css        # sphere, starfield, all keyframe animations
```

## Running

`npm` is installed via nvm and is not on the default PATH. Prefix with:

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
```

Then:

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview
```

Status: scaffolding complete, dependencies installed, production build passes.

## Possible next steps

- Optional swap to a true 3D WebGL sphere via `@react-three/fiber` if a real
  3D look is wanted (current approach is intentionally light-weight 2D/CSS).
- Deeper submenu nesting is already supported by the CSV `parentId` model.
