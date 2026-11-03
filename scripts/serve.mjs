import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${host}`).pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = normalize(join(root, relative));
  if (filePath !== root && !filePath.startsWith(root + sep)) return null;
  return filePath;
}

async function findFile(filePath) {
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) {
      const indexPath = join(filePath, "index.html");
      const indexInfo = await stat(indexPath);
      return indexInfo.isFile() ? indexPath : null;
    }
    return info.isFile() ? filePath : null;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    response.end("Méthode non autorisée.");
    return;
  }

  let requested;
  try {
    requested = resolveRequestPath(request.url || "/");
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Adresse invalide.");
    return;
  }

  if (!requested) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Accès refusé.");
    return;
  }

  let filePath = await findFile(requested);
  if (!filePath && !extname(requested)) {
    filePath = await findFile(join(root, "index.html"));
  }

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Fichier introuvable.");
    return;
  }

  try {
    const body = await readFile(filePath);
    const type = MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": type,
      "Content-Length": body.byteLength,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    if (request.method === "HEAD") response.end();
    else response.end(body);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Erreur interne du serveur.");
  }
});

server.listen(port, host, () => {
  console.log(`Parcours IA disponible sur http://${host}:${port}`);
  console.log("Appuyez sur Ctrl+C pour arrêter le serveur.");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Le port ${port} est déjà utilisé. Lancez avec PORT=4174 npm run dev.`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
