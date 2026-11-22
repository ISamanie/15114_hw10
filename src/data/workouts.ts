export type EquipmentType = 'free_weight' | 'machine' | 'bodyweight';
export type WeightUnit = 'lb' | 'kg';

export interface Exercise {
  id: string;
  name: string;
  equipmentType: EquipmentType;
  muscleGroup: string;
  description: string;
  imageUri: string;
  isCustom: boolean;
  createdAt: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  unit: WeightUnit;
  totalVolume: number;
  totalSets: number;
}

export interface WorkoutExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  orderIndex: number;
}

export interface SetEntry {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  reps: number;
  /** Total logged load in kilograms. */
  weight: number;
  bodyweightLoad?: { bodyWeight: number; addedWeight: number };
  volume: number;
  isCompleted: boolean;
}

export interface WorkoutRecord {
  session: WorkoutSession;
  exercises: WorkoutExercise[];
  sets: SetEntry[];
}

export interface WorkoutData {
  exercises: Exercise[];
  sessions: WorkoutSession[];
  workoutExercises: WorkoutExercise[];
  sets: SetEntry[];
  preferredUnit: WeightUnit;
  /** Last explicitly entered body weight in kilograms. */
  preferredBodyWeight?: number;
}

export interface DraftSet {
  id: string;
  weight: string;
  reps: string;
  done: boolean;
}

export interface DraftExercise {
  id: string;
  exerciseId: string;
  bodyWeight?: string;
  sets: DraftSet[];
}

export const equipmentLabels: Record<EquipmentType, string> = {
  free_weight: 'Free Weight',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

export const equipmentTypes = Object.keys(equipmentLabels) as EquipmentType[];

// Store all weights and volumes in kilograms to compare sessions logged in different units.
const kgPerPound = 0.45359237;
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const weightInputFormat = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 12, useGrouping: false });

export function inUnit(kg: number, unit: WeightUnit) {
  return unit === 'lb' ? kg / kgPerPound : kg;
}

export function formatWeightInput(kg: number, unit: WeightUnit) {
  return weightInputFormat.format(inUnit(kg, unit));
}

export function formatNumber(value: number) {
  return numberFormat.format(value);
}

export function formatWeight(kg: number, unit: WeightUnit) {
  return `${formatNumber(inUnit(kg, unit))} ${unit}`;
}

export function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDate(key: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, options);
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
  const remainder = String(seconds % 60).padStart(2, '0');
  return hours ? `${hours}:${minutes}:${remainder}` : `${minutes}:${remainder}`;
}

export function filterExercises(exercises: Exercise[], query: string, equipment?: EquipmentType) {
  const search = query.trim().toLocaleLowerCase();
  return exercises.filter((exercise) => (
    (!equipment || exercise.equipmentType === equipment) &&
    [exercise.name, exercise.muscleGroup, equipmentLabels[exercise.equipmentType]]
      .some((field) => field.toLocaleLowerCase().includes(search))
  ));
}

export function parseWeightInput(input: string, unit: WeightUnit) {
  const decimal = input.trim().replace(',', '.');
  const weight = Number(decimal);
  if (!/^\d*\.?\d+$/.test(decimal) || !Number.isFinite(weight) || weight > 99999) return null;
  return unit === 'lb' ? weight * kgPerPound : weight;
}

export function parseDraftSet(set: DraftSet, equipment: EquipmentType, unit: WeightUnit, bodyWeightInput = '') {
  const repsText = set.reps.trim();
  const reps = Number(repsText);
  if (!/^\d+$/.test(repsText) || reps < 1 || reps > 9999) return null;

  const bodyweight = equipment === 'bodyweight';
  const weight = bodyweight && !set.weight.trim() ? 0 : parseWeightInput(set.weight, unit);
  if (weight === null) return null;
  if (!bodyweight || !bodyWeightInput.trim()) return { reps, weight };

  const bodyWeight = parseWeightInput(bodyWeightInput, unit);
  if (bodyWeight === null) return null;
  if (bodyWeight === 0) return { reps, weight };
  return { reps, weight: bodyWeight + weight, bodyweightLoad: { bodyWeight, addedWeight: weight } };
}

export function buildWorkout(
  session: Omit<WorkoutSession, 'totalVolume' | 'totalSets'>,
  drafts: DraftExercise[],
  library: Exercise[],
): WorkoutRecord {
  const exercises: WorkoutExercise[] = [];
  const sets: SetEntry[] = [];
  for (const draft of drafts) {
    const exercise = library.find((item) => item.id === draft.exerciseId);
    if (!exercise) throw new Error('An exercise in this workout could not be found.');
    const completed = draft.sets.filter((set) => set.done);
    if (!completed.length) continue;
    exercises.push({ id: draft.id, sessionId: session.id, exerciseId: exercise.id, orderIndex: exercises.length });
    completed.forEach((set, index) => {
      const values = parseDraftSet(set, exercise.equipmentType, session.unit, draft.bodyWeight);
      if (!values) {
        const fields = exercise.equipmentType === 'bodyweight' ? 'body weight, added weight, and reps' : 'weight and reps';
        throw new Error(`Check the ${fields} for ${exercise.name}.`);
      }
      sets.push({
        ...values,
        id: set.id,
        workoutExerciseId: draft.id,
        setNumber: index + 1,
        volume: values.weight * values.reps,
        isCompleted: true,
      });
    });
  }
  if (!sets.length) throw new Error('Mark at least one set done before saving.');
  return { session: { ...session, totalVolume: totalVolume(sets), totalSets: sets.length }, exercises, sets };
}

