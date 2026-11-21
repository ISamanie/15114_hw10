import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { Palette, Radius } from '@/constants/theme';
import { cutoffDate, formatDate, formatNumber, progressSeries, type HistoryEntry, type WeightUnit } from '@/data/workouts';
import { Chips, Empty, IconButton, ui } from './tracker-ui';

const metrics = [{ value: 'best', label: 'Personal Best' }, { value: 'volume', label: 'Session Volume' }] as const;
const ranges = [{ value: '1', label: '1M' }, { value: '3', label: '3M' }, { value: '6', label: '6M' }, { value: 'all', label: 'All' }] as const;
type Metric = typeof metrics[number]['value'];
type Range = typeof ranges[number]['value'];

const plotHeight = 174;
const axisLabel = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const shortDate = { month: 'short', day: 'numeric' } as const;

export function ProgressChart({ history, unit, weighted }: { history: HistoryEntry[]; unit: WeightUnit; weighted: boolean }) {
  const [metric, setMetric] = useState<Metric>('best');
  const [range, setRange] = useState<Range>('all');
  const [selectedId, setSelectedId] = useState<string>();
  const [width, setWidth] = useState(0);
  const points = useMemo(() => progressSeries(history, metric, unit, weighted, range === 'all' ? '' : cutoffDate(Number(range))),
    [history, metric, range, unit, weighted]);

  const selectedIndex = points.findIndex((point) => point.id === selectedId);
  const index = selectedIndex >= 0 ? selectedIndex : points.length - 1;
  const selected = points[index];
  const measure = metric === 'best' && !weighted ? 'reps' : unit;
  const maximum = points.reduce((max, point) => Math.max(max, point.value), 0);
  const stepScale = 10 ** Math.floor(Math.log10((maximum || 1) / 3));
  const step = Math.ceil((maximum || 1) / (3 * stepScale)) * stepScale;
  const yMax = step * 3;
  const left = 45;
  const right = Math.max(left + 8, width - 12);
  const top = 12;
  const bottom = plotHeight - 28;
  const first = points[0];
  const last = points.at(-1);
  const start = first?.timestamp ?? 0;
  const span = (last?.timestamp ?? start) - start;
  const plotted = points.map((point, pointIndex) => ({
    ...point,
    x: left + (right - left) * (span ? (point.timestamp - start) / span : points.length > 1 ? pointIndex / (points.length - 1) : 0.5),
    y: bottom - (bottom - top) * point.value / yMax,
  }));

  return (
    <View style={[ui.card, styles.card]}>
      <Text accessibilityRole="header" style={ui.h2}>Progress</Text>
      <Chips options={metrics} value={metric} onChange={(value) => { setMetric(value); setSelectedId(undefined); }} label="Chart metric" />
      <Chips options={ranges} value={range} onChange={(value) => { setRange(value); setSelectedId(undefined); }} label="Chart date range" />
      {!selected || !first || !last ? <Empty title="No sessions in this period" detail="Log this exercise to see your progress here." icon="chart" /> : (
        <>
          <Text style={styles.axisCaption}>{metric === 'best' ? 'Personal best' : 'Session volume'} ({measure})</Text>
          <View style={styles.plot} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
            {width > 0 && <Svg width={width} height={plotHeight} accessible={false}>
              {[0, 1, 2, 3].map((level) => {
                const y = bottom - (bottom - top) * level / 3;
                return (
                  <ChartTick key={level} label={axisLabel.format(level * step)} y={y} left={left} right={right} />
                );
              })}
              {plotted.length > 1 && <Polyline points={plotted.map(({ x, y }) => `${x},${y}`).join(' ')}
                fill="none" stroke={Palette.accent} strokeWidth={2.5} strokeLinejoin="round" />}
              {plotted.map(({ id, x, y }) => <Circle key={id} cx={x} cy={y}
                r={id === selected.id ? 5 : 3} fill={Palette.accent} stroke={Palette.canvas} strokeWidth={1} />)}
              {plotted.map(({ id, x, y }) => <Circle key={`touch-${id}`} cx={x} cy={y} r={14} fill="transparent"
                onPress={() => setSelectedId(id)} />)}
              <SvgText x={left} y={plotHeight - 7} fill={Palette.muted} fontSize={10}>{formatDate(first.date, shortDate)}</SvgText>
              {last.date !== first.date && <SvgText x={right} y={plotHeight - 7} textAnchor="end" fill={Palette.muted} fontSize={10}>
                {formatDate(last.date, shortDate)}
              </SvgText>}
            </Svg>}
          </View>
          <View style={styles.readout}>
            <IconButton icon="left" label="Previous data point" disabled={index <= 0} onPress={() => setSelectedId(points[index - 1].id)} />
            <View style={ui.flex} accessibilityLiveRegion="polite">
              <Text style={[ui.emphasis, ui.center, ui.numeric]}>{formatNumber(selected.value)} {measure}</Text>
              <Text style={[ui.muted, ui.center]}>{formatDate(selected.date, { dateStyle: 'medium' })}</Text>
            </View>
            <IconButton icon="right" label="Next data point" disabled={index >= points.length - 1} onPress={() => setSelectedId(points[index + 1].id)} />
          </View>
        </>
      )}
    </View>
  );
}

function ChartTick({ label, y, left, right }: { label: string; y: number; left: number; right: number }) {
  return (
    <>
      <Line x1={left} x2={right} y1={y} y2={y} stroke={Palette.border} strokeWidth={1} />
      <SvgText x={left - 6} y={y + 4} textAnchor="end" fill={Palette.muted} fontSize={10}>{label}</SvgText>
    </>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 10 },
  axisCaption: { color: Palette.muted, fontSize: 12 },
  plot: { height: plotHeight },
  readout: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.surface, borderRadius: Radius.thumbnail },
});
