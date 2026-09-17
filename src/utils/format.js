// Склонение существительного: plural(3, 'книга', 'книги', 'книг') -> 'книги'
export function plural(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export function booksCountLabel(n) {
  return `${n} ${plural(n, 'книга', 'книги', 'книг')}`
}

export function authorNames(book) {
  const authors = book?.authors || []
  return authors.map((a) => a.full_name).join(', ')
}

// Телефон в формате 7XXXXXXXXXX — как ждёт SMS-шлюз.
export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`
  return digits
}

export function isValidPhone(value) {
  return /^7\d{10}$/.test(normalizePhone(value))
}
