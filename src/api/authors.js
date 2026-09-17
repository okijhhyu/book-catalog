import { http, unwrap } from './http'

export const authorsApi = {
  // params: { page, per_page, q }
  list: (params) => http.get('/authors', { params }).then(unwrap),
  get: (id) => http.get(`/authors/${id}`).then(unwrap),
  create: (payload) => http.post('/authors', payload).then(unwrap),
  update: (id, payload) => http.put(`/authors/${id}`, payload).then(unwrap),
  remove: (id) => http.delete(`/authors/${id}`).then(unwrap),

  // Подписка на новые книги автора доступна и гостю: нужен только телефон.
  subscribe: (id, phone) => http.post(`/authors/${id}/subscribe`, { phone }).then(unwrap),
  unsubscribe: (id, phone) =>
    http.post(`/authors/${id}/unsubscribe`, { phone }).then(unwrap),
}

export const reportsApi = {
  topAuthors: (year) => http.get('/reports/top-authors', { params: { year } }).then(unwrap),
}

export const authApi = {
  login: (credentials) => http.post('/auth/login', credentials).then(unwrap),
  register: (payload) => http.post('/auth/register', payload).then(unwrap),
  me: () => http.get('/auth/me').then(unwrap),
}
