import type { FragmentationProfile } from './engineV3Profiled';

export interface FragmentationProfileSet {
  schemaVersion: 2;
  source: string;
  scenarioId: string;
  replicateId: number;
  profiles: FragmentationProfile[];
}

export function parseFragmentationProfileSet(value: unknown, expectedScenarioId?: string): FragmentationProfileSet {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('El archivo debe contener un objeto JSON.');
  const input = value as Partial<FragmentationProfileSet>;
  if (input.schemaVersion !== 2) throw new Error('Versión de esquema de perfiles no compatible; se requiere schemaVersion 2.');
  if (typeof input.source !== 'string' || !input.source.trim()) throw new Error('Debe indicarse la fuente de los perfiles.');
  if (typeof input.scenarioId !== 'string' || !input.scenarioId.trim()) throw new Error('Debe indicarse el escenario.');
  if (expectedScenarioId && input.scenarioId !== expectedScenarioId) throw new Error('El archivo de perfiles pertenece a otro escenario.');
  const replicateId = input.replicateId;
  if (typeof replicateId !== 'number' || !Number.isInteger(replicateId) || replicateId < 1 || replicateId > 300) throw new Error('El identificador de réplica debe estar entre 1 y 300.');
  const allowedSetKeys = ['schemaVersion', 'source', 'scenarioId', 'replicateId', 'profiles'];
  if (Object.keys(input).some((key) => !allowedSetKeys.includes(key))) throw new Error('El archivo contiene propiedades no admitidas.');
  if (!Array.isArray(input.profiles) || input.profiles.length < 1) throw new Error('No se recibieron perfiles por frente.');
  const profiles = input.profiles as FragmentationProfile[];
  const ids = new Set<string>();
  for (const [index, profile] of profiles.entries()) {
    if (!profile || typeof profile.faceId !== 'string' || !profile.faceId.trim() || ids.has(profile.faceId)) {
      throw new Error(`Identificador de frente inválido o repetido en la fila ${index + 1}.`);
    }
    ids.add(profile.faceId);
    const allowedKeys = ['shovelIndex', 'faceId', 'p80Mm', 'rockMassIndex', 'diggability', 'powderFactorKgM3'];
    if (!Number.isInteger(profile.shovelIndex) || profile.shovelIndex < 0 || profile.shovelIndex >= profiles.length || profiles.some((other, otherIndex) => otherIndex !== index && other.shovelIndex === profile.shovelIndex)) {
      throw new Error(`Perfil ${profile.faceId}: shovelIndex debe identificar una pala única entre 0 y ${profiles.length - 1}.`);
    }
    if (Object.keys(profile).some((key) => !allowedKeys.includes(key))) throw new Error(`Perfil ${profile.faceId}: contiene campos que no pertenecen al esquema v2.`);
    const bounds: Array<[keyof FragmentationProfile, number, number, number]> = [
      ['p80Mm', profile.p80Mm, 5, 1500],
      ['rockMassIndex', profile.rockMassIndex, 1, 14],
      ['diggability', profile.diggability, 0, 100],
      ['powderFactorKgM3', profile.powderFactorKgM3, Number.MIN_VALUE, Number.MAX_VALUE],
    ];
    for (const [field, number, min, max] of bounds) {
      if (!Number.isFinite(number) || number < min || number > max) {
        throw new Error(`Perfil ${profile.faceId}: ${field} debe estar entre ${min} y ${max}.`);
      }
    }
  }
  return { schemaVersion: 2, source: input.source, scenarioId: input.scenarioId, replicateId, profiles };
}

export function toEngineProfiles(set: FragmentationProfileSet, shovelCount: number): FragmentationProfile[] {
  if (set.profiles.length !== shovelCount) throw new Error(`El escenario requiere ${shovelCount} perfiles, recibidos ${set.profiles.length}.`);
  return [...set.profiles].sort((a, b) => a.shovelIndex - b.shovelIndex).map((profile) => ({ ...profile }));
}
