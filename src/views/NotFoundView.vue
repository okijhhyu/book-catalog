<template>
  <div class="page container">
    <div class="empty">
      <h1>Страница не найдена</h1>
      <p>Проверьте адрес или вернитесь в каталог.</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'books' }">К списку книг</RouterLink>
    </div>
  </div>
</template>
