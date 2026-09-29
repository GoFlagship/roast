export class Spinner {
  private timer: NodeJS.Timeout | null = null
  private frameIndex = 0
  private readonly frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
  private currentText: string
  private readonly isTTY: boolean

  constructor(initialText = "Loading...") {
    this.currentText = initialText
    this.isTTY = Boolean(process.stdout && process.stdout.isTTY)
  }

  public start(text?: string): void {
    if (text) this.currentText = text

    if (!this.isTTY) {
      console.log(`[Roast] ${this.currentText}`)
      return
    }

    // Hide terminal cursor
    process.stdout.write("\x1B[?25l")
    this.render()

    this.timer = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length
      this.render()
    }, 80)
  }

  public setText(text: string): void {
    this.currentText = text
    if (this.isTTY && this.timer) {
      this.render()
    }
  }

  private render(): void {
    const frame = this.frames[this.frameIndex]
    process.stdout.write(`\r\x1B[K\x1B[38;2;255;149;0m${frame}\x1B[0m ${this.currentText}`)
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.isTTY) {
      // Clear line and restore terminal cursor
      process.stdout.write("\r\x1B[K\x1B[?25h")
    }
  }

  public succeed(text?: string): void {
    this.stop()
    const msg = text ?? this.currentText
    console.log(`\x1B[32m✔\x1B[0m ${msg}`)
  }

  public fail(text?: string): void {
    this.stop()
    const msg = text ?? this.currentText
    console.log(`\x1B[31m✖\x1B[0m ${msg}`)
  }
}
