export type ResearchExperiment = 1 | 2;
export type FailureLevel = "none" | "moderate" | "severe";
export type FragmentationPattern = "homogeneous" | "heterogeneous";
export type FineOrientation = "not_applicable" | "fine_far" | "fine_near";

export interface ResearchScenario {
  id: string;
  experiment: ResearchExperiment;
  shovelCount: 2 | 4;
  truckCount: 8 | 9 | 16 | 18;
  failureLevel: FailureLevel;
  fragmentationPattern: FragmentationPattern;
  fineOrientation: FineOrientation;
  haulDistancesM: number[];
  /**
   * Relative offsets as fractions (0.06 = +6%). These describe the scenario;
   * imported per-shovel profiles must already include their measured/precomputed
   * rockMassIndex. The offsets are not applied again by the profiled engine.
   */
  rockMassOffsets: number[];
  replicates: 300;
  shiftHours: 8;
}

const TOPOLOGIES = [
  { id: "2p8c", shovelCount: 2 as const, truckCount: 8 as const, haulDistancesM: [2400, 3100], rockMassOffsets: [0.06, -0.05] },
  { id: "2p9c", shovelCount: 2 as const, truckCount: 9 as const, haulDistancesM: [2400, 3100], rockMassOffsets: [0.06, -0.05] },
  { id: "4p16c", shovelCount: 4 as const, truckCount: 16 as const, haulDistancesM: [2000, 2600, 3200, 3800], rockMassOffsets: [0.10, 0.03, -0.04, -0.10] },
  { id: "4p18c", shovelCount: 4 as const, truckCount: 18 as const, haulDistancesM: [2000, 2600, 3200, 3800], rockMassOffsets: [0.10, 0.03, -0.04, -0.10] },
] as const;
const FAILURE_LEVELS: FailureLevel[] = ["none", "moderate", "severe"];

function makeScenario(
  experiment: ResearchExperiment,
  topology: typeof TOPOLOGIES[number],
  failureLevel: FailureLevel,
  pattern: FragmentationPattern,
  orientation: FineOrientation,
  suffix: "hom" | "het" | "hetnear"
): ResearchScenario {
  return {
    id: topology.id + "_" + failureLevel + "_" + suffix,
    experiment,
    shovelCount: topology.shovelCount,
    truckCount: topology.truckCount,
    failureLevel,
    fragmentationPattern: pattern,
    fineOrientation: orientation,
    haulDistancesM: [...topology.haulDistancesM],
    rockMassOffsets: [...topology.rockMassOffsets],
    replicates: 300,
    shiftHours: 8,
  };
}

const experiment1 = TOPOLOGIES.flatMap((topology) =>
  FAILURE_LEVELS.flatMap((failureLevel) => [
    makeScenario(1, topology, failureLevel, "homogeneous", "not_applicable", "hom"),
    makeScenario(1, topology, failureLevel, "heterogeneous", "fine_far", "het"),
  ])
);

// Exp. 2 reuses the twelve heterogeneous scenarios with fine faces far away,
// then adds the corresponding twelve cases with the fine-face orientation reversed.
const experiment2 = TOPOLOGIES.flatMap((topology) =>
  FAILURE_LEVELS.flatMap((failureLevel) => [
    makeScenario(2, topology, failureLevel, "heterogeneous", "fine_far", "het"),
    makeScenario(2, topology, failureLevel, "heterogeneous", "fine_near", "hetnear"),
  ])
);

export const M3_RESEARCH_SCENARIOS: ResearchScenario[] = [...experiment1, ...experiment2];

export function getResearchScenarios(experiment: ResearchExperiment): ResearchScenario[] {
  return M3_RESEARCH_SCENARIOS.filter((scenario) => scenario.experiment === experiment);
}

export function getResearchScenario(id: string): ResearchScenario | undefined {
  return M3_RESEARCH_SCENARIOS.find((scenario) => scenario.id === id);
}
