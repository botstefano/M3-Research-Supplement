import { MineSimV3, type Agent, type FragmentationProfile, type Policy, type Scenario } from "./engineV3Profiled";
import { loadPPOCheckpoint, type PPOCheckpointId } from "./ppoAgent";
import type { ResearchScenario } from "../researchScenarios";

const EXPERIMENT_1_POLICIES: Policy[] = [
  "fixed",
  "heuristic_min_queue",
  "heuristic_expected_wait",
  "heuristic_projected",
  "multicriteria",
  "multicriteria_no_digg",
  "rl",
  "rl_no_digg",
];

const EXPERIMENT_2_POLICIES: Policy[] = [
  "fixed",
  "heuristic_min_queue",
  "heuristic_expected_wait",
  "heuristic_projected",
  "multicriteria",
  "multicriteria_no_digg",
  "rl_w2",
  "rl_w2_clean",
  "rl_w6",
  "rl_w6_clean",
];

const POLICY_LABELS: Record<Policy, string> = {
  fixed: "Asignación fija",
  heuristic_min_queue: "Cola mínima",
  heuristic_expected_wait: "Espera esperada",
  heuristic_projected: "Proyectada",
  multicriteria: "Multicriterio con excavabilidad",
  multicriteria_no_digg: "Multicriterio sin excavabilidad",
  rl: "PPO con excavabilidad",
  rl_no_digg: "PPO sin excavabilidad (control original)",
  rl_no_digg2: "PPO sin excavabilidad (control limpio exploratorio)",
  rl_w2: "PPO peso energía 2",
  rl_w2_clean: "PPO peso energía 2 (control limpio)",
  rl_w6: "PPO peso energía 6",
  rl_w6_clean: "PPO peso energía 6 (control limpio)",
};

const CHECKPOINTS: Partial<Record<Policy, PPOCheckpointId>> = {
  rl: "experiment1_diggability",
  rl_no_digg: "experiment1_no_diggability",
  rl_no_digg2: "experiment1_clean_no_diggability",
  rl_w2: "experiment2_ppo_w2",
  rl_w2_clean: "experiment2_ppo_w2_clean",
  rl_w6: "experiment2_ppo_w6",
  rl_w6_clean: "experiment2_ppo_w6_clean",
};

export interface ResearchPolicyResult {
  policy: Policy;
  label: string;
  tph: number;
  wShovel: number;
  wCrusher: number;
  esag: number;
  cost: number;
  co2: number;
  fuel: number;
  blendP80: number;
  blendA: number;
  blendD: number;
  blendPowderFactorKgM3: number;
  active: number;
  cycles: number;
}

function toSimulationScenario(scenario: ResearchScenario): Scenario {
  return {
    id: scenario.id,
    shovels: scenario.shovelCount,
    trucks: scenario.truckCount,
    dist: [...scenario.haulDistancesM],
    rel: scenario.failureLevel,
  };
}

/**
 * Runs one article-defined replication for one selected scenario.
 * Every policy uses the same replication seed and exogenous failure schedule.
 * Movement random draws may diverge as policies create different trajectories.
 *
 * Profiles are external inputs. Each must identify P80, rock-mass index,
 * diggability and powder factor q (kg/m³) for one shovel/face.
 */
export async function runResearchSingleReplication(
  scenario: ResearchScenario,
  replicateId: number,
  profiles: FragmentationProfile[],
): Promise<ResearchPolicyResult[]> {
  if (!Number.isInteger(replicateId) || replicateId < 1 || replicateId > scenario.replicates) {
    throw new Error("El identificador de réplica debe estar entre 1 y " + scenario.replicates + ".");
  }
  if (!Array.isArray(profiles) || profiles.length !== scenario.shovelCount) {
    throw new Error("El escenario requiere exactamente un perfil externo por pala.");
  }

  const seed = (scenario.experiment === 1 ? 20000 : 30000) + replicateId;
  const policies = scenario.experiment === 1 ? EXPERIMENT_1_POLICIES : EXPERIMENT_2_POLICIES;
  const agentPolicies = policies.filter((policy) => CHECKPOINTS[policy] !== undefined);

  const loadedAgents = new Map<Policy, Agent>();
  await Promise.all(agentPolicies.map(async (policy) => {
    const checkpointId = CHECKPOINTS[policy];
    if (!checkpointId) throw new Error("No hay un checkpoint asociado a " + policy + ".");
    const loaded = await loadPPOCheckpoint(checkpointId);
    loadedAgents.set(policy, loaded.agent);
  }));

  const simulationScenario = toSimulationScenario(scenario);
  const orderedProfiles = [...profiles].sort((a, b) => a.shovelIndex - b.shovelIndex);
  const results: ResearchPolicyResult[] = [];

  for (const policy of policies) {
    const engine = new MineSimV3(seed);
    const agent = loadedAgents.get(policy);
    const result = engine.run(policy, simulationScenario, orderedProfiles, agent, false, replicateId, 0.38);
    results.push({
      policy,
      label: POLICY_LABELS[policy],
      tph: Number(result.tph),
      wShovel: Number(result.wShovel),
      wCrusher: Number(result.wCrusher),
      esag: Number(result.esag),
      cost: Number(result.cost),
      co2: Number(result.co2),
      fuel: Number(result.fuel),
      blendP80: Number(result.blendP80),
      blendA: Number(result.blendA),
      blendD: Number(result.blendD),
      blendPowderFactorKgM3: Number(result.blendPowderFactorKgM3),
      active: Number(result.active),
      cycles: Number(result.decisions),
    });
  }

  return results;
}
