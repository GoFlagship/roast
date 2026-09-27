import type {
  DirectoryScanResult,
  FileMetrics,
  FileScore,
  FolderScore,
} from "../types/index.js"
import { computeGeneralPenalties, computeJsxPenalties } from "./rules.js"
import { toScoreRank, getRoastVerdict } from "./verdicts.js"

export { toScoreRank, getRoastVerdict }

export function calculateFileScore(metrics: FileMetrics): FileScore {
  const general = computeGeneralPenalties(metrics)
  const penalties = [...general.penalties]
  let totalDeduction = general.deduction

  if (metrics.jsxMetrics.isJsxOrTsx) {
    const jsx = computeJsxPenalties(metrics.jsxMetrics)
    totalDeduction += jsx.deduction
    penalties.push(...jsx.penalties)
  }

  const score = Math.max(0, Math.round(100 - totalDeduction))
  const rank = toScoreRank(score)

  return { score, rank, penalties }
}

export function calculateFolderScore(folder: DirectoryScanResult): FolderScore {
  if (folder.files.length === 0) {
    return { score: 100, rank: "A", penalties: [] }
  }

  const totalScore = folder.files.reduce(
    (sum, file) => sum + calculateFileScore(file).score,
    0,
  )
  let avg = Math.round(totalScore / folder.files.length)
  const penalties: string[] = []

  if (folder.fileCount > 12) {
    const pts = Math.min(20, (folder.fileCount - 12) * 2)
    avg -= pts
    penalties.push(`Crowded directory (${folder.fileCount} files): -${pts}pt`)
  }

  const score = Math.max(0, Math.min(100, avg))
  const rank = toScoreRank(score)

  return { score, rank, penalties }
}
