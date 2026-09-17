<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'

const auth = useAuthStore()
const toasts = useToastStore()
const router = useRouter()

function logout() {
  auth.logout()
  toasts.success('Вы вышли из аккаунта')
  router.push({ name: 'books' })
}
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <RouterLink :to="{ name: 'books' }" class="brand">Каталог книг</RouterLink>

      <nav class="nav">
        <RouterLink :to="{ name: 'books' }">Книги</RouterLink>
        <RouterLink :to="{ name: 'authors' }">Авторы</RouterLink>
        <RouterLink :to="{ name: 'top-authors' }">Топ-10 авторов</RouterLink>
      </nav>

      <div class="account">
        <template v-if="auth.isAuthenticated">
          <span class="muted">{{ auth.userName }}</span>
          <button class="btn btn-sm" @click="logout">Выйти</button>
        </template>
        <RouterLink v-else class="btn btn-sm btn-primary" :to="{ name: 'login' }">
          Войти
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.header-inner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  min-height: 64px;
  flex-wrap: wrap;
  padding: 0.5rem 0;
}
.brand {
  font-family: var(--serif);
  font-size: 1.25rem;
  color: var(--ink);
  text-decoration: none;
}
.nav {
  display: flex;
  gap: 1.25rem;
  margin-right: auto;
  flex-wrap: wrap;
}
.nav a {
  color: var(--ink-soft);
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;
  text-decoration: none;
}
.nav a:hover {
  color: var(--ink);
}
.nav a.router-link-active {
  color: var(--ink);
  border-bottom-color: var(--accent);
}
.account {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style>
