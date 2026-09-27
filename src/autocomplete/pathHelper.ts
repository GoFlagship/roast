const ROOT_INPUTS = new Set(["", ".", "./"])

export interface ParsedPath {
  prefix: string
  searchDir: string
  partial: string
}

export function parseInputPath(rawInput: string): ParsedPath {
  const input = rawInput.trim().replace(/\\/g, "/")

  if (ROOT_INPUTS.has(input)) {
    return {
      prefix: input === "." || input === "" ? "./" : input,
      searchDir: ".",
      partial: "",
    }
  }

  if (input.endsWith("/")) {
    return {
      prefix: input,
      searchDir: input,
      partial: "",
    }
  }

  const lastSlash = input.lastIndexOf("/")
  if (lastSlash >= 0) {
    const prefix = input.slice(0, lastSlash + 1)
    return {
      prefix,
      searchDir: prefix,
      partial: input.slice(lastSlash + 1).toLowerCase(),
    }
  }

  return {
    prefix: "",
    searchDir: ".",
    partial: input.toLowerCase(),
  }
}
