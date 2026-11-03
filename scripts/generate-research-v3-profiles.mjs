#!/usr/bin/env node
/**
 * Generate reproducible, article-equation-based M-3 fragmentation profiles.
 *
 * IMPORTANT: these are synthetic reconstructions from the manuscript's stated
 * blast design and stochastic assumptions. They are NOT measurements from a mine.
 * Output layout is directly consumable by scripts/run-research-v3-batch.mjs.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const CONSTANTS = Object.freeze({
  rockFactorBase: 7.2,
  burdenBaseM: 6.5,
  spacingBaseM: 7.5,
  rockFactorSigma: 0.055,
  burdenSigma: 0.025,
  spacingSigma: 0.025,
  benchHeightM: 15,
  stemmingM: 4.8,
  drillDiameterMm: 270,
  explosiveDensityKgM3: 1250,
  relativeWeightStrength: 115,
  drillingDeviationM: 0.1,
  baseLoadingTimeSeconds: 145,
  holeChargeLengthM: 15 - 4.8 + 0.1 * 15,
});
const PROFILE_SOURCE =
  "Reconstruccion sintetica trazable desde ecuaciones y supuestos del manuscrito M-3; no son mediciones de campo.";

export class SeededRNG {
  constructor(seed) {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
    // Match the M-3 research engine: discard the first 50 uniforms.
    for (let i = 0; i < 50; i += 1) this.next();
  }

  next() {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  normal(mean = 0, standardDeviation = 1) {
    let u1 = this.next();
    const u2 = this.next();
    while (u1 <= 1e-7) u1 = this.next();
    return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * standardDeviation;
  }

  logNormal(mean = 0, standardDeviation = 1) {
    return Math.exp(this.normal(mean, standardDeviation));
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getGridFactors(scenario) {
  if (scenario.fragmentationPattern === "homogeneous") {
    return Array(scenario.shovelCount).fill(1);
  }

  const far = scenario.shovelCount === 2 ? [1.15, 0.85] : [1.20, 1.05, 0.95, 0.85];
  const near = scenario.shovelCount === 2 ? [0.85, 1.15] : [0.85, 0.95, 1.05, 1.20];
  if (scenario.fineOrientation === "fine_far") return far;
  if (scenario.fineOrientation === "fine_near") return near;
  throw new Error("Un escenario heterogeneo debe declarar fine_far o fine_near.");
}

export function getReplicationSeed(experiment, replicateId) {
  if (experiment !== 1 && experiment !== 2) throw new Error("El experimento debe ser 1 o 2.");
  if (!Number.isInteger(replicateId) || replicateId < 1 || replicateId > 300) {
    throw new Error("La replica debe ser un entero entre 1 y 300.");
  }
  // Evaluation seeds explicitly declared in the manuscript.
  return (experiment === 1 ? 20000 : 30000) + replicateId;
}

export function calculateFragmentationProfile({ rockMassIndex, burdenM, spacingM }) {
  for (const [name, value] of Object.entries({ rockMassIndex, burdenM, spacingM })) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(name + " debe ser positivo y finito.");
  }

  const c = CONSTANTS;
  const chargeMassKg =
    Math.PI *
    Math.pow(c.drillDiameterMm / 2000, 2) *
    c.holeChargeLengthM *
    c.explosiveDensityKgM3;
  const powderFactorKgM3 =
    chargeMassKg / (burdenM * spacingM * c.benchHeightM);

  // Kuznetsov: x_m in cm; A is the manuscript's rock factor and Q is kg/hole.
  const xMeanCm =
    rockMassIndex *
    Math.pow(1 / powderFactorKgM3, 0.8) *
    Math.pow(chargeMassKg, 1 / 6) *
    Math.pow(115 / c.relativeWeightStrength, 19 / 30);

  // Modified Cunningham, single-explosive/full-column case:
  // (|BCL-CCL|/L + 0.1)^0.1 = 0.1^0.1 when BCL = CCL.
  // The manuscript's text extraction renders this exponent imperfectly; this
  // interpretation reproduces its stated base case (n≈1.18, P80≈405 mm).
  const uniformityRaw =
    (2.2 - (14 * burdenM) / c.drillDiameterMm) *
    (1 - c.drillingDeviationM / burdenM) *
    Math.sqrt((1 + spacingM / burdenM) / 2) *
    Math.pow(0.1, 0.1) *
    (c.holeChargeLengthM / c.benchHeightM);
  const uniformity = clamp(uniformityRaw, 0.75, 2.2);

  // Rosin-Rammler: P(x)=1-exp[-(x/xc)^n]. x and xc are in cm here.
  const characteristicSizeCm = xMeanCm / Math.pow(Math.LN2, 1 / uniformity);
  const p80Mm =
    characteristicSizeCm * Math.pow(-Math.log(0.2), 1 / uniformity) * 10;
  const boulders600Pct =
    100 * Math.exp(-Math.pow(60 / characteristicSizeCm, uniformity));
  const fines25Pct =
    100 * (1 - Math.exp(-Math.pow(2.5 / characteristicSizeCm, uniformity)));
  const diggability = clamp(
    100 -
      0.25 * Math.abs(p80Mm - 180) -
      2.8 * boulders600Pct -
      0.8 * Math.max(0, fines25Pct - 15),
    10,
    98
  );

  return {
    p80Mm,
    rockMassIndex,
    diggability,
    powderFactorKgM3,
    diagnostics: {
      chargeMassKg,
      powderFactorKgM3,
      xMeanCm,
      uniformityRaw,
      uniformity,
      characteristicSizeCm,
      p80Mm,
      boulders600Pct,
      fines25Pct,
      diggability,
      burdenM,
      spacingM,
    },
  };
}

export function generateProfileSet(scenario, replicateId) {
  const seed = getReplicationSeed(scenario.experiment, replicateId);
  const rng = new SeededRNG(seed);
  const gridFactors = getGridFactors(scenario);
  const profiles = [];

  for (let shovelIndex = 0; shovelIndex < scenario.shovelCount; shovelIndex += 1) {
    // This draw order intentionally mirrors the three lognormal geotechnical
    // draws reserved per shovel in MineSimV3 before truck/plant random events.
    const rockMassIndex =
      CONSTANTS.rockFactorBase *
      (1 + scenario.rockMassOffsets[shovelIndex]) *
      rng.logNormal(0, CONSTANTS.rockFactorSigma);
    const burdenM =
      CONSTANTS.burdenBaseM *
      gridFactors[shovelIndex] *
      rng.logNormal(0, CONSTANTS.burdenSigma);
    const spacingM =
      CONSTANTS.spacingBaseM *
      gridFactors[shovelIndex] *
      rng.logNormal(0, CONSTANTS.spacingSigma);

    const calculated = calculateFragmentationProfile({ rockMassIndex, burdenM, spacingM });
    profiles.push({
      shovelIndex,
      faceId: scenario.id + "-rep" + String(replicateId).padStart(3, "0") + "-face" + (shovelIndex + 1),
      p80Mm: calculated.p80Mm,
      rockMassIndex: calculated.rockMassIndex,
      diggability: calculated.diggability,
      powderFactorKgM3: calculated.powderFactorKgM3,
    });
  }

  const profileSet = {
    schemaVersion: 2,
    source: PROFILE_SOURCE,
    scenarioId: scenario.id,
    replicateId,
    profiles,
  };
  assert.equal(profileSet.profiles.length, scenario.shovelCount);
  return profileSet;
}

async function loadResearchScenarios() {
  const tempDirectory = await import("node:fs/promises").then(({ mkdtemp }) =>
    mkdtemp(join(tmpdir(), "m3-profile-catalog-"))
  );
  const source = await readFile(new URL("../src/engine/researchScenarios.ts", import.meta.url), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      verbatimModuleSyntax: true,
    },
    reportDiagnostics: true,
  });
  const errors = (transpiled.diagnostics ?? []).filter(
    (item) => item.category === ts.DiagnosticCategory.Error
  );
  assert.equal(
    errors.length,
    0,
    "No se pudo cargar el catálogo de escenarios: " +
      errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join("; ")
  );
  const modulePath = join(tempDirectory, "researchScenarios.mjs");
  await writeFile(modulePath, transpiled.outputText, "utf8");
  const module = await import(pathToFileURL(modulePath).href);
  return {
    module,
    cleanup: async () => {
      const { rm } = await import("node:fs/promises");
      await rm(tempDirectory, { recursive: true, force: true });
    },
  };
}

export async function generateDataset({ scenarios, outputDir, replicates = 300 }) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) throw new Error("No se seleccionaron escenarios.");
  if (!Number.isInteger(replicates) || replicates < 1 || replicates > 300) {
    throw new Error("--replicates debe ser un entero entre 1 y 300.");
  }
  const root = resolve(outputDir);
  let filesWritten = 0;
  let profilesWritten = 0;
  const selectedScenarios = [];

  for (const scenario of scenarios) {
    const scenarioDir = join(root, scenario.id);
    await mkdir(scenarioDir, { recursive: true });
    let scenarioProfiles = 0;
    for (let replicateId = 1; replicateId <= replicates; replicateId += 1) {
      const profileSet = generateProfileSet(scenario, replicateId);
      const filePath = join(
        scenarioDir,
        "replicate-" + String(replicateId).padStart(3, "0") + ".json"
      );
      await writeFile(filePath, JSON.stringify(profileSet, null, 2) + "\n", "utf8");
      filesWritten += 1;
      profilesWritten += profileSet.profiles.length;
      scenarioProfiles += profileSet.profiles.length;
    }
    selectedScenarios.push({
      scenarioId: scenario.id,
      shovelCount: scenario.shovelCount,
      replicateFiles: replicates,
      faceProfiles: scenarioProfiles,
      gridFactors: getGridFactors(scenario),
      failureLevel: scenario.failureLevel,
      fragmentationPattern: scenario.fragmentationPattern,
      fineOrientation: scenario.fineOrientation,
      rockMassOffsets: scenario.rockMassOffsets,
    });
  }

  const experiment = scenarios[0].experiment;
  if (!scenarios.every((scenario) => scenario.experiment === experiment)) {
    throw new Error("No mezcles escenarios de experimentos distintos en una misma salida.");
  }
  const firstSeed = getReplicationSeed(experiment, 1);
  const lastSeed = getReplicationSeed(experiment, replicates);
  const manifest = {
    manifestVersion: 1,
    datasetKind: "synthetic_article_equation_reconstruction",
    warning: "NO SON MEDICIONES DE CAMPO. Son perfiles sinteticos reconstruidos desde los parametros y ecuaciones publicados en el manuscrito M-3.",
    experiment,
    replicateCount: replicates,
    seedRange: [firstSeed, lastSeed],
    seedFormula: experiment === 1 ? "20000 + replicateId" : "30000 + replicateId",
    randomGenerator: {
      algorithm: "Park-Miller minimal standard (multiplier 16807, modulus 2147483647)",
      initialUniformsDiscarded: 50,
      normalTransform: "Box-Muller cosine branch",
      drawOrderPerShovel: ["rock factor A, lognormal sigma 0.055", "burden B, lognormal sigma 0.025", "spacing S, lognormal sigma 0.025"],
      reproducibilityNote: "The generator recreates the three per-shovel geology draws; the simulation engine independently reserves the same three draws before its movement stream.",
    },
    blastDesign: {
      benchHeightM: CONSTANTS.benchHeightM,
      stemmingM: CONSTANTS.stemmingM,
      drillDiameterMm: CONSTANTS.drillDiameterMm,
      chargeLengthM: CONSTANTS.holeChargeLengthM,
      explosiveDensityKgM3: CONSTANTS.explosiveDensityKgM3,
      relativeWeightStrength: CONSTANTS.relativeWeightStrength,
      baseBurdenM: CONSTANTS.burdenBaseM,
      baseSpacingM: CONSTANTS.spacingBaseM,
      drillingDeviationM: CONSTANTS.drillingDeviationM,
      fullColumnCharge: true,
    },
    equations: {
      kuznesov: "xm_cm = A * (1/q)^0.8 * Q^(1/6) * (115/RWS)^(19/30)",
      powderFactor: "q = Q / (B*S*H), Q = pi*(d/2)^2*Lc*rho_explosive",
      cunningham: "n = clip[(2.2-14B/d)*(1-W/B)*sqrt((1+S/B)/2)*0.1^0.1*(Lc/H), 0.75, 2.2]",
      cunninghamAssumption: "Single-explosive, full-column charge; BCL=CCL, so the modified correction term becomes 0.1^0.1.",
      rosinRammler: "P(x) = 1 - exp[-(x/xc)^n]; xc = xm/(ln(2))^(1/n)",
      p80: "P80_mm = 10*xc_cm*(-ln(0.2))^(1/n)",
      diggability: "clip[100 - 0.25*abs(P80-180) - 2.8*B600 - 0.8*max(0,F25-15), 10, 98]",
    },
    stochasticAssumptions: {
      rockFactor: "A = 7.2*(1+scenarioOffset)*exp(N(0,0.055))",
      burden: "B = 6.5*gridFactor*exp(N(0,0.025)) metres",
      spacing: "S = 7.5*gridFactor*exp(N(0,0.025)) metres",
      correlation: "A, B and S use consecutive draws from one per-replication seeded stream; B and S each receive the same deterministic face grid factor but independent lognormal variation.",
      scope: "No mine survey, blast-hole record, sieve analysis or plant calibration data were supplied to or inferred by this generator.",
    },
    generatedFiles: filesWritten,
    generatedFaceProfiles: profilesWritten,
    scenarios: selectedScenarios,
  };

  await writeFile(join(root, "generation-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  return manifest;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") return { help: true };
    if (!item.startsWith("--")) throw new Error("Argumento no reconocido: " + item);
    const key = item.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error("Falta un valor para --" + key);
    values[key] = value;
    index += 1;
  }
  const experiment = Number(values.experiment);
  if (experiment !== 1 && experiment !== 2) throw new Error("Indica --experiment 1 o --experiment 2.");
  if (!values.output) throw new Error("Debes indicar --output.");
  const replicates = values.replicates === undefined ? 300 : Number(values.replicates);
  if (!Number.isInteger(replicates) || replicates < 1 || replicates > 300) {
    throw new Error("--replicates debe ser un entero entre 1 y 300.");
  }
  return { experiment, outputDir: resolve(values.output), replicates, scenarioId: values.scenario };
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log("Uso: npm run generate:research-v3-profiles -- --experiment 1 --output ./research-input/exp1 [--replicates 300] [--scenario ID]");
    console.log("Genera JSON schemaVersion 2, uno por escenario y replica. Los perfiles son reconstrucciones sinteticas, no mediciones de campo.");
    return;
  }
  const args = parseArgs(process.argv.slice(2));
  const { module, cleanup } = await loadResearchScenarios();
  try {
    let scenarios = module.getResearchScenarios(args.experiment);
    if (args.scenarioId) scenarios = scenarios.filter((scenario) => scenario.id === args.scenarioId);
    if (scenarios.length === 0) throw new Error("No existe el escenario indicado en el experimento seleccionado.");
    const manifest = await generateDataset({ scenarios, outputDir: args.outputDir, replicates: args.replicates });
    console.log("Perfiles generados: " + manifest.generatedFaceProfiles);
    console.log("Archivos JSON: " + manifest.generatedFiles);
    console.log("Semillas: " + manifest.seedRange[0] + "–" + manifest.seedRange[1]);
    console.log("Manifiesto: " + join(args.outputDir, "generation-manifest.json"));
    console.log("AVISO: reconstruccion sintetica desde el manuscrito; no son mediciones de campo.");
  } finally {
    await cleanup();
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
