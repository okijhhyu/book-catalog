<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { booksApi } from '@/api/books'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import BaseModal from '@/components/BaseModal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toasts = useToastStore()

const book = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const confirmOpen = ref(false)
const deleting = ref(false)

onMounted(async () => {
  try {
    book.value = await booksApi.get(route.params.id)
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    loading.value = false
  }
})

async function remove() {
  deleting.value = true
  try {
    await booksApi.remove(route.params.id)
    toasts.success('Книга удалена')
    router.push({ name: 'books' })
  } catch (e) {
    toasts.error(e.message)
  } finally {
    deleting.value = false
    confirmOpen.value = false
  }
}
</script>

<template>
  <div class="page container">
    <div v-if="loading" class="spinner" />
    <div v-else-if="errorMessage" class="alert">{{ errorMessage }}</div>

    <template v-else-if="book">
      <RouterLink :to="{ name: 'books' }" class="back">← К списку книг</RouterLink>

      <div class="layout">
        <div class="cover card">
          <img v-if="book.cover_url" :src="book.cover_url" :alt="`Обложка: ${book.title}`" />
          <div v-else class="cover-stub">Обложка не загружена</div>
        </div>

        <div>
          <h1>{{ book.title }}</h1>
          <p class="authors">
            <template v-if="book.authors?.length">
              <RouterLink
                v-for="(a, i) in book.authors"
                :key="a.id"
                :to="{ name: 'author', params: { id: a.id } }"
              >{{ a.full_name }}<span v-if="i < book.authors.length - 1">, </span></RouterLink>
            </template>
            <span v-else class="muted">Авторы не указаны</span>
          </p>

          <dl class="specs">
            <div><dt>Год выпуска</dt><dd>{{ book.year }}</dd></div>
            <div><dt>ISBN</dt><dd>{{ book.isbn }}</dd></div>
          </dl>

          <h2>Описание</h2>
          <p class="description">{{ book.description || 'Описание пока не добавлено.' }}</p>

          <div v-if="auth.isAuthenticated" class="actions">
            <RouterLink class="btn" :to="{ name: 'book-edit', params: { id: book.id } }">
              Редактировать
            </RouterLink>
            <button class="btn btn-danger" @click="confirmOpen = true">Удалить</button>
          </div>
          <p v-else class="hint">Войдите, чтобы редактировать или удалить книгу.</p>
        </div>
      </div>
    </template>

    <BaseModal v-if="confirmOpen" title="Удалить книгу?" @close="confirmOpen = false">
      <p>Книга «{{ book.title }}» будет удалена из каталога. Отменить действие нельзя.</p>
      <template #footer>
        <button class="btn" @click="confirmOpen = false">Отмена</button>
        <button class="btn btn-danger" :disabled="deleting" @click="remove">
          {{ deleting ? 'Удаляем…' : 'Удалить' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--ink-soft);
}
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 2rem;
  align-items: start;
}
@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
.cover {
  overflow: hidden;
  aspect-ratio: 3 / 4;
  background: #eceef1;
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cover-stub {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  font-size: 0.9rem;
}
.authors {
  margin-top: -0.25rem;
  font-size: 1.05rem;
}
.specs {
  display: flex;
  gap: 2rem;
  margin: 1.25rem 0;
  padding: 0.85rem 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.specs dt {
  font-size: 0.85rem;
  color: var(--ink-soft);
}
.specs dd {
  margin: 0.15rem 0 0;
  font-size: 1.05rem;
}
.description {
  max-width: 68ch;
  white-space: pre-line;
}
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
</style>
