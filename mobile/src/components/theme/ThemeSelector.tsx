import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@contexts';
import { royalBlueTheme, christmasTheme, pastelLimeTheme } from '@themes';
import type { ThemeName, Theme } from '@themes/types';

const THEME_OPTIONS: Array<{
  name: ThemeName;
  label: string;
  description: string;
  preview: Theme;
}> = [
  {
    name: 'royalBlue',
    label: 'Bleu Roi',
    description: 'Professionnel & Moderne',
    preview: royalBlueTheme,
  },
  {
    name: 'christmas',
    label: 'Noël',
    description: 'Festif & Joyeux',
    preview: christmasTheme,
  },
  {
    name: 'pastelLime',
    label: 'Lime Pastel',
    description: 'Ludique & Énergique',
    preview: pastelLimeTheme,
  },
];

export function ThemeSelector() {
  const { theme, themeName, setTheme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const handleThemeChange = async (name: ThemeName) => {
    if (name !== themeName) {
      await Haptics.selectionAsync();
      setTheme(name);
    }
  };

  return (
    <View style={styles.container}>
      {THEME_OPTIONS.map((option) => {
        const isSelected = option.name === themeName;
        return (
          <TouchableOpacity
            key={option.name}
            style={[
              styles.themeCard,
              isSelected && styles.themeCardSelected,
            ]}
            onPress={() => handleThemeChange(option.name)}
            activeOpacity={0.7}
          >
            {/* Preview des couleurs */}
            <View style={styles.colorPreview}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: option.preview.colors.primary },
                ]}
              />
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: option.preview.colors.secondary },
                ]}
              />
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: option.preview.colors.accent },
                ]}
              />
            </View>

            {/* Infos */}
            <View style={styles.info}>
              <Text style={styles.themeLabel}>{option.label}</Text>
              <Text style={styles.themeDescription}>
                {option.description}
              </Text>
            </View>

            {/* Checkmark si sélectionné */}
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.md,
    },
    themeCard: {
      backgroundColor: theme.colors.surface,
      borderWidth: theme.borders.medium, // 2px
      borderColor: theme.colors.border,
      borderRadius: theme.borders.medium, // 8px
      padding: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      ...theme.shadows.small, // Ombre 2px
    },
    themeCardSelected: {
      borderWidth: theme.borders.thick, // 3px quand sélectionné
      borderColor: theme.colors.primary,
      ...theme.shadows.medium, // Ombre plus grande
    },
    colorPreview: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    colorDot: {
      width: 28,
      height: 28,
      borderRadius: theme.borders.round, // Cercle
      borderWidth: theme.borders.thin, // 1px
      borderColor: theme.colors.border,
    },
    info: {
      flex: 1,
    },
    themeLabel: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    themeDescription: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.weights.medium,
    },
    checkmarkContainer: {
      width: 32,
      height: 32,
      borderRadius: theme.borders.round,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: theme.borders.medium,
      borderColor: theme.colors.border,
    },
    checkmark: {
      fontSize: theme.typography.sizes.lg,
      color: theme.colors.textInverse,
      fontWeight: theme.typography.weights.bold,
    },
  });
