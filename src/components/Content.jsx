import { useEffect, useRef, useState } from 'react'
import { orbitConfig } from '../config/orbitConfig'

// Renders the central sphere plus the orbiting satellites. Split out so the
// per-frame geometry math reads cleanly.
export default function OrbitContent({
  satellites,
  anglesRef,
  lagRef,
  focusNode,
  hoveredId,
  setHoveredId,
  onSelect,
  onCoreClick,
  isZooming
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
        {/* {focusNode && (<span>up</span>)} */}
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

        // const isZooming = isZooming
        const isHovered = node.id === hoveredId
        // Depth cues. zNorm is −1 (farthest) … +1 (nearest).
        const zNorm = radius ? z / radius : 0
        // If is hovered, allow animate in css to full size and opacity.
        const depth = isHovered || isZooming ? 1 : 1 + zNorm * depthScale
        const opacity = isHovered || isZooming ? 1 : minOpacity + (1 - minOpacity) * ((zNorm + 1) / 2)
        // Behind the core (z<0) paints under it; in front paints over it.
        // The core sphere sits at z-index 2 (see index.css).
        const zIndex = isHovered ? 4 : z < 0 ? 1 : 3

        const handleKeyDown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(node, x, y, cx, cy)
          }
        }
        const hoverAllowed = isZooming ? 'none' : 'default'
        return (
          <div
            role="button"
            tabIndex={0}
            key={node.id}
            className={`satellite${isHovered ? ' frozen' : ''}${
              node.children.length ? ` has-children-${node.children.length}` : ''
            }`}
            style={{ pointerEvents: hoverAllowed, left: x, top: y, transform: `scale(${depth})`, opacity, zIndex }}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId((cur) => (cur === node.id ? null : cur))}
            onClick={() => onSelect(node, x, y, cx, cy)}
            onKeyDown={handleKeyDown}
          >
            <span className="base-sphere satellite-dot" />
            {!isZooming && (
              <span className="satellite-label">{node.label}</span>
            )}
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
                            onClick={(e) => {e.stopPropagation(); onSelect(child, x, y, cx, cy);}}
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
