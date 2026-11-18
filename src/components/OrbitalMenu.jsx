import { useEffect, useReducer, useRef, useState } from 'react'
import { orbitConfig, speedFor, ZOOM_SCALE } from '../config/orbitConfig'
import OrbitContent from './Content'

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
    // If currently animating, disable clicks.
    if (zoom) return
    if (node.children.length > 0) {
      // Zoom into this satellite: glide it to center, scale up, then swap focus.
      setHoveredId(null)
      if (orbitConfig.animateStarsOnClick) {
        // Spin the star field an arbitrary amount (and always opposite the last spin).
        setSpin((s) => (s + Math.floor(Math.random()*orbitConfig.starAnimationIncrement)) * -1)
      }

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
      // console.log('open html page')
    }
  }

  const handleZoomOut = () => {
    if (zoom || zoomingOut || !focusNode) return
    setHoveredId(null)
    setZoomingOut(true)
    if (orbitConfig.animateStarsOnClick) {
      // Spin the star field an arbitrary amount (and always opposite the last spin).
      setSpin((s) => (s + Math.floor(Math.random()*orbitConfig.starAnimationIncrement)) * -1)
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setFocusId(parentId)
      setZoomingOut(false)
      setZoom(null)
      // setArriving(true)
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
          isZooming={zoom}
        />
      </div>
    </div>
  )
}
