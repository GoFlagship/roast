import {
  ASCIIFontRenderable,
  BoxRenderable,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core"

export class LoadingPage {
  public readonly view: BoxRenderable
  private readonly spinnerText: TextRenderable
  private readonly statusText: TextRenderable
  private readonly fileText: TextRenderable
  private timer: ReturnType<typeof setInterval> | null = null
  private frameIndex = 0
  private readonly frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

  constructor(private readonly renderer: CliRenderer) {
    this.view = new BoxRenderable(renderer, {
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 1,
    })

    const title = new ASCIIFontRenderable(renderer, {
      text: "ROAST",
      font: "block",
      color: ["#FF3B30", "#FF9500"],
    })
    this.view.add(title)

    const boxWidth = Math.min(68, Math.max(46, (renderer.width || 80) - 14))
    const box = new BoxRenderable(renderer, {
      border: true,
      borderStyle: "single",
      borderColor: "#FF6B00",
      title: " Roasting in Progress ",
      titleColor: "#FFA726",
      titleAlignment: "center",
      width: boxWidth,
      paddingX: 2,
      paddingY: 1,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 1,
      backgroundColor: "#161B22",
    })

    this.spinnerText = new TextRenderable(renderer, {
      content: "🔥 Starting roast analysis...",
      fg: "#FF9500",
    })
    box.add(this.spinnerText)

    this.statusText = new TextRenderable(renderer, {
      content: "Analyzing cognitive complexity, nesting & type safety...",
      fg: "#8B949E",
    })
    box.add(this.statusText)

    this.fileText = new TextRenderable(renderer, {
      content: "",
      fg: "#58A6FF",
    })
    box.add(this.fileText)

    this.view.add(box)
  }

  public startAnimation(targetPath: string): void {
    this.stopAnimation()
    this.fileText.content = `Target: ${targetPath}`
    this.timer = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length
      const frame = this.frames[this.frameIndex]
      this.spinnerText.content = `${frame} Roasting codebase in progress...`
    }, 80)
  }

  public updateProgress(currentFile: string, count: number): void {
    const frame = this.frames[this.frameIndex]
    this.spinnerText.content = `${frame} Roasting codebase in progress... (${count} files)`
    this.fileText.content = `Analyzing: ${currentFile}`
  }

  public stopAnimation(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
