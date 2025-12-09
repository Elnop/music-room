import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@contexts';
import { ThemeSelector } from '@components/theme';
import type { Theme } from '@themes/types';

export function SettingsScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apparence</Text>
        <ThemeSelector />
      </View>

      {/* Section future : Compte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <Text style={styles.placeholder}>
          Paramètres du compte à venir...
        </Text>
      </View>

      {/* Section future : Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.placeholder}>
          Paramètres des notifications à venir...
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    section: {
      padding: theme.spacing.md,
      borderBottomWidth: theme.borders.thin,
      borderBottomColor: theme.colors.borderLight,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    placeholder: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
  });
