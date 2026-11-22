import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/theme';

const paths = {
  dumbbell: 'M7 10h10M7 14h10M4 7h3v10H4zM17 7h3v10h-3zM4 10H2v4h2m16-4h2v4h-2',
  barbell: 'M2 12h20M5 7v10M8 5v14m8-14v14m3-12v10',
  machine: 'M10 2h4l.5 2.6 1.4.6 2.2-1.5 2.2 2.2-1.5 2.2.6 1.4 2.6.5v4l-2.6.5-.6 1.4 1.5 2.2-2.2 2.2-2.2-1.5-1.4.6L14 22h-4l-.5-2.6-1.4-.6-2.2 1.5-2.2-2.2 1.5-2.2-.6-1.4L2 14v-4l2.6-.5.6-1.4-1.5-2.2 2.2-2.2 2.2 1.5 1.4-.6zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  body: 'M14 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM4 9l8 2 8-2m-8 2v5m0 0-4 5m4-5 4 5',
  core: 'M3 12h4l3-7 4 14 3-7h4',
  legs: 'M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM12 7l-1 7m1-6 3 3 2-1M11 14l5-1 1.5 7H21M11 14l-3 5-5.5 1',
  chart: 'M4 4v16h16M8 15l4-5 4 2 4-6',
  calendar: 'M4 6h16v14H4zM8 4v4m8-4v4M4 10h16m-12 4h2m4 0h2m-8 3h2',
  plus: 'M12 5v14M5 12h14',
  left: 'm15 6-6 6 6 6',
  right: 'm9 6 6 6-6 6',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  search: 'M15.5 15.5 21 21M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  photo: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 5m-5-8h.01',
  trash: 'M4 7h16m-10-3h4M6 7l1 13h10l1-13m-8 4v5m4-5v5',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 22, color = Palette.text }: { name: IconName; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d={paths[name]} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
