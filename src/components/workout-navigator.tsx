import { getPendingResultAsync } from 'expo-image-picker';
import { router, useNavigationContainerRef, usePathname } from 'expo-router';
import { Stack } from 'expo-router/stack';
import Storage from 'expo-sqlite/kv-store';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';
import { recoverExerciseDraft, type ExerciseDraft } from '@/data/exercise-draft';
import { useWorkouts } from '@/data/workout-store';
import { RecoveredExerciseDraft } from './exercise-draft-context';
import { Action, Loading, ui } from './tracker-ui';

export function WorkoutNavigator() {
  const { data, loadError, recover, retry } = useWorkouts();
  const [draft, setDraft] = useState<ExerciseDraft | null | undefined>(
    process.env.EXPO_OS === 'android' ? undefined : null,
  );
  const recoveryRequest = useRef<Promise<ExerciseDraft | null> | undefined>(undefined);
  const openedRecovery = useRef(false);
  const navigationRef = useNavigationContainerRef();
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.EXPO_OS !== 'android') return;
    let active = true;
    recoveryRequest.current ??= recoverExerciseDraft(Storage, getPendingResultAsync).catch(() => null);
    void recoveryRequest.current.then((restored) => { if (active) setDraft(restored); });
    return () => { active = false; };
  }, []);

  const draftAlreadySaved = !!draft && data?.exercises.some(({ id }) => id === draft.id);
  useEffect(() => {
    if (!data || !draft || draftAlreadySaved || openedRecovery.current) return;
    const target = { pathname: '/create-exercise', params: { restore: draft.id } } as const;
    const openDraft = () => {
      if (!navigationRef.isReady() || openedRecovery.current) return;
      openedRecovery.current = true;
      if (pathname === '/create-exercise') router.replace(target);
      else router.push(target);
    };
    const stopListening = navigationRef.addListener('state', openDraft);
    openDraft();
    return stopListening;
  }, [data, draft, draftAlreadySaved, navigationRef, pathname]);

  if (loadError) {
    const damaged = loadError === 'damaged';
    return (
      <View style={[ui.loading, { padding: 24, gap: 12 }]}>
        <Text style={[ui.h2, ui.center]}>{damaged ? 'Workout data needs recovery' : 'Couldn’t load workout data'}</Text>
        {damaged && <Text style={[ui.muted, ui.center]}>Recover valid records and keep a local backup of the original data.</Text>}
        {damaged && <Action label="Recover Data" onPress={() => Alert.alert('Recover workout data?',
          'Valid records will be restored. The original copy will stay backed up on this device.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Recover', onPress: recover },
          ])} />}
        <Action label="Try Again" variant={damaged ? 'outline' : 'primary'} onPress={retry} />
      </View>
    );
  }
  if (!data || draft === undefined) return <Loading />;

  return (
    <RecoveredExerciseDraft value={draft}>
      <Stack screenOptions={{ headerTintColor: Palette.text, headerShadowVisible: false,
        headerStyle: { backgroundColor: Palette.canvas }, contentStyle: { backgroundColor: Palette.canvas } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="data" options={{ title: 'Exercise Data' }} />
        <Stack.Screen name="exercise/[id]" options={{ title: 'Exercise' }} />
        <Stack.Screen name="workout-tracker" options={{ title: 'Workout', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="create-exercise" options={{ title: 'New Exercise', presentation: 'modal' }} />
        <Stack.Screen name="workout-review" options={{ title: 'Workout Review', presentation: 'modal' }} />
      </Stack>
    </RecoveredExerciseDraft>
  );
}
