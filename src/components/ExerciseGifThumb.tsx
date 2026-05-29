import React from 'react';
import { StyleSheet, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import ExerciseGifImage from './ExerciseGifImage';
import { radius } from '../theme';

type Props = {
  exerciseId: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export default function ExerciseGifThumb({ exerciseId, size = 48, style, imageStyle }: Props) {
  return (
    <ExerciseGifImage
      exerciseId={exerciseId}
      style={[styles.wrap, { width: size, height: size, borderRadius: radius.md }, style]}
      imageStyle={[styles.image, { width: size, height: size }, imageStyle]}
      resizeMode="cover"
      fallbackSize={size}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  image: { borderRadius: radius.md },
});
