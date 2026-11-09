// Versions are auto-stamped as "v4.0" — nobody types them by hand. Older rows
// may hold "v3" or "v3.0"; both parse and compare the same way.
export function versionKey(value: string | null | undefined): number | null {
  const match = value?.match(/^v(\d+)(?:\.(\d+))?$/)
  if (!match) return null
  return parseInt(match[1]) * 1000 + (match[2] ? parseInt(match[2]) : 0)
}

export function nextVersionStamp(existing: Array<string | null | undefined>): string {
  const majors = existing
    .map(versionKey)
    .filter((k): k is number => k !== null)
    .map(k => Math.floor(k / 1000))
  return `v${(majors.length ? Math.max(...majors) : 0) + 1}.0`
}

export function isVersionNewer(candidate: string, current: string | null | undefined): boolean {
  const a = versionKey(candidate)
  const b = versionKey(current)
  if (a === null || b === null) return true // unparseable versions never block
  return a > b
}
