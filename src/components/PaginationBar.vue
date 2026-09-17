<script setup>
import { computed } from 'vue'

const props = defineProps({
  pagination: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['change'])

const page = computed(() => props.pagination.page || 1)
const totalPages = computed(() => props.pagination.total_pages || 1)
const total = computed(() => props.pagination.total || 0)

const pages = computed(() => {
  const list = []
  const from = Math.max(1, page.value - 2)
  const to = Math.min(totalPages.value, from + 4)
  for (let i = from; i <= to; i++) list.push(i)
  return list
})

function go(p) {
  if (p >= 1 && p <= totalPages.value && p !== page.value) emit('change', p)
}
</script>

<template>
  <div v-if="totalPages > 1" class="pager">
    <button class="btn btn-sm" :disabled="page <= 1" @click="go(page - 1)">Назад</button>
    <button
      v-for="p in pages"
      :key="p"
      class="btn btn-sm"
      :class="{ 'btn-primary': p === page }"
      @click="go(p)"
    >
      {{ p }}
    </button>
    <button class="btn btn-sm" :disabled="page >= totalPages" @click="go(page + 1)">
      Вперёд
    </button>
    <span class="muted count">Всего: {{ total }}</span>
  </div>
</template>

<style scoped>
.pager {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 1.25rem;
}
.count {
  margin-left: auto;
  font-size: 0.9rem;
}
</style>
