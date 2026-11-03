#!/usr/bin/env node
/**
 * Execute the complete M-3 v3 experiment from externally prepared profile files.
 *
 * Expected input layout:
 *   <input-dir>/<scenario-id>/replicate-001.json ... replicate-300.json
 *
 * Each JSON file must comply with public/research-v3/fragmentation-profile.schema.json
 * (schemaVersion 2). The runner writes one row per replication and policy.
 */
import assert from "node:assert/strict";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { webcrypto } from "node:crypto";
import ts from "typescript";

const ARCHIVE = new URL("../public/research-v3/ppo-checkpoints/", import.meta.url);
const ARCHIVE_PARTS = [
  "part00.txt", "part01a.txt", "part01b.txt", "part01c-a.txt", "part01c-b.txt",
  "part01c-c.txt", "part01d.txt", "part02.txt", "part03.txt", "part04.txt",
  "part05.txt", "part06a.txt", "part06b.txt", "part06c.txt", "part06d.txt",
  "part07a.txt", "part07b.txt", "part07c.txt", "part07d.txt",
];

function parseArgs(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw new Error("Argumento no reconocido: " + arg);
    const key = arg.slice(2);
    if (key === "help") { values.help = true; continue; }
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error("Falta un valor para --" + key);
    values[key] = value;
    i += 1;
  }
  if (values.help) return values;
  const experiment = Number(values.experiment);
  if (experiment !== 1 && experiment !== 2) throw new Error("Indica --experiment 1 o --experiment 2.");
  const replicates = values.replicates === undefined ? 300 : Number(values.replicates);
  if (!Number.isInteger(replicates) || replicates < 1 || replicates > 300) throw new Error("--replicates debe ser un entero entre 1 y 300.");
  if (!values["input-dir"] || !values.output) throw new Error("Debes indicar --input-dir y --output.");
  return {
    experiment,
    replicates,
    inputDir: resolve(values["input-dir"]),
    output: resolve(values.output),
    scenarioId: values.scenario,
  };
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}
function toCsv(rows) {
  const headers = [
    "experiment", "scenario_id", "replicate_id", "seed", "policy", "label",
    "tph", "wait_shovel_min", "wait_crusher_min", "esag_kwh_per_t",
    "cost_usd_per_t", "co2_kg_per_t", "fuel_l_per_t", "blend_p80_mm",
    "blend_rock_mass_index", "blend_diggability", "blend_powder_factor_kg_m3",
    "active_trucks", "cycles",
  ];
  return [headers.join(","), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(","))].join("\n") + "\n";
}
function transpile(source, label) {
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, verbatimModuleSyntax: true },
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, "No se pudo transpilar " + label + ": " + errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join("; "));
  return result.outputText;
}

