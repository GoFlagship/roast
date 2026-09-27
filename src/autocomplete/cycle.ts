export function getLongestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return ""
  let prefix = strings[0]
  for (let i = 1; i < strings.length; i++) {
    const current = strings[i].toLowerCase()
    while (prefix && !current.startsWith(prefix.toLowerCase())) {
      prefix = prefix.slice(0, -1)
    }
  }
  return prefix
}

export function getCycleMatch(matches: string[], currentValue: string): string | null {
  if (matches.length <= 1) return null
  const idx = matches.indexOf(currentValue)
  if (idx < 0) return null
  return matches[(idx + 1) % matches.length]
}

export function computeNextCompletion(
  currentValue: string,
  matches: string[],
): { nextValue: string; matches: string[]; nextIndex: number } {
  if (matches.length === 0) {
    return { nextValue: currentValue, matches: [], nextIndex: -1 }
  }

  const cycle = getCycleMatch(matches, currentValue)
  if (cycle) {
    return { nextValue: cycle, matches, nextIndex: matches.indexOf(cycle) }
  }

  const commonPrefix = getLongestCommonPrefix(matches)
  const nextValue = commonPrefix.length > currentValue.length ? commonPrefix : matches[0]
  return { nextValue, matches, nextIndex: 0 }
}
