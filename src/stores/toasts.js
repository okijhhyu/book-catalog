import { defineStore } from 'pinia'
import { ref } from 'vue'

let seq = 0

export const useToastStore = defineStore('toasts', () => {
  const items = ref([])

  function push(text, type = 'success') {
    const id = ++seq
    items.value.push({ id, text, type })
    setTimeout(() => remove(id), 4500)
  }

  function remove(id) {
    items.value = items.value.filter((t) => t.id !== id)
  }

  return {
    items,
    remove,
    success: (text) => push(text, 'success'),
    error: (text) => push(text, 'error'),
  }
})
