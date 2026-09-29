import fs from "node:fs"
import path from "node:path"
import { analyzeFile } from "../analyzer/analyzer.js"
import type { DirectoryScanResult, FileMetrics } from "../types/index.js"
import { loadGitignore, type GitIgnoreFilter } from "./gitignore.js"

export const DEFAULT_IGNORED_DIRS = new Set([
  // Dependencies & package managers
  "node_modules",
  "vendor",
  "bower_components",
  "jspm_packages",

  // Build & compilation outputs
  "dist",
  "build",
  "out",
  ".output",
  "target",
  "bin",
  "obj",
  "pkg",

  // Framework output & caches
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".astro",
  ".docusaurus",
  ".serverless",
  ".fusebox",

  // Bundler & tooling caches
  ".cache",
  ".turbo",
  ".parcel-cache",
  ".webpack",
  ".rollup.cache",
  "coverage",
  ".nyc_output",

  // Version control, IDE & tooling
  ".git",
  ".svn",
  ".hg",
  ".agents",
  ".gemini",
  ".vscode",
  ".idea",
  ".github",
  ".husky",

  // Temp directories
  ".temp",
  ".tmp",
  "temp",
  "tmp",
])

export const IGNORED_FILE_PATTERNS = [
  // TypeScript declarations
  /\.d\.(ts|mts|cts)$/i,
  // Minified files
  /\.min\.(js|mjs|cjs|ts)$/i,
  // Bundled or dist files
  /(-dist|\.bundle|\.chunk)\.(js|mjs|cjs|ts)$/i,
  /^bundle\.(js|mjs|cjs|ts)$/i,
  /^test-dist\.(js|mjs|cjs|ts)$/i,
  /^chunk-.*\.(js|mjs|cjs|ts)$/i,
  // Source maps
  /\.map$/i,
]

const CODE_FILE_REGEX = /\.(ts|js|tsx|jsx|mjs|cjs)$/i

export function isPathInIgnoredDir(targetPath: string): boolean {
  const normalized = targetPath.replace(/\\/g, "/")
  const segments = normalized.split("/")
  return segments.some((segment) => DEFAULT_IGNORED_DIRS.has(segment))
}

export function shouldScanDir(dirName: string, relPath: string, gitignore?: GitIgnoreFilter): boolean {
  if (DEFAULT_IGNORED_DIRS.has(dirName)) return false
  if (dirName.startsWith(".") && dirName !== "." && dirName !== "..") return false
  const normalizedRel = relPath.replace(/\\/g, "/")
  const segments = normalizedRel.split("/")
  if (segments.some((segment) => DEFAULT_IGNORED_DIRS.has(segment))) return false
  if (gitignore && gitignore(relPath, true)) return false
  return true
}

export function isCodeFile(
  fileName: string,
  relPath: string,
  fullPath?: string,
  gitignore?: GitIgnoreFilter,
): boolean {
  if (!CODE_FILE_REGEX.test(fileName)) return false

  for (const pattern of IGNORED_FILE_PATTERNS) {
    if (pattern.test(fileName)) return false
  }

  if (gitignore && gitignore(relPath, false)) return false

  if (fullPath) {
    try {
      const stat = fs.statSync(fullPath)
      // Exclude files larger than 1MB (usually bundled/generated)
      if (stat.size > 1024 * 1024) return false
    } catch {
      // Ignore stat errors
    }
  }

  return true
}

function createEmptyResult(dirPath: string): DirectoryScanResult {
  return {
    folderPath: dirPath,
    fileCount: 0,
    totalSloc: 0,
    files: [],
    subFolders: [],
  }
}

function createFileResult(filePath: string): DirectoryScanResult {
  const fileMetrics = analyzeFile(filePath)
  return {
    folderPath: path.dirname(filePath),
    fileCount: 1,
    totalSloc: fileMetrics.sloc,
    files: [fileMetrics],
    subFolders: [],
  }
}

