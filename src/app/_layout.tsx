import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { Action, Loading, ui } from '@/components/tracker-ui';
import { Palette } from '@/constants/theme';
import { useWorkouts, WorkoutProvider } from '@/data/workout-store';

export const unstable_settings = { initialRouteName: 'index' };

function Routes() {
  const { data, loadError, retry } = useWorkouts();
  if (loadError) {
    return (
      <View style={[ui.loading, { padding: 24, gap: 12 }]}>
        <Text style={[ui.h2, ui.center]}>Couldn’t load workout data</Text>
        <Action label="Try again" onPress={retry} />
      </View>
    );
  }
  if (!data) return <Loading />;

  return (
    <Stack screenOptions={{ headerTintColor: Palette.text, headerShadowVisible: false,
      headerStyle: { backgroundColor: Palette.canvas }, contentStyle: { backgroundColor: Palette.canvas } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="data" options={{ title: 'Exercise Data' }} />
      <Stack.Screen name="exercise/[id]" options={{ title: 'Exercise' }} />
      <Stack.Screen name="workout-tracker" options={{ title: 'Workout', headerBackVisible: false, gestureEnabled: false }} />
      <Stack.Screen name="create-exercise" options={{ title: 'New Exercise', presentation: 'modal' }} />
      <Stack.Screen name="workout-review" options={{ title: 'Workout Review', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <WorkoutProvider>
      <StatusBar style="dark" />
      <Routes />
    </WorkoutProvider>
  );
}
