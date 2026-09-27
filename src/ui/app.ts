import { BoxRenderable, createCliRenderer, type CliRenderer, type KeyEvent } from "@opentui/core"
import fs from "node:fs"
import path from "node:path"
import { InputPage } from "./inputPage.js"
import { createReportView } from "./reportPage.js"
import { runFullAnalysis } from "../scanner/scanner.js"
import type { FullAnalysisReport } from "../types/index.js"

type AppState = "INPUT" | "REPORT"

const TOGGLE_KEYS = new Set(["return", "space", "right", "left"])
const EXIT_KEYS = new Set(["escape", "q"])
const ENTER_KEYS = new Set(["return", "enter"])

export class RoastApp {
  private renderer!: CliRenderer
  private inputPage!: InputPage
  private currentState: AppState = "INPUT"
  private currentReport: FullAnalysisReport | null = null
  private currentFileIndex = 0
  private expandedFiles = new Set<number>([0])
  private reportView: BoxRenderable | null = null

  public async start(initialPath?: string): Promise<void> {
    this.renderer = await createCliRenderer({
      exitOnCtrlC: true,
      backgroundColor: "#0D1117",
    })

    this.renderer.root.alignItems = "center"
    this.renderer.root.justifyContent = "center"
    this.renderer.root.flexDirection = "column"

    this.renderer.addPostProcessFn(() => {
      if (this.currentState === "REPORT") {
        this.renderer.setCursorPosition(0, 0, false)
      }
    })

    const defaultPath = initialPath?.trim() || "."
    this.inputPage = new InputPage(
      this.renderer,
      (targetPath) => {
        this.triggerAnalysis(targetPath)
      },
      defaultPath,
    )

    this.renderer.keyInput.on("keypress", (key) => this.handleKey(key))
    this.renderer.on("resize", (width) => this.handleResize(width))

    this.renderer.root.add(this.inputPage.view)
    this.inputPage.focus()

    if (initialPath) {
      this.triggerAnalysis(initialPath)
    }
  }

  private triggerAnalysis(customPath?: string): void {
    const target = (customPath ?? this.inputPage.getValue()).trim() || "."
    const resolved = path.resolve(target)

    if (!fs.existsSync(resolved)) {
      this.inputPage.setStatus(`Error: Directory "${target}" not found!`)
      return
    }

    this.inputPage.blur()
    this.renderer.setCursorPosition(0, 0, false)
    this.inputPage.setStatus("Roasting in progress...")

    try {
      const report = runFullAnalysis(target)
      this.showReportScreen(report)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      this.inputPage.setStatus(`Error during analysis: ${msg}`)
      this.inputPage.focus()
    }
  }

  private refreshReportView(): void {
    if (!this.currentReport) return
    if (this.reportView) {
      this.renderer.root.remove(this.reportView)
    }
    this.reportView = createReportView(
      this.renderer,
      this.currentReport,
      this.currentFileIndex,
      this.expandedFiles,
    )
    this.renderer.root.add(this.reportView)
    this.renderer.setCursorPosition(0, 0, false)
  }

  private showReportScreen(report: FullAnalysisReport): void {
    this.currentReport = report
    this.currentFileIndex = 0
    this.expandedFiles.clear()
    if (report.files.length > 0) {
      this.expandedFiles.add(0)
    }

    this.inputPage.blur()
    this.renderer.setCursorPosition(0, 0, false)
    this.renderer.root.alignItems = "center"
    this.renderer.root.justifyContent = "center"

    this.renderer.root.remove(this.inputPage.view)
    if (this.reportView) {
      this.renderer.root.remove(this.reportView)
    }
    this.reportView = createReportView(
      this.renderer,
      report,
      this.currentFileIndex,
      this.expandedFiles,
    )
    this.renderer.root.add(this.reportView)
    this.currentState = "REPORT"
    this.renderer.setCursorPosition(0, 0, false)
  }

  private showInputScreen(): void {
    if (this.reportView) {
      this.renderer.root.remove(this.reportView)
      this.reportView = null
    }
    this.currentReport = null
    this.renderer.root.alignItems = "center"
    this.renderer.root.justifyContent = "center"
    this.renderer.root.add(this.inputPage.view)
    this.currentState = "INPUT"
    this.inputPage.focus()
    this.inputPage.updateSuggestions(this.inputPage.getValue())
  }

  private handleKey(key: KeyEvent): void {
    if (this.currentState === "INPUT") {
      this.handleInputKey(key)
    } else if (this.currentState === "REPORT") {
      this.handleReportKey(key)
    }
  }

  private handleInputKey(key: KeyEvent): void {
    if (key.name === "escape") {
      this.renderer.destroy()
      return
    }

    if (ENTER_KEYS.has(key.name)) {
      this.triggerAnalysis()
      return
    }

    if (key.name === "tab") {
      key.preventDefault()
      this.inputPage.handleTab()
    }
  }

  private handleReportKey(key: KeyEvent): void {
    if (EXIT_KEYS.has(key.name)) {
      this.renderer.destroy()
      return
    }

    if (key.name === "n") {
      key.preventDefault()
      this.showInputScreen()
      return
    }

    if (!this.currentReport || this.currentReport.files.length === 0) return

    if (this.handleReportNav(key)) {
      this.refreshReportView()
      return
    }

    if (this.handleReportToggle(key)) {
      this.refreshReportView()
    }
  }

  private handleReportNav(key: KeyEvent): boolean {
    if (!this.currentReport) return false
    if (key.name === "up") {
      key.preventDefault()
      this.currentFileIndex = Math.max(0, this.currentFileIndex - 1)
      return true
    }
    if (key.name === "down") {
      key.preventDefault()
      this.currentFileIndex = Math.min(this.currentReport.files.length - 1, this.currentFileIndex + 1)
      return true
    }
    return false
  }

  private handleReportToggle(key: KeyEvent): boolean {
    if (TOGGLE_KEYS.has(key.name)) {
      key.preventDefault()
      this.toggleSelectedFile()
      return true
    }
    if (key.name === "a") {
      key.preventDefault()
      this.toggleAllFiles()
      return true
    }
    return false
  }

  private toggleSelectedFile(): void {
    if (this.expandedFiles.has(this.currentFileIndex)) {
      this.expandedFiles.delete(this.currentFileIndex)
    } else {
      this.expandedFiles.add(this.currentFileIndex)
    }
  }

  private toggleAllFiles(): void {
    if (!this.currentReport) return
    if (this.expandedFiles.size === this.currentReport.files.length) {
      this.expandedFiles.clear()
    } else {
      for (let i = 0; i < this.currentReport.files.length; i++) {
        this.expandedFiles.add(i)
      }
    }
  }

  private handleResize(width: number): void {
    this.inputPage.resize(width)
    if (this.reportView && this.currentReport) {
      this.refreshReportView()
    }
  }
}
