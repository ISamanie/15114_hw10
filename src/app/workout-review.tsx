import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ExerciseThumbnail } from '@/components/exercise-row';
import { Action, Empty, ErrorText, Screen, ui } from '@/components/tracker-ui';
import { Palette } from '@/constants/theme';
import { useWorkouts } from '@/data/workout-store';
import { formatDate, formatDuration, formatWeight, getWorkout, totalReps, totalVolume } from '@/data/workouts';

export default function WorkoutReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { data, deleteWorkout } = useWorkouts();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const session = data?.sessions.find((item) => item.id === id);

  if (!data || !session) return <Screen><Empty title="Workout unavailable" />
    <Action label="Back to Training Log" onPress={() => router.dismissTo('/')} /></Screen>;

  const workout = getWorkout(data, session);
  const volume = totalVolume(workout.sets);

  function confirmDelete() {
    Alert.alert('Delete this workout?', 'Its sets will be removed from your calendar and exercise history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (busy.current) return;
        busy.current = true;
        setDeleting(true);
        setError('');
        try {
          await deleteWorkout(id);
          if (navigation.isFocused()) router.dismissTo('/');
        } catch {
          setError('Couldn’t delete the workout. Try again.');
        } finally {
          busy.current = false;
          setDeleting(false);
        }
      } },
    ]);
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={ui.h2}>{formatDate(session.date, { dateStyle: 'full' })}</Text>
        <Text style={[ui.muted, ui.numeric]}>{formatDuration(session.durationSeconds)} · {workout.sets.length} completed sets</Text>
      </View>
      <View style={[ui.card, styles.summary]}>
        <Text style={ui.muted}>Session volume</Text>
        <Text style={[ui.h1, ui.numeric]}>{formatWeight(volume, session.unit)}</Text>
        {volume === 0 && <Text style={[ui.emphasis, ui.numeric]}>{totalReps(workout.sets)} total reps</Text>}
      </View>
      {workout.exercises.sort((a, b) => a.orderIndex - b.orderIndex).map((entry) => {
        const exercise = data.exercises.find((item) => item.id === entry.exerciseId);
        const sets = workout.sets.filter((set) => set.workoutExerciseId === entry.id).sort((a, b) => a.setNumber - b.setNumber);
        if (!exercise) return null;
        return (
          <View key={entry.id} style={[ui.card, styles.exercise]}>
            <View style={ui.row}>
              <ExerciseThumbnail equipment={exercise.equipmentType} imageUri={exercise.imageUri} />
              <Text style={[ui.h3, ui.flex]}>{exercise.name}</Text>
            </View>
            {sets.map((set) => <View key={set.id} style={[ui.row, ui.spread, styles.set]}>
              <Text style={ui.muted}>Set {set.setNumber}</Text>
              <Text style={[ui.emphasis, ui.numeric]}>{set.reps} reps{set.weight > 0 ? ` · ${formatWeight(set.weight, session.unit)}` : ''}</Text>
            </View>)}
          </View>
        );
      })}
      {!!error && <ErrorText>{error}</ErrorText>}
      <Action label="Edit Workout" variant="outline" disabled={deleting}
        onPress={() => router.push({ pathname: '/workout-tracker', params: { edit: id } })} />
      <Action label={deleting ? 'Deleting…' : 'Delete Workout'} icon="trash" variant="danger" disabled={deleting} onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 4 },
  summary: { backgroundColor: Palette.mint, padding: 16, gap: 4 },
  exercise: { padding: 14, gap: 10 },
  set: { borderTopWidth: 1, borderTopColor: Palette.border, paddingTop: 8 },
});
