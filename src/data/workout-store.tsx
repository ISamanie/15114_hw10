import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import Storage from 'expo-sqlite/kv-store';

import { initialData } from './exercises';
import { putWorkout, removeWorkout, type Exercise, type WorkoutData, type WorkoutRecord } from './workouts';

const storageKey = 'workout-tracker:v1';

type WorkoutStore = {
  data: WorkoutData | null;
  loadError: boolean;
  retry: () => void;
  addExercise: (exercise: Exercise) => Promise<void>;
  saveWorkout: (workout: WorkoutRecord) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  visitExercise: (id: string) => void;
};

const Store = createContext<WorkoutStore | null>(null);

function readSnapshot(raw: string): WorkoutData {
  const snapshot: Partial<WorkoutData> | null = JSON.parse(raw);
  if (!snapshot || !Array.isArray(snapshot.exercises) || !Array.isArray(snapshot.sessions) ||
    !Array.isArray(snapshot.workoutExercises) || !Array.isArray(snapshot.sets) ||
    !Array.isArray(snapshot.recentExerciseIds) || (snapshot.preferredUnit !== 'lb' && snapshot.preferredUnit !== 'kg')) {
    throw new Error('Workout data has an invalid format.');
  }
  return {
    exercises: snapshot.exercises,
    sessions: snapshot.sessions,
    workoutExercises: snapshot.workoutExercises,
    sets: snapshot.sets,
    recentExerciseIds: snapshot.recentExerciseIds,
    preferredUnit: snapshot.preferredUnit,
  };
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkoutData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const current = useRef<WorkoutData | null>(null);
  const writeQueue = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const raw = await Storage.getItem(storageKey);
        const snapshot = raw === null ? initialData() : readSnapshot(raw);
        if (raw === null) await Storage.setItem(storageKey, JSON.stringify(snapshot));
        if (!active) return;
        current.current = snapshot;
        setData(snapshot);
      } catch {
        if (active) setLoadError(true);
      }
    }
    void load();
    return () => { active = false; };
  }, [attempt]);

  function update(transform: (data: WorkoutData) => WorkoutData) {
    const operation = writeQueue.current.then(async () => {
      if (!current.current) throw new Error('Workout data is still loading.');
      const next = transform(current.current);
      if (next === current.current) return;
      await Storage.setItem(storageKey, JSON.stringify(next));
      current.current = next;
      setData(next);
    });
    writeQueue.current = operation.catch(() => undefined);
    return operation;
  }

  return (
    <Store value={{
      data,
      loadError,
      retry: () => { setLoadError(false); setAttempt((value) => value + 1); },
      addExercise: (exercise) => update((snapshot) => ({
        ...snapshot,
        exercises: snapshot.exercises.some(({ id }) => id === exercise.id)
          ? snapshot.exercises : [...snapshot.exercises, exercise],
        recentExerciseIds: [exercise.id, ...snapshot.recentExerciseIds.filter((id) => id !== exercise.id)].slice(0, 5),
      })),
      saveWorkout: (workout) => update((snapshot) => putWorkout(snapshot, workout)),
      deleteWorkout: (id) => update((snapshot) => removeWorkout(snapshot, id)),
      visitExercise: (id) => {
        void update((snapshot) => snapshot.recentExerciseIds[0] === id ? snapshot : ({
          ...snapshot,
          recentExerciseIds: [id, ...snapshot.recentExerciseIds.filter((item) => item !== id)].slice(0, 5),
        })).catch(() => undefined);
      },
    }}>
      {children}
    </Store>
  );
}

export function useWorkouts() {
  const store = use(Store);
  if (!store) throw new Error('WorkoutProvider is missing.');
  return store;
}
