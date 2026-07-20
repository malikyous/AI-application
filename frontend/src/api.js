const API_BASE = '/api'

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/sessions`)
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json()
}

export async function createSession() {
  const res = await fetch(`${API_BASE}/sessions`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function fetchSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`)
  if (!res.ok) throw new Error('Failed to fetch session')
  return res.json()
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete session')
  return res.json()
}

export async function uploadFile(sessionId, file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('session_id', sessionId)

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Upload failed')
  }
  return res.json()
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Backend unavailable')
  return res.json()
}

// Templates API
export async function fetchTemplates() {
  const res = await fetch(`${API_BASE}/templates`)
  if (!res.ok) throw new Error('Failed to fetch templates')
  return res.json()
}

export async function createTemplate(name, content, category = 'general') {
  const res = await fetch(`${API_BASE}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, content, category }),
  })
  if (!res.ok) throw new Error('Failed to create template')
  return res.json()
}

export async function deleteTemplate(templateId) {
  const res = await fetch(`${API_BASE}/templates/${templateId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete template')
  return res.json()
}

// Search API
export async function searchMessages(query) {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Failed to search messages')
  return res.json()
}

// Export API
export async function exportSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/export`)
  if (!res.ok) throw new Error('Failed to export session')
  return res.blob()
}
