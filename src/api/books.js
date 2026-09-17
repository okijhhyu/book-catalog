import { http, unwrap } from './http'

const toFormData = (payload) => {
  const fd = new FormData()
  fd.append('title', payload.title ?? '')
  fd.append('year', payload.year ?? '')
  fd.append('isbn', payload.isbn ?? '')
  fd.append('description', payload.description ?? '')
  const ids = payload.author_ids ?? []
  if (ids.length === 0) {
    fd.append('author_ids[]', '')
  } else {
    ids.forEach((id) => fd.append('author_ids[]', id))
  }
  if (payload.cover instanceof File) fd.append('cover', payload.cover)
  if (payload.remove_cover) fd.append('remove_cover', '1')
  return fd
}

export const booksApi = {
  // params: { page, per_page, q, year, author_id }
  list: (params) => http.get('/books', { params }).then(unwrap),
  get: (id) => http.get(`/books/${id}`).then(unwrap),
  create: (payload) => http.post('/books', toFormData(payload)).then(unwrap),
  // POST + _method: Yii2/PHP не умеет разбирать multipart из PUT-запроса.
  update: (id, payload) => {
    const fd = toFormData(payload)
    fd.append('_method', 'PUT')
    return http.post(`/books/${id}`, fd).then(unwrap)
  },
  remove: (id) => http.delete(`/books/${id}`).then(unwrap),
}
