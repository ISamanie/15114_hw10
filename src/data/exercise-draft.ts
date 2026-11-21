import type { ImagePickerAsset, ImagePickerErrorResult, ImagePickerResult } from 'expo-image-picker';

import { exerciseIcons, type ExerciseIcon } from './exercises.ts';
import { equipmentLabels, type EquipmentType } from './workouts.ts';

export const exerciseDraftKey = 'workout-tracker:exercise-picker-draft:v1';

export type ExercisePhoto = Pick<ImagePickerAsset, 'uri' | 'fileName'>;

export type ExerciseDraft = {
  id: string;
  name: string;
  equipment: EquipmentType;
  muscle: string;
  description: string;
  icon: ExerciseIcon;
  photo?: ExercisePhoto;
  photoError?: string;
};

function readDraft(raw: string | null): ExerciseDraft | null {
  if (!raw) return null;
  try {
    const draft: Partial<ExerciseDraft> | null = JSON.parse(raw);
    if (!draft || typeof draft.id !== 'string' || !/^[a-z\d-]+$/i.test(draft.id) || typeof draft.name !== 'string' ||
      typeof draft.muscle !== 'string' || typeof draft.description !== 'string' || typeof draft.icon !== 'string' ||
      !Object.hasOwn(exerciseIcons, draft.icon) || typeof draft.equipment !== 'string' || !Object.hasOwn(equipmentLabels, draft.equipment) ||
      (draft.photo !== undefined && (!draft.photo || typeof draft.photo.uri !== 'string' || !draft.photo.uri ||
        (draft.photo.fileName != null && typeof draft.photo.fileName !== 'string')))) return null;
    return {
      id: draft.id, name: draft.name, muscle: draft.muscle, description: draft.description,
      icon: draft.icon, equipment: draft.equipment, photo: draft.photo,
      photoError: typeof draft.photoError === 'string' ? draft.photoError : undefined,
    };
  } catch {
    return null;
  }
}

type DraftStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export async function recoverExerciseDraft(storage: DraftStorage,
  getPendingResult: () => Promise<ImagePickerResult | ImagePickerErrorResult | null>): Promise<ExerciseDraft | null> {
  const draft = readDraft(await storage.getItem(exerciseDraftKey));
  if (!draft) return null;
  const photoError = 'Couldn’t recover the selected photo. Choose it again or pick an icon.';
  let result;
  try {
    result = await getPendingResult();
  } catch {
    result = { code: 'picker-recovery', message: photoError };
  }
  if (result && 'code' in result) draft.photoError = photoError;
  else if (result?.assets?.[0]) {
    const { uri, fileName } = result.assets[0];
    draft.photo = { uri, fileName };
    draft.photoError = undefined;
  }
  // Reading a native pending result consumes it. Keep it available until the form opens.
  await storage.setItem(exerciseDraftKey, JSON.stringify(draft)).catch(() => undefined);
  return draft;
}
