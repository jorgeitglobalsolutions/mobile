import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  View,
  StyleSheet,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExerciseGifUrl } from '../data/exerciseGifUrls';
import { colors, radius } from '../theme';

type Props = {
  exerciseId: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  fallbackSize?: number;
};

export default function ExerciseGifImage({
  exerciseId,
  style,
  imageStyle,
  resizeMode = 'cover',
  fallbackSize = 48,
}: Props) {
  const url = getExerciseGifUrl(exerciseId);
  const [loading, setLoading] = useState(Boolean(url));
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <View
        style={[
          styles.fallback,
          { width: fallbackSize, height: fallbackSize, borderRadius: radius.md },
          style,
        ]}
      >
        <Ionicons name="fitness-outline" size={fallbackSize * 0.5} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}
      <Image
        source={{ uri: url }}
        style={imageStyle}
        resizeMode={resizeMode}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.primarySoft },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  fallback: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
