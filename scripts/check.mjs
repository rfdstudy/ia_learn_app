/*
 * Vérification rapide du projet : syntaxe JavaScript, cohérence des données
 * et présence des fichiers référencés par index.html.
 * Usage : npm run check
 */
import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const errors = [];

async function listJavaScript(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listJavaScript(fullPath)));
    else if (/\.(js|mjs)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

async function main() {
  const jsFiles = [
    ...(await listJavaScript(resolve(root, "src"))),
    ...(await listJavaScript(resolve(root, "scripts"))),
    ...(await listJavaScript(resolve(root, "tests")))
  ];

  for (const file of jsFiles) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) {
      errors.push(`Syntaxe invalide : ${file}\n${result.stderr.trim()}`);
    }
  }

  const context = vm.createContext({ window: {}, console });
  for (const file of [
    "src/data/resources.js",
    "src/data/modules-core.js",
    "src/data/modules-optional.js"
  ]) {
    vm.runInContext(await readFile(resolve(root, file), "utf8"), context, { filename: file });
  }
  const data = context.window.IA_DATA;
  const modules = [...data.modules, ...data.optionalModules];
  const moduleIds = new Set(modules.map((module) => module.id));
  const resourceIds = new Set(data.resources.map((resource) => resource.id));

  if (data.modules.length !== 12) errors.push("Le parcours doit contenir 12 modules principaux.");
  if (data.optionalModules.length !== 3) errors.push("Le parcours doit contenir 3 modules optionnels.");
  if (moduleIds.size !== modules.length) errors.push("Des identifiants de module sont dupliqués.");
  if (resourceIds.size !== data.resources.length) errors.push("Des identifiants de ressource sont dupliqués.");

  for (const module of modules) {
    if (!module.quiz || module.quiz.length !== 3) {
      errors.push(`Le module ${module.id} doit contenir exactement 3 questions de quiz.`);
    }
    for (const id of module.resourceIds || []) {
      if (!resourceIds.has(id)) errors.push(`Le module ${module.id} référence la ressource inconnue « ${id} ».`);
    }
  }

  const index = await readFile(resolve(root, "index.html"), "utf8");
  const localReferences = [...index.matchAll(/(?:href|src)="((?:src|public)\/[^"]+)"/g)].map(
    (match) => match[1]
  );
  for (const reference of localReferences) {
    try {
      await readFile(resolve(root, reference));
    } catch {
      errors.push(`Fichier référencé introuvable : ${reference}`);
    }
  }

  if (errors.length) {
    console.error("Vérification échouée :\n");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(
    `Vérification réussie : ${data.modules.length} modules, ${data.optionalModules.length} options, ` +
      `${data.resources.length} ressources et ${jsFiles.length} fichiers JavaScript.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
