import fs from "node:fs"
import path from "node:path"
import { calculateFileScore, calculateFolderScore, getRoastVerdict } from "../scoring/scoring.js"
import type { AnalyzedFile, FullAnalysisReport } from "../types/index.js"
import { scanDirectory, scanDirectoryAsync, flattenScanFiles } from "./walker.js"
import { loadGitignore } from "./gitignore.js"

export { scanDirectory, scanDirectoryAsync }

export function runFullAnalysis(targetPath: string): FullAnalysisReport {
  const resolvedPath = path.resolve(targetPath)
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Path not found: ${targetPath}`)
  }

  const gitignoreFilter = loadGitignore(resolvedPath)
  const scanData = scanDirectory(resolvedPath, resolvedPath, gitignoreFilter)
  const rawFiles = flattenScanFiles(scanData)

  const allFiles: AnalyzedFile[] = rawFiles.map((metrics) => ({
    metrics,
    evaluation: calculateFileScore(metrics),
    filename: path.basename(metrics.filePath),
    relativePath: path.relative(resolvedPath, metrics.filePath) || path.basename(metrics.filePath),
  }))

  allFiles.sort((a, b) => a.evaluation.score - b.evaluation.score)

  const folderScore = calculateFolderScore(scanData)
  const totalSloc = allFiles.reduce((acc, f) => acc + f.metrics.sloc, 0)
  const { verdict } = getRoastVerdict(folderScore.score, folderScore.rank)

  return {
    targetPath: resolvedPath,
    folderScore,
    totalFiles: allFiles.length,
    totalSloc,
    files: allFiles,
    roastVerdict: verdict,
  }
}

export async function runFullAnalysisAsync(
  targetPath: string,
  onProgress?: (progress: { currentFile: string; scannedCount: number }) => void,
): Promise<FullAnalysisReport> {
  const resolvedPath = path.resolve(targetPath)
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Path not found: ${targetPath}`)
  }

  const gitignoreFilter = loadGitignore(resolvedPath)
  const scanData = await scanDirectoryAsync(resolvedPath, resolvedPath, gitignoreFilter, onProgress)
  const rawFiles = flattenScanFiles(scanData)

  const allFiles: AnalyzedFile[] = rawFiles.map((metrics) => ({
    metrics,
    evaluation: calculateFileScore(metrics),
    filename: path.basename(metrics.filePath),
    relativePath: path.relative(resolvedPath, metrics.filePath) || path.basename(metrics.filePath),
  }))

  allFiles.sort((a, b) => a.evaluation.score - b.evaluation.score)

  const folderScore = calculateFolderScore(scanData)
  const totalSloc = allFiles.reduce((acc, f) => acc + f.metrics.sloc, 0)
  const { verdict } = getRoastVerdict(folderScore.score, folderScore.rank)

  return {
    targetPath: resolvedPath,
    folderScore,
    totalFiles: allFiles.length,
    totalSloc,
    files: allFiles,
    roastVerdict: verdict,
  }
}
