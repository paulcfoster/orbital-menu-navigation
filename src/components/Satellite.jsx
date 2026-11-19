export default function Satellite({
  node,
  trueAngle,
  lag,
  hoveredId,
  setHoveredId,
  onSelect,
  isZooming,
  cx,
  cy,
  radius,
  cosX,
  sinX,
  cosY,
  sinY,
  depthScale,
  minOpacity,
}) {
  // Satellite position on a flat circle, then rotate that circle's
  // plane: first about the X axis (tiltX), then the Y axis (tiltY).
  const angle = trueAngle - lag
  const px = radius * Math.cos(angle)
  const py0 = radius * Math.sin(angle)
  const py = py0 * cosX // X-axis rotation: vertical squash
  const pz0 = py0 * sinX // …pushes points into depth
  const x = cx + px * cosY + pz0 * sinY // Y-axis rotation
  const y = cy + py
  const z = -px * sinY + pz0 * cosY // signed depth: +toward viewer

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
  const isHoveredWithChildren = isHovered && node.children.length > 0

   // If children, append unordered list to description.
  // Else append an indicator demonstrating a link to a page.
  const nodeDescription = () => {
    return (
      node.children.length > 0 ? (
        <p>
          {node.description}
          <br/><span>»»</span>
          Click to enter orbit.
        </p>
      ) : (
        <p>
          {node.description}
          <br/><span>»»</span>
          <a 
          href={`${node.link}`}
          target="_blank" 
          rel="noopener noreferrer" 
          >
            Land on planet {node.label}
          </a> 
        </p>
      )
    );
  }


  return (
    <div
      role="button"
      tabIndex={0}
      className={`satellite${isHovered ? ' frozen' : ''}`}
      style={{ pointerEvents: hoverAllowed, left: x, top: y, transform: `scale(${depth})`, opacity, zIndex }}
      onMouseEnter={() => setHoveredId(node.id)}
      onMouseLeave={() => setHoveredId((cur) => (cur === node.id ? null : cur))}
      onClick={() => onSelect(node, x, y, cx, cy)}
      onKeyDown={handleKeyDown}
    >
      
      <span 
        className={`base-sphere satellite-dot${node.children.length ? '' : ' no-children'}`}
      >
        {isHoveredWithChildren && (<div className="mini-satellite"></div>)}
      </span>
      {!isZooming && (
        <span className="satellite-label">{node.label}</span>
      )}
      {isHovered && (
        <div className="description-panel">
          <h2 className="satellite-label">{node.label}</h2>
          { nodeDescription() }
          {node.children.length > 0 && (
            <ul className="children-links">
              {node.children.map((child) => (
                <li key={child.id}>
                  {child.children.length > 0 ? (
                    <div
                      onClick={(e) => {e.stopPropagation(); onSelect(child, x, y, cx, cy);}}
                    >
                      {child.label}
                    </div>
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
}
