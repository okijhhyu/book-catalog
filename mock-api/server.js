/**
 * Мок-бэкенд каталога книг: повторяет контракт спеки (Yii2 + MySQL),
 * хранит данные в памяти. Нужен, чтобы фронт можно было запустить и проверить
 *
 * Формат ответа: { success: true, data: ... }
 * Формат ошибки:  { success: false, errors: [{ field, message }] }
 */
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.resolve("uploads");
const SMS_API_KEY =
  process.env.SMSPILOT_API_KEY ||
  "XXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZXXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZ";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) =>
      cb(
        null,
        `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${path.extname(file.originalname)}`,
      ),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ---------- данные ----------
const users = [{ id: 1, username: "admin", password: "admin123" }];
const tokens = new Map();

let authors = [
  { id: 1, full_name: "Толстой Лев Николаевич" },
  { id: 2, full_name: "Стругацкий Аркадий Натанович" },
  { id: 3, full_name: "Стругацкий Борис Натанович" },
  { id: 4, full_name: "Пелевин Виктор Олегович" },
  { id: 5, full_name: "Водолазкин Евгений Германович" },
];

let books = [
  {
    id: 1,
    title: "Война и мир",
    year: 1869,
    isbn: "978-5-389-06256-5",
    description:
      "Роман-эпопея о русском обществе в эпоху войн против Наполеона.",
    cover_url: null,
    author_ids: [1],
  },
  {
    id: 2,
    title: "Пикник на обочине",
    year: 1972,
    isbn: "978-5-17-088885-7",
    description: "Повесть о Зоне Посещения и сталкерах.",
    cover_url: null,
    author_ids: [2, 3],
  },
  {
    id: 3,
    title: "Трудно быть богом",
    year: 1964,
    isbn: "978-5-17-114275-9",
    description: "Землянин-наблюдатель в средневековом мире Арканара.",
    cover_url: null,
    author_ids: [2, 3],
  },
  {
    id: 4,
    title: "Generation «П»",
    year: 1999,
    isbn: "978-5-699-37701-3",
    description: "Роман о копирайтере и эпохе девяностых.",
    cover_url: null,
    author_ids: [4],
  },
  {
    id: 5,
    title: "Лавр",
    year: 2012,
    isbn: "978-5-17-078606-1",
    description: "Неисторический роман о средневековом врачевателе.",
    cover_url: null,
    author_ids: [5],
  },
  {
    id: 6,
    title: "Авиатор",
    year: 2016,
    isbn: "978-5-17-098926-4",
    description: "Человек из прошлого века приходит в себя в наши дни.",
    cover_url: null,
    author_ids: [5],
  },
];

// подписки: authorId -> Set(phone)
const subscriptions = new Map();

let nextBookId = books.length + 1;
let nextAuthorId = authors.length + 1;

// ---------- утилиты ----------
const ok = (res, data) => res.json({ success: true, data });
const fail = (res, status, errors) =>
  res.status(status).json({ success: false, errors });
const fieldError = (field, message) => ({ field, message });

function currentUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  return token ? tokens.get(token) : null;
}

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return fail(res, 401, [fieldError("", "Требуется авторизация")]);
  req.user = user;
  next();
}

function paginate(items, query) {
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(query.per_page) || 20));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return {
    items: items.slice((page - 1) * perPage, page * perPage),
    pagination: { total, page, per_page: perPage, total_pages: totalPages },
  };
}

const authorShort = (a) => ({
  id: a.id,
  full_name: a.full_name,
  books_count: books.filter((b) => b.author_ids.includes(a.id)).length,
});

const bookOut = (b) => ({
  id: b.id,
  title: b.title,
  year: b.year,
  isbn: b.isbn,
  description: b.description,
  cover_url: b.cover_url,
  authors: b.author_ids
    .map((id) => authors.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => ({ id: a.id, full_name: a.full_name })),
});

