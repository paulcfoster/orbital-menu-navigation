# Orbital Menu Navigation

An animated website menu where each menu item is a satellite orbiting a large
central sphere.

- **Orbit** — menu items continuously orbit the central sphere on a tilted
  plane, passing in front of and behind it (scaling and fading with depth).
- **Hover** — freezes that satellite in place and shows its description.
- **Click** — zooms into the satellite until it becomes the central sphere,
  and its submenu items appear as new orbiting satellites.
- **Click the central sphere** (or the back button) to zoom back out.

Menu items are defined entirely in [`public/menu.csv`](public/menu.csv) — edit
that file to change the menu; no code changes needed.

The look of the orbit (plane tilt, radius, depth, speed) is controlled from
[`src/orbitConfig.js`](src/orbitConfig.js) — see [Tuning the orbit](#tuning-the-orbit).

## Menu CSV format

| Column        | Meaning                                                        |
| ------------- | -------------------------------------------------------------- |
| `id`          | Unique identifier for the item.                                |
| `parentId`    | `id` of the parent item; leave blank for top-level items.      |
| `label`       | Text shown on the satellite.                                   |
| `description` | Shown when the item is hovered (wrap in quotes if it has commas). |
| `link`        | Optional URL — opened when a leaf item (no children) is clicked. |

## Tuning the orbit

All orbit parameters live in [`src/orbitConfig.js`](src/orbitConfig.js). Edit
the values there and the change is picked up on the next dev reload / build —
no other code changes needed. Angles are in radians (use the `DEG` helper).

| Parameter                       | Effect                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| `tiltX`                         | Tips the plane forward/back. `0` = flat circle, `90*DEG` = edge-on. |
| `tiltY`                         | Swivels the plane left/right around the vertical axis.              |
| `radiusFactor`                  | Orbit radius as a fraction of the smaller viewport side.            |
| `centerXOffset` / `centerYOffset` | Shift the whole system in pixels.                                 |
| `depthScale`                    | Near/far size difference (`0` = none).                              |
| `minOpacity`                    | Opacity of the farthest satellites (`1` = no fade).                 |
| `baseSpeed` / `speedVariation`  | Orbit angular speed and per-satellite spread.                       |

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Tech

- [React](https://react.dev) 18 + [Vite](https://vitejs.dev)
- Pure CSS animation (no animation libraries) driven by a single
  `requestAnimationFrame` loop in [`src/OrbitalMenu.jsx`](src/OrbitalMenu.jsx).
- Tiny dependency-free CSV parser in [`src/csv.js`](src/csv.js).

## Project layout

```
public/menu.csv        # menu definition (edit this)
src/main.jsx           # React entry point
src/App.jsx            # loads + parses the CSV, then renders the menu
src/OrbitalMenu.jsx    # orbit animation, tilt projection, hover-freeze, zoom
src/orbitConfig.js     # tunable orbit parameters (tilt, radius, depth, speed)
src/csv.js             # CSV parser + tree builder
src/index.css          # all styling / keyframe animations
```
