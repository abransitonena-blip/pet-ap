const TOKEN_KEY = 'letreros_admin_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) headers.Authorization = `Bearer ${getToken()}`
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Error ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  track: (folio) => request(`/track/${encodeURIComponent(folio)}`),
  login: (password) => request('/admin/login', { method: 'POST', body: { password } }),
  orders: () => request('/admin/orders', { auth: true }),
  stats: () => request('/admin/stats', { auth: true }),
  updateOrder: (id, patch) => request(`/admin/orders/${id}`, { method: 'PATCH', body: patch, auth: true }),
  deleteOrder: (id) => request(`/admin/orders/${id}`, { method: 'DELETE', auth: true })
}
