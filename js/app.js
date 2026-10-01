import { CASES, CIVIL_REGISTRY, SHIFT } from "../data/cases.js";
import * as Audio from "./audio.js";
import { C0 } from "./chunk-0.js";
import { C1 } from "./chunk-1.js";
import { C2 } from "./chunk-2.js";
const b64 = C0+C1+C2;
async function gunzipB64(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return await new Response(stream).text();
}
const src = await gunzipB64(b64);
const mod = await import("data:text/javascript;charset=utf-8," + encodeURIComponent(src));
mod.install({ CASES, CIVIL_REGISTRY, SHIFT, Audio });
