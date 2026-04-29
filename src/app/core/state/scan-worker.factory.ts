// @ts-nocheck - Jest compiles specs as CommonJS; Angular still bundles import.meta workers.
export function createScanWorker(): Worker {
  return new Worker(new URL("./scan.worker", import.meta.url), {
    type: "module",
  });
}