async function main() {
  let args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; return; }
  if (args.help) {
    console.log(`Uso:
  npm run run:research-v3 -- --experiment 1 --input-dir ./research-input/exp1 --output ./results/exp1.csv
  npm run run:research-v3 -- --experiment 2 --input-dir ./research-input/exp2 --output ./results/exp2.csv

Opciones:
  --experiment 1|2       Experimento que se ejecutará (obligatorio).
  --input-dir RUTA       Carpeta con <scenario-id>/replicate-NNN.json (obligatorio).
  --output RUTA           CSV de resultados individuales (obligatorio).
  --scenario ID           Ejecuta solo un escenario del catálogo.
  --replicates N          Ejecuta réplicas 1..N (por defecto 300).
  --help                  Muestra esta ayuda.

Cada JSON debe usar schemaVersion 2 e incluir un perfil por pala, con P80, índice
geomecánico, excavabilidad y powderFactorKgM3 (q, kg/m³). El script valida todos
los archivos antes de ejecutar. No genera datos de perfil ni recalcula estadística.`);
    return;
  }

  const tempDir = await import("node:fs/promises").then(({ mkdtemp }) => mkdtemp(join(tmpdir(), "m3-research-batch-")));
  const engineDir = join(tempDir, "engine");
  const researchDir = join(engineDir, "research-v3");
  await mkdir(researchDir, { recursive: true });

  const modules = [
    ["../src/engine/researchScenarios.ts", join(engineDir, "researchScenarios.mjs"), []],
    ["../src/engine/research-v3/engineV3Profiled.ts", join(researchDir, "engineV3Profiled.mjs"), []],
    ["../src/engine/research-v3/ppoAgent.ts", join(researchDir, "ppoAgent.mjs"), []],
    ["../src/engine/research-v3/profileSchema.ts", join(researchDir, "profileSchema.mjs"), []],
    ["../src/engine/research-v3/runScenario.ts", join(researchDir, "runScenario.mjs"), [
      ['from "./engineV3Profiled"', 'from "./engineV3Profiled.mjs"'],
      ['from "./ppoAgent"', 'from "./ppoAgent.mjs"'],
      ['from "../researchScenarios"', 'from "../researchScenarios.mjs"'],
    ]],
  ];

  const previousFetch = globalThis.fetch;
  globalThis.crypto ??= webcrypto;
  globalThis.fetch = async (url, options) => {
    const requested = String(url);
    const part = requested.split("/").at(-1);
    if (requested.startsWith("/research-v3/ppo-checkpoints/") && ARCHIVE_PARTS.includes(part)) {
      try {
        const body = await readFile(new URL(part, ARCHIVE), "utf8");
        return new Response(body, { status: 200, headers: { "content-type": "text/plain" } });
      } catch {
        return new Response("not found", { status: 404 });
      }
    }
    return previousFetch(url, options);
  };

  try {
    for (const [sourcePath, targetPath, replacements] of modules) {
      let source = await readFile(new URL(sourcePath, import.meta.url), "utf8");
      for (const [before, after] of replacements) source = source.replaceAll(before, after);
      await writeFile(targetPath, transpile(source, sourcePath), "utf8");
    }
    const scenariosModule = await import(pathToFileURL(join(engineDir, "researchScenarios.mjs")).href);
    const profileModule = await import(pathToFileURL(join(researchDir, "profileSchema.mjs")).href);
    const engineModule = await import(pathToFileURL(join(researchDir, "runScenario.mjs")).href);

    let scenarios = scenariosModule.getResearchScenarios(args.experiment);
    if (args.scenarioId) scenarios = scenarios.filter((item) => item.id === args.scenarioId);
    if (scenarios.length === 0) throw new Error("El escenario indicado no existe en el experimento seleccionado.");
    const jobs = [];
    for (const scenario of scenarios) {
      for (let replicateId = 1; replicateId <= args.replicates; replicateId += 1) {
        const file = join(args.inputDir, scenario.id, "replicate-" + String(replicateId).padStart(3, "0") + ".json");
        try { await access(file); }
        catch { throw new Error("Falta el archivo de entrada requerido: " + file); }
        const parsed = JSON.parse(await readFile(file, "utf8"));
        const checked = profileModule.parseFragmentationProfileSet(parsed, scenario.id);
        if (checked.replicateId !== replicateId) {
          throw new Error(file + ": replicateId no coincide con el nombre del archivo.");
        }
        if (checked.profiles.length !== scenario.shovelCount) {
          throw new Error(file + ": se requieren " + scenario.shovelCount + " perfiles, uno por pala.");
        }
        jobs.push({ scenario, replicateId, profiles: profileModule.toEngineProfiles(checked, scenario.shovelCount) });
      }
    }

    console.log("Prevalidación correcta: " + jobs.length + " guardias; se ejecutarán " +
      jobs.reduce((sum, job) => sum + (job.scenario.experiment === 1 ? 8 : 10), 0) + " simulaciones de política.");
    const rows = [];
    let completed = 0;
    for (const job of jobs) {
      const seed = (job.scenario.experiment === 1 ? 20000 : 30000) + job.replicateId;
      const results = await engineModule.runResearchSingleReplication(job.scenario, job.replicateId, job.profiles);
      for (const result of results) {
        rows.push({
          experiment: job.scenario.experiment,
          scenario_id: job.scenario.id,
          replicate_id: job.replicateId,
          seed,
          policy: result.policy,
          label: result.label,
          tph: result.tph,
          wait_shovel_min: result.wShovel,
          wait_crusher_min: result.wCrusher,
          esag_kwh_per_t: result.esag,
          cost_usd_per_t: result.cost,
          co2_kg_per_t: result.co2,
          fuel_l_per_t: result.fuel,
          blend_p80_mm: result.blendP80,
          blend_rock_mass_index: result.blendA,
          blend_diggability: result.blendD,
          blend_powder_factor_kg_m3: result.blendPowderFactorKgM3,
          active_trucks: result.active,
          cycles: result.cycles,
        });
      }
      completed += 1;
      if (completed % 25 === 0 || completed === jobs.length) console.log("Guardias completas: " + completed + "/" + jobs.length);
    }

    await mkdir(dirname(args.output), { recursive: true });
    const temporaryOutput = args.output + ".partial";
    await writeFile(temporaryOutput, toCsv(rows), "utf8");
    const { rename } = await import("node:fs/promises");
    await rename(temporaryOutput, args.output);
    console.log("CSV individual creado: " + args.output + " (" + rows.length + " filas).");
  } finally {
    globalThis.fetch = previousFetch;
    await rm(tempDir, { recursive: true, force: true });
  }
}

await main();
