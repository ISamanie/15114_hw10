import { randomUUID } from 'expo-crypto';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseRow } from '@/components/exercise-row';
import { Icon } from '@/components/tracker-icon';
import { Action, Chips, Empty, ErrorText, Screen, SearchField, ui } from '@/components/tracker-ui';
import { WorkoutBlock } from '@/components/workout-block';
import { MaxContentWidth, Palette, Radius } from '@/constants/theme';
import { useWorkouts } from '@/data/workout-store';
import { buildWorkout, dateKey, filterExercises, formatDuration, formatWeightInput, getWorkout, parseDraftSet, parseWeightInput,
  rememberedBodyWeight, restoreDraftExercises,
  type DraftExercise, type DraftSet, type Exercise, type WeightUnit } from '@/data/workouts';

const units = [{ value: 'lb', label: 'lb' }, { value: 'kg', label: 'kg' }] as const;

function SessionTimer({ startedAtMs, fixed }: { startedAtMs: number; fixed?: number }) {
  const [now, setNow] = useState(startedAtMs);
  useEffect(() => {
    if (fixed !== undefined) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [fixed]);
  const duration = formatDuration(fixed ?? Math.max(0, Math.floor((now - startedAtMs) / 1000)));

  return (
    <View style={styles.timer}>
      <Icon name="clock" size={17} color={Palette.accentText} />
      <Text accessibilityLabel={`Session duration ${duration}`} style={[styles.timerText, ui.numeric]}>{duration}</Text>
    </View>
  );
}

export default function WorkoutTrackerScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { data, saveWorkout } = useWorkouts();
  const headerHeight = useHeaderHeight();
  const { bottom } = useSafeAreaInsets();
  const previous = data?.sessions.find((session) => session.id === edit);
  const [startedAtMs] = useState(() => previous ? Date.parse(previous.startedAt) : Date.now());
  const [sessionId] = useState(() => previous?.id ?? randomUUID());
  const [unit, setUnit] = useState<WeightUnit>(previous?.unit ?? data?.preferredUnit ?? 'lb');
  const [blocks, setBlocks] = useState<DraftExercise[]>(() => data && previous ? restoreDraftExercises(getWorkout(data, previous)) : []);
  const [editedBodyWeight, setEditedBodyWeight] = useState<number>();
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(true);
  const [searchLayout, setSearchLayout] = useState<{ offset: number; minHeight: number } | null>(null);
  const formHeight = useRef(0);
  const viewportHeight = useRef(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const dialogOpen = useRef(false);
  const list = useRef<SectionList<Exercise>>(null);

  const disableRemovalPrevention = usePreventRemove(dirty || saving, ({ repeat }) => {
    if (savingRef.current || dialogOpen.current) return;
    dialogOpen.current = true;
    Alert.alert(previous ? 'Discard workout changes?' : 'Discard this workout?', 'Your unsaved sets will be lost.', [
      { text: 'Keep Editing', style: 'cancel', onPress: () => { dialogOpen.current = false; } },
      { text: 'Discard', style: 'destructive', onPress: () => {
        dialogOpen.current = false;
        setDirty(false);
        repeat();
      } },
    ], { cancelable: true, onDismiss: () => { dialogOpen.current = false; } });
  });

  const matches = useMemo(() => filterExercises(data?.exercises ?? [], query).sort((a, b) => a.name.localeCompare(b.name)), [data?.exercises, query]);
  const sections = useMemo(() => [{ key: 'exercises', data: pickerOpen ? matches : [] }], [pickerOpen, matches]);
  const priorBodyWeight = useMemo(() => data && !previous ? rememberedBodyWeight(data) : undefined, [data, previous]);
  const searchFocused = searchLayout !== null;

  useEffect(() => {
    if (!searchLayout) return;
    const frame = requestAnimationFrame(() => {
      list.current?.getScrollResponder()?.scrollTo({ y: searchLayout.offset, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [searchLayout, query]);

  function focusExerciseSearch() {
    // Sample the layout once per focus so native resize events cannot drive another render.
    const offset = formHeight.current;
    const minHeight = offset + viewportHeight.current;
    setSearchLayout((current) => current ?? { offset, minHeight });
    setPickerOpen(true);
  }

  function changeBlocks(transform: (current: DraftExercise[]) => DraftExercise[]) {
    if (savingRef.current) return;
    setDirty(true);
    setError('');
    setBlocks(transform);
  }

  function updateSets(id: string, transform: (sets: DraftSet[]) => DraftSet[]) {
    changeBlocks((current) => current.map((block) => block.id === id ? { ...block, sets: transform(block.sets) } : block));
  }

  function addExercise(exercise: Exercise) {
    if (savingRef.current) return;
    const id = randomUUID();
    const bodyweight = exercise.equipmentType === 'bodyweight';
    const first: DraftSet = { id: randomUUID(), weight: bodyweight ? '0' : '', reps: '', done: false };
    const prefill = editedBodyWeight ?? priorBodyWeight;
    const bodyWeight = bodyweight && prefill !== undefined ? formatWeightInput(prefill, unit) : undefined;
    changeBlocks((current) => [...current, { id, exerciseId: exercise.id, bodyWeight, sets: [first] }]);
    setQuery('');
    setPickerOpen(false);
    setSearchLayout(null);
    Keyboard.dismiss();
  }

  function toggleSet(block: DraftExercise, set: DraftSet, number: number, exercise: Exercise) {
    if (!set.done && !parseDraftSet(set, exercise.equipmentType, unit, block.bodyWeight)) {
      const fields = exercise.equipmentType === 'bodyweight' ? 'reps, body weight, and added weight' : 'weight and reps';
      setError(`Enter valid ${fields} for ${exercise.name}, set ${number}.`);
      return;
    }
    updateSets(block.id, (sets) => sets.map((item) => item.id === set.id ? { ...item, done: !set.done } : item));
  }

  async function finish() {
    if (!data || savingRef.current) return;
    const completedAt = new Date();
    let workout;
    try {
      workout = buildWorkout(previous ?? {
        id: sessionId, date: dateKey(completedAt), startedAt: new Date(startedAtMs).toISOString(), completedAt: completedAt.toISOString(),
        durationSeconds: Math.max(0, Math.floor((completedAt.getTime() - startedAtMs) / 1000)), unit,
      }, blocks, data.exercises);
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'Check your completed sets.');
      return;
    }

    setError('');
    savingRef.current = true;
    setSaving(true);
    Keyboard.dismiss();
    try {
      await saveWorkout(workout, editedBodyWeight);
    } catch {
      setError('Couldn’t save the workout. Your sets are still here. Try again.');
      return;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
    setDirty(false);
    disableRemovalPrevention();
    router.dismissTo({ pathname: '/', params: { day: workout.session.date, saved: completedAt.toISOString() } });
  }

  if (!data) return null;
  if (edit && !previous) return <Screen><Empty title="Workout unavailable" detail="This workout may have been deleted." />
    <Action label="Back to Training Log" onPress={() => router.dismissTo('/')} /></Screen>;

  return (
    <KeyboardAvoidingView style={ui.canvas} behavior="padding" enabled={process.env.EXPO_OS === 'ios' && searchFocused}
      keyboardVerticalOffset={headerHeight}>
      <View style={styles.toolbar}>
        <Action label="Cancel" variant="quiet" onPress={() => router.dismiss()} disabled={saving} />
        <SessionTimer startedAtMs={startedAtMs} fixed={previous?.durationSeconds} />
        <Action label={saving ? 'Saving…' : previous ? 'Save Changes' : 'Finish Workout'} onPress={finish} disabled={saving} />
      </View>
      {!!error && <View style={styles.error}><ErrorText>{error}</ErrorText></View>}

      <SectionList ref={list} sections={sections}
        keyExtractor={(exercise) => exercise.id} style={ui.canvas}
        onLayout={(event) => { viewportHeight.current = event.nativeEvent.layout.height; }}
        contentContainerStyle={[ui.page, styles.list, {
          paddingBottom: Math.max(bottom, 16) + 16,
          // Keep the picker scrollable to the top even when the query has few matches.
          minHeight: searchLayout?.minHeight,
        }]}
        stickySectionHeadersEnabled contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets={!searchFocused}
        keyboardShouldPersistTaps="handled" keyboardDismissMode={searchFocused ? 'none' : 'on-drag'}
        renderItem={({ item }) => <ExerciseRow exercise={item} onPress={() => addExercise(item)} add />}
        ListHeaderComponent={(
          <View style={styles.header} onLayout={(event) => { formHeight.current = event.nativeEvent.layout.height; }}>
            <View style={[ui.row, ui.spread]}>
              <Text accessibilityRole="header" style={[ui.h2, ui.flex]}>{previous ? 'Edit workout' : 'Active workout'}</Text>
              {blocks.length || previous ? <Text style={ui.muted}>Weight in {unit}</Text>
                : <Chips options={units} value={unit} onChange={setUnit} label="Weight units" />}
            </View>
            {!blocks.length && <View style={[ui.card, styles.empty]}><Empty title="No exercises added"
              detail="Pick a movement below to log your first set." icon="dumbbell" /></View>}
            {blocks.map((block) => {
              const exercise = data.exercises.find((item) => item.id === block.exerciseId);
              if (!exercise) return null;
              return (
                <WorkoutBlock key={block.id} draft={block} exercise={exercise} unit={unit} disabled={saving}
                  onRemove={() => changeBlocks((current) => current.filter((item) => item.id !== block.id))}
                  onChangeBodyWeight={(bodyWeight) => {
                    if (savingRef.current) return;
                    setEditedBodyWeight(parseWeightInput(bodyWeight, unit) || undefined);
                    changeBlocks((current) => current.map((item) => item.id === block.id ? { ...item, bodyWeight } : item));
                  }}
                  onAddSet={() => {
                    const id = randomUUID();
                    updateSets(block.id, (sets) => {
                      const last = sets.at(-1);
                      return [...sets, { id, weight: last?.weight ?? (exercise.equipmentType === 'bodyweight' ? '0' : ''),
                        reps: last?.reps ?? '', done: false }];
                    });
                  }}
                  onDeleteSet={(id) => updateSets(block.id, (sets) => sets.filter((item) => item.id !== id))}
                  onChangeSet={(id, field, value) => updateSets(block.id, (sets) => sets.map((item) => item.id === id ? { ...item, [field]: value } : item))}
                  onToggleSet={(set, number) => toggleSet(block, set, number, exercise)} />
              );
            })}
          </View>
        )}
        renderSectionHeader={() => (
          <View style={styles.picker}>
            <View style={[ui.row, ui.spread]}>
              <Text accessibilityRole="header" style={ui.h3}>Add Exercise</Text>
              <Action label={pickerOpen ? 'Hide list' : 'Browse'} variant="quiet" onPress={() => {
                if (pickerOpen) Keyboard.dismiss();
                setPickerOpen(!pickerOpen);
              }} />
            </View>
            <SearchField query={query} onChange={(value) => { setQuery(value); setPickerOpen(true); }}
              onFocus={focusExerciseSearch} onBlur={() => setSearchLayout(null)} />
          </View>
        )}
        renderSectionFooter={() => pickerOpen && !matches.length
          ? <Empty title="No matching exercises" detail="Try a different name or muscle group." /> : null}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  toolbar: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4,
    borderBottomWidth: 1, borderBottomColor: Palette.border },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.mint, borderRadius: Radius.chip, padding: 7 },
  timerText: { color: Palette.accentText, fontSize: 15, fontWeight: '700' },
  error: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: Palette.dangerTint },
  list: { gap: 0, paddingTop: 0 },
  header: { gap: 16, paddingTop: 16, paddingBottom: 5 },
  empty: { backgroundColor: Palette.surface },
  picker: { gap: 4, backgroundColor: Palette.canvas, paddingBottom: 4 },
});
