import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";

const mockDir = process.cwd() + "/src/__tests__/mocks";
const extensionDir = process.cwd() + "/chromium-extension/app";

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

const server = createServer((req, res) => {
  const url = req.url || "/";
  let filePath: string;

  if (url.startsWith("/extension/")) {
    filePath = join(extensionDir, url.replace("/extension/", ""));
  } else {
    filePath = join(mockDir, url === "/" ? "chatgpt.html" : url);
  }

  if (existsSync(filePath)) {
    const ext = extname(filePath);
    res.setHeader("Content-Type", mimeTypes[ext] || "text/plain");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end(readFileSync(filePath));
  } else {
    res.statusCode = 404;
    res.end(`Not found: ${filePath}`);
  }
});

const PORT = 3456;
server.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});
