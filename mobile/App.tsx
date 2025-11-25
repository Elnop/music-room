import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from './src/constants';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Music Room</Text>
      <Text style={styles.subtitle}>Mobile App Initialized ✅</Text>
      <Text style={styles.info}>Backend: localhost:3000</Text>
      <Text style={styles.info}>React Native with Expo</Text>
      <Text style={styles.info}>TypeScript + Zustand + React Navigation</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  info: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
