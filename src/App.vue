<script setup>
import AppHeader from '@/components/AppHeader.vue'
import ToastList from '@/components/ToastList.vue'
</script>

<template>
  <AppHeader />
  <main>
    <RouterView />
  </main>
  <ToastList />
</template>
