import { useEffect, useRef, useState } from 'react'
import { orbitConfig } from '../config/orbitConfig'
import Satellite from './Satellite'

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

      {satellites.map((node) => (
        <Satellite
          key={node.id}
          node={node}
          trueAngle={anglesRef.current[node.id] ?? 0}
          lag={lagRef.current[node.id] ?? 0}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onSelect={onSelect}
          isZooming={isZooming}
          cx={cx}
          cy={cy}
          radius={radius}
          cosX={cosX}
          sinX={sinX}
          cosY={cosY}
          sinY={sinY}
          depthScale={depthScale}
          minOpacity={minOpacity}
        />
      ))}
    </div>
  )
}
