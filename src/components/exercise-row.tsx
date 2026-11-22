import { File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/theme';
import { defaultExerciseIcons, exerciseIcons, type ExerciseIcon } from '@/data/exercises';
import { equipmentLabels, type EquipmentType, type Exercise } from '@/data/workouts';
import { Icon } from './tracker-icon';
import { ui } from './tracker-ui';

const thumbnails = {
  free_weight: { background: Palette.mint, ink: Palette.accentText },
  machine: { background: Palette.blueTint, ink: Palette.blueInk },
  bodyweight: { background: Palette.violetTint, ink: Palette.violetInk },
} as const;

export function ExerciseThumbnail({ equipment, imageUri, size = 48 }: { equipment: EquipmentType; imageUri: string; size?: number }) {
  const [failedUri, setFailedUri] = useState<string>();
  const theme = thumbnails[equipment];
  const candidate = imageUri.slice(5) as ExerciseIcon;
  const icon = imageUri.startsWith('icon:') && Object.hasOwn(exerciseIcons, candidate) ? candidate : defaultExerciseIcons[equipment];
  const uri = imageUri.startsWith('photo:') ? new File(Paths.document, imageUri.slice(6)).uri : imageUri;
  const showImage = !!uri && !imageUri.startsWith('icon:') && failedUri !== uri;

  return (
    <View style={[styles.thumbnail, { width: size, height: size, backgroundColor: theme.background }]}>
      {showImage ? <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" onError={() => setFailedUri(uri)} />
        : <Icon name={icon} color={theme.ink} size={size * 0.56} />}
    </View>
  );
}

export function ExerciseRow({ exercise, onPress, add = false }: {
  exercise: Exercise; onPress: () => void; add?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={add ? `Add ${exercise.name}` : exercise.name}
      accessibilityHint={`${equipmentLabels[exercise.equipmentType]}, ${exercise.muscleGroup}`}
      onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <ExerciseThumbnail equipment={exercise.equipmentType} imageUri={exercise.imageUri} />
      <View style={ui.flex}>
        <Text style={ui.emphasis}>{exercise.name}</Text>
        <Text style={ui.muted}>{equipmentLabels[exercise.equipmentType]} · {exercise.muscleGroup}</Text>
      </View>
      <Icon name={add ? 'plus' : 'right'} size={18} color={add ? Palette.accentText : Palette.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumbnail: { borderRadius: Radius.thumbnail, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Palette.border },
  pressed: { backgroundColor: Palette.surface },
});
