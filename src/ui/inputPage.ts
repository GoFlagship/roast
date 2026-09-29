import {
  ASCIIFontRenderable,
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core"
import { getDirectoryCompletions, computeNextCompletion } from "../autocomplete/autocomplete.js"

export class InputPage {
  public readonly view: BoxRenderable
  public readonly folderInput: InputRenderable
  private readonly inputContainer: BoxRenderable
  private readonly suggestionsText: TextRenderable
  private readonly statusText: TextRenderable
  private lastMatches: string[] = []
  private lastMatchIndex = -1

  constructor(
    private readonly renderer: CliRenderer,
    private readonly onStartRoast: (targetPath: string) => void,
    defaultPath = ".",
  ) {
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

    const subtitle = new TextRenderable(renderer, {
      content: "Brutal Code Analyzer & Roaster",
      fg: "#FFA116",
    })
    this.view.add(subtitle)

    const inputWidth = Math.min(72, Math.max(46, (renderer.width || 80) - 12))
    this.inputContainer = new BoxRenderable(renderer, {
      border: true,
      borderStyle: "single",
      borderColor: "#FF6B00",
      title: " Target Directory Path ",
      titleColor: "#FFA726",
      titleAlignment: "left",
      width: inputWidth,
      paddingX: 1,
      marginTop: 1,
      backgroundColor: "#161B22",
    })

    this.folderInput = new InputRenderable(renderer, {
      value: defaultPath,
      placeholder: "Enter directory path (e.g. . or ./src)...",
      placeholderColor: "#6E7681",
      textColor: "#FFFFFF",
      flexGrow: 1,
    })

    this.inputContainer.add(this.folderInput)
    this.view.add(this.inputContainer)

    this.suggestionsText = new TextRenderable(renderer, {
      content: "",
      fg: "#58A6FF",
    })
    this.view.add(this.suggestionsText)

    this.statusText = new TextRenderable(renderer, {
      content: "",
      fg: "#F85149",
    })
    this.view.add(this.statusText)

    const helperText = new TextRenderable(renderer, {
      content: "[TAB] Autocomplete   •   [ENTER] Start Roast   •   [ESC] Exit",
      fg: "#8B949E",
    })
    this.view.add(helperText)

    this.folderInput.on(InputRenderableEvents.INPUT, (val: string) => {
      this.statusText.content = ""
      this.updateSuggestions(val)
    })

    this.folderInput.on(InputRenderableEvents.ENTER, (val: string) => {
      this.onStartRoast(val)
    })

    this.updateSuggestions(this.folderInput.value)
  }

  public focus(): void {
    this.folderInput.focus()
  }

  public blur(): void {
    this.folderInput.blur()
  }

  public getValue(): string {
    return this.folderInput.value
  }

  public setStatus(msg: string): void {
    this.statusText.content = msg
  }

  public handleTab(): void {
    const completion = computeNextCompletion(
      this.folderInput.value,
      this.lastMatches,
      this.lastMatchIndex,
    )
    this.folderInput.value = completion.nextValue
    this.lastMatches = completion.matches
    this.lastMatchIndex = completion.nextIndex
    this.updateSuggestions(completion.nextValue)
  }

  public updateSuggestions(currentPath: string): void {
    const matches = getDirectoryCompletions(currentPath)
    this.lastMatches = matches
    if (matches.length === 0) {
      this.suggestionsText.content = ""
    } else if (matches.length === 1) {
      this.suggestionsText.content = `[TAB] to complete: ${matches[0]}`
    } else {
      const preview = matches.slice(0, 3).join("   ")
      const extra = matches.length > 3 ? ` (+${matches.length - 3} more)` : ""
      this.suggestionsText.content = `[TAB] Suggestions: ${preview}${extra}`
    }
  }

  public resize(width: number): void {
    this.inputContainer.width = Math.min(72, Math.max(46, width - 12))
  }
}
