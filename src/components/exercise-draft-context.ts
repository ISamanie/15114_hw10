import { createContext } from 'react';

import type { ExerciseDraft } from '@/data/exercise-draft';

export const RecoveredExerciseDraft = createContext<ExerciseDraft | null>(null);
