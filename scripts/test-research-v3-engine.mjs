import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash, webcrypto } from "node:crypto";
import { gunzipSync } from "node:zlib";
import ts from "typescript";

const repoRoot = new URL("../", import.meta.url);
const archiveRoot = new URL("../public/research-v3/ppo-checkpoints/", import.meta.url);
const expectedArchiveSha256 = "171ef1c78c2a2e5ac11b37bc92a352fa624bbab0881dd289aedd8da53f61e060";
const parts = [
  "part00.txt",
  "part01a.txt",
  "part01b.txt",
  "part01c-a.txt",
  "part01c-b.txt",
  "part01c-c.txt",
  "part01d.txt",
  "part02.txt",
  "part03.txt",
  "part04.txt",
  "part05.txt",
  "part06a.txt",
  "part06b.txt",
  "part06c.txt",
  "part06d.txt",
  "part07a.txt",
  "part07b.txt",
  "part07c.txt",
  "part07d.txt",
];

const encodedParts = await Promise.all(parts.map((part) =>
  readFile(new URL(part, archiveRoot), "utf8")
));
const encodedArchive = encodedParts.join("");
assert.match(encodedArchive, /^[A-Za-z0-9+/]+=*$/, "El archivo PPO debe ser Base64 válido.");
const compressedArchive = Buffer.from(encodedArchive, "base64");
assert.equal(compressedArchive.length, 28199, "El tamaño del archivo PPO comprimido debe ser exacto.");
assert.equal(
  createHash("sha256").update(compressedArchive).digest("hex"),
  expectedArchiveSha256,
  "La huella SHA-256 del archivo PPO debe coincidir con el paquete v3 original."
);

const checkpointPayload = JSON.parse(gunzipSync(compressedArchive).toString("utf8"));
assert.equal(checkpointPayload.schemaVersion, 1);
const checkpoints = checkpointPayload.checkpoints;
const expectedCheckpoints = {
  experiment1_diggability: ["agents_rl_s2.json", 2],
  experiment1_no_diggability: ["agents_rl_no_digg_s4.json", 4],
  experiment1_clean_no_diggability: ["agents_rl_no_digg2_s3.json", 3],
  experiment2_ppo_w2: ["agents2_rl_w2_s2.json", 2],
  experiment2_ppo_w2_clean: ["agents2_rl_no_digg2_w2_s1.json", 1],
  experiment2_ppo_w6: ["agents2_rl_w6_s1.json", 1],
  experiment2_ppo_w6_clean: ["agents2_rl_no_digg2_w6_s1.json", 1],
};
assert.deepEqual(Object.keys(checkpoints).sort(), Object.keys(expectedCheckpoints).sort());
for (const [id, [sourceFile, seed]] of Object.entries(expectedCheckpoints)) {
  const checkpoint = checkpoints[id];
  assert.equal(checkpoint.sourceFile, sourceFile);
  assert.equal(checkpoint.seed, seed);
  assert.ok(Number.isFinite(checkpoint.validationScore));
  assert.equal(checkpoint.weights.W1.length, 16);
  assert.ok(checkpoint.weights.W1.every((row) => row.length === 10 && row.every(Number.isFinite)));
  assert.equal(checkpoint.weights.b1.length, 16);
  assert.equal(checkpoint.weights.w2.length, 16);
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), "m3-research-v3-engine-"));
const engineDirectory = join(temporaryDirectory, "engine");
const researchEngineDirectory = join(engineDirectory, "research-v3");
await mkdir(researchEngineDirectory, { recursive: true });

function transpile(source, targetPath) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      verbatimModuleSyntax: true,
    },
    reportDiagnostics: true,
  });
  const errors = (output.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, "TypeScript transpile failed for " + targetPath + ": " + errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join("; "));
  return output.outputText;
}

