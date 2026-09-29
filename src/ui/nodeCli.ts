import readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import path from "node:path"
import fs from "node:fs"
import { runFullAnalysisAsync } from "../scanner/scanner.js"
import { printCliReport } from "./cliPrinter.js"
import { Spinner } from "./spinner.js"

export async function runNodeCli(args: string[] = []): Promise<void> {
  const isTTY = Boolean(process.stdin && process.stdin.isTTY)
  let targetPath = args.find((arg) => !arg.startsWith("-"))

  if (!targetPath) {
    if (isTTY) {
      console.log(`
  \x1B[38;2;255;59;48m██████╗  ██████╗  █████╗ ███████╗████████╗\x1B[0m
  \x1B[38;2;255;110;0m██╔══██╗██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝\x1B[0m
  \x1B[38;2;255;149;0m██████╔╝██║   ██║███████║███████╗   ██║   \x1B[0m
  \x1B[38;2;255;180;0m██╔══██╗██║   ██║██╔══██║╚════██║   ██║   \x1B[0m
  \x1B[38;2;255;210;0m██║  ██║╚██████╔╝██║  ██║███████║   ██║   \x1B[0m
  \x1B[38;2;255;230;0m╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝   \x1B[0m
      \x1B[38;2;255;161;22mBrutal Code Analyzer & Roaster\x1B[0m
`)
      const rl = readline.createInterface({ input, output })
      try {
        const answer = await rl.question("  Enter directory to roast [default: .]: ")
        targetPath = answer.trim() || "."
      } finally {
        rl.close()
      }
    } else {
      targetPath = "."
    }
  }

  const resolved = path.resolve(targetPath)
  if (!fs.existsSync(resolved)) {
    console.error(`\x1B[31mError: Directory "${targetPath}" not found!\x1B[0m`)
    process.exit(1)
  }

  const spinner = new Spinner(`Roasting codebase in "${targetPath}"...`)
  spinner.start()

  try {
    const report = await runFullAnalysisAsync(targetPath, (progress) => {
      spinner.setText(`Roasting codebase... [${progress.scannedCount} files] ${progress.currentFile}`)
    })

    spinner.succeed(`Roast complete! Analyzed ${report.totalFiles} files (${report.totalSloc} SLOC).`)
    printCliReport(report)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    spinner.fail(`Error during roast: ${msg}`)
    process.exit(1)
  }
}
