import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  size?: number;
  strokeWidth?: number;
  value: number;
  goal: number;
  color: string;
  /** Primary label inside the ring (e.g. "85 g") */
  centerText: string;
  /** Secondary muted label below the main one. */
  centerSub?: string;
};

export default function MacroRing({
  size = 96,
  strokeWidth = 9,
  value,
  goal,
  color,
  centerText,
  centerSub,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0;
  const dashOffset = c * (1 - pct);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.centerText}>{centerText}</Text>
        {centerSub ? <Text style={styles.centerSub}>{centerSub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 14, fontWeight: '800', color: colors.text },
  centerSub: { fontSize: 10, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
});
