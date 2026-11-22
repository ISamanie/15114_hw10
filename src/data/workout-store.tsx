import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import Storage from 'expo-sqlite/kv-store';

import { DamagedWorkoutSnapshot, loadWorkoutState, saveRecentExercises, workoutKey } from './workout-persistence';
import { putWorkout, removeWorkout, type Exercise, type WorkoutData, type WorkoutRecord } from './workouts';

type WorkoutStore = {
  data: WorkoutData | null;
  recentExerciseIds: string[];
  loadError: 'damaged' | 'unavailable' | null;
  retry: () => void;
  recover: () => void;
  addExercise: (exercise: Exercise) => Promise<void>;
  saveWorkout: (workout: WorkoutRecord, bodyWeight?: number) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  visitExercise: (id: string) => void;
};

const Store = createContext<WorkoutStore | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkoutData | null>(null);
  const [recentExerciseIds, setRecentExerciseIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<WorkoutStore['loadError']>(null);
  const [attempt, setAttempt] = useState({ recover: false });
  const current = useRef<WorkoutData | null>(null);
  const currentRecents = useRef<string[]>([]);
  const writeQueue = useRef(Promise.resolve());
  const recentQueue = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data: snapshot, recents } = await loadWorkoutState(Storage, attempt.recover);
        if (!active) return;
        current.current = snapshot;
        currentRecents.current = recents;
        setData(snapshot);
        setRecentExerciseIds(recents);
      } catch (error) {
        if (active) setLoadError(error instanceof DamagedWorkoutSnapshot ? 'damaged' : 'unavailable');
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
      await Storage.setItem(workoutKey, JSON.stringify(next));
      current.current = next;
      setData(next);
    });
    writeQueue.current = operation.catch(() => undefined);
    return operation;
  }

  function visitExercise(id: string) {
    if (currentRecents.current[0] === id) return;
    const next = [id, ...currentRecents.current.filter((item) => item !== id)].slice(0, 5);
    currentRecents.current = next;
    setRecentExerciseIds(next);
    recentQueue.current = recentQueue.current.then(() => saveRecentExercises(Storage, next))
      .catch(() => undefined);
  }

  return (
    <Store value={{
      data,
      recentExerciseIds,
      loadError,
      retry: () => { setLoadError(null); setAttempt({ recover: false }); },
      recover: () => { setLoadError(null); setAttempt({ recover: true }); },
      addExercise: async (exercise) => {
        await update((snapshot) => snapshot.exercises.some(({ id }) => id === exercise.id)
          ? snapshot : { ...snapshot, exercises: [...snapshot.exercises, exercise] });
        visitExercise(exercise.id);
      },
      saveWorkout: (workout, bodyWeight) => update((snapshot) => putWorkout(snapshot, workout, bodyWeight)),
      deleteWorkout: (id) => update((snapshot) => removeWorkout(snapshot, id)),
      visitExercise,
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
