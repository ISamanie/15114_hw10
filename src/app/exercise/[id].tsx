import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
  const exercise = data?.exercises.find((item) => item.id === id);
  const history = useMemo(() => data ? exerciseHistory(data, id) : [], [data, id]);
  if (!data || !exercise) return <Screen><Empty title="Exercise unavailable" />
    <Action label="Back to Exercise Data" onPress={() => router.dismissTo('/data')} /></Screen>;

  const unit = data.preferredUnit;
  const best = bestSet(history.map((entry) => entry.best));
  const weighted = (best?.weight ?? 0) > 0;
  const maxReps = history.reduce((max, entry) => entry.sets.reduce((current, set) => Math.max(current, set.reps), max), 0);
  const lifetimeVolume = history.reduce((sum, item) => sum + item.volume, 0);
  const bestLabel = best ? (weighted ? formatWeight(best.weight, unit) : `${maxReps} reps`) : '—';

  return (
    <Screen>
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
        {!history.length ? <View style={ui.card}><Empty title="No sets logged yet" detail="Completed sets will appear here." /></View> : (
          <ScrollView horizontal keyboardShouldPersistTaps="handled" style={ui.card}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.date, styles.columnLabel]}>Date</Text>
                <Text style={[styles.sets, styles.columnLabel]}>Sets × Reps</Text>
                <Text style={[styles.best, styles.columnLabel]}>Top Weight / PR</Text>
                <Text style={[styles.volume, styles.columnLabel]}>Session Volume</Text>
              </View>
              {history.slice().reverse().map(({ session, sets, best: top, volume }) => (
                <View key={session.id} style={styles.tableRow}>
                  <Text style={[styles.date, styles.cell, ui.numeric]}>{formatDate(session.date, { dateStyle: 'medium' })}</Text>
                  <Text style={[styles.sets, styles.cell, ui.numeric]}>{setSummary(sets)}</Text>
                  <Text style={[styles.best, styles.cell, ui.numeric]}>{top.weight > 0 ? `${formatWeight(top.weight, unit)} × ${top.reps}` : `${top.reps} reps`}</Text>
                  <Text style={[styles.volume, styles.cell, ui.numeric]}>{formatWeight(volume, unit)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </Screen>
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
  history: { gap: 10 },
  table: { minWidth: 414 },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Palette.border },
  tableHeader: { backgroundColor: Palette.surface, borderTopLeftRadius: Radius.card, borderTopRightRadius: Radius.card },
  columnLabel: { fontSize: 12, fontWeight: '700', color: Palette.muted },
  cell: { fontSize: 13, color: Palette.text },
  date: { width: 91 },
  sets: { width: 78 },
  best: { width: 99 },
  volume: { width: 102, textAlign: 'right' },
});
