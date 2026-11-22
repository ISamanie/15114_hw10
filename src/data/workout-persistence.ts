import { initialData, refreshBuiltInExerciseIcon } from './exercises.ts';
import { equipmentLabels, type Exercise, type SetEntry, type WorkoutData, type WorkoutExercise, type WorkoutSession } from './workouts.ts';

export const workoutKey = 'workout-tracker:v1';
export const recentKey = 'workout-tracker:recent-exercises:v1';

type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export function saveRecentExercises(storage: Pick<Storage, 'setItem'>, ids: string[]) {
  return storage.setItem(recentKey, JSON.stringify(ids));
}

export class DamagedWorkoutSnapshot extends Error {
  constructor() {
    super('Workout data has an invalid format.');
  }
}

function parseJson(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return null; }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isTimestamp(value: unknown): value is string {
  return isString(value) && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
}

function isDate(value: unknown): value is string {
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
}

function isNonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isCount(value: unknown): value is number {
  return isNonnegative(value) && Number.isSafeInteger(value);
}

function isImageUri(value: unknown): value is string {
  if (!isString(value)) return false;
  if (!value.startsWith('photo:')) return true;
  const name = value.slice(6);
  return /^[a-z\d._-]+$/i.test(name) && name !== '.' && name !== '..';
}

function isExercise(value: unknown): value is Exercise {
  return isObject(value) && isString(value.id) && isString(value.name) && isString(value.muscleGroup)
    && isString(value.description) && isImageUri(value.imageUri) && typeof value.isCustom === 'boolean'
    && isTimestamp(value.createdAt) && typeof value.equipmentType === 'string' && Object.hasOwn(equipmentLabels, value.equipmentType);
}

function isSession(value: unknown): value is WorkoutSession {
  return isObject(value) && isString(value.id) && isDate(value.date)
    && isTimestamp(value.startedAt) && isTimestamp(value.completedAt) && isCount(value.durationSeconds)
    && (value.unit === 'lb' || value.unit === 'kg') && isNonnegative(value.totalVolume) && isCount(value.totalSets);
}

function isBlock(value: unknown): value is WorkoutExercise {
  return isObject(value) && isString(value.id) && isString(value.sessionId)
    && isString(value.exerciseId) && isCount(value.orderIndex);
}

function isSet(value: unknown): value is SetEntry {
  return isObject(value) && isString(value.id) && isString(value.workoutExerciseId)
    && isCount(value.setNumber) && value.setNumber > 0 && isCount(value.reps) && value.reps > 0
    && isNonnegative(value.weight) && isNonnegative(value.volume) && Number.isFinite(value.weight * value.reps)
    && typeof value.isCompleted === 'boolean'
    && isBodyweightLoad(value.bodyweightLoad, value.weight);
}

function isBodyweightLoad(value: unknown, totalWeight: number) {
  return value === undefined || (isObject(value) && isNonnegative(value.bodyWeight) && value.bodyWeight > 0
    && isNonnegative(value.addedWeight) && value.bodyWeight + value.addedWeight === totalWeight);
}

function recentIds(value: unknown, exercises: Exercise[]) {
  if (!Array.isArray(value)) return [];
  const exerciseIds = new Set(exercises.map(({ id }) => id));
  return Array.from(new Set(value.filter((id): id is string => typeof id === 'string' && exerciseIds.has(id)))).slice(0, 5);
}

function parseSnapshot(raw: string, recover: boolean) {
  const parsed = parseJson(raw);
  const snapshot = isObject(parsed) ? parsed : {};
  let damaged = false;
  function records<T extends { id: string }>(field: string, validate: (value: unknown) => value is T) {
    const values = snapshot[field];
    const valid = new Map<string, T>();
    if (Array.isArray(values)) {
      for (const value of values) {
        if (validate(value) && !valid.has(value.id)) valid.set(value.id, value);
      }
    }
    if (!Array.isArray(values) || valid.size !== values.length) damaged = true;
    return valid;
  }

  const exercises = records('exercises', isExercise);
  if (recover) {
    for (const exercise of initialData().exercises) {
      if (!exercises.has(exercise.id)) exercises.set(exercise.id, exercise);
    }
  }
  const sessions = records('sessions', isSession);
  const blocks = records('workoutExercises', (value): value is WorkoutExercise =>
    isBlock(value) && exercises.has(value.exerciseId) && sessions.has(value.sessionId));
  const sets = records('sets', (value): value is SetEntry => isSet(value) && blocks.has(value.workoutExerciseId));
  const unit = snapshot.preferredUnit;
  const bodyWeight = snapshot.preferredBodyWeight;
  if (unit !== 'lb' && unit !== 'kg') damaged = true;
  if (damaged && !recover) throw new DamagedWorkoutSnapshot();

  const data: WorkoutData = {
    exercises: Array.from(exercises.values(), refreshBuiltInExerciseIcon),
    sessions: Array.from(sessions.values()),
    workoutExercises: Array.from(blocks.values()),
    sets: Array.from(sets.values()),
    preferredUnit: unit === 'kg' ? 'kg' : 'lb',
    ...(isNonnegative(bodyWeight) && bodyWeight > 0 && { preferredBodyWeight: bodyWeight }),
  };
  if (damaged) {
    const totals = new Map<string, { totalSets: number; totalVolume: number }>();
    for (const set of data.sets) {
      set.volume = set.weight * set.reps;
      if (!set.isCompleted) continue;
      const sessionId = blocks.get(set.workoutExerciseId)!.sessionId;
      const total = totals.get(sessionId) ?? { totalSets: 0, totalVolume: 0 };
      total.totalSets++;
      total.totalVolume += set.volume;
      totals.set(sessionId, total);
    }
    data.sessions = data.sessions.map((session) => ({
      ...session,
      ...(totals.get(session.id) ?? { totalSets: 0, totalVolume: 0 }),
    }));
  }

  return { data, damaged, legacyRecents: snapshot.recentExerciseIds };
}

export async function loadWorkoutState(storage: Storage, recover = false) {
  const raw = await storage.getItem(workoutKey);
  const snapshot = raw === null ? null : parseSnapshot(raw, recover);
  const data = snapshot?.data ?? initialData();
  if (raw !== null && snapshot?.damaged) {
    await storage.setItem(`${workoutKey}:backup:${new Date().toISOString()}`, raw);
  }
  const storedRecents = await storage.getItem(recentKey);
  const recents = recentIds(storedRecents === null ? snapshot?.legacyRecents : parseJson(storedRecents), data.exercises);
  if (storedRecents === null && recents.length) await saveRecentExercises(storage, recents);
  if (raw === null || snapshot?.damaged) await storage.setItem(workoutKey, JSON.stringify(data));
  return { data, recents };
}
