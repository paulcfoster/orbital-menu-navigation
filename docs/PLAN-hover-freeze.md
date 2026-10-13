# Hover-freeze that keeps tracking its orbit, then glides back

## Context
In `src/OrbitalMenu.jsx`, the rAF loop (lines 43-51) skips `a[id] += dt * speedFor(i)` for the hovered satellite, so its angle stops advancing and it permanently falls behind on mouseout. Desired: while hovered the satellite looks frozen but its true orbital position keeps advancing; on mouseout it glides forward to where it should be now.

## Design: true angle + lag
`anglesRef` stays the true angle (always advances, except while zooming). New `lagRef` (per id) = radians the displayed satellite trails the true angle. Displayed angle = `anglesRef[id] - lagRef[id]`; `OrbitContent` renders with that.

Per frame in the existing loop (hover handlers unchanged; loop already reads `hoveredRef`):
1. Zooming: no advance, no lag change (as today).
2. Else advance true angle by `dt * speedFor(i)`.
3. Hovered: cancel any release; `lag += dt * speedFor(i)` (displayed angle constant).
4. Not hovered, lag > 0, no release: start `release[id] = { t0: ts, lag0: lag % 2π }` (forward, at most one lap).
5. Releasing: `p = clamp((ts - t0)/releaseDuration)`, `lag = lag0 * (1 - ease(p))`; at p=1 lag = 0 and delete record. Target is the moving true angle.
6. Re-hover mid-release resumes from the current lag.

Seeding effect (lines 31-37) also resets `lagRef` and `releaseRef`.

## Files
- `src/OrbitalMenu.jsx`: loop, refs, displayed angle in `OrbitContent`, reseed reset.
- `src/orbitConfig.js`: `releaseDuration` (~700 ms).

## Verification
- `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"; npm run dev`
- Hover ~10s then leave: smooth forward glide, no jump/backwards motion, spacing vs neighbors preserved.
- Leave and re-enter mid-glide: freezes in place, no jump.
- `npm run build` passes.

