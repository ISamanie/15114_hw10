import type { EquipmentType, Exercise, WorkoutData } from './workouts';

export const exerciseIcons = {
  dumbbell: 'Dumbbell',
  barbell: 'Barbell',
  machine: 'Machine',
  body: 'Bodyweight',
  core: 'Cardio',
  plus: 'Recovery',
  legs: 'Lunge stretch',
} as const;

export type ExerciseIcon = keyof typeof exerciseIcons;

export const defaultExerciseIcons = {
  free_weight: 'dumbbell',
  machine: 'machine',
  bodyweight: 'body',
} as const satisfies Record<EquipmentType, ExerciseIcon>;

const catalog: [string, EquipmentType, string, ExerciseIcon, string][] = [
  ['Barbell Bench Press', 'free_weight', 'Chest', 'barbell', 'Plant your feet and keep your shoulder blades drawn back. Lower the bar to your chest, then press it up over your shoulders.'],
  ['Barbell Squat', 'free_weight', 'Quadriceps', 'barbell', 'Brace your torso and bend your knees and hips together. Keep your knees tracking over your toes as you stand.'],
  ['Deadlift', 'free_weight', 'Posterior chain', 'barbell', 'Hinge at the hips and grip the bar close to your shins. Push through the floor and stand tall without leaning back.'],
  ['Romanian Deadlift', 'free_weight', 'Hamstrings', 'barbell', 'Keep a soft bend in your knees and send your hips back as the bar slides down your thighs. Stand by driving your hips forward.'],
  ['Dumbbell Curl', 'free_weight', 'Biceps', 'dumbbell', 'Keep your elbows beside your ribs as you curl the dumbbells. Lower them slowly without swinging your torso.'],
  ['Dumbbell Shoulder Press', 'free_weight', 'Shoulders', 'dumbbell', 'Start with the dumbbells near shoulder height. Press overhead with your ribs down, then return under control.'],
  ['Dumbbell Row', 'free_weight', 'Back', 'dumbbell', 'Brace with one hand and keep your torso still. Pull the dumbbell toward your hip and lower until your arm is long.'],
  ['Dumbbell Lateral Raise', 'free_weight', 'Shoulders', 'dumbbell', 'With soft elbows, raise the dumbbells out to the sides to shoulder height. Lower without shrugging.'],
  ['Goblet Squat', 'free_weight', 'Quadriceps', 'dumbbell', 'Hold a dumbbell close to your chest. Sit between your hips, then drive through your whole foot to stand.'],
  ['Lat Pulldown', 'machine', 'Back', 'machine', 'Pull the bar toward your upper chest with your elbows traveling down. Extend your arms slowly without letting the stack drop.'],
  ['Leg Press', 'machine', 'Quadriceps', 'machine', 'Set both feet on the platform and lower it as far as you can keep your hips against the pad. Press through your whole foot.'],
  ['Cable Row', 'machine', 'Back', 'machine', 'Sit tall and pull the handle toward your lower ribs. Let your arms extend without rocking your torso.'],
  ['Chest Fly Machine', 'machine', 'Chest', 'machine', 'Set the handles near chest height and keep a slight bend in your elbows. Bring the handles together and return slowly.'],
  ['Leg Extension', 'machine', 'Quadriceps', 'machine', 'Align your knees with the machine pivot. Straighten your knees smoothly and lower the pad with control.'],
  ['Seated Leg Curl', 'machine', 'Hamstrings', 'machine', 'Hold your thighs against the pad. Curl your heels down and back, then return slowly.'],
  ['Cable Triceps Pushdown', 'machine', 'Triceps', 'machine', 'Keep your upper arms still and extend your elbows to press the handle down. Return until your forearms are near parallel to the floor.'],
  ['Machine Calf Raise', 'machine', 'Calves', 'machine', 'Lower your heels until you feel a stretch. Rise onto the balls of your feet and pause before lowering.'],
  ['Pull-Ups', 'bodyweight', 'Back', 'body', 'Start from a controlled hang. Drive your elbows down until your chin clears the bar, then lower fully.'],
  ['Push-Ups', 'bodyweight', 'Chest', 'body', 'Keep a straight line from shoulders to heels as you lower your chest. Press the floor away without letting your hips sag.'],
  ['Dips', 'bodyweight', 'Triceps', 'body', 'Support yourself on parallel bars and bend your elbows to a comfortable depth. Press back up with your shoulders steady.'],
  ['Planks', 'bodyweight', 'Core', 'body', 'Keep your elbows under your shoulders and brace your abdomen. Count each completed hold as one rep.'],
  ['Reverse Lunges', 'bodyweight', 'Glutes', 'body', 'Step one foot back and lower both knees. Drive through the front foot to return to standing.'],
  ['Glute Bridges', 'bodyweight', 'Glutes', 'body', 'Lie on your back with your feet planted. Squeeze your glutes to lift your hips without arching your lower back.'],
  ['Hanging Knee Raises', 'bodyweight', 'Core', 'body', 'Hang with steady shoulders and curl your knees toward your chest. Lower slowly without swinging.'],
];

const builtIns: Exercise[] = catalog.map(([name, equipmentType, muscleGroup, icon, description]) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  equipmentType,
  muscleGroup,
  description,
  imageUri: `icon:${icon}`,
  isCustom: false,
  createdAt: '2026-01-01T00:00:00.000Z',
}));

const builtInThumbnails = new Map(builtIns.map(({ id, imageUri }) => [id, imageUri]));

export function refreshBuiltInExerciseIcon(exercise: Exercise): Exercise {
  if (exercise.isCustom || !exercise.imageUri.startsWith('icon:')) return exercise;
  const imageUri = builtInThumbnails.get(exercise.id);
  return imageUri && imageUri !== exercise.imageUri ? { ...exercise, imageUri } : exercise;
}

export function initialData(): WorkoutData {
  return { exercises: builtIns, sessions: [], workoutExercises: [], sets: [], preferredUnit: 'lb' };
}
