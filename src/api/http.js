import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

// Токен подставляем из localStorage, чтобы не тянуть store в модуль API.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Приводим любую ошибку к единому виду:
 * { message: string, fields: { [field]: string }, status: number }
 * Формат ошибок бэка: { success: false, errors: [{ field, message }] }
 */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 0
    const payload = error.response?.data
    const fields = {}
    let message = 'Не удалось выполнить запрос. Попробуйте ещё раз.'

    if (Array.isArray(payload?.errors) && payload.errors.length) {
      for (const item of payload.errors) {
        if (item.field) fields[item.field] = item.message
      }
      message = payload.errors[0].message || message
    } else if (status === 401) {
      message = 'Требуется вход в систему.'
    } else if (status === 403) {
      message = 'Недостаточно прав для этого действия.'
    } else if (status === 404) {
      message = 'Запись не найдена.'
    } else if (status === 0) {
      message = 'Сервер недоступен. Проверьте, что бэкенд запущен.'
    }

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }

    return Promise.reject({ message, fields, status })
  },
)

// Бэк отвечает { success, data }, наружу отдаём только data.
export const unwrap = (response) => response.data?.data ?? response.data
