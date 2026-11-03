import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  calculateFragmentationProfile,
  generateDataset,
  generateProfileSet,
  getGridFactors,
  getReplicationSeed,
} from "./generate-research-v3-profiles.mjs";

const baseline = calculateFragmentationProfile({
  rockMassIndex: 7.2,
  burdenM: 6.5,
  spacingM: 7.5,
});
assert.ok(Math.abs(baseline.diagnostics.chargeMassKg - 837.362069) < 1e-5);
assert.ok(Math.abs(baseline.powderFactorKgM3 - 1.1451105) < 1e-6);
assert.ok(Math.abs(baseline.diagnostics.uniformity - 1.1793909) < 1e-6);
assert.ok(Math.abs(baseline.p80Mm - 405.142896) < 1e-5);
assert.ok(Math.abs(baseline.diagnostics.boulders600Pct - 7.750031) < 1e-5);
assert.ok(Math.abs(baseline.diggability - 22.01419) < 1e-4);

assert.equal(getReplicationSeed(1, 1), 20001);
assert.equal(getReplicationSeed(1, 300), 20300);
assert.equal(getReplicationSeed(2, 1), 30001);
assert.equal(getReplicationSeed(2, 300), 30300);

const twoFar = {
  experiment: 1,
  id: "2p8c_none_het",
  shovelCount: 2,
  rockMassOffsets: [0.06, -0.05],
  fragmentationPattern: "heterogeneous",
  fineOrientation: "fine_far",
};
const twoNear = { ...twoFar, experiment: 2, fineOrientation: "fine_near" };
const fourFar = { ...twoFar, shovelCount: 4, rockMassOffsets: [0.10, 0.03, -0.04, -0.10] };
const fourNear = { ...fourFar, experiment: 2, fineOrientation: "fine_near" };
assert.deepEqual(getGridFactors(twoFar), [1.15, 0.85]);
assert.deepEqual(getGridFactors(twoNear), [0.85, 1.15]);
assert.deepEqual(getGridFactors(fourFar), [1.20, 1.05, 0.95, 0.85]);
assert.deepEqual(getGridFactors(fourNear), [0.85, 0.95, 1.05, 1.20]);
assert.deepEqual(getGridFactors({ ...twoFar, fragmentationPattern: "homogeneous", fineOrientation: "not_applicable" }), [1, 1]);

const first = generateProfileSet(twoFar, 1);
const repeated = generateProfileSet(twoFar, 1);
const otherReplicate = generateProfileSet(twoFar, 2);
assert.deepEqual(first, repeated, "La misma semilla y escenario deben generar exactamente el mismo JSON.");
assert.notDeepEqual(first, otherReplicate, "Réplicas distintas deben variar.");
assert.equal(first.schemaVersion, 2);
assert.equal(first.profiles.length, 2);
assert.equal(first.profiles[0].shovelIndex, 0);
assert.ok(first.profiles.every((profile) =>
  Number.isFinite(profile.p80Mm) &&
  profile.p80Mm >= 5 &&
  profile.p80Mm <= 1500 &&
  profile.rockMassIndex >= 1 &&
  profile.rockMassIndex <= 14 &&
  profile.diggability >= 10 &&
  profile.diggability <= 98 &&
  profile.powderFactorKgM3 > 0
));

const temporaryDirectory = await mkdtemp(join(tmpdir(), "m3-profile-generator-test-"));
try {
  const manifest = await generateDataset({
    scenarios: [twoFar],
    outputDir: temporaryDirectory,
    replicates: 2,
  });
  assert.equal(manifest.generatedFiles, 2);
  assert.equal(manifest.generatedFaceProfiles, 4);
  const generatedPath = join(temporaryDirectory, twoFar.id, "replicate-001.json");
  const generatedJson = JSON.parse(await readFile(generatedPath, "utf8"));
  assert.deepEqual(generatedJson, first);
  const savedManifest = JSON.parse(await readFile(join(temporaryDirectory, "generation-manifest.json"), "utf8"));
  assert.equal(savedManifest.datasetKind, "synthetic_article_equation_reconstruction");
  assert.deepEqual(savedManifest.seedRange, [20001, 20002]);
  assert.match(savedManifest.warning, /NO SON MEDICIONES DE CAMPO/);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

console.log("M-3 profile generator checks passed: article base case, seed manifest, face orientation, reproducibility and schema-v2 output.");
