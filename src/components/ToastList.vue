<script setup>
import { useToastStore } from '@/stores/toasts'
const toasts = useToastStore()
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <div v-for="t in toasts.items" :key="t.id" class="toast" :class="t.type">
      <span>{{ t.text }}</span>
      <button class="close" aria-label="Закрыть" @click="toasts.remove(t.id)">×</button>
    </div>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 50;
  max-width: min(360px, calc(100vw - 2rem));
}
.toast {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  background: #fff;
  border: 1px solid var(--line);
  border-left: 3px solid var(--ok);
  border-radius: var(--radius);
  padding: 0.65rem 0.85rem;
  box-shadow: 0 4px 14px rgba(27, 36, 48, 0.12);
  font-size: 0.92rem;
}
.toast.error {
  border-left-color: var(--danger);
}
.close {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  color: var(--ink-soft);
  margin-left: auto;
}
</style>