export function getWorkout(data: WorkoutData, session: WorkoutSession): WorkoutRecord {
  const exercises = data.workoutExercises.filter((exercise) => exercise.sessionId === session.id);
  const exerciseIds = new Set(exercises.map((exercise) => exercise.id));
  const sets = data.sets.filter((set) => exerciseIds.has(set.workoutExerciseId) && set.isCompleted);
  return { session, exercises, sets };
}

export function restoreDraftExercises(workout: WorkoutRecord): DraftExercise[] {
  const { unit } = workout.session;
  return workout.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex).map((exercise) => {
    const sets = workout.sets.filter((set) => set.workoutExerciseId === exercise.id).sort((a, b) => a.setNumber - b.setNumber);
    const load = sets[0]?.bodyweightLoad;
    return {
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      bodyWeight: load && formatWeightInput(load.bodyWeight, unit),
      sets: sets.map((set) => ({
        id: set.id, weight: formatWeightInput(set.bodyweightLoad?.addedWeight ?? set.weight, unit),
        reps: String(set.reps), done: true,
      })),
    };
  });
}

export function rememberedBodyWeight(data: WorkoutData) {
  if (data.preferredBodyWeight !== undefined) return data.preferredBodyWeight;

  // Older snapshots already stored body weight on completed sets.
  const weightsByBlock = new Map<string, number>();
  for (const set of data.sets) {
    if (set.isCompleted && set.bodyweightLoad) {
      weightsByBlock.set(set.workoutExerciseId, set.bodyweightLoad.bodyWeight);
    }
  }

  const completionTimes = new Map(data.sessions.map(({ id, completedAt }) => [id, Date.parse(completedAt)]));
  let latestTime = -Infinity;
  let bodyWeight: number | undefined;
  for (const block of data.workoutExercises) {
    const weight = weightsByBlock.get(block.id);
    const time = completionTimes.get(block.sessionId);
    if (weight !== undefined && time !== undefined && time >= latestTime) {
      latestTime = time;
      bodyWeight = weight;
    }
  }
  return bodyWeight;
}

export function removeWorkout(data: WorkoutData, sessionId: string): WorkoutData {
  const exerciseIds = new Set(data.workoutExercises.filter((item) => item.sessionId === sessionId).map((item) => item.id));
  return {
    ...data,
    sessions: data.sessions.filter((session) => session.id !== sessionId),
    workoutExercises: data.workoutExercises.filter((exercise) => exercise.sessionId !== sessionId),
    sets: data.sets.filter((set) => !exerciseIds.has(set.workoutExerciseId)),
  };
}

export function putWorkout(data: WorkoutData, workout: WorkoutRecord, bodyWeight?: number): WorkoutData {
  const next = removeWorkout(data, workout.session.id);
  return {
    ...next,
    sessions: [...next.sessions, workout.session],
    workoutExercises: [...next.workoutExercises, ...workout.exercises],
    sets: [...next.sets, ...workout.sets],
    preferredUnit: workout.session.unit,
    ...(bodyWeight !== undefined && { preferredBodyWeight: bodyWeight }),
  };
}

export function totalVolume(sets: SetEntry[]) {
  return sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
}

export function totalReps(sets: SetEntry[]) {
  return sets.reduce((sum, set) => sum + set.reps, 0);
}

export function bestSet(sets: SetEntry[]) {
  return sets.reduce<SetEntry | undefined>((best, set) => !best || set.weight > best.weight ? set : best, undefined);
}

export function exerciseHistory(data: WorkoutData, exerciseId: string, groupBy: 'session' | 'block' = 'session') {
  const exerciseIndex = new Map(data.workoutExercises.filter((exercise) => exercise.exerciseId === exerciseId)
    .map((exercise) => [exercise.id, exercise]));
  const groups = new Map<string, { sessionId: string; order: number; sets: SetEntry[] }>();
  for (const set of data.sets) {
    const block = exerciseIndex.get(set.workoutExerciseId);
    if (!block || !set.isCompleted) continue;
    const key = groupBy === 'block' ? block.id : block.sessionId;
    const group = groups.get(key) ?? { sessionId: block.sessionId, order: block.orderIndex, sets: [] };
    group.sets.push(set);
    groups.set(key, group);
  }
  const sessions = new Map(data.sessions.map((session) => [session.id, session]));
  return Array.from(groups).flatMap(([id, { sessionId, order, sets }]) => {
    const session = sessions.get(sessionId);
    return session ? [{ id, order, session, sets, volume: totalVolume(sets), best: bestSet(sets)! }] : [];
  }).sort((a, b) => a.session.completedAt.localeCompare(b.session.completedAt) || a.order - b.order);
}

export type HistoryEntry = ReturnType<typeof exerciseHistory>[number];

export function cutoffDate(months: number, now = new Date()) {
  const first = new Date(now.getFullYear(), now.getMonth() - months, 1);
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  first.setDate(Math.min(now.getDate(), lastDay));
  return dateKey(first);
}

export function progressSeries(history: HistoryEntry[], metric: 'best' | 'volume', unit: WeightUnit, cutoff: string) {
  let runningBest = 0;
  const points: { id: string; date: string; timestamp: number; value: number }[] = [];
  for (const { session, best, volume } of history) {
    runningBest = Math.max(runningBest, inUnit(best.weight, unit));
    if (session.date < cutoff) continue;
    points.push({ id: session.id, date: session.date, timestamp: Date.parse(session.completedAt),
      value: metric === 'best' ? runningBest : inUnit(volume, unit) });
  }
  return points;
}
