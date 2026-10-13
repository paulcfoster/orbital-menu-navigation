import { useEffect, useReducer, useRef, useState } from 'react'
import { orbitConfig } from './orbitConfig'

// Angular speed (radians/sec) for the satellite at a given index. Slight
// per-item variation keeps the orbits from looking mechanical.
const speedFor = (i) =>
  orbitConfig.baseSpeed + (i % 3) * orbitConfig.speedVariation

export default function OrbitalMenu({ tree }) {
  const { byId, roots } = tree

  const [focusId, setFocusId] = useState(null) // null = top-level orbit
  const [hoveredId, setHoveredId] = useState(null)
  const [zoom, setZoom] = useState(null) // { dx, dy } while zooming in/out

  const focusNode = focusId ? byId.get(focusId) : null
  const satellites = focusNode ? focusNode.children : roots
  const parentId = focusNode ? focusNode.parentId || null : null

  // --- animation state kept in refs so the rAF loop never restarts ---
  const anglesRef = useRef({})
  const hoveredRef = useRef(null)
  const zoomingRef = useRef(false)
  const fieldRef = useRef(null)
  const [, tick] = useReducer((x) => x + 1, 0)

  hoveredRef.current = hoveredId
  zoomingRef.current = !!zoom

  // Seed angles whenever the set of satellites changes.
  useEffect(() => {
    const next = {}
    satellites.forEach((s, i) => {
      next[s.id] = (i / satellites.length) * Math.PI * 2
    })
    anglesRef.current = next
  }, [satellites])

  // Single persistent animation loop.
  useEffect(() => {
    let raf
    let last = null
    const loop = (ts) => {
      if (last == null) last = ts
      const dt = (ts - last) / 1000
      last = ts
      const a = anglesRef.current
      Object.keys(a).forEach((id, i) => {
        const frozen = id === hoveredRef.current || zoomingRef.current
        if (!frozen) a[id] += dt * speedFor(i)
      })
      tick()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleSelect = (node, x, y, cx, cy) => {
    // console.log(node)
    // console.log(x)
    // console.log(y)
    // console.log(cx)
    // console.log(cy)
    // console.log(zoom)
    // return
    if (zoom) return
    if (node.children.length > 0) {
      // Zoom into this satellite: glide it to center, scale up, then swap focus.
      setHoveredId(null)
      setZoom({ dx: cx - x, dy: cy - y })
      window.setTimeout(() => {
        setFocusId(node.id)
        setZoom(null)
      }, 650)
    } else if (node.link) {
      window.open(node.link, '_blank', 'noopener')
    }
  }

  const handleZoomOut = () => {
    if (zoom || !focusNode) return
    setHoveredId(null)
    setFocusId(parentId)
  }

  const hoveredNode = hoveredId ? byId.get(hoveredId) : null

  return (
    <div className="orbital-root">
      <div className="starfield"/>

      <header className="masthead">
        <h1>Orbital Menu Navigation</h1>
        {focusNode && (
          <button className="back-link" onClick={handleZoomOut}>
            ← {parentId ? byId.get(parentId).label : 'Top orbit'}
          </button>
        )}
      </header>

      <div
        ref={fieldRef}
        className={`orbit-field${zoom ? ' zooming' : ''}`}
        style={zoom ? { '--dx': `${zoom.dx}px`, '--dy': `${zoom.dy}px` } : undefined}
      >
        <OrbitContent
          satellites={satellites}
          anglesRef={anglesRef}
          focusNode={focusNode}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onSelect={handleSelect}
          onCoreClick={handleZoomOut}
        />
      </div>

      {hoveredNode && (
        <aside className="description-panel">
          <h2>{hoveredNode.label}</h2>
          <p>{hoveredNode.description}</p>
          {hoveredNode.children.length > 0 ? (
            <span className="hint">Click to enter orbit →</span>
          ) : hoveredNode.link ? (
            <span className="hint">Click to open ↗</span>
          ) : null}
        </aside>
      )}
    </div>
  )
}

// Renders the central sphere plus the orbiting satellites. Split out so the
// per-frame geometry math reads cleanly.
function OrbitContent({
  satellites,
  anglesRef,
  focusNode,
  hoveredId,
  setHoveredId,
  onSelect,
  onCoreClick,
}) {
  const wrapRef = useRef(null)
  const [size, setSize] = useState({ w: 800, h: 600 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const {
    radiusFactor,
    centerXOffset,
    centerYOffset,
    tiltX,
    tiltY,
    depthScale,
    minOpacity,
  } = orbitConfig

  const cx = size.w / 2 + centerXOffset
  const cy = size.h / 2 + centerYOffset
  const radius = Math.min(size.w, size.h) * radiusFactor

  // Trig for the orbital-plane rotation, computed once per render.
  const cosX = Math.cos(tiltX)
  const sinX = Math.sin(tiltX)
  const cosY = Math.cos(tiltY)
  const sinY = Math.sin(tiltY)

  // The guide ring is the orbit circle projected onto the screen. With an
  // orthographic projection that ellipse's axes shrink by cos(tilt).
  // const ringW = radius * 2 * Math.abs(cosY)
  // const ringH = radius * 2 * Math.abs(cosX)
  // Hiding as it does not line up well with "Saturn ring tilt" (see orbitConfig.js)
  // Previous sat just within .orbit-wrap.
  // <div className="orbit-ring" style={{ width: ringW, height: ringH, left: cx, top: cy }} />

  const coreSphereStyles = { left: cx, top: cy }
  const testAttr = "tabindex: '-1'"
  // Planet is not clickable if at top level.
  if (!focusNode) {
    coreSphereStyles.pointerEvents = 'none'
  }

  return (
    <div className="orbit-wrap" ref={wrapRef}>

      <button
        className="core-sphere base-sphere"
        style={coreSphereStyles}
        onClick={onCoreClick}
        aria-label={focusNode ? 'Zoom back out' : ''}
        tabIndex={focusNode ? '1' : '-1'}
      >
        <span>{focusNode ? focusNode.label : 'Orbital Menu'}</span>
      </button>

      {satellites.map((node) => {
        const angle = anglesRef.current[node.id] ?? 0

        // Satellite position on a flat circle, then rotate that circle's
        // plane: first about the X axis (tiltX), then the Y axis (tiltY).
        const px = radius * Math.cos(angle)
        const py0 = radius * Math.sin(angle)
        const py = py0 * cosX // X-axis rotation: vertical squash
        const pz0 = py0 * sinX // …pushes points into depth
        const x = cx + px * cosY + pz0 * sinY // Y-axis rotation
        const y = cy + py
        const z = -px * sinY + pz0 * cosY // signed depth: +toward viewer

        // Depth cues. zNorm is −1 (farthest) … +1 (nearest).
        const zNorm = radius ? z / radius : 0
        const depth = 1 + zNorm * depthScale
        const opacity = minOpacity + (1 - minOpacity) * ((zNorm + 1) / 2)
        const isHovered = node.id === hoveredId
        // Behind the core (z<0) paints under it; in front paints over it.
        // The core sphere sits at z-index 2 (see index.css).
        const zIndex = isHovered ? 4 : z < 0 ? 1 : 3

        return (
          <button
            key={node.id}
            className={`satellite${isHovered ? ' frozen' : ''}${
              node.children.length ? ` has-children-${node.children.length}` : ''
            }`}
            style={{ left: x, top: y, transform: `scale(${depth})`, opacity, zIndex }}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId((cur) => (cur === node.id ? null : cur))}
            onClick={() => onSelect(node, x, y, cx, cy)}
          >
            <span className="base-sphere satellite-dot" />
            <span className="satellite-label">{node.label}</span>
            {/* <div className="description-panel">
                <p>{node.description}</p>
                {node.children.length > 0 ? (
                  <span className="hint">Click to enter orbit →</span>
                ) : node.link ? (
                  <span className="hint">Click to open ↗</span>
                ) : null}
            </div> */}
          </button>
        )
      })}
    </div>
  )
}
