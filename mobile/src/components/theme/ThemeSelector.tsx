import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme, ThemeName } from '@/themes/types';

// Theme metadata for selector
const AVAILABLE_THEMES: Array<{
  name: ThemeName;
  displayName: string;
  primaryColor: string;
  icon: string;
}> = [
  { name: 'royalBlue', displayName: 'Bleu Roi', primaryColor: '#1E3A8A', icon: '👑' },
  { name: 'christmas', displayName: 'Noël', primaryColor: '#DC2626', icon: '🎄' },
  { name: 'pastelLime', displayName: 'Lime', primaryColor: '#84CC16', icon: '🍋' },
];

export function ThemeSelector() {
  const { theme, themeName, setTheme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {AVAILABLE_THEMES.map(themeOption => {
        const isSelected = themeName === themeOption.name;
        return (
          <TouchableOpacity
            key={themeOption.name}
            style={[
              styles.themeButton,
              { borderColor: themeOption.primaryColor },
              isSelected && styles.themeButtonSelected,
              isSelected && { backgroundColor: themeOption.primaryColor },
            ]}
            onPress={() => setTheme(themeOption.name)}
            activeOpacity={0.7}
          >
            <Text style={styles.themeIcon}>{themeOption.icon}</Text>
            <Text style={[styles.themeName, isSelected && styles.themeNameSelected]}>
              {themeOption.displayName}
            </Text>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    themeButton: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: 12,
      borderWidth: 2,
      backgroundColor: theme.colors.surface,
    },
    themeButtonSelected: {
      borderWidth: 3,
    },
    themeIcon: {
      fontSize: 24,
      marginBottom: theme.spacing.xs,
    },
    themeName: {
      fontSize: 12,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
      textAlign: 'center',
    },
    themeNameSelected: {
      color: '#FFFFFF',
      fontWeight: theme.typography.weights.bold,
    },
    checkmark: {
      position: 'absolute',
      top: 4,
      right: 6,
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: theme.typography.weights.bold,
    },
  });
