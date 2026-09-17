<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { authorsApi } from '@/api/authors'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import BaseModal from '@/components/BaseModal.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import { booksCountLabel } from '@/utils/format'

const auth = useAuthStore()
const toasts = useToastStore()

const authors = ref([])
const pagination = ref({})
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')
const page = ref(1)

const formOpen = ref(false)
const saving = ref(false)
const editing = ref(null)
const form = reactive({ full_name: '' })
const formErrors = reactive({})

const removing = ref(null)
const deleting = ref(false)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await authorsApi.list({
      page: page.value,
      per_page: 20,
      q: search.value || undefined,
    })
    authors.value = data.items || []
    pagination.value = data.pagination || {}
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    loading.value = false
  }
}

let timer = null
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    load()
  }, 400)
})

function openCreate() {
  editing.value = null
  form.full_name = ''
  Object.keys(formErrors).forEach((k) => delete formErrors[k])
  formOpen.value = true
}

function openEdit(author) {
  editing.value = author
  form.full_name = author.full_name
  Object.keys(formErrors).forEach((k) => delete formErrors[k])
  formOpen.value = true
}

async function save() {
  Object.keys(formErrors).forEach((k) => delete formErrors[k])
  const value = form.full_name.trim()
  if (value.length < 3) {
    formErrors.full_name = 'Введите ФИО целиком, например «Толстой Лев Николаевич».'
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await authorsApi.update(editing.value.id, { full_name: value })
      toasts.success('Данные автора обновлены')
    } else {
      await authorsApi.create({ full_name: value })
      toasts.success('Автор добавлен')
    }
    formOpen.value = false
    load()
  } catch (e) {
    Object.assign(formErrors, e.fields || {})
    if (!Object.keys(e.fields || {}).length) toasts.error(e.message)
  } finally {
    saving.value = false
  }
}

async function confirmRemove() {
  deleting.value = true
  try {
    await authorsApi.remove(removing.value.id)
    toasts.success('Автор удалён')
    removing.value = null
    load()
  } catch (e) {
    toasts.error(e.message)
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page container">
    <div class="page-head">
      <div>
        <h1>Авторы</h1>
        <p>Подпишитесь на автора, чтобы получить SMS о его новых книгах.</p>
      </div>
      <button v-if="auth.isAuthenticated" class="btn btn-primary" @click="openCreate">
        Добавить автора
      </button>
    </div>

    <div class="toolbar">
      <div class="field">
        <label for="author-search">Поиск</label>
        <input id="author-search" v-model="search" class="input" placeholder="ФИО автора" />
      </div>
    </div>

    <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>
    <div v-if="loading" class="spinner" />

    <template v-else>
      <table v-if="authors.length" class="table">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Книг в каталоге</th>
            <th v-if="auth.isAuthenticated" class="right">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in authors" :key="a.id">
            <td>
              <RouterLink :to="{ name: 'author', params: { id: a.id } }">
                {{ a.full_name }}
              </RouterLink>
            </td>
            <td class="muted">{{ booksCountLabel(a.books_count ?? 0) }}</td>
            <td v-if="auth.isAuthenticated" class="right">
              <button class="btn btn-sm" @click="openEdit(a)">Изменить</button>
              <button class="btn btn-sm btn-danger" @click="removing = a">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">Авторов пока нет.</div>

      <PaginationBar :pagination="pagination" @change="(p) => { page = p; load() }" />
    </template>

    <BaseModal
      v-if="formOpen"
      :title="editing ? 'Редактирование автора' : 'Новый автор'"
      @close="formOpen = false"
    >
      <div class="field" :class="{ 'field-error': formErrors.full_name }">
        <label for="full_name">ФИО</label>
        <input
          id="full_name"
          v-model="form.full_name"
          class="input"
          placeholder="Толстой Лев Николаевич"
          @keyup.enter="save"
        />
        <p v-if="formErrors.full_name" class="error-text">{{ formErrors.full_name }}</p>
      </div>
      <template #footer>
        <button class="btn" @click="formOpen = false">Отмена</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Сохраняем…' : 'Сохранить' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal v-if="removing" title="Удалить автора?" @close="removing = null">
      <p>{{ removing.full_name }} будет удалён вместе со связями с книгами.</p>
      <template #footer>
        <button class="btn" @click="removing = null">Отмена</button>
        <button class="btn btn-danger" :disabled="deleting" @click="confirmRemove">
          {{ deleting ? 'Удаляем…' : 'Удалить' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.right {
  text-align: right;
}
.right .btn + .btn {
  margin-left: 0.35rem;
}
</style>
