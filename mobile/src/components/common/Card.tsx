import React from 'react';
import { View, StyleSheet, TouchableOpacity, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevation?: boolean;
}

export function Card({ children, onPress, style, elevation = true }: CardProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, elevation && styles.elevation, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface, // Blanc
      borderRadius: theme.borders.medium, // 8px
      borderWidth: theme.borders.thick, // 3px bordure noire
      borderColor: theme.colors.border, // Noir
      padding: theme.spacing.md,
    },
    elevation: {
      ...theme.shadows.large, // Ombre offset 6px (grande ombre pour les cartes)
    },
  });
