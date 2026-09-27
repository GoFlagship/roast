#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { printCliReport } from "./ui/cliPrinter.js"
import { runFullAnalysis } from "./scanner/scanner.js"

const args = process.argv.slice(2)

if (args.includes("-h") || args.includes("--help")) {
  console.log(`
  ROAST - Brutal Code Analyzer & Roaster

  Usage:
    roast [directory]
    npx @goflagship/roast [directory]
    bunx @goflagship/roast [directory]

  Options:
    -h, --help      Display help
    -v, --version   Display version

  Examples:
    roast
    roast ./src
    roast .
`)
  process.exit(0)
}

if (args.includes("-v") || args.includes("--version")) {
  console.log("0.1.0")
  process.exit(0)
}

const targetPath = args.find((arg) => !arg.startsWith("-")) || "."
const isBun = typeof process.versions.bun === "string"

if (isBun) {
  const { RoastApp } = await import("./ui/app.js")
  const app = new RoastApp()
  await app.start(targetPath === "." && !args.includes(".") ? undefined : targetPath)
} else {
  let hasBun = false
  try {
    const check = spawnSync("bun", ["--version"], { stdio: "ignore" })
    hasBun = check.status === 0
  } catch {
    hasBun = false
  }

  if (hasBun) {
    const res = spawnSync("bun", [process.argv[1], ...args], { stdio: "inherit" })
    process.exit(res.status ?? 0)
  }

  try {
    const report = runFullAnalysis(targetPath)
    printCliReport(report)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`Error: ${msg}`)
    process.exit(1)
  }
}