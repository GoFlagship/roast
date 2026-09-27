import type { ScoreRank } from "../types/index.js"

const VERDICTS: Record<ScoreRank, string> = {
  A: "Clean, modular, and rock-solid code. Hard to find anything to roast.",
  B: "Passable code with noticeable flaws. A refactoring pass wouldn't hurt.",
  C: "Rapidly escalating complexity. You are accumulating technical debt at dangerous speeds.",
  D: "Maze-like nesting and 'any' types everywhere. Debugging this codebase will be pure torture.",
  F: "TOTAL DISASTER! Incomprehensible code violating every best practice. Burn it and rewrite from scratch!",
}

export function toScoreRank(score: number): ScoreRank {
  if (score >= 90) return "A"
  if (score >= 75) return "B"
  if (score >= 60) return "C"
  if (score >= 45) return "D"
  return "F"
}

export function getRoastVerdict(
  _score: number,
  rank: ScoreRank,
): { verdict: string } {
  return {
    verdict: VERDICTS[rank] ?? VERDICTS.F,
  }
}
