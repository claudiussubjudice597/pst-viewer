/** Split a search query into the distinct terms we highlight / match on. */
export function queryTerms(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2),
    ),
  )
}

/** Escape a string for safe use inside a RegExp. */
export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** A case-insensitive regex matching any of the given (already-escaped-safe) terms. */
export function termsRegExp(terms: string[]): RegExp | null {
  if (!terms.length) return null
  return new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
}
