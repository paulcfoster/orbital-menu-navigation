export default function Breadcrumbs({ byId, focusId, setFocusId }) {
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
    <header className="masthead">
      <nav className="breadcrumbs">
        <h1 onClick={() => setFocusId("")}>Orbital Menu Navigation</h1>
        {breadcrumbTrail().map((node, index, arr) => (
          <span key={node.id} className={node.id}>
            {<span className="breadcrumb-sep"> › </span>}
            {index === arr.length - 1 ? (
              <span className="breadcrumb-current">Now orbiting: {node.label}</span>
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
    </header>
  )
}
