import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import type { VisibilityLevel } from '@/types/user.types';
import { VISIBILITY_LABELS, VISIBILITY_ICONS } from '@/types/user.types';

interface VisibilityToggleProps {
  label: string;
  description?: string;
  value: VisibilityLevel;
  onChange: (value: VisibilityLevel) => void;
}

const VISIBILITY_OPTIONS: VisibilityLevel[] = ['public', 'friends_only', 'private'];

export function VisibilityToggle({ label, description, value, onChange }: VisibilityToggleProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>

      <View style={styles.options}>
        {VISIBILITY_OPTIONS.map(option => {
          const isSelected = value === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onChange(option)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionIcon}>{VISIBILITY_ICONS[option]}</Text>
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {VISIBILITY_LABELS[option]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontSize: 16,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    description: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    options: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    option: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 8,
      gap: 4,
    },
    optionSelected: {
      backgroundColor: theme.colors.primary,
    },
    optionIcon: {
      fontSize: 14,
    },
    optionLabel: {
      fontSize: 12,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.textSecondary,
    },
    optionLabelSelected: {
      color: '#FFFFFF',
    },
  });