try {
  const modules = [
    ["../src/engine/researchScenarios.ts", join(engineDirectory, "researchScenarios.mjs"), []],
    ["../src/engine/research-v3/engineV3Profiled.ts", join(researchEngineDirectory, "engineV3Profiled.mjs"), []],
    ["../src/engine/research-v3/ppoAgent.ts", join(researchEngineDirectory, "ppoAgent.mjs"), []],
    ["../src/engine/research-v3/profileSchema.ts", join(researchEngineDirectory, "profileSchema.mjs"), []],
    ["../src/engine/research-v3/runScenario.ts", join(researchEngineDirectory, "runScenario.mjs"), [
      ['from "./engineV3Profiled"', 'from "./engineV3Profiled.mjs"'],
      ['from "./ppoAgent"', 'from "./ppoAgent.mjs"'],
      ['from "../researchScenarios"', 'from "../researchScenarios.mjs"'],
    ]],
  ];

  for (const [sourcePath, targetPath, replacements] of modules) {
    let source = await readFile(new URL(sourcePath, import.meta.url), "utf8");
    for (const [before, after] of replacements) source = source.replaceAll(before, after);
    await writeFile(targetPath, transpile(source, targetPath), "utf8");
  }

  const scenarios = await import(pathToFileURL(join(engineDirectory, "researchScenarios.mjs")).href);
  const getProfiles = (scenarioId, shovelCount, replicateId) => ({
    schemaVersion: 2,
    source: "fixture-only automated software test; not measured operational data",
    scenarioId,
    replicateId,
    profiles: Array.from({ length: shovelCount }, (_, shovelIndex) => ({
      shovelIndex,
      faceId: "TEST-FACE-" + shovelIndex,
      p80Mm: 145 + 15 * shovelIndex,
      rockMassIndex: 7.2 + (shovelIndex === 0 ? 0.06 : -0.05),
      diggability: 72 + shovelIndex * 4,
      powderFactorKgM3: 1.145 + shovelIndex * 0.03,
    })),
  });

  const profileModule = await import(pathToFileURL(join(researchEngineDirectory, "profileSchema.mjs")).href);
  const engineModule = await import(pathToFileURL(join(researchEngineDirectory, "runScenario.mjs")).href);
  const engineCoreModule = await import(pathToFileURL(join(researchEngineDirectory, "engineV3Profiled.mjs")).href);
  const ppoModule = await import(pathToFileURL(join(researchEngineDirectory, "ppoAgent.mjs")).href);

  const e1 = scenarios.getResearchScenarios(1);
  const e2 = scenarios.getResearchScenarios(2);
  assert.equal(e1.length, 24);
  assert.equal(e2.length, 24);
  assert.equal(e1.filter((scenario) => scenario.fragmentationPattern === "homogeneous").length, 12);
  assert.equal(e1.filter((scenario) => scenario.fragmentationPattern === "heterogeneous").length, 12);
  assert.equal(e2.filter((scenario) => scenario.fineOrientation === "fine_far").length, 12);
  assert.equal(e2.filter((scenario) => scenario.fineOrientation === "fine_near").length, 12);

  const invalidProfileSet = getProfiles(e1[0].id, e1[0].shovelCount, 1);
  invalidProfileSet.profiles[0].shovelIndex = 1;
  assert.throws(() => profileModule.parseFragmentationProfileSet(invalidProfileSet, e1[0].id), /shovelIndex/);
  const legacyProfileSet = getProfiles(e1[0].id, e1[0].shovelCount, 1);
  legacyProfileSet.schemaVersion = 1;
  assert.throws(() => profileModule.parseFragmentationProfileSet(legacyProfileSet, e1[0].id), /schemaVersion 2/);

  const previousFetch = globalThis.fetch;
  globalThis.crypto ??= webcrypto;
  let failFirstCheckpointRequest = true;
  globalThis.fetch = async (url) => {
    const requested = String(url);
    const part = requested.split("/").at(-1);
    if (!parts.includes(part)) return new Response("not found", { status: 404 });
    if (failFirstCheckpointRequest) {
      failFirstCheckpointRequest = false;
      return new Response("temporary network error", { status: 503 });
    }
    const body = await readFile(new URL(part, archiveRoot), "utf8");
    return new Response(body, { status: 200, headers: { "content-type": "text/plain" } });
  };

  try {
    await assert.rejects(
      () => ppoModule.loadPPOCheckpoint("experiment1_diggability"),
      /No se pudo recuperar un segmento del archivo PPO/,
      "El primer intento debe exponer un fallo transitorio de descarga."
    );
    const recoveredCheckpoint = await ppoModule.loadPPOCheckpoint("experiment1_diggability");
    assert.equal(recoveredCheckpoint.id, "experiment1_diggability", "La carga PPO debe recuperarse después del fallo transitorio.");

    const e1Scenario = scenarios.getResearchScenario("2p8c_none_hom");
    const e2Scenario = scenarios.getResearchScenario("2p8c_none_hetnear");
    assert.ok(e1Scenario && e2Scenario);

    const e1Profiles = profileModule.toEngineProfiles(
      profileModule.parseFragmentationProfileSet(getProfiles(e1Scenario.id, e1Scenario.shovelCount, 1), e1Scenario.id),
      e1Scenario.shovelCount
    );
    assert.throws(
      () => new engineCoreModule.MineSimV3(20001).run(
        "rl",
        { id: e1Scenario.id, shovels: e1Scenario.shovelCount, trucks: e1Scenario.truckCount, dist: [...e1Scenario.haulDistancesM], rel: e1Scenario.failureLevel },
        e1Profiles
      ),
      /requiere un agente PPO cargado/,
      "Una política PPO no debe iniciar si falta el checkpoint/agente."
    );

    const exp1First = await engineModule.runResearchSingleReplication(e1Scenario, 1, e1Profiles);
    const exp1Repeat = await engineModule.runResearchSingleReplication(e1Scenario, 1, e1Profiles);
    assert.equal(exp1First.length, 8);
    assert.deepEqual(exp1First, exp1Repeat, "La réplica determinista del Exp. 1 debe ser repetible.");
    assert.ok(exp1First.every((row) => Number.isFinite(row.tph) && Number.isFinite(row.esag) && Number.isFinite(row.cost) && Number.isFinite(row.blendPowderFactorKgM3)));
    for (const row of exp1First) {
      const expectedCost = (0.55 + 0.42 * row.blendPowderFactorKgM3) + 1.18 * row.fuel +
        0.088 * row.esag + 0.85 + 0.0075 * (100 - row.blendD) + 0.95;
      assert.ok(Math.abs(row.cost - expectedCost) < 1e-10, "El costo unitario debe reproducir la ecuación del artículo.");
    }

    // Si una pala no entrega mineral, no debe recibir un peso artificial en el blending.
    const longDistanceScenario = {
      id: "blend-one-active-face", shovels: 2, trucks: 8,
      dist: [500000, 2000], rel: "none",
    };
    const blendCheck = new engineCoreModule.MineSimV3(61001).run("fixed", longDistanceScenario, e1Profiles);
    assert.equal(blendCheck.blendP80, e1Profiles[1].p80Mm);
    assert.equal(blendCheck.blendA, e1Profiles[1].rockMassIndex);
    assert.equal(blendCheck.blendD, e1Profiles[1].diggability);
    assert.equal(blendCheck.blendPowderFactorKgM3, e1Profiles[1].powderFactorKgM3);

    const noDeliveryScenario = {
      id: "no-delivery", shovels: 2, trucks: 8,
      dist: [1000000, 1000000], rel: "none",
    };
    assert.throws(
      () => new engineCoreModule.MineSimV3(61002).run("fixed", noDeliveryScenario, e1Profiles),
      /no entregó toneladas/,
      "Una réplica sin entregas no debe producir costos ni blending ficticios."
    );

    const e2Profiles = profileModule.toEngineProfiles(
      profileModule.parseFragmentationProfileSet(getProfiles(e2Scenario.id, e2Scenario.shovelCount, 1), e2Scenario.id),
      e2Scenario.shovelCount
    );
    const exp2First = await engineModule.runResearchSingleReplication(e2Scenario, 1, e2Profiles);
    const exp2Repeat = await engineModule.runResearchSingleReplication(e2Scenario, 1, e2Profiles);
    assert.equal(exp2First.length, 10);
    assert.deepEqual(exp2First, exp2Repeat, "La réplica determinista del Exp. 2 debe ser repetible.");
    assert.ok(exp2First.every((row) => Number.isFinite(row.tph) && Number.isFinite(row.esag) && Number.isFinite(row.cost)));
    assert.ok(exp2First.some((row) => row.policy === "rl_w2"));
    assert.ok(exp2First.some((row) => row.policy === "rl_w6"));
  } finally {
    globalThis.fetch = previousFetch;
  }

  console.log("M-3 research v3 engine checks passed.");
  console.log("24 + 24 scenarios; PPO SHA-256; eight/ten policies; deterministic runs; exact unit-cost equation; delivered-tonnage-only blending.");
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
