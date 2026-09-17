<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { booksApi } from '@/api/books'
import { authorsApi } from '@/api/authors'
import { useAuthStore } from '@/stores/auth'
import BookCard from '@/components/BookCard.vue'
import PaginationBar from '@/components/PaginationBar.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const books = ref([])
const authors = ref([])
const pagination = ref({})
const loading = ref(false)
const errorMessage = ref('')

const filters = reactive({
  q: route.query.q || '',
  year: route.query.year || '',
  author_id: route.query.author_id || '',
  page: Number(route.query.page) || 1,
})

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await booksApi.list({
      page: filters.page,
      per_page: 12,
      q: filters.q || undefined,
      year: filters.year || undefined,
      author_id: filters.author_id || undefined,
    })
    books.value = data.items || []
    pagination.value = data.pagination || {}
  } catch (e) {
    errorMessage.value = e.message
    books.value = []
  } finally {
    loading.value = false
  }
}

async function loadAuthors() {
  try {
    const data = await authorsApi.list({ per_page: 100 })
    authors.value = data.items || []
  } catch {
    authors.value = []
  }
}

function syncQuery() {
  router.replace({
    query: {
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.year ? { year: filters.year } : {}),
      ...(filters.author_id ? { author_id: filters.author_id } : {}),
      ...(filters.page > 1 ? { page: filters.page } : {}),
    },
  })
}

let timer = null
watch(
  () => filters.q,
  () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      filters.page = 1
      syncQuery()
      load()
    }, 400)
  },
)

watch([() => filters.year, () => filters.author_id], () => {
  filters.page = 1
  syncQuery()
  load()
})

function changePage(page) {
  filters.page = page
  syncQuery()
  load()
}

function resetFilters() {
  filters.q = ''
  filters.year = ''
  filters.author_id = ''
  filters.page = 1
}

onMounted(() => {
  load()
  loadAuthors()
})
</script>

<template>
  <div class="page container">
    <div class="page-head">
      <div>
        <h1>Книги</h1>
        <p>Каталог изданий с описанием, годом выпуска и авторами.</p>
      </div>
      <RouterLink v-if="auth.isAuthenticated" class="btn btn-primary" :to="{ name: 'book-create' }">
        Добавить книгу
      </RouterLink>
    </div>

    <div class="toolbar">
      <div class="field">
        <label for="q">Поиск</label>
        <input id="q" v-model="filters.q" class="input" placeholder="Название или ISBN" />
      </div>
      <div class="field">
        <label for="year">Год выпуска</label>
        <input id="year" v-model="filters.year" class="input" type="number" placeholder="Любой" />
      </div>
      <div class="field">
        <label for="author">Автор</label>
        <select id="author" v-model="filters.author_id" class="select">
          <option value="">Все авторы</option>
          <option v-for="a in authors" :key="a.id" :value="a.id">{{ a.full_name }}</option>
        </select>
      </div>
      <button class="btn" @click="resetFilters">Сбросить</button>
    </div>

    <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>
    <div v-if="loading" class="spinner" />

    <template v-else>
      <div v-if="books.length" class="grid">
        <BookCard v-for="book in books" :key="book.id" :book="book" />
      </div>
      <div v-else class="empty">
        Ничего не нашлось. Измените фильтры или добавьте первую книгу.
      </div>

      <PaginationBar :pagination="pagination" @change="changePage" />
    </template>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}
.toolbar .field {
  min-width: 180px;
}
</style>
