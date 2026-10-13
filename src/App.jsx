import { useEffect, useState } from 'react'
import { parseCsv, buildMenuTree } from './csv.js'
import OrbitalMenu from './OrbitalMenu.jsx'

export default function App() {
  const [tree, setTree] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/menu.csv')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load menu.csv (${res.status})`)
        return res.text()
      })
      .then((text) => setTree(buildMenuTree(parseCsv(text))))
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="status">⚠ {error}</div>
  if (!tree) return <div className="status">Establishing orbit…</div>

  return <OrbitalMenu tree={tree} />
}
