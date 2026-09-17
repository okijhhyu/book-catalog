import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/authors'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => Boolean(token.value))
  const userName = computed(() => user.value?.username || user.value?.email || 'Пользователь')

  function persist() {
    if (token.value) localStorage.setItem('token', token.value)
    else localStorage.removeItem('token')
    if (user.value) localStorage.setItem('user', JSON.stringify(user.value))
    else localStorage.removeItem('user')
  }

  async function login(credentials) {
    const data = await authApi.login(credentials)
    token.value = data.token || data.access_token
    user.value = data.user || { username: credentials.username }
    persist()
  }

  async function register(payload) {
    const data = await authApi.register(payload)
    if (data?.token || data?.access_token) {
      token.value = data.token || data.access_token
      user.value = data.user || { username: payload.username }
      persist()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    persist()
  }

  return { token, user, isAuthenticated, userName, login, register, logout }
})
