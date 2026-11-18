// Minimal CSV parser that handles quoted fields containing commas and
// escaped double-quotes ("" -> "). Returns an array of row objects keyed
// by the header row.
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }

    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      // Handle CRLF: skip the \n after a \r
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  // Flush trailing field/row
  if (field !== '' || row.length) {
    row.push(field)
    if (row.length > 1 || row[0] !== '') rows.push(row)
  }

  if (!rows.length) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((cols) => {
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? '').trim()
    })
    return obj
  })
}

// Turn flat CSV rows into a lookup of nodes plus a children index.
export function buildMenuTree(records) {
  const byId = new Map()
  records.forEach((r) => {
    byId.set(r.id, { ...r, children: [] })
  })
  const roots = []
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId).children.push(node)
    } else {
      roots.push(node)
    }
  })
  return { byId, roots }
}
