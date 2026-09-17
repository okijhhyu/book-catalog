<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

defineProps({ title: { type: String, default: '' } })
const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal card" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>{{ title }}</h3>
        <button class="btn btn-ghost btn-sm" aria-label="Закрыть" @click="emit('close')">×</button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
      <div v-if="$slots.footer" class="modal-foot">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(27, 36, 48, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 40;
}
.modal {
  width: min(460px, 100%);
  background: #fff;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--line);
}
.modal-head h3 {
  margin: 0;
}
.modal-body {
  padding: 1.25rem;
}
.modal-foot {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--line);
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
