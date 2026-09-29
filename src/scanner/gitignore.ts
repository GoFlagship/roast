import fs from "node:fs"
import path from "node:path"

export type GitIgnoreFilter = (relPath: string, isDirectory: boolean) => boolean

interface ParsedPattern {
  regex: RegExp
  isDirOnly: boolean
  isNegation: boolean
}

export function parseGitignorePattern(pattern: string): ParsedPattern | null {
  let p = pattern.trim()
  if (!p || p.startsWith("#")) return null

  const isNegation = p.startsWith("!")
  if (isNegation) {
    p = p.slice(1).trim()
  }

  const isDirOnly = p.endsWith("/")
  if (isDirOnly) {
    p = p.slice(0, -1)
  }

  // Escape regex special characters except * and ?
  let regexStr = p
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/(?<!\.)\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")

  if (p.startsWith("/")) {
    regexStr = `^${regexStr.slice(1)}(/.*)?$`
  } else {
    regexStr = `(^|/)${regexStr}(/.*)?$`
  }

  try {
    const regex = new RegExp(regexStr, "i")
    return { regex, isDirOnly, isNegation }
  } catch {
    return null
  }
}

export function loadGitignore(dirPath: string): GitIgnoreFilter {
  let currentDir = path.resolve(dirPath)
  const patterns: ParsedPattern[] = []

  // Check current directory and walk up to find .gitignore
  while (true) {
    const gitignorePath = path.join(currentDir, ".gitignore")
    if (fs.existsSync(gitignorePath)) {
      try {
        const content = fs.readFileSync(gitignorePath, "utf-8")
        const lines = content.split(/\r?\n/)
        for (const line of lines) {
          const parsed = parseGitignorePattern(line)
          if (parsed) patterns.push(parsed)
        }
      } catch {
        // Ignore read errors
      }
      break
    }
    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) break
    currentDir = parentDir
  }

  return (relPath: string, isDirectory: boolean): boolean => {
    if (patterns.length === 0) return false
    const normalized = relPath.replace(/\\/g, "/")
    let ignored = false

    for (const { regex, isDirOnly, isNegation } of patterns) {
      if (isDirOnly && !isDirectory) continue
      if (regex.test(normalized)) {
        ignored = !isNegation
      }
    }

    return ignored
  }
}
