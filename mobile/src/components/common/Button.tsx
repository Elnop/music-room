import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const isDisabled = disabled || loading;
  const buttonText = title || children;

  const containerStyle = [
    styles.container,
    styles[variant],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ].filter(Boolean);

  const textStyle = [styles.text, styles[`${variant}Text` as keyof typeof styles]].filter(Boolean);

  // Spinner color based on variant
  const spinnerColor = variant === 'outline' ? theme.colors.primary : theme.colors.textInverse;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={textStyle}>{buttonText}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingVertical: theme.spacing.sm + 4,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borders.medium, // 8px arrondi léger
      borderWidth: theme.borders.thick, // 3px bordure noire épaisse
      borderColor: theme.colors.border, // Noir
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
      ...theme.shadows.medium, // Ombre offset 4px
    },
    fullWidth: {
      width: '100%',
    },
    disabled: {
      backgroundColor: theme.colors.surfaceAlt,
      borderColor: theme.colors.borderLight,
      // Pas d'opacity - utilisation de couleurs désactivées
    },

    // Variants
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.surface,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: theme.borders.medium, // 2px pour outline
    },

    // Text styles
    text: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.bold, // 700 - bold par défaut
    },
    primaryText: {
      color: theme.colors.textInverse,
    },
    secondaryText: {
      color: theme.colors.text,
    },
    outlineText: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.bold,
    },
  });
