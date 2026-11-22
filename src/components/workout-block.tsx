import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Palette, Radius } from '@/constants/theme';
import { equipmentLabels, type DraftExercise, type DraftSet, type Exercise, type WeightUnit } from '@/data/workouts';
import { ExerciseThumbnail } from './exercise-row';
import { Icon } from './tracker-icon';
import { Action, IconButton, ui } from './tracker-ui';

export function WorkoutBlock({ draft, exercise, unit, disabled, onAddSet, onRemove, onChangeBodyWeight, onChangeSet, onDeleteSet, onToggleSet }: {
  draft: DraftExercise; exercise: Exercise; unit: WeightUnit; disabled: boolean;
  onAddSet: () => void; onRemove: () => void;
  onChangeBodyWeight: (value: string) => void;
  onChangeSet: (id: string, field: 'weight' | 'reps', value: string) => void;
  onDeleteSet: (id: string) => void; onToggleSet: (set: DraftSet, number: number) => void;
}) {
  const bodyweight = exercise.equipmentType === 'bodyweight';
  const weightLabel = bodyweight ? '+ Added Weight' : 'Weight';

  return (
    <View style={[ui.card, styles.block]}>
      <View style={ui.row}>
        <ExerciseThumbnail equipment={exercise.equipmentType} imageUri={exercise.imageUri} size={40} />
        <View style={ui.flex}>
          <Text accessibilityRole="header" style={ui.h3}>{exercise.name}</Text>
          <Text style={ui.muted}>{equipmentLabels[exercise.equipmentType]}</Text>
        </View>
        <IconButton icon="close" label={`Remove ${exercise.name}`} onPress={onRemove} disabled={disabled} />
      </View>
      {bodyweight && (
        <View style={ui.row}>
          <Text style={[ui.emphasis, ui.flex]}>Body weight ({unit})</Text>
          <TextInput accessibilityLabel={`${exercise.name}, body weight in ${unit}`} value={draft.bodyWeight ?? ''}
            onChangeText={onChangeBodyWeight} inputMode="decimal" maxLength={12} placeholder="Optional"
            placeholderTextColor={Palette.muted} editable={!disabled} style={[styles.input, styles.bodyWeightInput, ui.numeric]} />
        </View>
      )}
      {!!draft.sets.length && <View style={[styles.setRow, styles.heading]}>
        <Text style={[styles.setNumber, styles.column]}>Set</Text>
        {bodyweight && <Text style={[ui.flex, styles.column]}>Reps</Text>}
        <Text style={[bodyweight ? styles.addedWeight : ui.flex, styles.column]}>{weightLabel} ({unit})</Text>
        {!bodyweight && <Text style={[ui.flex, styles.column]}>Reps</Text>}
        <Text style={[styles.control, styles.column]}>Done</Text>
        <View style={styles.control} />
      </View>}
      {draft.sets.map((set, index) => {
        const number = index + 1;
        const weight = (
          <TextInput accessibilityLabel={`${exercise.name}, set ${number}, ${weightLabel} in ${unit}`}
            value={set.weight} onChangeText={(value) => onChangeSet(set.id, 'weight', value)}
            inputMode="decimal" maxLength={12} placeholder="0" placeholderTextColor={Palette.muted} editable={!disabled}
            style={[styles.input, bodyweight ? styles.addedWeight : ui.flex, ui.numeric]} />
        );
        const reps = (
          <TextInput accessibilityLabel={`${exercise.name}, set ${number}, reps`} value={set.reps}
            onChangeText={(value) => onChangeSet(set.id, 'reps', value)} inputMode="numeric" maxLength={4}
            placeholder="0" placeholderTextColor={Palette.muted} editable={!disabled} style={[styles.input, ui.flex, ui.numeric]} />
        );
        return (
          <View key={set.id} style={[styles.setRow, set.done && styles.setDone]}>
            <Text style={[styles.setNumber, ui.emphasis, ui.numeric, ui.center]}>{number}</Text>
            {bodyweight ? reps : weight}
            {bodyweight ? weight : reps}
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: set.done, disabled }}
              accessibilityLabel={`${exercise.name}, mark set ${number} ${set.done ? 'incomplete' : 'done'}`}
              disabled={disabled} onPress={() => onToggleSet(set, number)}
              style={({ pressed }) => [styles.checkTarget, pressed && ui.pressed]}>
              <View style={[styles.checkBox, set.done && styles.checked]}>
                {set.done && <Icon name="check" size={15} color={Palette.canvas} />}
              </View>
            </Pressable>
            <IconButton icon="trash" label={`${exercise.name}, delete set ${number}`} disabled={disabled} onPress={() => onDeleteSet(set.id)} />
          </View>
        );
      })}
      <View style={styles.addSet}><Action label="Add Set" icon="plus" variant="quiet" onPress={onAddSet} disabled={disabled} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { padding: 12, gap: 7 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.chip, paddingVertical: 2 },
  heading: { marginTop: 2 },
  setDone: { backgroundColor: Palette.mint },
  column: { color: Palette.muted, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  setNumber: { width: 29 },
  control: { width: 44 },
  addedWeight: { flex: 1.45 },
  bodyWeightInput: { flex: 1, minWidth: 100 },
  input: { minHeight: 42, minWidth: 0, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.chip,
    backgroundColor: Palette.surface, color: Palette.text, fontSize: 16, textAlign: 'center', paddingHorizontal: 4 },
  checkTarget: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  checkBox: { width: 23, height: 23, borderRadius: 6, borderWidth: 1, borderColor: Palette.muted,
    backgroundColor: Palette.canvas, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: Palette.accent, borderColor: Palette.accent },
  addSet: { alignSelf: 'flex-start' },
});
