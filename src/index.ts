#!/usr/bin/env node
import { RoastApp } from "./ui/app.js"

const args = process.argv.slice(2)

if (args.includes("-h") || args.includes("--help")) {
  console.log(`
  ROAST - Brutal Code Analyzer & Roaster

  Usage:
    roast [directory]
    npx @goflagship/roast [directory]

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
  console.log("1.0.0")
  process.exit(0)
}

const targetPath = args.find((arg) => !arg.startsWith("-"))
const app = new RoastApp()
await app.start(targetPath)