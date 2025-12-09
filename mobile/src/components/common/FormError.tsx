import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';

interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.error + '20', // 20% opacity rouge
      borderLeftWidth: theme.borders.thick, // 3px bordure gauche
      borderLeftColor: theme.colors.error, // Rouge
      padding: theme.spacing.sm,
      borderRadius: theme.borders.small, // 4px
      marginBottom: theme.spacing.md,
    },
    text: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.error,
      fontWeight: theme.typography.weights.semibold, // 600 - bold
    },
  });
