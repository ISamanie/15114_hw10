import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseThumbnail } from '@/components/exercise-row';
import { ProgressChart } from '@/components/progress-chart';
import { Action, Empty, Screen, ui } from '@/components/tracker-ui';
import { Palette, Radius } from '@/constants/theme';
import { useWorkouts } from '@/data/workout-store';
import { bestSet, equipmentLabels, exerciseHistory, formatDate, formatWeight, type SetEntry } from '@/data/workouts';

function setSummary(sets: SetEntry[]) {
  const groups: { reps: number; count: number }[] = [];
  for (const set of sets) {
    const previous = groups.at(-1);
    if (previous?.reps === set.reps) previous.count++;
    else groups.push({ reps: set.reps, count: 1 });
  }
  return groups.map(({ count, reps }) => `${count} × ${reps}`).join(', ');
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkouts();
  const { bottom } = useSafeAreaInsets();
  const exercise = data?.exercises.find((item) => item.id === id);
  const history = useMemo(() => data ? exerciseHistory(data, id) : [], [data, id]);
  const appearances = useMemo(() => data ? exerciseHistory(data, id, 'block').reverse() : [], [data, id]);
  if (!data || !exercise) return <Screen><Empty title="Exercise unavailable" />
    <Action label="Back to Exercise Data" onPress={() => router.dismissTo('/data')} /></Screen>;

  const unit = data.preferredUnit;
  const best = bestSet(history.map((entry) => entry.best));
  const weighted = (best?.weight ?? 0) > 0;
  const maxReps = history.reduce((max, entry) => entry.sets.reduce((current, set) => Math.max(current, set.reps), max), 0);
  const lifetimeVolume = history.reduce((sum, item) => sum + item.volume, 0);
  const sessionVolumes = new Map(history.map((entry) => [entry.session.id, entry.volume]));
  const bestLabel = best ? (weighted ? formatWeight(best.weight, unit) : `${maxReps} reps`) : '—';

  return (
    <FlatList data={appearances} keyExtractor={(entry) => entry.id} style={ui.canvas}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[ui.page, styles.list, { paddingBottom: Math.max(bottom, 16) + 16 }]}
      ListHeaderComponent={(
        <View style={styles.overview}>
          <View style={styles.hero}>
            <View style={styles.heroHeading}>
              <ExerciseThumbnail equipment={exercise.equipmentType} imageUri={exercise.imageUri} size={68} />
              <View style={[ui.flex, styles.heroText]}>
                <View style={styles.badge}><Text style={styles.badgeText}>{equipmentLabels[exercise.equipmentType]}</Text></View>
                <Text accessibilityRole="header" style={styles.title}>{exercise.name}</Text>
                <Text style={ui.muted}>{exercise.muscleGroup}</Text>
              </View>
            </View>
            <Text style={ui.text}>{exercise.description}</Text>
          </View>
          <View style={styles.stats}>
            <Stat label="Personal Best" value={bestLabel} detail={best && weighted ? `${best.reps} reps at best · ${maxReps} max reps` : undefined} featured />
            <Stat label="All-Time Volume" value={formatWeight(lifetimeVolume, unit)} />
            <Stat label="Total Sessions" value={String(history.length)} />
          </View>
          <ProgressChart history={history} unit={unit} weighted={weighted} />
          <View style={styles.history}>
            <Text accessibilityRole="header" style={ui.h2}>History</Text>
            {!!appearances.length && (
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.column, styles.columnLabel]}>Date</Text>
                <Text style={[styles.column, styles.columnLabel]}>Sets × Reps</Text>
                <Text style={[styles.column, styles.columnLabel]}>Top Weight / PR</Text>
                <Text style={[styles.volume, styles.columnLabel]}>Session Volume</Text>
              </View>
            )}
          </View>
        </View>
      )}
      ListEmptyComponent={<View style={[ui.card, styles.empty]}>
        <Empty title="No sets logged yet" detail="Completed sets will appear here." />
      </View>}
      renderItem={({ item: { session, sets, best: top, volume }, index }) => (
        <View style={[styles.tableRow, index === appearances.length - 1 && styles.tableEnd]}>
          <Text style={[styles.column, styles.cell, ui.numeric]}>{formatDate(session.date, { dateStyle: 'medium' })}</Text>
          <Text style={[styles.column, styles.cell, ui.numeric]}>{setSummary(sets)}</Text>
          <Text style={[styles.column, styles.cell, ui.numeric]}>{top.weight > 0 ? `${formatWeight(top.weight, unit)} × ${top.reps}` : `${top.reps} reps`}</Text>
          <Text style={[styles.volume, styles.cell, ui.numeric]}>{formatWeight(sessionVolumes.get(session.id) ?? volume, unit)}</Text>
        </View>
      )}
    />
  );
}

function Stat({ label, value, detail, featured }: { label: string; value: string; detail?: string; featured?: boolean }) {
  return (
    <View style={[ui.card, styles.stat, featured && styles.featured]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, ui.numeric]}>{value}</Text>
      {detail && <Text style={[ui.muted, ui.numeric]}>{detail}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 14 },
  heroHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroText: { gap: 3 },
  title: { color: Palette.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.45 },
  badge: { alignSelf: 'flex-start', backgroundColor: Palette.mint, borderRadius: Radius.chip, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, color: Palette.accentText, fontWeight: '700' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexGrow: 1, flexBasis: 90, minHeight: 76, backgroundColor: Palette.surface, padding: 10, gap: 5 },
  featured: { backgroundColor: Palette.mint, borderColor: Palette.mint, flexGrow: 1.4, flexBasis: 110 },
  statLabel: { fontSize: 12, fontWeight: '600', color: Palette.muted },
  statValue: { color: Palette.text, fontSize: 17, fontWeight: '800' },
  list: { gap: 0 },
  overview: { gap: 20 },
  history: { gap: 10 },
  empty: { marginTop: 10 },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 12,
    borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Palette.border },
  tableHeader: { backgroundColor: Palette.surface, borderTopWidth: 1, borderTopLeftRadius: Radius.card, borderTopRightRadius: Radius.card },
  tableEnd: { borderBottomLeftRadius: Radius.card, borderBottomRightRadius: Radius.card },
  columnLabel: { fontSize: 12, fontWeight: '700', color: Palette.muted },
  cell: { fontSize: 13, color: Palette.text },
  column: { flex: 1 },
  volume: { flex: 1, textAlign: 'right' },
});
