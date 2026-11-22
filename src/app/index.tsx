import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/tracker-icon';
import { Empty, IconButton, Screen, ui } from '@/components/tracker-ui';
import { Palette, Radius } from '@/constants/theme';
import { useWorkouts } from '@/data/workout-store';
import { dateKey, formatDate, formatDuration, formatWeight, getWorkout, totalReps, totalVolume, type WorkoutSession } from '@/data/workouts';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HomeScreen() {
  const { day, saved } = useLocalSearchParams<{ day?: string; saved?: string }>();
  const date = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00`) : undefined;
  const initialDay = date && !Number.isNaN(date.getTime()) && dateKey(date) === day ? day : undefined;
  return <TrainingLog key={`${initialDay ?? ''}:${saved ?? ''}`} initialDay={initialDay} />;
}

function TrainingLog({ initialDay }: { initialDay?: string }) {
  const { data } = useWorkouts();
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(() => {
    const date = initialDay ? new Date(`${initialDay}T12:00:00`) : today;
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => initialDay ?? dateKey(today));
  const workoutsByDay = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const session of data?.sessions ?? []) {
      const day = map.get(session.date) ?? [];
      day.push(session);
      map.set(session.date, day);
    }
    return map;
  }, [data?.sessions]);
  if (!data) return null;

  const activeWorkouts = (workoutsByDay.get(selectedDay) ?? []).slice()
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = month.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weekCount = Math.ceil((firstWeekday + daysInMonth) / weekdays.length);
  const monthSessionCount = data.sessions.filter((session) => session.date.startsWith(dateKey(month).slice(0, 7))).length;

  function changeMonth(delta: number) {
    const next = new Date(year, monthIndex + delta, 1);
    setMonth(next);
    const prefix = dateKey(next).slice(0, 7);
    const lastWorkout = Array.from(workoutsByDay.keys()).filter((day) => day.startsWith(prefix)).sort().at(-1);
    const todayKey = dateKey(today);
    setSelectedDay(lastWorkout ?? (todayKey.startsWith(prefix) ? todayKey : dateKey(next)));
  }

  return (
    <SafeAreaView edges={['top']} style={ui.canvas}>
      <Screen>
        <View style={styles.brand}>
          <View style={styles.brandIcon}><Icon name="dumbbell" color={Palette.canvas} size={20} /></View>
          <Text style={styles.brandName}>Workout Tracker</Text>
        </View>
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={ui.h1}>Training log</Text>
          <Text style={ui.muted}>Log your lifts and follow your progress.</Text>
        </View>

        <View style={styles.featureCards}>
          <FeatureCard title="Start Workout" subtitle="Log sets, reps, and weight" icon="dumbbell" featured
            onPress={() => router.push('/workout-tracker')} />
          <FeatureCard title="Exercise Data" subtitle="Browse exercises and see your PRs" icon="chart"
            onPress={() => router.push('/data')} />
        </View>

        <View style={styles.section}>
          <View style={[ui.row, ui.spread]}>
            <Text accessibilityRole="header" style={ui.h2}>Workout Calendar</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{monthSessionCount} {monthSessionCount === 1 ? 'workout' : 'workouts'}</Text>
            </View>
          </View>
          <View style={[ui.card, styles.calendar]}>
            <View style={[ui.row, ui.spread]}>
              <IconButton icon="left" label="Previous month" onPress={() => changeMonth(-1)} />
              <Text accessibilityLiveRegion="polite" style={ui.h3}>
                {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
              <IconButton icon="right" label="Next month" onPress={() => changeMonth(1)} />
            </View>
            <View style={styles.week}>
              {weekdays.map((day) => (
                <View key={day} style={styles.column}>
                  <Text style={[ui.muted, styles.weekday]}>{day}</Text>
                </View>
              ))}
            </View>
            <View>
              {Array.from({ length: weekCount }, (_, week) => (
                <View key={week} style={styles.week}>
                  {weekdays.map((weekday, column) => {
                    const day = week * weekdays.length + column - firstWeekday + 1;
                    if (day < 1 || day > daysInMonth) return <View key={weekday} style={styles.column} />;
                    const key = dateKey(new Date(year, monthIndex, day));
                    const count = workoutsByDay.get(key)?.length ?? 0;
                    const selected = key === selectedDay;
                    return (
                      <View key={weekday} style={[styles.column, styles.cell]}>
                        <Pressable accessibilityRole="button" accessibilityState={{ selected }}
                          accessibilityLabel={`${formatDate(key, { dateStyle: 'full' })}, ${count} ${count === 1 ? 'workout' : 'workouts'}`}
                          onPress={() => setSelectedDay(key)} style={({ pressed }) => [styles.day, !!count && styles.logged,
                            key === dateKey(today) && styles.today, selected && styles.selected, pressed && ui.pressed]}>
                          <Text style={[styles.dayText, ui.numeric, selected && styles.lightText]}>{day}</Text>
                          {!!count && <View style={[styles.dot, selected && styles.lightDot]} />}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
          <Text accessibilityRole="header" style={ui.h3}>{formatDate(selectedDay, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          {activeWorkouts.length === 0 && <View style={[ui.card, styles.empty]}>
            <Empty title="No workouts logged" detail="Completed workouts appear here." icon="calendar" />
          </View>}
          {activeWorkouts.map((session, index) => {
            const workout = getWorkout(data, session);
            const volume = totalVolume(workout.sets);
            return (
              <Pressable key={session.id} accessibilityRole="button"
                onPress={() => router.push({ pathname: '/workout-review', params: { id: session.id } })}
                style={({ pressed }) => [ui.card, ui.row, styles.workoutRow, pressed && ui.pressed]}>
                <View style={ui.flex}>
                  <Text style={ui.emphasis}>{activeWorkouts.length > 1 ? `Workout ${activeWorkouts.length - index}` : 'Workout'}</Text>
                  <Text style={[ui.muted, ui.numeric]}>{workout.exercises.length} exercises · {formatDuration(session.durationSeconds)}</Text>
                </View>
                <View style={styles.workoutVolume}>
                  <Text style={ui.muted}>Volume</Text>
                  <Text style={[ui.emphasis, ui.numeric]}>{formatWeight(volume, session.unit)}</Text>
                  {volume === 0 && <Text style={[ui.muted, ui.numeric]}>{totalReps(workout.sets)} reps</Text>}
                </View>
                <Icon name="right" size={16} color={Palette.muted} />
              </Pressable>
            );
          })}
        </View>
      </Screen>
    </SafeAreaView>
  );
}

function FeatureCard({ title, subtitle, icon, featured = false, onPress }: {
  title: string; subtitle: string; icon: IconName; featured?: boolean; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => [styles.feature, featured ? styles.featurePrimary : styles.featureSecondary, pressed && ui.pressed]}>
      <View style={[styles.featureIcon, featured && styles.featureIconPrimary]}>
        <Icon name={icon} color={featured ? Palette.darkGreen : Palette.accentText} size={24} />
      </View>
      <View style={ui.flex}>
        <Text style={[styles.featureTitle, featured && styles.lightText]}>{title}</Text>
        <Text style={[ui.muted, featured && styles.featureSubtitle]}>{subtitle}</Text>
      </View>
      <Icon name="arrow" size={20} color={featured ? Palette.lightGreen : Palette.accentText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandIcon: { width: 30, height: 30, backgroundColor: Palette.accent, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 15, fontWeight: '700', color: Palette.darkGreen },
  intro: { gap: 4 },
  section: { gap: 12 },
  featureCards: { gap: 10 },
  feature: { flexDirection: 'row', alignItems: 'center', minHeight: 80, borderRadius: Radius.card, padding: 13, gap: 12 },
  featurePrimary: { backgroundColor: Palette.darkGreen },
  featureSecondary: { backgroundColor: Palette.mint },
  featureIcon: { width: 46, height: 46, borderRadius: Radius.thumbnail, backgroundColor: Palette.canvas, alignItems: 'center', justifyContent: 'center' },
  featureIconPrimary: { backgroundColor: Palette.lightGreen },
  featureTitle: { fontSize: 17, fontWeight: '700', color: Palette.text },
  featureSubtitle: { color: Palette.lightGreen },
  countBadge: { backgroundColor: Palette.mint, borderRadius: Radius.chip, paddingHorizontal: 8, paddingVertical: 5 },
  countText: { fontSize: 12, color: Palette.accentText, fontWeight: '700' },
  calendar: { padding: 8, paddingBottom: 12, gap: 4 },
  week: { flexDirection: 'row' },
  column: { flex: 1, minWidth: 0 },
  weekday: { textAlign: 'center', fontSize: 12 },
  cell: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  day: { width: '92%', maxWidth: 46, minHeight: 40, borderRadius: Radius.thumbnail, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14, fontWeight: '600', color: Palette.text },
  today: { borderWidth: 1, borderColor: Palette.accent },
  logged: { backgroundColor: Palette.mint },
  selected: { backgroundColor: Palette.accentText },
  lightText: { color: Palette.canvas },
  dot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: Palette.accent },
  lightDot: { backgroundColor: Palette.lightGreen },
  workoutRow: { padding: 14 },
  workoutVolume: { alignItems: 'flex-end' },
  empty: { backgroundColor: Palette.surface },
});