function parseAuthorIds(body) {
  const raw = body["author_ids[]"] ?? body.author_ids ?? [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map(Number).filter((n) => Number.isInteger(n) && n > 0);
}

function validateBook(body, authorIds) {
  const errors = [];
  const year = Number(body.year);
  if (!body.title || !String(body.title).trim())
    errors.push(fieldError("title", "Укажите название книги."));
  if (
    !Number.isInteger(year) ||
    year < 1400 ||
    year > new Date().getFullYear() + 1
  )
    errors.push(fieldError("year", "Проверьте год выпуска."));
  if (!body.isbn || !String(body.isbn).trim())
    errors.push(fieldError("isbn", "Укажите ISBN."));
  if (!authorIds.length)
    errors.push(fieldError("author_ids", "Выберите хотя бы одного автора."));
  return errors;
}

// ---------- SMS (smspilot.ru, ключ-эмулятор) ----------
async function sendSms(phone, text) {
  const url = `https://smspilot.ru/api.php?send=${encodeURIComponent(text)}&to=${encodeURIComponent(phone)}&from=INFORM&apikey=${SMS_API_KEY}&format=json`;
  try {
    const response = await fetch(url);
    const result = await response.json();
    console.log(`[sms] ${phone}: ${text} ->`, result);
  } catch (e) {
    console.log(`[sms:offline] ${phone}: ${text}`);
  }
}

function notifySubscribers(book) {
  const phones = new Set();
  for (const authorId of book.author_ids) {
    for (const phone of subscriptions.get(authorId) || []) phones.add(phone);
  }
  for (const phone of phones) {
    sendSms(phone, `Новая книга в каталоге: «${book.title}» (${book.year}).`);
  }
}

// ---------- авторизация ----------
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find(
    (u) => u.username === username && u.password === password,
  );
  if (!user)
    return fail(res, 422, [
      fieldError("password", "Неверный логин или пароль."),
    ]);
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, { id: user.id, username: user.username });
  ok(res, { token, user: { id: user.id, username: user.username } });
});

app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || String(username).trim().length < 3)
    return fail(res, 422, [
      fieldError("username", "Логин — минимум 3 символа."),
    ]);
  if (!password || password.length < 6)
    return fail(res, 422, [
      fieldError("password", "Пароль — минимум 6 символов."),
    ]);
  if (users.some((u) => u.username === username))
    return fail(res, 422, [fieldError("username", "Такой логин уже занят.")]);

  const user = { id: users.length + 1, username, password };
  users.push(user);
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, { id: user.id, username: user.username });
  ok(res, { token, user: { id: user.id, username: user.username } });
});

app.get("/api/auth/me", requireAuth, (req, res) => ok(res, req.user));

// ---------- книги ----------
app.get("/api/books", (req, res) => {
  let result = [...books];
  const q = (req.query.q || "").toLowerCase().trim();
  if (q)
    result = result.filter(
      (b) => b.title.toLowerCase().includes(q) || b.isbn.includes(q),
    );
  if (req.query.year)
    result = result.filter((b) => b.year === Number(req.query.year));
  if (req.query.author_id)
    result = result.filter((b) =>
      b.author_ids.includes(Number(req.query.author_id)),
    );

  result.sort((a, b) => b.year - a.year);
  const { items, pagination } = paginate(result, req.query);
  ok(res, { items: items.map(bookOut), pagination });
});

app.get("/api/books/:id", (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) return fail(res, 404, [fieldError("", "Книга не найдена.")]);
  ok(res, bookOut(book));
});

app.post("/api/books", requireAuth, upload.single("cover"), (req, res) => {
  const authorIds = parseAuthorIds(req.body);
  const errors = validateBook(req.body, authorIds);
  if (errors.length) return fail(res, 422, errors);

  const book = {
    id: nextBookId++,
    title: String(req.body.title).trim(),
    year: Number(req.body.year),
    isbn: String(req.body.isbn).trim(),
    description: req.body.description || "",
    cover_url: req.file ? `/uploads/${req.file.filename}` : null,
    author_ids: authorIds,
  };
  books.push(book);
  notifySubscribers(book);
  res.status(201).json({ success: true, data: bookOut(book) });
});

function updateBook(req, res) {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) return fail(res, 404, [fieldError("", "Книга не найдена.")]);

  const authorIds = parseAuthorIds(req.body);
  const errors = validateBook(req.body, authorIds);
  if (errors.length) return fail(res, 422, errors);

  book.title = String(req.body.title).trim();
  book.year = Number(req.body.year);
  book.isbn = String(req.body.isbn).trim();
  book.description = req.body.description || "";
  book.author_ids = authorIds;
  if (req.file) book.cover_url = `/uploads/${req.file.filename}`;
  else if (req.body.remove_cover === "1") book.cover_url = null;

  ok(res, bookOut(book));
}

app.post("/api/books/:id", requireAuth, upload.single("cover"), updateBook);
app.put("/api/books/:id", requireAuth, upload.single("cover"), updateBook);

