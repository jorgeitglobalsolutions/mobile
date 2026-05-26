import React from 'react';
import { Image, View, StyleSheet, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExerciseGif } from '../data/exerciseAssets.generated';
import { colors, radius } from '../theme';

type Props = {
  exerciseId: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export default function ExerciseGifThumb({ exerciseId, size = 48, style, imageStyle }: Props) {
  const source = getExerciseGif(exerciseId);
  if (!source) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: radius.md }, style]}>
        <Ionicons name="fitness-outline" size={size * 0.5} color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius.md }, style]}>
      <Image
        source={source}
        style={[styles.image, { width: size, height: size }, imageStyle]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.primarySoft },
  image: { borderRadius: radius.md },
  fallback: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
