import React from 'react';
import { View, Image, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { COLORS, FONT_SIZES } from '@constants';

interface AvatarProps {
  uri?: string;
  size?: 'sm' | 'md' | 'lg';
  name?: string;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 80,
};

const FONT_SIZE_MAP = {
  sm: FONT_SIZES.xs,
  md: FONT_SIZES.md,
  lg: FONT_SIZES.xl,
};

export function Avatar({ uri, size = 'md', name, style }: AvatarProps) {
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];

  // Get initials from name
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
});
