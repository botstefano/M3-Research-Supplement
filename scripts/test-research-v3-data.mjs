import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import ts from "typescript";

const root = new URL("../public/research-v3/", import.meta.url);
async function csv(name) {
  const text = await readFile(fileURLToPath(new URL(name, root)), "utf8");
  const lines = text.trim().split(/\r?\n/);
  assert.ok(lines.length >= 2, name + " debe contener encabezado y filas.");
  const headers = lines[0].split(",");
  const rows = lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((key, index) => [key, values[index] ?? ""]));
  });
  return { headers, rows };
}

const exp1 = await csv("experiment1_policy_summary.csv");
const exp2 = await csv("experiment2_contrasts_summary.csv");
const constancia = await csv("sag_estadisticas_descriptivas.csv");
const metrics = await csv("sag_metricas_modelo_vs_planta.csv");

const profileSchema = JSON.parse(await readFile(fileURLToPath(new URL("fragmentation-profile.schema.json", root)), "utf8"));
assert.ok(profileSchema.properties.profiles.items.required.includes("shovelIndex"));
assert.ok(profileSchema.properties.profiles.items.required.includes("p80Mm"));
assert.ok(profileSchema.properties.profiles.items.required.includes("diggability"));
assert.ok(profileSchema.properties.profiles.items.required.includes("powderFactorKgM3"));
assert.equal(profileSchema.properties.schemaVersion.const, 2);
assert.equal(profileSchema.properties.profiles.items.properties.powderFactorKgM3.exclusiveMinimum, 0);
assert.equal(profileSchema.properties.profiles.items.properties.blastingCostPerTonne, undefined);
assert.equal(profileSchema.properties.profiles.items.properties.shovelIndex.type, "integer");
assert.ok(profileSchema.properties.profiles.items.properties.shovelIndex.minimum === 0);
assert.ok(profileSchema.properties.profiles.items.properties.shovelIndex.maximum === 3);

assert.equal(exp1.rows.length, 8, "Experimento 1: deben existir ocho políticas.");
assert.deepEqual(
  exp1.rows.map((row) => row.policy).sort(),
  ["fixed","heuristic_expected_wait","heuristic_min_queue","heuristic_projected","multicriteria","multicriteria_no_digg","rl","rl_no_digg"].sort()
);
assert.ok(["tph_mean_rel_pct","esag_mean_rel_pct","cost_mean_rel_pct","co2_mean_rel_pct"].every((key) => exp1.headers.includes(key)));
assert.equal(exp2.rows.length, 14, "Experimento 2: deben existir catorce contrastes resumidos.");
assert.equal(exp2.rows.filter((row) => row.outcome === "esag").length, 10);
assert.equal(exp2.rows.filter((row) => row.outcome === "tph").length, 4);
assert.ok(exp2.rows.every((row) => Number.isFinite(Number(row.significant_holm))));
assert.equal(constancia.rows.length, 7, "Constancia: deben existir siete estadísticas descriptivas.");
assert.ok(constancia.rows.every((row) => Number(row.n) === 14));
assert.ok(metrics.rows.some((row) => row.metric === "mae_kwh_t"));
assert.ok(metrics.rows.some((row) => row.metric === "rmse_kwh_t"));
assert.ok(metrics.rows.some((row) => row.metric === "mape_pct"));
assert.ok(metrics.rows.some((row) => row.metric === "pearson_r"));

const scenarioSource = await readFile(new URL("../src/engine/researchScenarios.ts", import.meta.url), "utf8");
const scenarioTranspiled = ts.transpileModule(scenarioSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  reportDiagnostics: true,
});
const scenarioErrors = (scenarioTranspiled.diagnostics ?? []).filter(
  (item) => item.category === ts.DiagnosticCategory.Error
);
assert.equal(scenarioErrors.length, 0, "El catálogo de escenarios debe transpilar sin errores.");

const temporaryDirectory = await mkdtemp(join(tmpdir(), "m3-research-scenarios-"));
try {
  const modulePath = join(temporaryDirectory, "researchScenarios.mjs");
  await writeFile(modulePath, scenarioTranspiled.outputText, "utf8");
  const catalog = await import(pathToFileURL(modulePath).href);
  const e1 = catalog.getResearchScenarios(1);
  const e2 = catalog.getResearchScenarios(2);
  assert.equal(e1.length, 24, "Experimento 1 debe contener 24 escenarios.");
  assert.equal(e2.length, 24, "Experimento 2 debe contener 24 escenarios.");

  const expectedOffsetsByTopology = {
    "2p8c": [0.06, -0.05],
    "2p9c": [0.06, -0.05],
    "4p16c": [0.10, 0.03, -0.04, -0.10],
    "4p18c": [0.10, 0.03, -0.04, -0.10],
  };

  for (const scenarios of [e1, e2]) {
    assert.equal(new Set(scenarios.map((item) => item.id)).size, 24, "Los ID de escenario deben ser únicos.");
    assert.deepEqual(
      [...new Set(scenarios.map((item) => item.failureLevel))].sort(),
      ["moderate", "none", "severe"]
    );
    if (scenarios === e1) {
      assert.deepEqual(
        [...new Set(scenarios.map((item) => item.fragmentationPattern))].sort(),
        ["heterogeneous", "homogeneous"]
      );
    } else {
      assert.ok(scenarios.every((item) => item.fragmentationPattern === "heterogeneous"));
      assert.deepEqual(
        [...new Set(scenarios.map((item) => item.fineOrientation))].sort(),
        ["fine_far", "fine_near"]
      );
    }
    assert.deepEqual(
      scenarios.map((item) => item.shovelCount + "/" + item.truckCount).filter((value, index, all) => all.indexOf(value) === index).sort(),
      ["2/8", "2/9", "4/16", "4/18"]
    );
    assert.ok(scenarios.every((item) => item.replicates === 300 && item.shiftHours === 8));
  }

  const allScenarios = [...e1, ...e2];
  assert.ok(allScenarios.every((item) => item.haulDistancesM.length === item.shovelCount));
  assert.ok(allScenarios.every((item) => item.rockMassOffsets.length === item.shovelCount));
  for (const item of allScenarios) {
    const topologyId = item.id.split("_")[0];
    assert.deepEqual(
      item.rockMassOffsets,
      expectedOffsetsByTopology[topologyId],
      topologyId + ": offsets geomecánicos deben expresarse como fracciones coherentes."
    );
    assert.ok(
      item.rockMassOffsets.every((offset) => Number.isFinite(offset) && Math.abs(offset) <= 1),
      topologyId + ": cada offset debe ser una fracción finita y acotada."
    );
  }

  assert.ok(e1.filter((item) => item.fragmentationPattern === "heterogeneous").every((item) => item.fineOrientation === "fine_far"));
  assert.equal(e2.filter((item) => item.fineOrientation === "fine_far").length, 12);
  assert.equal(e2.filter((item) => item.fineOrientation === "fine_near").length, 12);
  assert.ok(e2.every((item) => item.id.endsWith("_het") || item.id.endsWith("_hetnear")));
  assert.ok(allScenarios.filter((item) => item.fragmentationPattern === "homogeneous").every((item) => item.fineOrientation === "not_applicable"));
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

console.log("M-3 archived research CSV and scenario catalog checks passed.");
console.log("8 políticas; 14 contrastes; 7 estadísticas Constancia; 24 escenarios por experimento; métricas MAE/RMSE/MAPE/Pearson.");
