/**
 * Placeholder parsing for "fill" writing mode.
 * Placeholders use the {{name}} syntax; AI fills them in.
 */

const PLACEHOLDER_RE = /\{\{([^}]+)\}\}/g

/** Extract unique placeholder names (trimmed) from a fill template string. */
export function parsePlaceholders(text: string): string[] {
  const set = new Set<string>()
  for (const m of text.matchAll(PLACEHOLDER_RE)) {
    const name = m[1].trim()
    if (name) set.add(name)
  }
  return Array.from(set)
}
