/**
 * Copies `white-web-sdk`'s self-contained browser bundle into `public/vendor/`.
 *
 * The whiteboard SDK cannot be imported through the bundler. It still calls
 * `ReactDOM.render`, which React 18 deprecated and **React 19 removed** — and
 * Next.js deliberately aliases `react` / `react-dom` to the application's one
 * copy for every module in the graph, so the `react@16` npm installs beside
 * the SDK never reaches it. The symptom is `(0, wl.render) is not a function`
 * thrown from `new WhiteWebSdk(...)`.
 *
 * The package also ships `index.iife.js`, which has React 16 compiled into it
 * and imports nothing at runtime. Loaded from a <script> tag it gets its own
 * React, untouched by the bundler's alias, and the application keeps React 19
 * — the two never meet, because the whiteboard renders into a plain DOM node
 * we hand it (`room.bindHtmlElement`) rather than into our React tree.
 *
 * It is copied rather than committed so that `package.json` stays the single
 * source of truth for the version: bumping the dependency re-copies on the
 * next install, where a checked-in 2.8 MB blob would silently keep serving
 * whatever was vendored the day it was added. `public/vendor/` is gitignored
 * for the same reason.
 */

import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "../node_modules/white-web-sdk/src/index.iife.js");
const destination = resolve(here, "../public/vendor/white-web-sdk.iife.js");

async function sizeOf(path) {
  try {
    return (await stat(path)).size;
  } catch {
    return null;
  }
}

const sourceSize = await sizeOf(source);
if (sourceSize === null) {
  // Not an error: `npm install --omit=optional`, a partial install, or a
  // lockfile checkout that hasn't been installed yet. The classroom reports
  // an unavailable whiteboard rather than the build failing over it.
  console.warn(
    "[whiteboard] white-web-sdk is not installed — skipping the vendor copy. " +
      "The classroom whiteboard will report that it cannot load.",
  );
  process.exit(0);
}

if ((await sizeOf(destination)) === sourceSize) {
  process.exit(0);
}

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
console.log(`[whiteboard] vendored white-web-sdk (${Math.round(sourceSize / 1024)} KB)`);
