const memoryStore: Record<string, string> = {};

export function saveStorageItem(key: string, value: string): void {
  memoryStore[key] = value;
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage quota or restricted context errors
  }
}

export function loadStorageItem(key: string): string | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      const val = globalThis.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // Fallback to memory store
  }
  return memoryStore[key] ?? null;
}

export function removeStorageItem(key: string): void {
  delete memoryStore[key];
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}

