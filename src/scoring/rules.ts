import type { FileMetrics, JsxMetrics } from "../types/index.js"

export interface PenaltyResult {
  deduction: number
  penalties: string[]
}

export function computeGeneralPenalties(metrics: FileMetrics): PenaltyResult {
  let deduction = 0
  const penalties: string[] = []

  if (metrics.sloc > 200) {
    const pts = Math.min(25, Math.floor((metrics.sloc - 200) / 10))
    deduction += pts
    penalties.push(`Long file (${metrics.sloc} SLOC): -${pts}pt`)
  }

  if (metrics.cognitiveComplexity > 10) {
    const pts = Math.min(30, (metrics.cognitiveComplexity - 10) * 2)
    deduction += pts
    penalties.push(`High cognitive complexity (${metrics.cognitiveComplexity}): -${pts}pt`)
  }

  if (metrics.maxNestingDepth > 3) {
    const pts = Math.min(15, (metrics.maxNestingDepth - 3) * 5)
    deduction += pts
    penalties.push(`Excessive nesting (level ${metrics.maxNestingDepth}): -${pts}pt`)
  }

  const typeDeductions = metrics.anyCount * 5 + metrics.typeAssertionCount * 2
  if (typeDeductions > 0) {
    const pts = Math.min(30, typeDeductions)
    deduction += pts
    penalties.push(`Weak types (${metrics.anyCount} any, ${metrics.typeAssertionCount} cast): -${pts}pt`)
  }

  return { deduction, penalties }
}

export function computeJsxPenalties(jsx: JsxMetrics): PenaltyResult {
  let deduction = 0
  const penalties: string[] = []

  if (jsx.maxJsxDepth > 6) {
    const pts = Math.min(25, (jsx.maxJsxDepth - 6) * 6 + 5)
    deduction += pts
    penalties.push(`JSX Hell: deep nesting (${jsx.maxJsxDepth} levels, max 6): -${pts}pt`)
  }

  if (jsx.hugeComponentsCount > 0) {
    const excess = Math.max(0, Math.floor((jsx.maxComponentLines - 150) / 10))
    const pts = Math.min(30, jsx.hugeComponentsCount * 10 + excess)
    deduction += pts
    penalties.push(`Huge React component (${jsx.maxComponentLines} lines, max 150): -${pts}pt`)
  }

  if (jsx.missingPropsInterfaceCount > 0) {
    const pts = Math.min(20, jsx.missingPropsInterfaceCount * 8)
    deduction += pts
    penalties.push(`Missing Props interface (${jsx.missingPropsInterfaceCount} component(s) with any/untyped props): -${pts}pt`)
  }

  if (jsx.giantInlineCallbacksCount > 0) {
    const pts = Math.min(25, jsx.giantInlineCallbacksCount * 5)
    deduction += pts
    penalties.push(`Unmemorized inline callbacks (${jsx.giantInlineCallbacksCount} giant inline function(s) in JSX props): -${pts}pt`)
  }

  return { deduction, penalties }
}
