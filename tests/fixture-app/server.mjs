// Zero-dependency static server for the deterministic fixture app.
// Routes map clean paths (docs/07) to files under ./site.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const siteDir = join(here, "site");
const PORT = Number(process.env.PORT ?? 5173);

const routes = {
  "/": "index.html",
  "/dashboard": "dashboard.html",
  "/settings/billing": "settings-billing.html",
  "/settings/profile": "settings-profile.html",
  "/responsive": "responsive.html",
};

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const file = routes[url.pathname] ?? url.pathname.replace(/^\//, "");
  try {
    const body = await readFile(join(siteDir, file));
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(PORT, () => console.log(`fixture-app on http://localhost:${PORT}`));
