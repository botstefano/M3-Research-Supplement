import type { Agent } from './engineV3Profiled';

export type PPOCheckpointId =
  | 'experiment1_diggability'
  | 'experiment1_no_diggability'
  | 'experiment1_clean_no_diggability'
  | 'experiment2_ppo_w2'
  | 'experiment2_ppo_w2_clean'
  | 'experiment2_ppo_w6'
  | 'experiment2_ppo_w6_clean';

export interface PPOActorWeights {
  W1: number[][];
  b1: number[];
  w2: number[];
}

function validateActorWeights(value: unknown): value is PPOActorWeights {
  if (!value || typeof value !== 'object') return false;
  const weights = value as Partial<PPOActorWeights>;
  return Array.isArray(weights.W1) && weights.W1.length === 16 &&
    weights.W1.every((row) => Array.isArray(row) && row.length === 10 && row.every(Number.isFinite)) &&
    Array.isArray(weights.b1) && weights.b1.length === 16 && weights.b1.every(Number.isFinite) &&
    Array.isArray(weights.w2) && weights.w2.length === 16 && weights.w2.every(Number.isFinite);
}

/** Deterministic actor inference from the selected PPO checkpoint used in the paper. */
export class PPOAgent implements Agent {
  private readonly weights: PPOActorWeights;

  constructor(weights: PPOActorWeights) {
    if (!validateActorWeights(weights)) throw new Error('Los pesos del actor PPO no tienen la estructura esperada (16 × 10).');
    this.weights = {
      W1: weights.W1.map((row) => [...row]),
      b1: [...weights.b1],
      w2: [...weights.w2],
    };
  }

  choose(features: number[][], _global: number[], _context: { dumped: number }, stochastic: boolean): number {
    if (stochastic) throw new Error('La evaluación del checkpoint publicado debe ser determinista.');
    if (!Array.isArray(features) || features.length < 1 || features.length > 4 ||
        features.some((row) => !Array.isArray(row) || row.length !== 10 || row.some((n) => !Number.isFinite(n)))) {
      throw new Error('El vector de estado PPO debe contener entre una y cuatro palas, con diez variables por pala.');
    }
    const scores = features.map((row) => {
      const hidden = this.weights.W1.map((weights, index) => {
        let activation = this.weights.b1[index];
        for (let feature = 0; feature < 10; feature += 1) activation += weights[feature] * row[feature];
        return Math.tanh(activation);
      });
      return hidden.reduce((sum, activation, index) => sum + activation * this.weights.w2[index], 0);
    });
    let selected = 0;
    for (let index = 1; index < scores.length; index += 1) {
      if (scores[index] > scores[selected]) selected = index;
    }
    return selected;
  }

  static load(value: unknown): PPOAgent {
    if (!validateActorWeights(value)) throw new Error('Checkpoint PPO inválido o incompleto.');
    return new PPOAgent(value);
  }
}

export interface LoadedPPOCheckpoint {
  agent: PPOAgent;
  id: PPOCheckpointId;
  sourceFile: string;
  seed: number;
  validationScore: number;
}

/** Loads a compressed, versioned collection of selected actors stored with the clean app. */
const CHECKPOINT_ARCHIVE_PARTS = [
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
] as const;

const CHECKPOINT_ARCHIVE_SHA256 = "171ef1c78c2a2e5ac11b37bc92a352fa624bbab0881dd289aedd8da53f61e060";

async function loadCheckpointArchive(): Promise<{ checkpoints: Record<string, unknown> }> {
  const responses = await Promise.all(CHECKPOINT_ARCHIVE_PARTS.map((part) =>
    fetch(`/research-v3/ppo-checkpoints/${part}`)
  ));
  const failed = responses.find((response) => !response.ok);
  if (failed) throw new Error(`No se pudo recuperar un segmento del archivo PPO (${failed.status}).`);

  const encodedParts = await Promise.all(responses.map((response) => response.text()));
  const encoded = encodedParts.join("");
  if (!/^[A-Za-z0-9+/]+=*$/.test(encoded)) throw new Error("El archivo PPO contiene caracteres Base64 no válidos.");
  const binary = atob(encoded);
  const compressed = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const digest = await crypto.subtle.digest("SHA-256", compressed);
  const actualSha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (actualSha256 !== CHECKPOINT_ARCHIVE_SHA256) {
    throw new Error("La huella SHA-256 del archivo PPO no coincide; se bloqueó la carga del modelo.");
  }
  if (typeof DecompressionStream === "undefined") throw new Error("Este navegador no admite descompresión gzip.");
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  const payload: unknown = await new Response(stream).json();
  if (!payload || typeof payload !== "object" || !("checkpoints" in payload)) {
    throw new Error("El archivo PPO verificado no contiene el catálogo esperado.");
  }
  const checkpoints = (payload as { checkpoints?: unknown }).checkpoints;
  if (!checkpoints || typeof checkpoints !== "object" || Array.isArray(checkpoints)) {
    throw new Error("El catálogo de checkpoints PPO tiene una estructura inválida.");
  }
  return { checkpoints: checkpoints as Record<string, unknown> };
}

let checkpointArchivePromise: Promise<{ checkpoints: Record<string, unknown> }> | null = null;

export async function loadPPOCheckpoint(id: PPOCheckpointId): Promise<LoadedPPOCheckpoint> {
  checkpointArchivePromise ??= loadCheckpointArchive();
  let checkpoints: Record<string, unknown>;
  try {
    ({ checkpoints } = await checkpointArchivePromise);
  } catch (error) {
    // A transient network or integrity failure must not poison every later retry.
    checkpointArchivePromise = null;
    throw error;
  }
  const checkpoint = checkpoints[id] as { sourceFile?: string; seed?: number; validationScore?: number; weights?: unknown } | undefined;
  if (!checkpoint || typeof checkpoint.sourceFile !== "string" || !Number.isInteger(checkpoint.seed) || !Number.isFinite(checkpoint.validationScore)) {
    throw new Error(`No existe un checkpoint PPO válido para ${id}.`);
  }
  return {
    agent: PPOAgent.load(checkpoint.weights),
    id,
    sourceFile: checkpoint.sourceFile,
    seed: checkpoint.seed as number,
    validationScore: checkpoint.validationScore as number,
  };
}
