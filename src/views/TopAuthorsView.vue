<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reportsApi } from '@/api/authors'
import { booksCountLabel } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const currentYear = new Date().getFullYear()
const year = ref(Number(route.query.year) || currentYear)
const items = ref([])
const loading = ref(false)
const errorMessage = ref('')

const years = computed(() => {
  const list = []
  for (let y = currentYear; y >= currentYear - 30; y--) list.push(y)
  return list
})

const maxCount = computed(() => Math.max(1, ...items.value.map((i) => i.books_count || 0)))

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await reportsApi.topAuthors(year.value)
    items.value = data.items || []
    router.replace({ query: { year: year.value } })
  } catch (e) {
    errorMessage.value = e.message
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page container">
    <div class="page-head">
      <div>
        <h1>Топ-10 авторов</h1>
        <p>Кто выпустил больше всего книг за выбранный год.</p>
      </div>
      <div class="field">
        <label for="year">Год</label>
        <select id="year" v-model.number="year" class="select" @change="load">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <div v-if="errorMessage" class="alert">{{ errorMessage }}</div>
    <div v-if="loading" class="spinner" />

    <template v-else>
      <ol v-if="items.length" class="chart">
        <li v-for="item in items" :key="item.author_id">
          <span class="rank">{{ item.rank }}</span>
          <RouterLink class="name" :to="{ name: 'author', params: { id: item.author_id } }">
            {{ item.full_name }}
          </RouterLink>
          <span class="bar-wrap">
            <span
              class="bar"
              :style="{ width: `${(item.books_count / maxCount) * 100}%` }"
            />
          </span>
          <span class="count muted">{{ booksCountLabel(item.books_count) }}</span>
        </li>
      </ol>
      <div v-else class="empty">За {{ year }} год книг в каталоге нет.</div>
    </template>
  </div>
</template>

<style scoped>
.page-head .field {
  margin-bottom: 0;
  min-width: 140px;
}
.chart {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.chart li {
  display: grid;
  grid-template-columns: 2rem minmax(140px, 1fr) minmax(80px, 2fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--line);
}
.chart li:last-child {
  border-bottom: none;
}
.rank {
  font-family: var(--serif);
  font-size: 1.15rem;
  color: var(--ink-soft);
}
.name {
  color: var(--ink);
}
.bar-wrap {
  background: #eceef1;
  border-radius: 3px;
  height: 10px;
}
.bar {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
}
.count {
  font-size: 0.9rem;
  white-space: nowrap;
}
@media (max-width: 640px) {
  .chart li {
    grid-template-columns: 1.5rem 1fr auto;
  }
  .bar-wrap {
    display: none;
  }
}
</style>
