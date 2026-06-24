import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../context/LocaleContext';
import { colors, radius, spacing } from '../theme';

export type ChartPoint = { atMs: number; weightKg: number };

type Props = {
  entries: ChartPoint[];
};

function shortDate(ms: number, localeTag: string): string {
  try {
    return new Date(ms).toLocaleDateString(localeTag, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 8;

export default function WeightProgressChart({ entries }: Props) {
  const { t } = useTranslation();
  const { localeTag } = useLocale();
  const { width: winW } = useWindowDimensions();
  const chartW = Math.max(280, winW - spacing.xl * 2);
  const chartH = 188;

  const innerW = chartW - PAD_L - PAD_R;
  const innerH = chartH - PAD_T - PAD_B;

  const layout = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.atMs - b.atMs);
    if (!sorted.length) {
      return null;
    }
    const weights = sorted.map((p) => p.weightKg);
    let min = Math.min(...weights);
    let max = Math.max(...weights);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const pad = (max - min) * 0.08 || 0.5;
    const yMin = min - pad;
    const yMax = max + pad;
    const t0 = sorted[0]!.atMs;
    const t1 = sorted[sorted.length - 1]!.atMs;
    const span = Math.max(t1 - t0, 1);
    const singlePoint = sorted.length === 1;

    const dots: { cx: number; cy: number }[] = [];
    let poly = '';
    sorted.forEach((p, i) => {
      const nx = singlePoint ? PAD_L + innerW / 2 : PAD_L + ((p.atMs - t0) / span) * innerW;
      const ny = PAD_T + innerH - ((p.weightKg - yMin) / (yMax - yMin)) * innerH;
      dots.push({ cx: nx, cy: ny });
      poly += (i ? ' ' : '') + `${nx.toFixed(1)},${ny.toFixed(1)}`;
    });

    return {
      polylinePoints: poly,
      dots,
      minW: min,
      maxW: max,
      startMs: t0,
      endMs: t1,
      gridY: [0, 0.5, 1].map((t) => PAD_T + innerH * (1 - t)),
    };
  }, [entries, innerW, innerH]);

  if (!entries.length || !layout) {
    return (
      <View style={[styles.card, { width: chartW }]}>
        <Text style={styles.title}>{t('weightProgressChart.title')}</Text>
        <Text style={styles.empty}>{t('weightProgressChart.empty')}</Text>
      </View>
    );
  }

  const single = entries.length === 1;
  const firstPt = entries[0];

  return (
    <View style={[styles.card, { width: chartW }]}>
      <Text style={styles.title}>{t('weightProgressChart.title')}</Text>
      <View style={{ alignItems: 'center' }}>
        <Svg width={chartW} height={chartH}>
          {layout.gridY.map((y, idx) => (
            <Line
              key={idx}
              x1={PAD_L}
              y1={y}
              x2={chartW - PAD_R}
              y2={y}
              stroke={colors.border}
              strokeWidth={StyleSheet.hairlineWidth}
              strokeDasharray="4 6"
            />
          ))}
          {!single ? (
            <Polyline
              points={layout.polylinePoints}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {layout.dots.map((d, i) => (
            <Circle key={i} cx={d.cx} cy={d.cy} r={5} fill={colors.white} stroke={colors.primary} strokeWidth={2} />
          ))}
        </Svg>
      </View>
      <View style={styles.axisRow}>
        <Text style={styles.axisDate}>{shortDate(layout.startMs, localeTag)}</Text>
        <Text style={styles.axisHint}>
          {single
            ? t('weightProgressChart.weightSingle', { weight: firstPt!.weightKg.toFixed(1) })
            : t('weightProgressChart.weightRange', {
                min: layout.minW.toFixed(1),
                max: layout.maxW.toFixed(1),
              })}
        </Text>
        <Text style={styles.axisDate}>{single ? '' : shortDate(layout.endMs, localeTag)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  empty: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: spacing.xs,
  },
  axisDate: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  axisHint: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
});
