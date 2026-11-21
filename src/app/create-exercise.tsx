import { randomUUID } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { launchImageLibraryAsync, type ImagePickerAsset } from 'expo-image-picker';
import { router, useNavigation } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExerciseThumbnail } from '@/components/exercise-row';
import { Action, Chips, ErrorText, Screen, ui } from '@/components/tracker-ui';
import { Palette, Radius } from '@/constants/theme';
import { exerciseIcons, type ExerciseIcon } from '@/data/exercises';
import { useWorkouts } from '@/data/workout-store';
import { equipmentLabels, equipmentTypes, type EquipmentType } from '@/data/workouts';

const options = equipmentTypes.map((value) => ({ value, label: equipmentLabels[value] }));
const icons = Object.entries(exerciseIcons) as [ExerciseIcon, string][];

export default function CreateExerciseScreen() {
  const { addExercise } = useWorkouts();
  const navigation = useNavigation();
  const [id] = useState(randomUUID);
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState<EquipmentType>('free_weight');
  const [muscle, setMuscle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<ExerciseIcon>('dumbbell');
  const [photo, setPhoto] = useState<ImagePickerAsset>();
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  async function choosePhoto() {
    if (busy.current) return;
    busy.current = true;
    setPicking(true);
    setError('');
    try {
      const result = await launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
      if (!result.canceled) setPhoto(result.assets[0]);
    } catch {
      setError('Couldn’t open the photo library. Try again or choose an icon.');
    } finally {
      busy.current = false;
      setPicking(false);
    }
  }

  async function save() {
    if (busy.current) return;
    setAttempted(true);
    if (!name.trim() || !muscle.trim() || !description.trim()) return;
    setError('');
    setSaving(true);
    busy.current = true;
    Keyboard.dismiss();
    let copiedFile: File | undefined;
    try {
      let imageUri = `icon:${icon}`;
      if (photo) {
        const extension = (photo.fileName ?? photo.uri).split('?')[0].match(/\.([a-z\d]{2,5})$/i)?.[0] ?? '.jpg';
        const file = new File(Paths.document, `exercise-${id}${extension}`);
        await new File(photo.uri).copy(file, { overwrite: true });
        copiedFile = file;
        imageUri = `photo:${file.name}`;
      }
      await addExercise({ id, name: name.trim(), equipmentType: equipment, muscleGroup: muscle.trim(),
        description: description.trim(), imageUri, isCustom: true, createdAt: new Date().toISOString() });
    } catch {
      try { copiedFile?.delete(); } catch { /* The original photo remains in the picker cache. */ }
      setError('Couldn’t save the exercise. Your entries are still here. Try again.');
      return;
    } finally {
      busy.current = false;
      setSaving(false);
    }
    if (navigation.isFocused()) {
      if (router.canGoBack()) router.back();
      else router.replace('/data');
    }
  }

  return (
    <KeyboardAvoidingView style={ui.canvas} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={styles.field}>
          <Text style={ui.emphasis}>Name</Text>
          <TextInput accessibilityLabel="Name" value={name} onChangeText={setName} editable={!saving} maxLength={80}
            placeholder="e.g. Incline Dumbbell Press" placeholderTextColor={Palette.muted} style={styles.input} />
          {attempted && !name.trim() && <ErrorText>Enter an exercise name.</ErrorText>}
        </View>
        <View style={styles.field}>
          <Text style={ui.emphasis}>Equipment type</Text>
          <Chips options={options} value={equipment} onChange={setEquipment} label="Equipment type" />
        </View>
        <View style={styles.field}>
          <Text style={ui.emphasis}>Muscle group</Text>
          <TextInput accessibilityLabel="Muscle group" value={muscle} onChangeText={setMuscle} editable={!saving} maxLength={60}
            placeholder="e.g. Chest" placeholderTextColor={Palette.muted} style={styles.input} />
          {attempted && !muscle.trim() && <ErrorText>Enter the primary muscle group.</ErrorText>}
        </View>
        <View style={styles.field}>
          <Text style={ui.emphasis}>Form description</Text>
          <TextInput accessibilityLabel="Form description" value={description} onChangeText={setDescription} editable={!saving}
            multiline maxLength={300} placeholder="Add a short cue for performing the exercise."
            placeholderTextColor={Palette.muted} style={[styles.input, styles.description]} />
          {attempted && !description.trim() && <ErrorText>Enter a short form description.</ErrorText>}
        </View>
        <View style={styles.field}>
          <Text style={ui.emphasis}>Exercise thumbnail</Text>
          <View style={[ui.row, ui.spread]}>
            <ExerciseThumbnail equipment={equipment} imageUri={photo?.uri ?? `icon:${icon}`} size={64} />
            <Action label={photo ? 'Change photo' : 'Choose photo'} icon="photo" variant="outline"
              disabled={saving || picking} onPress={choosePhoto} />
          </View>
          <View style={styles.icons}>
            {icons.map(([value, label]) => {
              const selected = !photo && value === icon;
              return (
                <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${label} icon`}
                  accessibilityState={{ selected }} disabled={saving || picking}
                  onPress={() => { setIcon(value); setPhoto(undefined); setError(''); }}
                  style={[styles.iconOption, selected && styles.selected]}>
                  <ExerciseThumbnail equipment={equipment} imageUri={`icon:${value}`} size={36} />
                </Pressable>
              );
            })}
          </View>
        </View>
        {!!error && <ErrorText>{error}</ErrorText>}
        <Action label={saving ? 'Saving…' : 'Save Exercise'} onPress={save} disabled={saving || picking} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  input: { minHeight: 48, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.thumbnail,
    paddingHorizontal: 12, paddingVertical: 10, color: Palette.text, backgroundColor: Palette.surface, fontSize: 16 },
  description: { minHeight: 92, textAlignVertical: 'top' },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  iconOption: { padding: 3, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.thumbnail },
  selected: { borderColor: Palette.accent, backgroundColor: Palette.mint },
});
