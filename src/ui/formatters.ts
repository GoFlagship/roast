import type { ScoreRank } from "../types/index.js"

export interface CategoryInfo {
  label: string
  color: string
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "#34D399"
  if (score >= 80) return "#38BDF8"
  if (score >= 70) return "#FBBF24"
  if (score >= 50) return "#FB923C"
  return "#F87171"
}

export function getRankColor(rank: ScoreRank | string): string {
  switch (rank) {
    case "A":
      return "#34D399"
    case "B":
      return "#38BDF8"
    case "C":
      return "#FBBF24"
    case "D":
      return "#FB923C"
    case "F":
    default:
      return "#F87171"
  }
}

export function getComplexityCategory(cognitive: number): CategoryInfo {
  if (cognitive <= 5) return { label: "Low", color: "#34D399" }
  if (cognitive <= 10) return { label: "Moderate", color: "#38BDF8" }
  if (cognitive <= 20) return { label: "High", color: "#FB923C" }
  return { label: "Extreme", color: "#F87171" }
}

export function getNestingCategory(depth: number): CategoryInfo {
  if (depth <= 2) return { label: "Shallow", color: "#34D399" }
  if (depth === 3) return { label: "Normal", color: "#38BDF8" }
  if (depth === 4) return { label: "Deep", color: "#FB923C" }
  return { label: "Severe", color: "#F87171" }
}

export function getTypeSafetyCategory(anyCount: number, assertions: number): CategoryInfo {
  const sum = anyCount + assertions
  if (sum === 0) return { label: "Strict", color: "#34D399" }
  if (sum <= 3) return { label: "Moderate", color: "#FBBF24" }
  return { label: "Danger", color: "#F87171" }
}

export function getJsxDepthCategory(depth: number): CategoryInfo {
  if (depth <= 4) return { label: "Shallow", color: "#34D399" }
  if (depth <= 6) return { label: "Moderate", color: "#FBBF24" }
  return { label: "JSX Hell", color: "#F87171" }
}

export function getComponentSizeCategory(lines: number): CategoryInfo {
  if (lines <= 80) return { label: "Compact", color: "#34D399" }
  if (lines <= 150) return { label: "Moderate", color: "#38BDF8" }
  if (lines <= 200) return { label: "Bloated", color: "#FB923C" }
  return { label: "Monolithic", color: "#F87171" }
}

export function renderGauge(value: number, max: number, barLength = 14): string {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0))
  const filled = Math.round(ratio * barLength)
  const empty = Math.max(0, barLength - filled)
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`
}
