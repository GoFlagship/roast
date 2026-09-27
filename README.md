# @goflagship/roast

> Brutal terminal code analyzer and codebase roaster powered by OpenTUI and TypeScript AST inspection.

Roast inspects your TypeScript, JavaScript, React, and JSX codebase, detects code smells, anti-patterns, and architectural bloat, and delivers an uncompromising health grade and roast verdict directly inside an interactive terminal UI.

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
- **File Breakdown & Gauges**: Expandable file-by-file dropdowns with ASCII progress bars, penalty itemization, and health scores.
- **Roast Verdict**: Brutally honest evaluations based on codebase health ranking.

---

## Installation

Run directly with `npx` (no installation required):

```bash
npx @goflagship/roast
```

Or install globally via npm:

```bash
npm install -g @goflagship/roast
```

---

## Usage

### Interactive Mode

Launch the interactive prompt to select or type a directory:

```bash
roast
```

### Direct Target Analysis

Pass the target folder directly to start analysis immediately:

```bash
roast ./src
```

Analyze the current directory:

```bash
roast .
```

### Options

```bash
roast --help       # Display help information
roast --version    # Display version number
```

---

## Keyboard Controls

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
node dist/index.js
```

---

## License

Apache-2.0 © [flagship](https://github.com/GoFlagship)
