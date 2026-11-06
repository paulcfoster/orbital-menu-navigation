import { useEffect, useReducer, useRef, useState } from 'react'
import { orbitConfig } from './orbitConfig'

// Angular speed (radians/sec) for the satellite at a given index. Slight
// per-item variation keeps the orbits from looking mechanical.
const speedFor = (i) =>
  orbitConfig.baseSpeed + (i % 3) * orbitConfig.speedVariation

const ZOOM_SCALE = 7 // must match planet.css .orbit-field.zooming scale()

export default function OrbitalMenu({ tree }) {
  const { byId, roots } = tree

  const [focusId, setFocusId] = useState(null) // null = top-level orbit
  const [hoveredId, setHoveredId] = useState(null)
  const [zoom, setZoom] = useState(null) // { dx, dy } while zooming in/out
  const [zoomingOut, setZoomingOut] = useState(false)
  const [arriving, setArriving] = useState(false)
  const [spin, setSpin] = useState(0)

  const focusNode = focusId ? byId.get(focusId) : null
  const satellites = focusNode ? focusNode.children : roots
  const parentId = focusNode ? focusNode.parentId || null : null

  // --- animation state kept in refs so the rAF loop never restarts ---
  const anglesRef = useRef({})
  const lagRef = useRef({})
  const releaseRef = useRef({})
  const hoveredRef = useRef(null)
  const zoomingRef = useRef(false)
  const fieldRef = useRef(null)
  const timeoutRef = useRef(null)
  const [, tick] = useReducer((x) => x + 1, 0)

  hoveredRef.current = hoveredId
  zoomingRef.current = !!zoom || zoomingOut

  // Seed angles whenever the set of satellites changes.
  useEffect(() => {
    const next = {}
    satellites.forEach((s, i) => {
      next[s.id] = (i / satellites.length) * Math.PI * 2
    })
    anglesRef.current = next
    lagRef.current = {}
    releaseRef.current = {}
  }, [satellites])

  // Single persistent animation loop.
  useEffect(() => {
    let raf
    let last = null
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

    const loop = (ts) => {
      if (last == null) last = ts
      const dt = (ts - last) / 1000
      last = ts
      const a = anglesRef.current
      const lag = lagRef.current
      const releases = releaseRef.current

      Object.keys(a).forEach((id, i) => {
        const isZooming = zoomingRef.current
        const isHovered = id === hoveredRef.current

        // Always advance true angle unless zooming
        if (!isZooming) {
          a[id] += dt * speedFor(i)
        }

        // Handle lag changes and releases
        if (isZooming) {
          // No change to lag while zooming
        } else if (isHovered) {
          // Cancel any release and grow lag to keep displayed angle constant
          delete releases[id]
          if (!lag[id]) lag[id] = 0
          lag[id] += dt * speedFor(i)
        } else if (lag[id] > 0) {
          // Not hovered and has lag: start or continue release
          if (!releases[id]) {
            // Start release: record initial lag (clamped to one lap forward)
            releases[id] = { t0: ts, lag0: lag[id] % (2 * Math.PI) }
          }

          const rel = releases[id]
          const elapsed = (ts - rel.t0) / orbitConfig.releaseDuration
          const p = clamp(elapsed, 0, 1)
          lag[id] = rel.lag0 * (1 - easeInOutCubic(p))

          if (p >= 1) {
            lag[id] = 0
            delete releases[id]
          }
        }
      })
      tick()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleSelect = (node, x, y, cx, cy) => {
    if (zoom) return
    if (node.children.length > 0) {
      // Zoom into this satellite: glide it to center, scale up, then swap focus.
      setHoveredId(null)
      // Spin the star field an arbitrary amount (and always opposite the last spin).
      // setSpin((s) => (s + Math.floor(Math.random()*90)) * -1)

      // Calculate transform to land the clicked satellite on the core position
      const rect = fieldRef.current?.getBoundingClientRect()
      if (rect) {
        const w = rect.width
        const h = rect.height
        const dx = cx - w / 2 - ZOOM_SCALE * (x - w / 2)
        const dy = cy - h / 2 - ZOOM_SCALE * (y - h / 2)
        setZoom({ dx, dy })
      } else {
        setZoom({ dx: cx, dy: cy })
      }

      window.setTimeout(() => {
        setFocusId(node.id)
        setZoom(null)
      }, 650)
    } else if (node.link) {
      window.open(node.link, '_blank', 'noopener')
    }
  }

  const handleZoomOut = () => {
    if (zoom || zoomingOut || !focusNode) return
    setHoveredId(null)
    setZoomingOut(true)
    // Spin the star field an arbitrary amount (and always opposite the last spin).
    // setSpin((s) => (s + Math.floor(Math.random()*90)) * -1)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setFocusId(parentId)
      setZoomingOut(false)
      setArriving(true)
    }, 650)
  }

  const breadcrumbTrail = () => {
    if (!focusId) return []
    const trail = []
    let currentId = focusId
    
    while (currentId) {
      const node = byId.get(currentId)
      if (!node) break
      trail.unshift(node)
      currentId = node.parentId
    }
    return trail
  }

  return (
    <div className="orbital-root">
      <div className="starfield" style={{ transform: `rotate(${spin}deg) ` }} onAnimationEnd={() => setArriving(false)}/>

      <header className="masthead">
        
        {breadcrumbTrail && (
          <nav className="breadcrumbs">
            <h1 onClick={() => setFocusId("")}>Orbital Menu Navigation</h1>
            {breadcrumbTrail().map((node, index, arr) => (
              <span key={node.id} className={node.id}>
                {<span className="breadcrumb-sep"> › </span>}
                {index === arr.length - 1 ? (
                  <span className="breadcrumb-current">{node.label}</span>
                ) : (
                  <a 
                    className="breadcrumb-link" 
                    onClick={() => setFocusId(node.id)}
                  >
                    {node.label}
                  </a>
                )}
              </span>
            ))}
          </nav>
        )}
      </header>

      <div
        ref={fieldRef}
        className={`orbit-field${zoom ? ' zooming' : ''}${zoomingOut ? ' zooming-out' : ''}${arriving ? ' arriving' : ''}`}
        style={zoom ? { '--dx': `${zoom.dx}px`, '--dy': `${zoom.dy}px` } : undefined}
      >
        <OrbitContent
          satellites={satellites}
          anglesRef={anglesRef}
          lagRef={lagRef}
          focusNode={focusNode}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onSelect={handleSelect}
          onCoreClick={handleZoomOut}
        />
      </div>
    </div>
  )
}

// Renders the central sphere plus the orbiting satellites. Split out so the
// per-frame geometry math reads cleanly.
function OrbitContent({
  satellites,
  anglesRef,
  lagRef,
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
        {/* <span>Back up to {focusNode ? focusNode.label : 'Orbital Menu'}</span> */}
      </button>

      {satellites.map((node) => {
        const trueAngle = anglesRef.current[node.id] ?? 0
        const lag = lagRef.current[node.id] ?? 0
        const angle = trueAngle - lag

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

        const handleKeyDown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(node, x, y, cx, cy)
          }
        }
        return (
          <div
            role="button"
            tabIndex={0}
            key={node.id}
            className={`satellite${isHovered ? ' frozen' : ''}${
              node.children.length ? ` has-children-${node.children.length}` : ''
            }`}
            style={{ left: x, top: y, transform: `scale(${depth})`, opacity, zIndex }}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId((cur) => (cur === node.id ? null : cur))}
            onClick={() => onSelect(node, x, y, cx, cy)}
            onKeyDown={handleKeyDown}
          >
            <span className="base-sphere satellite-dot" />
            <span className="satellite-label">{node.label}</span>
            {isHovered && (
              <div className="description-panel">
                <h2 className="satellite-label">{node.label}</h2>
                <p>{node.description}</p>
                {node.children.length > 0 && (
                  <ul className="children-links">
                    {node.children.map((child) => (
                      <li key={child.id}>
                        {child.children.length > 0 ? (
                          <a
                            href=""
                            onClick={() => onSelect(node, x, y, cx, cy)}
                          >
                            {child.label}
                          </a>
                        ) : (
                          <a
                            href={child.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {child.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
