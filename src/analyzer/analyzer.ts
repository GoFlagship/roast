import ts from "typescript"
import fs from "node:fs"
import path from "node:path"
import { analyzeJsx } from "./jsxAnalyzer.js"
import type { FileMetrics } from "../types/index.js"

const BRANCHING_KINDS = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ConditionalExpression,
  ts.SyntaxKind.CaseClause,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.CatchClause,
])

const LOGICAL_OPERATORS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
])

const FUNCTION_KINDS = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.FunctionExpression,
])

const ASSERTION_KINDS = new Set([
  ts.SyntaxKind.AsExpression,
  ts.SyntaxKind.TypeAssertionExpression,
  ts.SyntaxKind.NonNullExpression,
])

function countSloc(content: string): number {
  return content.split("\n").filter((line) => {
    const trimmed = line.trim()
    return trimmed.length > 0 && !/^(\/\/|\/\*|\*)/.test(trimmed)
  }).length
}

function resolveScriptKind(ext: string): ts.ScriptKind {
  if (ext === ".tsx") return ts.ScriptKind.TSX
  if (ext === ".jsx") return ts.ScriptKind.JSX
  return ts.ScriptKind.Unknown
}

export function analyzeFile(filePath: string): FileMetrics {
  const content = fs.readFileSync(filePath, "utf-8")
  const ext = path.extname(filePath).toLowerCase()
  const isJsxOrTsx = /\.(jsx|tsx)$/.test(ext)
  const isTsx = ext === ".tsx"

  const scriptKind = resolveScriptKind(ext)
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, scriptKind)

  const sloc = countSloc(content)
  let cyclomaticComplexity = 1
  let cognitiveComplexity = 0
  let maxNestingDepth = 0
  let anyCount = 0
  let typeAssertionCount = 0
  let functionsCount = 0

  function inspectNode(node: ts.Node, currentNesting = 0): void {
    let nextNesting = currentNesting
    const kind = node.kind

    if (BRANCHING_KINDS.has(kind)) {
      cyclomaticComplexity++
      cognitiveComplexity += 1 + currentNesting
      nextNesting = currentNesting + 1
    }

    if (FUNCTION_KINDS.has(kind)) {
      functionsCount++
      nextNesting = 0
    }

    if (ASSERTION_KINDS.has(kind)) {
      typeAssertionCount++
    }

    if (kind === ts.SyntaxKind.AnyKeyword) {
      anyCount++
    }

    if (ts.isBinaryExpression(node) && LOGICAL_OPERATORS.has(node.operatorToken.kind)) {
      cyclomaticComplexity++
      cognitiveComplexity++
    }

    if (nextNesting > maxNestingDepth) {
      maxNestingDepth = nextNesting
    }

    ts.forEachChild(node, (child) => inspectNode(child, nextNesting))
  }

  inspectNode(sourceFile)

  const jsxMetrics = analyzeJsx(sourceFile, isJsxOrTsx, isTsx)

  return {
    filePath,
    sloc,
    functionsCount,
    cyclomaticComplexity,
    cognitiveComplexity,
    maxNestingDepth,
    anyCount,
    typeAssertionCount,
    jsxMetrics,
  }
}
