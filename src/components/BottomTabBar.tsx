import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { accessLevel } = useAuth();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          if (route.name === 'AddPlaceholder') {
            return (
              <View key={route.key} style={styles.tabSlot}>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  style={styles.fab}
                  onPress={() => {
                    const parent = navigation.getParent();
                    if (accessLevel === 'paywalled') {
                      parent?.navigate('Paywall' as never);
                    } else {
                      parent?.navigate('ExerciseLibrary' as never);
                    }
                  }}
                >
                  <Ionicons name="add" size={32} color={colors.white} />
                </TouchableOpacity>
              </View>
            );
          }

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
          if (route.name === 'Routines') iconName = isFocused ? 'barbell' : 'barbell-outline';
          if (route.name === 'History') iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
          if (route.name === 'Profile') iconName = isFocused ? 'person' : 'person-outline';

          const displayLabel =
            route.name === 'Home'
              ? 'Home'
              : route.name === 'Routines'
                ? 'Routines'
                : route.name === 'History'
                  ? 'History'
                    : route.name === 'Profile'
                    ? 'Profile'
                    : route.name;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabSlot}
              activeOpacity={0.85}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.label, isFocused && styles.labelActive]}>{displayLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
      android: { elevation: 8 },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  labelActive: { color: colors.primary },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
});
