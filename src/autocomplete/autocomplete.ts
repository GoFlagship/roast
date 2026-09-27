import fs from "node:fs"
import path from "node:path"
import { parseInputPath } from "./pathHelper.js"
import { computeNextCompletion as computeCycle } from "./cycle.js"

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", ".agents"])

function isDirectory(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory()
  } catch {
    return false
  }
}

function isIgnoredEntry(entry: fs.Dirent): boolean {
  if (!entry.isDirectory()) return true
  return IGNORED_DIRS.has(entry.name)
}

function matchesPartial(name: string, partial: string): boolean {
  if (!partial) return true
  return name.toLowerCase().startsWith(partial)
}

export function getDirectoryCompletions(rawInput: string): string[] {
  const { prefix, searchDir, partial } = parseInputPath(rawInput)
  const resolvedDir = path.resolve(searchDir)

  if (!isDirectory(resolvedDir)) {
    return []
  }

  try {
    const entries = fs.readdirSync(resolvedDir, { withFileTypes: true })
    const matches: string[] = []

    for (const entry of entries) {
      if (isIgnoredEntry(entry)) continue
      if (matchesPartial(entry.name, partial)) {
        matches.push(`${prefix}${entry.name}/`)
      }
    }

    return matches.sort()
  } catch {
    return []
  }
}

export function computeNextCompletion(
  currentValue: string,
  _lastMatches?: string[],
  _lastMatchIndex?: number,
): { nextValue: string; matches: string[]; nextIndex: number } {
  const matches = getDirectoryCompletions(currentValue)
  return computeCycle(currentValue, matches)
}
