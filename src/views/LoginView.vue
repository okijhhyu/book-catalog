<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'

const auth = useAuthStore()
const toasts = useToastStore()
const route = useRoute()
const router = useRouter()

const mode = ref('login')
const loading = ref(false)
const errorMessage = ref('')
const errors = reactive({})
const form = reactive({ username: '', password: '' })

async function submit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  errorMessage.value = ''

  if (!form.username.trim()) errors.username = 'Введите логин.'
  if (form.password.length < 6) errors.password = 'Пароль — не меньше 6 символов.'
  if (Object.keys(errors).length) return

  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login({ username: form.username.trim(), password: form.password })
    } else {
      await auth.register({ username: form.username.trim(), password: form.password })
      if (!auth.isAuthenticated) {
        await auth.login({ username: form.username.trim(), password: form.password })
      }
    }
    toasts.success('Вы вошли в систему')
    router.push(route.query.redirect || { name: 'books' })
  } catch (e) {
    errorMessage.value = e.message
    Object.assign(errors, e.fields || {})
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page container">
    <div class="box panel">
      <h1>{{ mode === 'login' ? 'Вход' : 'Регистрация' }}</h1>
      <p class="muted">
        Просмотр каталога и подписка доступны без входа. Добавление, редактирование и удаление —
        только зарегистрированным пользователям.
      </p>

      <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>

      <form @submit.prevent="submit">
        <div class="field" :class="{ 'field-error': errors.username }">
          <label for="username">Логин</label>
          <input id="username" v-model="form.username" class="input" autocomplete="username" />
          <p v-if="errors.username" class="error-text">{{ errors.username }}</p>
        </div>

        <div class="field" :class="{ 'field-error': errors.password }">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="form.password"
            class="input"
            type="password"
            autocomplete="current-password"
          />
          <p v-if="errors.password" class="error-text">{{ errors.password }}</p>
        </div>

        <button class="btn btn-primary full" type="submit" :disabled="loading">
          {{ loading ? 'Проверяем…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться' }}
        </button>
      </form>

      <p class="switch">
        <template v-if="mode === 'login'">
          Нет аккаунта?
          <button class="link" @click="mode = 'register'">Зарегистрироваться</button>
        </template>
        <template v-else>
          Уже есть аккаунт?
          <button class="link" @click="mode = 'login'">Войти</button>
        </template>
      </p>

      <p class="hint demo">Тестовый доступ к мок-бэкенду: <b>admin</b> / <b>admin123</b></p>
    </div>
  </div>
</template>

<style scoped>
.box {
  max-width: 420px;
  margin: 2rem auto;
}
.box h1 {
  font-size: 1.6rem;
}
.full {
  width: 100%;
  justify-content: center;
}
.switch {
  margin: 1rem 0 0;
  font-size: 0.92rem;
}
.link {
  border: none;
  background: none;
  color: var(--accent);
  cursor: pointer;
  font: inherit;
  padding: 0;
  text-decoration: underline;
}
.demo {
  border-top: 1px solid var(--line);
  padding-top: 0.75rem;
  margin-top: 1rem;
}
</style>
