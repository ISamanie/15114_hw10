import { StatusBar } from 'expo-status-bar';

import { WorkoutNavigator } from '@/components/workout-navigator';
import { WorkoutProvider } from '@/data/workout-store';

export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  return (
    <WorkoutProvider>
      <StatusBar style="dark" />
      <WorkoutNavigator />
    </WorkoutProvider>
  );
}
