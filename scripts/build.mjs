import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");

async function build() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  await Promise.all([
    cp(resolve(root, "src"), resolve(dist, "src"), { recursive: true }),
    cp(resolve(root, "public"), resolve(dist, "public"), { recursive: true }),
    cp(resolve(root, "index.html"), resolve(dist, "index.html")),
    cp(resolve(root, "README.md"), resolve(dist, "README.md")),
    cp(resolve(root, "LICENSE"), resolve(dist, "LICENSE"))
  ]);

  const index = await readFile(resolve(dist, "index.html"), "utf8");
  if (!index.includes("src/app.js")) {
    throw new Error("Le build ne contient pas le point d’entrée de l’application.");
  }

  await writeFile(resolve(dist, ".nojekyll"), "", "utf8");
  console.log(`Build statique prêt dans ${dist}`);
  console.log("Le dossier dist/ peut être publié tel quel sur un hébergement statique.");
}

build().catch((error) => {
  console.error("Échec du build :", error);
  process.exitCode = 1;
});
