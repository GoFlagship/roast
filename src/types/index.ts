export interface JsxMetrics {
  isJsxOrTsx: boolean
  maxJsxDepth: number
  maxComponentLines: number
  hugeComponentsCount: number
  missingPropsInterfaceCount: number
  giantInlineCallbacksCount: number
}

export interface FileMetrics {
  filePath: string
  sloc: number
  functionsCount: number
  cyclomaticComplexity: number
  cognitiveComplexity: number
  maxNestingDepth: number
  anyCount: number
  typeAssertionCount: number
  jsxMetrics: JsxMetrics
}

export type ScoreRank = "A" | "B" | "C" | "D" | "F"

export interface FileScore {
  score: number
  rank: ScoreRank
  penalties: string[]
}

export interface FolderScore {
  score: number
  rank: ScoreRank
  penalties: string[]
}

export interface DirectoryScanResult {
  folderPath: string
  fileCount: number
  totalSloc: number
  files: FileMetrics[]
  subFolders: DirectoryScanResult[]
}

export interface AnalyzedFile {
  metrics: FileMetrics
  evaluation: FileScore
  filename: string
  relativePath: string
}

export interface FullAnalysisReport {
  targetPath: string
  folderScore: FolderScore
  totalFiles: number
  totalSloc: number
  files: AnalyzedFile[]
  roastVerdict: string
}
