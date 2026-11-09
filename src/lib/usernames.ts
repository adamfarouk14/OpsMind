export const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/

export const USERNAME_HINT = '3-32 characters: lowercase letters, digits, dot, underscore or hyphen'

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function validateUsername(value: string): string | null {
  const username = normalizeUsername(value)
  if (!username) return 'Username is required'
  if (!USERNAME_PATTERN.test(username)) return `Username is not valid. ${USERNAME_HINT}`
  if (/^[._-]|[._-]$/.test(username)) return 'Username cannot start or end with a dot, underscore or hyphen'
  return null
}
