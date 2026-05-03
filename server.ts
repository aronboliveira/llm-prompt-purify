import { APP_BASE_HREF } from "@angular/common";
import { CommonEngine } from "@angular/ssr/node";
import express from "express";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import bootstrap from "./src/main.server";

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express(),
    serverDistFolder = dirname(fileURLToPath(import.meta.url)),
    browserDistFolder = resolve(serverDistFolder, "../browser"),
    indexHtml = join(serverDistFolder, "index.server.html"),
    commonEngine = new CommonEngine();

  server.set("view engine", "html");
  server.set("views", browserDistFolder);

  // Only static assets should bypass Angular SSR.
  server.get(
    "*.*",
    express.static(browserDistFolder, {
      maxAge: "1y",
      index: false,
    })
  );

  server.get("*", (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env["PORT"] || 4000,
    server = app();

  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
