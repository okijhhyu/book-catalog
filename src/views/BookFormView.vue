<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { booksApi } from '@/api/books'
import { authorsApi } from '@/api/authors'
import { useToastStore } from '@/stores/toasts'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()

const isEdit = computed(() => Boolean(route.params.id))
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const errors = reactive({})

const authors = ref([])
const authorSearch = ref('')
const coverPreview = ref('')
const removeCover = ref(false)

const form = reactive({
  title: '',
  year: '',
  isbn: '',
  description: '',
  author_ids: [],
  cover: null,
})

const filteredAuthors = computed(() => {
  const q = authorSearch.value.trim().toLowerCase()
  if (!q) return authors.value
  return authors.value.filter((a) => a.full_name.toLowerCase().includes(q))
})

const selectedAuthors = computed(() =>
  authors.value.filter((a) => form.author_ids.includes(a.id)),
)

function toggleAuthor(id) {
  const i = form.author_ids.indexOf(id)
  if (i === -1) form.author_ids.push(id)
  else form.author_ids.splice(i, 1)
  delete errors.author_ids
}

function onFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    errors.cover = 'Подойдёт JPG, PNG или WebP.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errors.cover = 'Файл больше 5 МБ — выберите изображение поменьше.'
    return
  }
  delete errors.cover
  form.cover = file
  removeCover.value = false
  coverPreview.value = URL.createObjectURL(file)
}

function clearCover() {
  form.cover = null
  coverPreview.value = ''
  removeCover.value = isEdit.value
}

function validate() {
  Object.keys(errors).forEach((k) => delete errors[k])
  const year = Number(form.year)
  const currentYear = new Date().getFullYear()

  if (!form.title.trim()) errors.title = 'Укажите название книги.'
  if (!form.year) errors.year = 'Укажите год выпуска.'
  else if (!Number.isInteger(year) || year < 1400 || year > currentYear + 1)
    errors.year = `Год должен быть числом от 1400 до ${currentYear + 1}.`
  if (!form.isbn.trim()) errors.isbn = 'Укажите ISBN.'
  else if (!/^(97[89][- ]?)?(\d[- ]?){9}[\dXx]$/.test(form.isbn.trim()))
    errors.isbn = 'ISBN состоит из 10 или 13 цифр, например 978-5-389-21499-5.'
  if (!form.author_ids.length) errors.author_ids = 'Выберите хотя бы одного автора.'

  return Object.keys(errors).length === 0
}

async function submit() {
  if (!validate()) return
  saving.value = true
  errorMessage.value = ''
  try {
    const payload = { ...form, remove_cover: removeCover.value }
    const data = isEdit.value
      ? await booksApi.update(route.params.id, payload)
      : await booksApi.create(payload)

    toasts.success(isEdit.value ? 'Изменения сохранены' : 'Книга добавлена')
    router.push({ name: 'book', params: { id: data.id || route.params.id } })
  } catch (e) {
    errorMessage.value = e.message
    Object.assign(errors, e.fields || {})
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const authorsData = await authorsApi.list({ per_page: 200 })
    authors.value = authorsData.items || []

    if (isEdit.value) {
      const book = await booksApi.get(route.params.id)
      form.title = book.title
      form.year = book.year
      form.isbn = book.isbn
      form.description = book.description || ''
      form.author_ids = (book.authors || []).map((a) => a.id)
      coverPreview.value = book.cover_url || ''
    }
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page container">
    <h1>{{ isEdit ? 'Редактирование книги' : 'Новая книга' }}</h1>

    <div v-if="loading" class="spinner" />

    <form v-else class="layout" @submit.prevent="submit">
      <div class="panel">
        <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>

        <div class="field" :class="{ 'field-error': errors.title }">
          <label for="title">Название</label>
          <input id="title" v-model="form.title" class="input" />
          <p v-if="errors.title" class="error-text">{{ errors.title }}</p>
        </div>

        <div class="grid-2">
          <div class="field" :class="{ 'field-error': errors.year }">
            <label for="year">Год выпуска</label>
            <input id="year" v-model="form.year" class="input" type="number" />
            <p v-if="errors.year" class="error-text">{{ errors.year }}</p>
          </div>
          <div class="field" :class="{ 'field-error': errors.isbn }">
            <label for="isbn">ISBN</label>
            <input id="isbn" v-model="form.isbn" class="input" placeholder="978-5-389-21499-5" />
            <p v-if="errors.isbn" class="error-text">{{ errors.isbn }}</p>
          </div>
        </div>

        <div class="field" :class="{ 'field-error': errors.description }">
          <label for="description">Описание</label>
          <textarea id="description" v-model="form.description" class="textarea" />
          <p v-if="errors.description" class="error-text">{{ errors.description }}</p>
        </div>

        <div class="field" :class="{ 'field-error': errors.author_ids }">
          <label>Авторы</label>
          <input
            v-model="authorSearch"
            class="input"
            placeholder="Найти автора по фамилии"
          />
          <div class="authors-box">
            <label v-for="a in filteredAuthors" :key="a.id" class="checkbox">
              <input
                type="checkbox"
                :checked="form.author_ids.includes(a.id)"
                @change="toggleAuthor(a.id)"
              />
              <span>{{ a.full_name }}</span>
            </label>
            <p v-if="!filteredAuthors.length" class="muted pad">
              Авторы не найдены. Добавьте автора в разделе «Авторы».
            </p>
          </div>
          <div v-if="selectedAuthors.length" class="chips">
            <span v-for="a in selectedAuthors" :key="a.id" class="badge">{{ a.full_name }}</span>
          </div>
          <p v-if="errors.author_ids" class="error-text">{{ errors.author_ids }}</p>
        </div>
      </div>

      <aside class="panel side">
        <h3>Обложка</h3>
        <div class="preview">
          <img v-if="coverPreview" :src="coverPreview" alt="Предпросмотр обложки" />
          <div v-else class="preview-stub">Файл не выбран</div>
        </div>
        <input
          id="cover"
          class="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="onFileChange"
        />
        <p v-if="errors.cover" class="error-text">{{ errors.cover }}</p>
        <p class="hint">JPG, PNG или WebP, до 5 МБ.</p>
        <button v-if="coverPreview" type="button" class="btn btn-sm" @click="clearCover">
          Убрать обложку
        </button>

        <div class="submit">
          <button class="btn btn-primary" type="submit" :disabled="saving">
            {{ saving ? 'Сохраняем…' : isEdit ? 'Сохранить изменения' : 'Добавить книгу' }}
          </button>
          <button class="btn" type="button" @click="router.back()">Отмена</button>
        </div>
      </aside>
    </form>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
.authors-box {
  margin-top: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.5rem;
}
.checkbox {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.25rem;
  margin: 0;
  color: var(--ink);
  font-size: 0.95rem;
  cursor: pointer;
}
.pad {
  padding: 0.5rem;
  margin: 0;
  font-size: 0.9rem;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
}
.side h3 {
  margin-top: 0;
}
.preview {
  aspect-ratio: 3 / 4;
  background: #eceef1;
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 0.75rem;
}
.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.preview-stub {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  font-size: 0.9rem;
}
.file {
  font-size: 0.9rem;
  width: 100%;
}
.submit {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}
</style>
