// test-fixtures/bad-ai-code/messy.ts
export function processUserData(data: any, options?: any) {
  let result: any = null;

  if (data) {
    if (data.user) {
      if (data.user.role === 'admin' || data.user.role === 'superuser') {
        for (let i = 0; i < data.items.length; i++) {
          if (data.items[i].active) {
            result = options?.strict ? data.items[i].value! : (data.items[i].fallback ? 1 : 0);
          } else {
            result = null;
          }
        }
      } else {
        result = false;
      }
    }
  }

  return (result as unknown as string);
}