# Каталог книг — фронтенд (Vue 3)

Фронтенд для API каталога книг: книги с несколькими авторами, обложками, подписка гостей на новые книги автора и отчёт «Топ-10 авторов за год».

## Запуск в Docker

```bash
docker compose up --build
```

- Фронтенд: http://localhost:8080
- API (мок-бэкенд): http://localhost:3000/api/books

Тестовый пользователь: **admin / admin123**.

Режим разработки с hot reload:

```bash
docker compose -f docker-compose.dev.yml up --build
# http://localhost:5173
```

Без Docker:

```bash
npm install
npm run dev        # фронт на 5173
cd mock-api && npm install && npm start   # API на 3000
```

## Подключение к реальному бэкенду

В `nginx.conf` заменить `proxy_pass http://api:3000;` на адрес Yii2-приложения и убрать сервис `api` из `docker-compose.yml`. Либо собрать фронт с прямым адресом API:

```bash
VITE_API_BASE_URL=https://example.com/api npm run build
```

## Что реализовано

| Требование ТЗ | Где |
|---|---|
| Просмотр каталога, поиск, фильтры по году и автору, пагинация | `/books` |
| Карточка книги: название, год, описание, ISBN, обложка, авторы | `/books/:id` |
| Добавление, редактирование, удаление книги (только для юзера) | `/books/new`, `/books/:id/edit` |
| Загрузка фото главной страницы с предпросмотром | `BookFormView.vue` |
| CRUD авторов | `/authors` |
| Подписка гостя на новые книги автора по номеру телефона | `/authors/:id` |
| Отчёт «Топ-10 авторов за год», доступен всем | `/report/top-authors` |
| Вход и регистрация, хранение токена, guard на маршрутах | `/login`, `src/router/index.js` |
| SMS через smspilot.ru (ключ-эмулятор) | `mock-api/server.js`, функция `sendSms` |

Разграничение прав: гость видит каталог и может подписаться; кнопки добавления, редактирования и удаления появляются только после входа, а маршруты форм закрыты навигационным guard'ом. Токен подставляется в заголовок `Authorization: Bearer`, ответ `401` сбрасывает сессию.

## Контракт API

Ответы разворачиваются из `{ success, data }`, ошибки приводятся к `{ message, fields }` в `src/api/http.js` — поля из `errors[].field` подсвечиваются прямо в форме.

| Метод | Назначение |
|---|---|
| `GET /books` | список: `page`, `per_page`, `q`, `year`, `author_id` |
| `GET /books/{id}` | карточка книги |
| `POST /books` | создание, `multipart/form-data` |
| `POST /books/{id}` + `_method=PUT` | обновление (multipart нельзя слать через PUT в PHP) |
| `DELETE /books/{id}` | удаление |
| `GET/POST/PUT/DELETE /authors` | CRUD авторов |
| `POST /authors/{id}/subscribe` | подписка, тело `{ phone }` |
| `GET /reports/top-authors?year=` | отчёт |
| `POST /auth/login`, `/auth/register` | авторизация |

## Стек

Vue 3 (Composition API, `<script setup>`), Vue Router 4 с ленивой загрузкой страниц, Pinia, Axios, Vite. Стили — обычный CSS с токенами в `:root`, без UI-библиотек. Мок-бэкенд — Express + Multer, данные в памяти.

## Структура

```
src/
  api/        клиент HTTP и методы книг, авторов, отчёта, авторизации
  components/ шапка, карточка книги, пагинация, модалка, тосты
  stores/     auth (токен, пользователь), toasts
  views/      страницы каталога, книги, формы, авторов, отчёта, входа
  utils/      склонения, нормализация телефона
mock-api/     мок бэкенда по спеке + отправка SMS
```
