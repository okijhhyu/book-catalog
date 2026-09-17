<script setup>
import { computed } from 'vue'
import { authorNames } from '@/utils/format'

const props = defineProps({ book: { type: Object, required: true } })
const authors = computed(() => authorNames(props.book) || 'Автор не указан')
</script>

<template>
  <article class="book card">
    <RouterLink :to="{ name: 'book', params: { id: book.id } }" class="cover-link">
      <img v-if="book.cover_url" :src="book.cover_url" :alt="`Обложка: ${book.title}`" />
      <div v-else class="cover-stub">Нет обложки</div>
    </RouterLink>
    <div class="body">
      <h3>
        <RouterLink :to="{ name: 'book', params: { id: book.id } }">{{ book.title }}</RouterLink>
      </h3>
      <p class="muted authors">{{ authors }}</p>
      <p class="muted meta">{{ book.year }} год · ISBN {{ book.isbn }}</p>
    </div>
  </article>
</template>

<style scoped>
.book {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cover-link {
  display: block;
  aspect-ratio: 3 / 4;
  background: #eceef1;
}
.cover-link img {
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
  font-size: 0.85rem;
}
.body {
  padding: 0.85rem 1rem 1rem;
}
.body h3 {
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
}
.body h3 a {
  color: var(--ink);
}
.authors,
.meta {
  margin: 0;
  font-size: 0.88rem;
}
.meta {
  margin-top: 0.35rem;
}
</style>
