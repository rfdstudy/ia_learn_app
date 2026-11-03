import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

export const DATA_FILES = [
  "src/data/resources.js",
  "src/data/modules-core.js",
  "src/data/modules-optional.js"
];

export const RUNTIME_FILES = [...DATA_FILES, "src/core.js", "src/store.js", "src/ui.js"];

export async function loadFiles(files) {
  const context = vm.createContext({ window: {}, console, Intl, Blob, URL });
  for (const file of files) {
    const code = await readFile(resolve(root, file), "utf8");
    vm.runInContext(code, context, { filename: file });
  }
  return context.window;
}

export function loadData() {
  return loadFiles(DATA_FILES);
}

export function loadRuntime() {
  return loadFiles(RUNTIME_FILES);
}
