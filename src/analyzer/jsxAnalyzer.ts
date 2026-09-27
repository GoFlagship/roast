import ts from "typescript"
import type { JsxMetrics } from "../types/index.js"

const JSX_ELEMENT_KINDS = new Set([
  ts.SyntaxKind.JsxElement,
  ts.SyntaxKind.JsxSelfClosingElement,
  ts.SyntaxKind.JsxFragment,
])

const FUNCTION_RESET_KINDS = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.FunctionExpression,
])

const COMPLEX_STATEMENTS = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.SwitchStatement,
  ts.SyntaxKind.TryStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
])

function hasJsxChild(node: ts.Node): boolean {
  if (JSX_ELEMENT_KINDS.has(node.kind)) return true
  let found = false
  ts.forEachChild(node, (child) => {
    if (!found && hasJsxChild(child)) found = true
  })
  return found
}

function isReactComponent(name: string, node: ts.Node): boolean {
  if (/^[A-Z]/.test(name) && name.length > 0) return true
  return hasJsxChild(node)
}

function isMissingPropsInterface(
  fnNode: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  isTsx: boolean,
  parentDecl?: ts.VariableDeclaration,
): boolean {
  if (fnNode.parameters.length === 0) return false
  const firstParam = fnNode.parameters[0]

  if (firstParam.type) {
    return firstParam.type.kind === ts.SyntaxKind.AnyKeyword
  }

  if (!isTsx) return false

  if (parentDecl?.type && ts.isTypeReferenceNode(parentDecl.type)) {
    const args = parentDecl.type.typeArguments
    if (!args || args.length === 0) return true
    return args[0].kind === ts.SyntaxKind.AnyKeyword
  }

  return true
}

function isComplexCallback(
  expr: ts.ArrowFunction | ts.FunctionExpression,
  sourceFile: ts.SourceFile,
): boolean {
  const startLine = sourceFile.getLineAndCharacterOfPosition(expr.getStart(sourceFile)).line
  const endLine = sourceFile.getLineAndCharacterOfPosition(expr.getEnd()).line
  if (endLine - startLine + 1 >= 4) return true

  if (!ts.isBlock(expr.body)) return false
  if (expr.body.statements.length >= 3) return true

  return expr.body.statements.some((s) => COMPLEX_STATEMENTS.has(s.kind))
}

export function analyzeJsx(
  sourceFile: ts.SourceFile,
  isJsxOrTsx: boolean,
  isTsx: boolean,
): JsxMetrics {
  if (!isJsxOrTsx) {
    return {
      isJsxOrTsx: false,
      maxJsxDepth: 0,
      maxComponentLines: 0,
      hugeComponentsCount: 0,
      missingPropsInterfaceCount: 0,
      giantInlineCallbacksCount: 0,
    }
  }

  let maxJsxDepth = 0
  let maxComponentLines = 0
  let hugeComponentsCount = 0
  let missingPropsInterfaceCount = 0
  let giantInlineCallbacksCount = 0

  function recordComponent(
    node: ts.Node,
    fn: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
    name: string,
    parentDecl?: ts.VariableDeclaration,
  ): void {
    if (!isReactComponent(name, fn)) return
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line
    const lines = end - start + 1
    if (lines > maxComponentLines) maxComponentLines = lines
    if (lines > 150) hugeComponentsCount++
    if (isMissingPropsInterface(fn, isTsx, parentDecl)) missingPropsInterfaceCount++
  }

  function checkVariable(node: ts.VariableDeclaration): void {
    const init = node.initializer
    if (!init) return
    if (!ts.isArrowFunction(init) && !ts.isFunctionExpression(init)) return
    recordComponent(node, init, node.name.getText(sourceFile), node)
  }

  function checkAttribute(node: ts.JsxAttribute): void {
    if (!node.initializer || !ts.isJsxExpression(node.initializer) || !node.initializer.expression) return
    const expr = node.initializer.expression
    if (!ts.isArrowFunction(expr) && !ts.isFunctionExpression(expr)) return
    if (isComplexCallback(expr, sourceFile)) giantInlineCallbacksCount++
  }

  function walk(node: ts.Node, currentDepth = 0): void {
    let nextDepth = currentDepth

    if (JSX_ELEMENT_KINDS.has(node.kind)) {
      nextDepth = currentDepth + 1
      if (nextDepth > maxJsxDepth) maxJsxDepth = nextDepth
    }

    if (FUNCTION_RESET_KINDS.has(node.kind)) {
      nextDepth = 0
    }

    if (ts.isFunctionDeclaration(node)) {
      recordComponent(node, node, node.name?.text || "")
    }

    if (ts.isVariableDeclaration(node)) {
      checkVariable(node)
    }

    if (ts.isJsxAttribute(node)) {
      checkAttribute(node)
    }

    ts.forEachChild(node, (child) => walk(child, nextDepth))
  }

  walk(sourceFile, 0)

  return {
    isJsxOrTsx: true,
    maxJsxDepth,
    maxComponentLines,
    hugeComponentsCount,
    missingPropsInterfaceCount,
    giantInlineCallbacksCount,
  }
}
