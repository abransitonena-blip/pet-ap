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
  createBatch: (payload) => request('/orders/batch', { method: 'POST', body: payload }),
  track: (folio) => request(`/track/${encodeURIComponent(folio)}`),
  login: (username, password) => request('/admin/login', { method: 'POST', body: { username, password } }),
  me: () => request('/admin/me', { auth: true }),
  publicSettings: () => request('/public/settings'),
  settings: () => request('/admin/settings', { auth: true }),
  savePrices: (prices) => request('/admin/settings/prices', { method: 'PUT', body: prices, auth: true }),
  saveBusiness: (business) => request('/admin/settings/business', { method: 'PUT', body: business, auth: true }),
  users: () => request('/admin/users', { auth: true }),
  createUser: (u) => request('/admin/users', { method: 'POST', body: u, auth: true }),
  updateUser: (id, patch) => request(`/admin/users/${id}`, { method: 'PATCH', body: patch, auth: true }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE', auth: true }),
  quoteDoc: (folio, token) => request(`/quote/${encodeURIComponent(folio)}?t=${encodeURIComponent(token)}`),
  respondQuote: (folio, token, accept) => request(`/quote/${encodeURIComponent(folio)}/respond`, { method: 'POST', body: { t: token, accept } }),
  orders: () => request('/admin/orders', { auth: true }),
  stats: () => request('/admin/stats', { auth: true }),
  updateOrder: (id, patch) => request(`/admin/orders/${id}`, { method: 'PATCH', body: patch, auth: true }),
  addPayment: (id, p) => request(`/admin/orders/${id}/payments`, { method: 'POST', body: p, auth: true }),
  deletePayment: (id, pid) => request(`/admin/orders/${id}/payments/${pid}`, { method: 'DELETE', auth: true }),
  gallery: () => request('/public/gallery'),
  reviews: () => request('/public/reviews'),
  sendReview: (folio, body) => request(`/quote/${encodeURIComponent(folio)}/review`, { method: 'POST', body }),
  addPhoto: (id, image) => request(`/admin/orders/${id}/photos`, { method: 'POST', body: { image }, auth: true }),
  deletePhoto: (id, pid) => request(`/admin/orders/${id}/photos/${pid}`, { method: 'DELETE', auth: true }),
  leads: () => request('/admin/leads', { auth: true }),
  addLead: (l) => request('/admin/leads', { method: 'POST', body: l, auth: true }),
  updateLead: (id, l) => request(`/admin/leads/${id}`, { method: 'PATCH', body: l, auth: true }),
  deleteLead: (id) => request(`/admin/leads/${id}`, { method: 'DELETE', auth: true }),
  saveCosts: (costs) => request('/admin/settings/costs', { method: 'PUT', body: costs, auth: true }),
  suppliers: () => request('/admin/suppliers', { auth: true }),
  addSupplier: (x) => request('/admin/suppliers', { method: 'POST', body: x, auth: true }),
  deleteSupplier: (id) => request(`/admin/suppliers/${id}`, { method: 'DELETE', auth: true }),
  inventory: () => request('/admin/inventory', { auth: true }),
  saveInventory: (items) => request('/admin/inventory', { method: 'PUT', body: { items }, auth: true }),
  people: () => request('/admin/people', { auth: true }),
  myDay: () => request('/admin/myday', { auth: true }),
  clock: () => request('/admin/clock', { method: 'POST', auth: true }),
  list: (kind) => request(`/admin/${kind}`, { auth: true }),
  create: (kind, x) => request(`/admin/${kind}`, { method: 'POST', body: x, auth: true }),
  update: (kind, id, x) => request(`/admin/${kind}/${id}`, { method: 'PATCH', body: x, auth: true }),
  remove: (kind, id) => request(`/admin/${kind}/${id}`, { method: 'DELETE', auth: true }),
  attendance: (month) => request(`/admin/attendance?month=${month}`, { auth: true }),
  saveAttendance: (x) => request('/admin/attendance', { method: 'POST', body: x, auth: true }),
  saveHr: (hr) => request('/admin/settings/hr', { method: 'PUT', body: hr, auth: true }),
  coupon: (code, total) => request(`/public/coupon/${encodeURIComponent(code)}?total=${Math.round(total || 0)}`),
  saveTexture: (finish, body) => request(`/admin/textures/${finish}`, { method: 'POST', body, auth: true }),
  deleteTexture: (finish) => request(`/admin/textures/${finish}`, { method: 'DELETE', auth: true }),
  deleteOrder: (id) => request(`/admin/orders/${id}`, { method: 'DELETE', auth: true })
}
