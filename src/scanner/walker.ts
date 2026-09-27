import fs from "node:fs"
import path from "node:path"
import { analyzeFile } from "../analyzer/analyzer.js"
import type { DirectoryScanResult, FileMetrics } from "../types/index.js"

const IGNORED_NAMES = new Set(["node_modules", ".git", "dist", ".agents"])
const CODE_FILE_REGEX = /\.(ts|js|tsx|jsx)$/

function shouldScanDir(entry: fs.Dirent): boolean {
  return entry.isDirectory() && !IGNORED_NAMES.has(entry.name)
}

function isCodeFile(entry: fs.Dirent): boolean {
  return entry.isFile() && CODE_FILE_REGEX.test(entry.name)
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

export function scanDirectory(dirPath: string): DirectoryScanResult {
  const stat = fs.statSync(dirPath)
  if (stat.isFile()) {
    return createFileResult(dirPath)
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

    if (shouldScanDir(entry)) {
      results.subFolders.push(scanDirectory(fullPath))
      continue
    }

    if (isCodeFile(entry)) {
      results.fileCount++
      const fileMetrics = analyzeFile(fullPath)
      results.totalSloc += fileMetrics.sloc
      results.files.push(fileMetrics)
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
