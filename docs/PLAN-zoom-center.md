# Zoom polish: center zoom-in on clicked satellite, animate zoom-out with spinning starfield

## Context
Two problems in `src/OrbitalMenu.jsx`:

1. **Zoom-in off-center** (`handleSelect`, line 59): sets `zoom = { dx: cx, dy: cy }` (the core's pixel position). `.orbit-field.zooming` (`src/css/planet.css:8`) applies `translate(var(--dx), var(--dy)) scale(7)` about the field center, so the field zooms toward an unrelated point. The satellite's `x, y` are passed in but ignored.
2. **Zoom-out is instant** (`handleZoomOut`, line 74): just calls `setFocusId(parentId)` with no animation, and the starfield (`src/css/starfield.css`, only a slow background-position `drift`) does nothing.

## Part 1: center zoom-in (handleSelect)
Transform maps point p to `C + 7*(p - C) + d` with C = field center (W/2, H/2). To land the clicked satellite (x, y) on the new core position (cx, cy):

- `dx = cx - W/2 - 7*(x - W/2)`
- `dy = cy - H/2 - 7*(y - H/2)`

Get W/H from the currently unused `fieldRef.current.getBoundingClientRect()`. Add `const ZOOM_SCALE = 7` near `speedFor` (keep in sync with `planet.css`). Fix the stale comment.

## Part 2: animated zoom-out + spinning starfield (handleZoomOut)
Mirror of zoom-in, in two phases (total ~650ms, same as zoom-in):

1. **Shrink out**: new state `zoomingOut` (boolean). `handleZoomOut` sets it (and clears hover), guards on `zoom || zoomingOut`. The field gets class `zooming-out`: `transform: scale(0.15); opacity: 0` about the core (field center, matching the core's position closely enough; no translate needed). Include `zoomingOut` in `zoomingRef` so satellites freeze during the animation.
2. **Swap + arrive**: after a 650ms timeout, `setFocusId(parentId)`, `setZoomingOut(false)`, and trigger a short `zoom-arrive` CSS keyframe on the field (from `scale(1.6); opacity 0` to `scale(1); opacity 1`, ~400ms) so the parent view eases in instead of popping. Implement via a state flag cleared on `animationend` (or timeout).

**Starfield spin**: keep a `spin` state (degrees). Each zoom-out does `setSpin(s => s + 90)` (direction opposite the zoom, e.g. negative, is a free choice; default positive). Apply to the starfield div: `style={{ transform: `rotate(${spin}deg)` }}` with `transition: transform 0.65s cubic-bezier(0.6, 0, 0.4, 1)` in `starfield.css`. Accumulating degrees avoids a snap-back at the end of the animation. The existing `drift` animation uses `background-position`, so it doesn't conflict.

To avoid empty corners while rotated, enlarge the starfield in `starfield.css`: `inset: -75%` (2.5x the viewport; safe for aspect ratios up to ~2:1 and more). Tile size stays 600px so star density is unchanged. The root already hides overflow (`body { overflow: hidden }`); also add `overflow: hidden` to `.orbital-root` if it doesn't already clip.

Timeout hygiene: store timeout ids in a ref and clear on unmount (zoom-in currently doesn't; apply to both while here).

## Files
- `src/OrbitalMenu.jsx`: handleSelect math, handleZoomOut animation, new state (`zoomingOut`, `spin`, arrive flag), field className, starfield style.
- `src/css/planet.css`: `.orbit-field.zooming-out`, `.orbit-field.arriving` keyframes.
- `src/css/starfield.css`: bigger inset, transform transition.

## Out of scope (flagging)
Breadcrumb links and the `<h1>` call `setFocusId` directly, so they still switch instantly with no animation. Not changed unless you want them routed through the same zoom-out.

## Verification
- `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"; npm run dev`, open http://localhost:5173.
- Click satellites at several orbit positions (left/right/top/bottom/front/back): clicked satellite scales up and glides to the center sphere position.
- In a submenu, click the core sphere: field shrinks and fades, starfield visibly rotates ~90deg, parent orbit eases in. Repeat to confirm rotation accumulates with no snap and no empty corners at wide and narrow window sizes.
- Click rapidly during animations: no double triggers or stuck states.
- Keyboard Enter/Space on a satellite and the description-panel child links still work.
- `npm run build` passes.
