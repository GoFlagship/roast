import fs from "node:fs"
import path from "node:path"
import { calculateFileScore, calculateFolderScore, getRoastVerdict } from "../scoring/scoring.js"
import type { AnalyzedFile, FullAnalysisReport } from "../types/index.js"
import { scanDirectory, flattenScanFiles } from "./walker.js"

export { scanDirectory }

export function runFullAnalysis(targetPath: string): FullAnalysisReport {
  const resolvedPath = path.resolve(targetPath)
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Path not found: ${targetPath}`)
  }

  const scanData = scanDirectory(resolvedPath)
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
