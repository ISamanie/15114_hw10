import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseRow } from '@/components/exercise-row';
import { Action, Chips, Empty, SearchField, ui } from '@/components/tracker-ui';
import { useWorkouts } from '@/data/workout-store';
import { equipmentLabels, equipmentTypes, filterExercises, type EquipmentType, type Exercise } from '@/data/workouts';

const categories = [{ value: 'all' as const, label: 'All' }, ...equipmentTypes.map((value) => ({ value, label: equipmentLabels[value] }))];

export default function DataScreen() {
  const { data, recentExerciseIds, visitExercise } = useWorkouts();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<EquipmentType | 'all'>('all');
  const { bottom } = useSafeAreaInsets();
  const matches = useMemo(() => filterExercises(data?.exercises ?? [], query, category === 'all' ? undefined : category)
    .sort((a, b) => a.name.localeCompare(b.name)), [data?.exercises, category, query]);
  const recent = query.trim() ? [] : recentExerciseIds.flatMap((id) => {
    const exercise = matches.find((item) => item.id === id);
    return exercise ? [exercise] : [];
  });

  function openExercise(exercise: Exercise) {
    visitExercise(exercise.id);
    router.push({ pathname: '/exercise/[id]', params: { id: exercise.id } });
  }

  return (
    <FlatList data={matches} keyExtractor={(exercise) => exercise.id} style={ui.canvas}
      contentContainerStyle={[ui.page, styles.list, { paddingBottom: Math.max(bottom, 16) + 16 }]}
      contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      renderItem={({ item }) => <ExerciseRow exercise={item} onPress={() => openExercise(item)} />}
      ListHeaderComponent={(
        <View style={styles.header}>
          <View style={[ui.row, ui.spread]}>
            <Text accessibilityRole="header" style={[ui.h2, ui.flex]}>Exercise library</Text>
            <Action label="New Exercise" icon="plus" variant="outline" onPress={() => router.push('/create-exercise')} />
          </View>
          <SearchField query={query} onChange={setQuery} />
          {!!recent.length && <View>
            <Text accessibilityRole="header" style={ui.h3}>Recently viewed</Text>
            {recent.map((exercise) => <ExerciseRow key={exercise.id} exercise={exercise} onPress={() => openExercise(exercise)} />)}
          </View>}
          <Chips options={categories} value={category} onChange={setCategory} label="Equipment filter" />
          <Text accessibilityLiveRegion="polite" style={[ui.muted, ui.numeric]}>
            {matches.length} {matches.length === 1 ? 'exercise' : 'exercises'}
          </Text>
        </View>
      )}
      ListEmptyComponent={<Empty title="No matching exercises" detail="Try another search or equipment filter." icon="search" />}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: 14, paddingBottom: 4 },
  list: { gap: 0 },
});
