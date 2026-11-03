import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./run-research-v3-batch.mjs", import.meta.url));
const help = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8" });
assert.equal(help.status, 0, "El ejecutor por lotes debe mostrar ayuda sin requerir entradas.");
assert.match(help.stdout, /--experiment 1\|2/);
assert.match(help.stdout, /schemaVersion 2/);
console.log("M-3 research batch CLI help check passed.");
