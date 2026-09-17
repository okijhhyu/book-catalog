import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/books' },
  {
    path: '/books',
    name: 'books',
    component: () => import('@/views/BookListView.vue'),
    meta: { title: 'Книги' },
  },
  {
    path: '/books/new',
    name: 'book-create',
    component: () => import('@/views/BookFormView.vue'),
    meta: { title: 'Новая книга', auth: true },
  },
  {
    path: '/books/:id',
    name: 'book',
    component: () => import('@/views/BookView.vue'),
    meta: { title: 'Книга' },
  },
  {
    path: '/books/:id/edit',
    name: 'book-edit',
    component: () => import('@/views/BookFormView.vue'),
    meta: { title: 'Редактирование книги', auth: true },
  },
  {
    path: '/authors',
    name: 'authors',
    component: () => import('@/views/AuthorListView.vue'),
    meta: { title: 'Авторы' },
  },
  {
    path: '/authors/:id',
    name: 'author',
    component: () => import('@/views/AuthorView.vue'),
    meta: { title: 'Автор' },
  },
  {
    path: '/report/top-authors',
    name: 'top-authors',
    component: () => import('@/views/TopAuthorsView.vue'),
    meta: { title: 'Топ-10 авторов' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Вход' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Страница не найдена' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — Каталог книг` : 'Каталог книг'
})

export default router
