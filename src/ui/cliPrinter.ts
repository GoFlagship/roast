import path from "node:path"
import type { FullAnalysisReport } from "../types/index.js"
import {
  getComplexityCategory,
  getNestingCategory,
  getTypeSafetyCategory,
  renderGauge,
} from "./formatters.js"

export function printCliReport(report: FullAnalysisReport): void {
  const relTarget = path.relative(process.cwd(), report.targetPath) || "."
  const separator = "═".repeat(64)
  const lineSeparator = "─".repeat(64)

  console.log(`\n${separator}`)
  console.log(`  ROAST REPORT: ${relTarget}`)
  console.log(separator)
  console.log(`  Overall Score: ${report.folderScore.score}/100 [Rank ${report.folderScore.rank}]`)
  console.log(`  Files Analyzed: ${report.totalFiles} (${report.totalSloc} SLOC)`)

  if (report.folderScore.penalties.length > 0) {
    console.log(`  Warnings:      ${report.folderScore.penalties.join(", ")}`)
  }

  console.log(`\n  THE VERDICT:`)
  console.log(`  "${report.roastVerdict}"`)
  console.log(`\n${lineSeparator}`)
  console.log(`  FILE BREAKDOWN (${report.files.length})`)
  console.log(lineSeparator)

  for (const file of report.files) {
    const comp = getComplexityCategory(file.metrics.cognitiveComplexity)
    const nest = getNestingCategory(file.metrics.maxNestingDepth)
    const typeCat = getTypeSafetyCategory(file.metrics.anyCount, file.metrics.typeAssertionCount)
    const healthGauge = renderGauge(file.evaluation.score, 100, 10)

    console.log(`\n  * ${file.relativePath}`)
    console.log(`    Score:      ${healthGauge} ${file.evaluation.score}/100 [Rank ${file.evaluation.rank}]`)
    console.log(`    SLOC:       ${file.metrics.sloc} lines | Functions: ${file.metrics.functionsCount}`)
    console.log(`    Complexity: ${file.metrics.cognitiveComplexity} (${comp.label}) | Nesting: Level ${file.metrics.maxNestingDepth} (${nest.label})`)
    console.log(`    Type Safety:${typeCat.label} (${file.metrics.anyCount} any, ${file.metrics.typeAssertionCount} assertions)`)

    if (file.metrics.jsxMetrics.isJsxOrTsx) {
      console.log(`    JSX Depth:  Level ${file.metrics.jsxMetrics.maxJsxDepth} | Component Max Lines: ${file.metrics.jsxMetrics.maxComponentLines}`)
    }

    if (file.evaluation.penalties.length > 0) {
      console.log(`    Deductions:`)
      for (const p of file.evaluation.penalties) {
        console.log(`      - ${p}`)
      }
    } else {
      console.log(`    Deductions: None (Clean Code)`)
    }
  }

  console.log(`\n${separator}`)
  console.log(`  Tip: Run with Bun (bunx @goflagship/roast) to launch the interactive TUI.`)
  console.log(`${separator}\n`)
}
