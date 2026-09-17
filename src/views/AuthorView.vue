<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authorsApi } from '@/api/authors'
import { booksApi } from '@/api/books'
import { useToastStore } from '@/stores/toasts'
import BookCard from '@/components/BookCard.vue'
import { booksCountLabel, isValidPhone, normalizePhone } from '@/utils/format'

const route = useRoute()
const toasts = useToastStore()

const author = ref(null)
const books = ref([])
const loading = ref(true)
const errorMessage = ref('')

const phone = ref(localStorage.getItem('subscriber_phone') || '')
const phoneError = ref('')
const subscribing = ref(false)
const subscribed = ref(false)

async function subscribe() {
  phoneError.value = ''
  if (!isValidPhone(phone.value)) {
    phoneError.value = 'Введите номер в формате +7 999 123-45-67.'
    return
  }
  subscribing.value = true
  try {
    await authorsApi.subscribe(route.params.id, normalizePhone(phone.value))
    localStorage.setItem('subscriber_phone', phone.value)
    subscribed.value = true
    toasts.success('Подписка оформлена: пришлём SMS о новой книге')
  } catch (e) {
    phoneError.value = e.fields?.phone || e.message
  } finally {
    subscribing.value = false
  }
}

async function unsubscribe() {
  subscribing.value = true
  try {
    await authorsApi.unsubscribe(route.params.id, normalizePhone(phone.value))
    subscribed.value = false
    toasts.success('Подписка отменена')
  } catch (e) {
    toasts.error(e.message)
  } finally {
    subscribing.value = false
  }
}

onMounted(async () => {
  try {
    author.value = await authorsApi.get(route.params.id)
    const data = await booksApi.list({ author_id: route.params.id, per_page: 12 })
    books.value = data.items || []
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page container">
    <div v-if="loading" class="spinner" />
    <div v-else-if="errorMessage" class="alert">{{ errorMessage }}</div>

    <template v-else-if="author">
      <RouterLink :to="{ name: 'authors' }" class="back">← К списку авторов</RouterLink>

      <div class="page-head">
        <div>
          <h1>{{ author.full_name }}</h1>
          <p>{{ booksCountLabel(author.books_count ?? books.length) }} в каталоге</p>
        </div>
      </div>

      <section class="panel subscribe">
        <h2>Новые книги — по SMS</h2>
        <p class="muted">
          Оставьте номер телефона, и мы напишем, как только у автора выйдет новая книга.
        </p>

        <div v-if="subscribed" class="done">
          Подписка на номер {{ phone }} активна.
          <button class="btn btn-sm" :disabled="subscribing" @click="unsubscribe">
            Отписаться
          </button>
        </div>

        <form v-else class="sub-form" @submit.prevent="subscribe">
          <div class="field" :class="{ 'field-error': phoneError }">
            <label for="phone">Телефон</label>
            <input id="phone" v-model="phone" class="input" placeholder="+7 999 123-45-67" />
            <p v-if="phoneError" class="error-text">{{ phoneError }}</p>
          </div>
          <button class="btn btn-primary" type="submit" :disabled="subscribing">
            {{ subscribing ? 'Подписываем…' : 'Подписаться' }}
          </button>
        </form>
      </section>

      <h2 class="books-title">Книги автора</h2>
      <div v-if="books.length" class="grid">
        <BookCard v-for="book in books" :key="book.id" :book="book" />
      </div>
      <div v-else class="empty">У автора пока нет книг в каталоге.</div>
    </template>
  </div>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--ink-soft);
}
.subscribe {
  max-width: 560px;
  margin-bottom: 2.5rem;
}
.subscribe h2 {
  margin-top: 0;
}
.sub-form {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-top: 1rem;
}
.sub-form .field {
  flex: 1;
  margin-bottom: 0;
}
.sub-form .btn {
  margin-top: 1.55rem;
}
.done {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: 1rem;
  background: var(--accent-wash);
  color: var(--accent-dark);
  border-radius: var(--radius);
  padding: 0.65rem 0.85rem;
}
.books-title {
  margin-bottom: 1rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}
@media (max-width: 560px) {
  .sub-form {
    flex-direction: column;
  }
  .sub-form .btn {
    margin-top: 0;
  }
}
</style>
