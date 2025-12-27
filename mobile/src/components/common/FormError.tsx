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
      backgroundColor: theme.colors.error + '20',
      borderLeftWidth: theme.borders.thick,
      borderLeftColor: theme.colors.error,
      padding: theme.spacing.sm,
      borderRadius: theme.borders.small,
      marginBottom: theme.spacing.md,
    },
    text: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.error,
      fontWeight: theme.typography.weights.semibold,
    },
  });