export function scanDirectory(
  dirPath: string,
  rootDir = dirPath,
  gitignore?: GitIgnoreFilter,
): DirectoryScanResult {
  if (isPathInIgnoredDir(dirPath)) {
    return createEmptyResult(dirPath)
  }

  const stat = fs.statSync(dirPath)
  const filter = gitignore ?? loadGitignore(rootDir)

  if (stat.isFile()) {
    const fileName = path.basename(dirPath)
    const relPath = path.relative(rootDir, dirPath) || fileName
    if (!isCodeFile(fileName, relPath, dirPath, filter)) {
      return createEmptyResult(path.dirname(dirPath))
    }
    return createFileResult(dirPath)
  }

  const dirName = path.basename(dirPath)
  const relDirPath = path.relative(rootDir, dirPath)
  if (relDirPath && !shouldScanDir(dirName, relDirPath, filter)) {
    return createEmptyResult(dirPath)
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const results: DirectoryScanResult = {
    folderPath: dirPath,
    fileCount: 0,
    totalSloc: 0,
    files: [],
    subFolders: [],
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const relPath = path.relative(rootDir, fullPath)

    if (entry.isDirectory()) {
      if (shouldScanDir(entry.name, relPath, filter)) {
        results.subFolders.push(scanDirectory(fullPath, rootDir, filter))
      }
      continue
    }

    if (entry.isFile()) {
      if (isCodeFile(entry.name, relPath, fullPath, filter)) {
        results.fileCount++
        const fileMetrics = analyzeFile(fullPath)
        results.totalSloc += fileMetrics.sloc
        results.files.push(fileMetrics)
      }
    }
  }

  return results
}

export async function scanDirectoryAsync(
  dirPath: string,
  rootDir = dirPath,
  gitignore?: GitIgnoreFilter,
  onProgress?: (progress: { currentFile: string; scannedCount: number }) => void,
  counter = { count: 0 },
): Promise<DirectoryScanResult> {
  if (isPathInIgnoredDir(dirPath)) {
    return createEmptyResult(dirPath)
  }

  const stat = fs.statSync(dirPath)
  const filter = gitignore ?? loadGitignore(rootDir)

  if (stat.isFile()) {
    const fileName = path.basename(dirPath)
    const relPath = path.relative(rootDir, dirPath) || fileName
    if (!isCodeFile(fileName, relPath, dirPath, filter)) {
      return createEmptyResult(path.dirname(dirPath))
    }
    counter.count++
    if (onProgress) {
      onProgress({ currentFile: relPath, scannedCount: counter.count })
    }
    return createFileResult(dirPath)
  }

  const dirName = path.basename(dirPath)
  const relDirPath = path.relative(rootDir, dirPath)
  if (relDirPath && !shouldScanDir(dirName, relDirPath, filter)) {
    return createEmptyResult(dirPath)
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const results: DirectoryScanResult = {
    folderPath: dirPath,
    fileCount: 0,
    totalSloc: 0,
    files: [],
    subFolders: [],
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const relPath = path.relative(rootDir, fullPath)

    if (entry.isDirectory()) {
      if (shouldScanDir(entry.name, relPath, filter)) {
        const subResult = await scanDirectoryAsync(fullPath, rootDir, filter, onProgress, counter)
        results.subFolders.push(subResult)
      }
      continue
    }

    if (entry.isFile()) {
      if (isCodeFile(entry.name, relPath, fullPath, filter)) {
        counter.count++
        if (onProgress) {
          onProgress({ currentFile: relPath, scannedCount: counter.count })
        }
        // Yield to event loop so spinners, animations and UI can render
        await new Promise((resolve) => setImmediate(resolve))

        results.fileCount++
        const fileMetrics = analyzeFile(fullPath)
        results.totalSloc += fileMetrics.sloc
        results.files.push(fileMetrics)
      }
    }
  }

  return results
}

export function flattenScanFiles(node: DirectoryScanResult): FileMetrics[] {
  const all: FileMetrics[] = [...node.files]
  for (const sub of node.subFolders) {
    all.push(...flattenScanFiles(sub))
  }
  return all
}
