// Tunable parameters for the orbital animation.
// Edit any value here — no other code changes are needed.
//
// All angles are in RADIANS. Use the DEG helper to write them in degrees,
// e.g. `65 * DEG`.  (π rad = 180° ≈ 3.14159; π/2 = 90° ≈ 1.5708)

const DEG = Math.PI / 180

export const orbitConfig = {
  // ─── Size & position of the whole system ─────────────────────────────
  radiusFactor: 0.33, // orbit radius as a fraction of the smaller viewport side
  centerXOffset: 0, // px to shift the system right (+) / left (−)
  centerYOffset: 0, // px to shift the system down (+) / up (−)

  // ─── Orientation of the orbital plane (the x / y / z tilt) ───────────
  // tiltX tips the ring forward/back around the horizontal (X) axis.
  //   0       → flat circle facing you (the original look)
  //   90*DEG  → fully edge-on; satellites pass straight in front of / behind
  //             the core sphere
  //   ~65*DEG → a "Saturn ring" tilt (default)
  tiltX: 65 * DEG,
  // tiltY swivels the ring left/right around the vertical (Y) axis.
  //   0 → no swivel.  Combine with tiltX for an off-axis plane.
  tiltY: -30 * DEG,

  // ─── Depth cues derived from each satellite's z position ─────────────
  depthScale: 0.45, // near/far size difference (0 = none, 0.45 = ±45%)
  minOpacity: 0.45, // opacity of the deepest (farthest) satellites (1 = no fade)

  // ─── Motion ──────────────────────────────────────────────────────────
  baseSpeed: 0.22, // angular speed in radians/sec
  speedVariation: 0.0, // per-satellite speed spread, to de-sync the orbits
}

export default orbitConfig
