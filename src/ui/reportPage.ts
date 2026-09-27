import {
  ASCIIFontRenderable,
  BoxRenderable,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core"
import path from "node:path"
import {
  getScoreColor,
  getRankColor,
  renderGauge,
  getComplexityCategory,
  getNestingCategory,
  getTypeSafetyCategory,
  getJsxDepthCategory,
  getComponentSizeCategory,
} from "./formatters.js"
import type { FullAnalysisReport } from "../types/index.js"

export function createReportView(
  renderer: CliRenderer,
  report: FullAnalysisReport,
  currentFileIndex: number,
  expandedFiles: Set<number>,
): BoxRenderable {
  const terminalWidth = renderer.width || 80
  const containerWidth = Math.min(88, Math.max(54, terminalWidth - 6))
  const innerContentWidth = containerWidth - 4

  const container = new BoxRenderable(renderer, {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 1,
    width: containerWidth,
  })

  const roastedTitle = new ASCIIFontRenderable(renderer, {
    text: "ROASTED",
    font: "block",
    color: ["#FF3B30", "#FF9500"],
  })
  container.add(roastedTitle)

  const relTarget = path.relative(process.cwd(), report.targetPath) || "."
  const rankColor = getRankColor(report.folderScore.rank)

  const headerBox = new BoxRenderable(renderer, {
    border: true,
    borderStyle: "single",
    borderColor: rankColor,
    title: ` ROAST REPORT: ${relTarget} `,
    titleColor: "#FFA726",
    titleAlignment: "center",
    width: "100%",
    paddingX: 1,
    paddingY: 0,
    backgroundColor: "#161B22",
  })

  const scoreSummary = new TextRenderable(renderer, {
    content:
      `OVERALL SCORE: ${report.folderScore.score}/100 [Rank ${report.folderScore.rank}] ` +
      `(${report.totalFiles} files analyzed, ${report.totalSloc} total SLOC)`,
    fg: rankColor,
  })
  headerBox.add(scoreSummary)

  if (report.folderScore.penalties.length > 0) {
    const warningsText = new TextRenderable(renderer, {
      content: `Warnings: ${report.folderScore.penalties.join(", ")}`,
      fg: "#FBBF24",
    })
    headerBox.add(warningsText)
  }

  container.add(headerBox)

  const verdictBox = new BoxRenderable(renderer, {
    border: true,
    borderStyle: "single",
    borderColor: "#FF4500",
    title: " THE VERDICT ",
    titleColor: "#FF6B00",
    titleAlignment: "left",
    width: "100%",
    paddingX: 1,
    paddingY: 0,
    backgroundColor: "#1A1520",
  })

  const verdictText = new TextRenderable(renderer, {
    content: `"${report.roastVerdict}"`,
    fg: "#FFA116",
  })
  verdictBox.add(verdictText)
  container.add(verdictBox)

  const filesBox = new BoxRenderable(renderer, {
    border: true,
    borderStyle: "single",
    borderColor: "#30363D",
    title: ` File Breakdown (${report.files.length}) `,
    titleColor: "#C9D1D9",
    titleAlignment: "left",
    width: "100%",
    paddingX: 1,
    paddingY: 0,
    backgroundColor: "#161B22",
  })

  const controlsHint = new TextRenderable(renderer, {
    content: "Use [UP/DOWN] to select, [ENTER/SPACE] to toggle dropdown, [A] to toggle all",
    fg: "#8B949E",
  })
  filesBox.add(controlsHint)

  const divider = new TextRenderable(renderer, {
    content: "─".repeat(innerContentWidth),
    fg: "#30363D",
  })
  filesBox.add(divider)

  for (let i = 0; i < report.files.length; i++) {
    const file = report.files[i]
    const isSelected = i === currentFileIndex
    const isExpanded = expandedFiles.has(i)
    const fColor = getScoreColor(file.evaluation.score)

    const pointer = isSelected ? ">" : " "
    const arrow = isExpanded ? "[-]" : "[+]"
    const prefix = `${pointer} ${arrow} ${file.filename}`
    const scoreStr = `Score: ${file.evaluation.score}/100`
    const paddingCount = Math.max(2, innerContentWidth - prefix.length - scoreStr.length)
    const headerLine = `${prefix}${" ".repeat(paddingCount)}${scoreStr}`

    const headerText = new TextRenderable(renderer, {
      content: headerLine,
      fg: isSelected ? "#FFFFFF" : fColor,
    })
    filesBox.add(headerText)

    if (isExpanded) {
      const detailColor = "#8B949E"
      const compCat = getComplexityCategory(file.metrics.cognitiveComplexity)
      const nestCat = getNestingCategory(file.metrics.maxNestingDepth)
      const typeCat = getTypeSafetyCategory(file.metrics.anyCount, file.metrics.typeAssertionCount)

      const healthGauge = renderGauge(file.evaluation.score, 100, 14)
      const compGauge = renderGauge(file.metrics.cognitiveComplexity, 25, 14)
      const nestGauge = renderGauge(file.metrics.maxNestingDepth, 6, 14)

      filesBox.add(new TextRenderable(renderer, {
        content: `    | Path: ${file.relativePath}`,
        fg: detailColor,
      }))

      filesBox.add(new TextRenderable(renderer, {
        content: `    | SLOC: ${file.metrics.sloc} lines  •  Functions: ${file.metrics.functionsCount}`,
        fg: detailColor,
      }))

      filesBox.add(new TextRenderable(renderer, {
        content: `    | Health:           ${healthGauge} ${file.evaluation.score}/100 (Rank ${file.evaluation.rank})`,
        fg: fColor,
      }))

      filesBox.add(new TextRenderable(renderer, {
        content: `    | Complexity:       ${compGauge} ${file.metrics.cognitiveComplexity} (${compCat.label} - Cyclomatic: ${file.metrics.cyclomaticComplexity})`,
        fg: compCat.color,
      }))

      filesBox.add(new TextRenderable(renderer, {
        content: `    | Nesting Level:    ${nestGauge} Depth ${file.metrics.maxNestingDepth} (${nestCat.label})`,
        fg: nestCat.color,
      }))

      filesBox.add(new TextRenderable(renderer, {
        content: `    | Type Safety:      ${typeCat.label} (${file.metrics.anyCount} any, ${file.metrics.typeAssertionCount} assertions)`,
        fg: typeCat.color,
      }))

      if (file.metrics.jsxMetrics.isJsxOrTsx) {
        const jsxCat = getJsxDepthCategory(file.metrics.jsxMetrics.maxJsxDepth)
        const compSizeCat = getComponentSizeCategory(file.metrics.jsxMetrics.maxComponentLines)
        const jsxGauge = renderGauge(file.metrics.jsxMetrics.maxJsxDepth, 8, 14)

        filesBox.add(new TextRenderable(renderer, {
          content: `    | JSX Nesting:      ${jsxGauge} Depth ${file.metrics.jsxMetrics.maxJsxDepth} (${jsxCat.label})`,
          fg: jsxCat.color,
        }))

        if (file.metrics.jsxMetrics.maxComponentLines > 0) {
          const compGauge = renderGauge(file.metrics.jsxMetrics.maxComponentLines, 200, 14)
          filesBox.add(new TextRenderable(renderer, {
            content: `    | Component Size:   ${compGauge} ${file.metrics.jsxMetrics.maxComponentLines} lines (${compSizeCat.label})`,
            fg: compSizeCat.color,
          }))
        }

        if (file.metrics.jsxMetrics.missingPropsInterfaceCount > 0 || file.metrics.jsxMetrics.giantInlineCallbacksCount > 0) {
          filesBox.add(new TextRenderable(renderer, {
            content: `    | React Quality:    ${file.metrics.jsxMetrics.missingPropsInterfaceCount} untyped/any props  •  ${file.metrics.jsxMetrics.giantInlineCallbacksCount} unmemorized inline callbacks`,
            fg: "#F85149",
          }))
        }
      }

      if (file.evaluation.penalties.length > 0) {
        filesBox.add(new TextRenderable(renderer, {
          content: "    | Deductions:",
          fg: "#F85149",
        }))

        for (const p of file.evaluation.penalties) {
          filesBox.add(new TextRenderable(renderer, {
            content: `    |   * ${p}`,
            fg: "#F85149",
          }))
        }
      } else {
        filesBox.add(new TextRenderable(renderer, {
          content: "    | Deductions: None (Clean Code)",
          fg: "#34D399",
        }))
      }

      filesBox.add(new TextRenderable(renderer, {
        content: " ",
        fg: "#30363D",
      }))
    }
  }

  container.add(filesBox)

  const actionBox = new BoxRenderable(renderer, {
    border: true,
    borderStyle: "single",
    borderColor: "#38BDF8",
    title: " Actions ",
    titleColor: "#38BDF8",
    titleAlignment: "center",
    width: "100%",
    paddingX: 1,
    paddingY: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D1E2D",
  })

  const actionText = new TextRenderable(renderer, {
    content: "Press [ N ] for NEW ROAST   •   [UP/DOWN] Select File   •   [ENTER/SPACE] Toggle Dropdown   •   [A] Toggle All   •   [ESC/Q] Exit",
    fg: "#E0F2FE",
  })
  actionBox.add(actionText)
  container.add(actionBox)

  return container
}
