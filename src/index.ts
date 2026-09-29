#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { runNodeCli } from "./ui/nodeCli.js"

const args = process.argv.slice(2)

if (args.includes("-h") || args.includes("--help")) {
  console.log(`
  ROAST - Brutal Code Analyzer & Roaster

  Usage:
    roast [directory]
    roast [directory] --cli
    npx @goflagship/roast [directory]
    bunx @goflagship/roast [directory]

  Options:
    -h, --help      Display help
    -v, --version   Display version
    --cli, --no-tui Run in standard CLI mode without OpenTUI
    --tui           Run with interactive TUI (requires Bun)

  Examples:
    roast
    roast ./src
    roast .
`)
  process.exit(0)
}

if (args.includes("-v") || args.includes("--version")) {
  console.log("1.0.1")
  process.exit(0)
}

const forceCli = args.includes("--cli") || args.includes("--no-tui")
const forceTui = args.includes("--tui")
const isBun = typeof process.versions.bun === "string"

if (isBun && !forceCli) {
  try {
    const { RoastApp } = await import("./ui/app.js")
    const app = new RoastApp()
    const targetPath = args.find((arg) => !arg.startsWith("-"))
    await app.start(targetPath)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[Warning] OpenTUI unavailable (${msg}), falling back to CLI...`)
    await runNodeCli(args)
  }
} else if (forceTui) {
  let hasBun = false
  try {
    const check = spawnSync("bun", ["--version"], { stdio: "ignore" })
    hasBun = check.status === 0
  } catch {
    hasBun = false
  }

  if (hasBun) {
    const cleanArgs = args.filter((a) => a !== "--tui")
    const res = spawnSync("bun", [process.argv[1], ...cleanArgs], { stdio: "inherit" })
    process.exit(res.status ?? 0)
  } else {
    console.warn("[Warning] TUI mode requires Bun. Running in standard CLI mode instead.")
    await runNodeCli(args)
  }
} else {
  // Running natively on Node without OpenTUI
  await runNodeCli(args)
}