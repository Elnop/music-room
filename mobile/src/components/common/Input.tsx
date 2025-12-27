import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  leftIcon,
  containerStyle,
  ...rest
}: InputProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithIcon : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          {...rest}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borders.medium,
      borderWidth: theme.borders.medium,
      borderColor: theme.colors.border,
    },
    inputContainerError: {
      borderWidth: theme.borders.thick,
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.surface,
    },
    leftIcon: {
      paddingLeft: theme.spacing.sm + 2,
    },
    input: {
      flex: 1,
      paddingVertical: theme.spacing.sm + 2,
      paddingHorizontal: theme.spacing.sm + 4,
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.regular,
    },
    inputWithIcon: {
      paddingLeft: theme.spacing.xs,
    },
    error: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.error,
      fontWeight: theme.typography.weights.semibold,
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    },
  });
