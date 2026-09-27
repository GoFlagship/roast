# @goflagship/roast

> Brutal terminal code analyzer and codebase roaster powered by OpenTUI and TypeScript AST inspection.

Roast inspects your TypeScript, JavaScript, React, and JSX codebase, detects code smells, anti-patterns, and architectural bloat, and delivers an uncompromising health grade and roast verdict directly inside an interactive terminal UI or formatted CLI output.

---

## Features

- **Deep AST Analysis**: AST parsing powered by the TypeScript compiler API for accurate metrics.
- **Code Quality Metrics**:
  - Source Lines of Code (SLOC)
  - Cognitive Complexity & Cyclomatic Complexity
  - Maximum Block Nesting Depth
  - Type Safety Audit (detects `any` keywords and unsafe type assertions)
- **React & JSX Anti-Pattern Detection**:
  - **JSX Hell**: Flags deeply nested JSX element trees exceeding 6 levels.
  - **Monolithic Components**: Detects bloated components exceeding 150 lines.
  - **Untyped Props**: Identifies React components with missing interfaces or untyped props.
  - **Unmemorized Inline Callbacks**: Flags giant inline function expressions inside JSX attributes.
- **Interactive TUI & CLI Output**: Rich full-screen terminal interface with expandable file dropdowns, or instant formatted CLI reports for CI/CD pipelines.
- **Roast Verdict**: Brutally honest evaluations based on codebase health ranking.

---

## Installation & Quick Start

### Interactive Terminal UI (Recommended via Bun)

The interactive full-screen interface is powered by OpenTUI's native Zig core. Run directly using `bunx`:

```bash
bunx --bun @goflagship/roast
```

Or install globally with Bun:

```bash
bun add -g @goflagship/roast
roast
```

### Universal Mode (Node.js & npx)

Run directly using `npx` across any Node.js environment (Node 18, 20, 22, 24):

```bash
npx @goflagship/roast
```

Or install globally with npm:

```bash
npm install -g @goflagship/roast
roast
```

---

## Runtime Compatibility & Engines Note

### OpenTUI and Native FFI

The interactive terminal UI uses OpenTUI, which requires native Foreign Function Interface (FFI) bindings provided by the **Bun** runtime (`bun >= 1.3.0`).

- When executed with `bunx --bun @goflagship/roast` (or on a system where Bun is installed), Roast automatically launches the full interactive terminal application.
- When executed in a pure Node.js environment where Bun is not present (such as CI/CD runners or headless Linux servers), Roast automatically falls back to **Headless CLI Mode**. The entire AST analysis runs in pure Node.js and prints the formatted roast report with ASCII gauges and deductions directly to stdout.

### The npm `EBADENGINE` Warning

During `npm install -g @goflagship/roast`, npm may display an informational warning:

```text
npm warn EBADENGINE Unsupported engine {
  package: '@opentui/core@0.5.12',
  required: { bun: '>=1.3.0', node: '>=26.4.0' }
}
```

This warning originates from the upstream `@opentui/core` dependency package, which targets Node 26 for future native Node FFI support while running natively on Bun today. This warning is non-blocking and does not affect package installation or code analysis.

---

## Usage

### Interactive Mode

Launch the interactive prompt to select or type a directory:

```bash
roast
```

### Direct Target Analysis

Pass the target folder directly to analyze immediately:

```bash
roast ./src
```

Analyze the current directory:

```bash
roast .
```

### Command Options

```bash
roast --help       # Display help information
roast --version    # Display version number
```

---

## Keyboard Controls (Interactive TUI)

### Input Screen
| Key | Action |
|---|---|
| `[TAB]` | Autocomplete path or cycle through directory matches |
| `[ENTER]` | Start analysis |
| `[ESC]` | Exit application |

### Report Screen
| Key | Action |
|---|---|
| `[UP] / [DOWN]` | Select file in breakdown list |
| `[ENTER] / [SPACE]` | Toggle file details dropdown |
| `[A]` | Expand or collapse all file dropdowns |
| `[N]` | Start a new roast (return to input screen) |
| `[ESC] / [Q]` | Exit application |

---

## Scoring System

Projects and files start at a perfect **100** points. Penalties are deducted based on detected issues:

| Category | Deduction Trigger |
|---|---|
| File Length | Deductions applied when SLOC exceeds 200 lines |
| Cognitive Complexity | Deductions applied when cognitive complexity exceeds 10 |
| Block Nesting Depth | Deductions applied when nesting depth exceeds level 3 |
| Type Weakness | Penalties for `any` types and explicit type assertions |
| JSX Nesting | Penalties for JSX nesting depth exceeding 6 levels |
| Component Bloat | Penalties for React components exceeding 150 lines |
| Missing Props Interface | Penalties for components missing typed Props interfaces |
| Giant Inline Callbacks | Penalties for multi-line unmemorized callbacks in JSX attributes |
| Directory Congestion | Deductions when a single folder contains more than 12 source files |

### Rank Scale

- **Rank A** (90 - 100): Clean, modular, and rock-solid code. Hard to find anything to roast.
- **Rank B** (75 - 89): Passable code with noticeable flaws. A refactoring pass would help.
- **Rank C** (60 - 74): Rapidly escalating complexity and technical debt accumulation.
- **Rank D** (45 - 59): Maze-like nesting and weak typing throughout the codebase.
- **Rank F** (0 - 44): Total disaster. Severe anti-patterns across multiple files.

---

## Development

```bash
# Clone the repository
git clone https://github.com/GoFlagship/roast.git
cd roast

# Install dependencies
bun install

# Run in development mode
bun start

# Compile TypeScript
bun run build

# Run built distribution
bun dist/index.js
```

---

## License

Apache-2.0 © [flagship](https://github.com/GoFlagship)