app.delete("/api/books/:id", requireAuth, (req, res) => {
  const index = books.findIndex((b) => b.id === Number(req.params.id));
  if (index === -1)
    return fail(res, 404, [fieldError("", "Книга не найдена.")]);
  books.splice(index, 1);
  ok(res, { deleted: true });
});

// ---------- авторы ----------
app.get("/api/authors", (req, res) => {
  let result = [...authors];
  const q = (req.query.q || "").toLowerCase().trim();
  if (q) result = result.filter((a) => a.full_name.toLowerCase().includes(q));
  result.sort((a, b) => a.full_name.localeCompare(b.full_name, "ru"));
  const { items, pagination } = paginate(result, req.query);
  ok(res, { items: items.map(authorShort), pagination });
});

app.get("/api/authors/:id", (req, res) => {
  const author = authors.find((a) => a.id === Number(req.params.id));
  if (!author) return fail(res, 404, [fieldError("", "Автор не найден.")]);
  ok(res, authorShort(author));
});

app.post("/api/authors", requireAuth, (req, res) => {
  const fullName = String(req.body.full_name || "").trim();
  if (fullName.length < 3)
    return fail(res, 422, [fieldError("full_name", "Укажите ФИО автора.")]);
  const author = { id: nextAuthorId++, full_name: fullName };
  authors.push(author);
  res.status(201).json({ success: true, data: authorShort(author) });
});

app.put("/api/authors/:id", requireAuth, (req, res) => {
  const author = authors.find((a) => a.id === Number(req.params.id));
  if (!author) return fail(res, 404, [fieldError("", "Автор не найден.")]);
  const fullName = String(req.body.full_name || "").trim();
  if (fullName.length < 3)
    return fail(res, 422, [fieldError("full_name", "Укажите ФИО автора.")]);
  author.full_name = fullName;
  ok(res, authorShort(author));
});

app.delete("/api/authors/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const index = authors.findIndex((a) => a.id === id);
  if (index === -1) return fail(res, 404, [fieldError("", "Автор не найден.")]);
  authors.splice(index, 1);
  books = books.map((b) => ({
    ...b,
    author_ids: b.author_ids.filter((a) => a !== id),
  }));
  subscriptions.delete(id);
  ok(res, { deleted: true });
});

// ---------- подписки ----------
const phoneOk = (phone) => /^7\d{10}$/.test(String(phone || ""));

app.post("/api/authors/:id/subscribe", (req, res) => {
  const author = authors.find((a) => a.id === Number(req.params.id));
  if (!author) return fail(res, 404, [fieldError("", "Автор не найден.")]);
  if (!phoneOk(req.body.phone))
    return fail(res, 422, [
      fieldError("phone", "Введите номер в формате +7 999 123-45-67."),
    ]);

  if (!subscriptions.has(author.id)) subscriptions.set(author.id, new Set());
  subscriptions.get(author.id).add(req.body.phone);
  sendSms(
    req.body.phone,
    `Вы подписались на новые книги автора ${author.full_name}.`,
  );
  ok(res, { subscribed: true });
});

app.post("/api/authors/:id/unsubscribe", (req, res) => {
  subscriptions.get(Number(req.params.id))?.delete(req.body.phone);
  ok(res, { subscribed: false });
});

// ---------- отчёт ----------
app.get("/api/reports/top-authors", (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const counts = authors
    .map((a) => ({
      author_id: a.id,
      full_name: a.full_name,
      books_count: books.filter(
        (b) => b.year === year && b.author_ids.includes(a.id),
      ).length,
    }))
    .filter((row) => row.books_count > 0)
    .sort(
      (a, b) =>
        b.books_count - a.books_count ||
        a.full_name.localeCompare(b.full_name, "ru"),
    )
    .slice(0, 10)
    .map((row, i) => ({ rank: i + 1, ...row }));

  ok(res, { year, items: counts });
});

app.use("/api", (_req, res) =>
  fail(res, 404, [fieldError("", "Метод не найден.")]),
);

app.use((err, _req, res, _next) => {
  console.error(err);
  const message =
    err.code === "LIMIT_FILE_SIZE"
      ? "Файл больше 5 МБ."
      : "Внутренняя ошибка сервера.";
  fail(res, 500, [fieldError("", message)]);
});

app.listen(PORT, () => console.log(`Mock API слушает порт ${PORT}`));
