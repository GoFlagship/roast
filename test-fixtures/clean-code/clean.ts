// test-fixtures/clean-code/clean.ts
interface UserItem {
  active: boolean;
  value: string;
}

interface ProcessInput {
  items: UserItem[];
  isAdmin: boolean;
}

export function extractActiveValues(input: ProcessInput): string[] {
  if (!input.isAdmin) {
    return [];
  }

  return input.items
    .filter((item) => item.active)
    .map((item) => item.value);
}