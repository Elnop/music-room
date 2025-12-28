import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { isLightColor } from '@/hooks/useImageColors';
import type { Theme } from '@themes/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface FloatingHeaderProps {
  /** Title displayed (optional) */
  title?: string;
  /** Title alignment (default: 'center') */
  titleAlign?: 'center' | 'left';
  /** Right action button icon (optional) */
  rightIcon?: IoniconsName;
  /** Right action button callback */
  onRightPress?: () => void;
  /** Show right button (default: false if no rightIcon/onRightPress) */
  showRightButton?: boolean;
  /** Show back button (default: true) */
  showBackButton?: boolean;
  /** Custom back action (default: navigation.goBack) */
  onBackPress?: () => void;
}

export function FloatingHeader({
  title,
  titleAlign = 'center',
  rightIcon = 'ellipsis-horizontal',
  onRightPress,
  showRightButton,
  showBackButton = true,
  onBackPress,
}: FloatingHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Detect if we're on a light theme
  const isLight = isLightColor(theme.colors.background);
  const buttonBg = isLight ? 'rgba(200, 200, 200, 0.8)' : 'rgba(30, 30, 30, 0.6)';
  const iconColor = isLight ? '#1a1a1a' : '#FFFFFF';

  const styles = React.useMemo(
    () => createStyles(theme, insets.top, !!title, titleAlign, buttonBg),
    [theme, insets.top, title, titleAlign, buttonBg]
  );

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const shouldShowRight = showRightButton ?? !!onRightPress;

  return (
    <View style={styles.container}>
      {/* Back button or placeholder */}
      {showBackButton ? (
        <TouchableOpacity style={styles.button} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.buttonPlaceholder} />
      )}

      {/* Title (optional) */}
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Right button */}
      {shouldShowRight ? (
        <TouchableOpacity style={styles.button} onPress={onRightPress} activeOpacity={0.7}>
          <Ionicons name={rightIcon} size={24} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.buttonPlaceholder} />
      )}
    </View>
  );
}

const createStyles = (
  theme: Theme,
  topInset: number,
  hasTitle: boolean,
  titleAlign: 'center' | 'left',
  buttonBg: string
) =>
  StyleSheet.create({
    container: {
      position: hasTitle ? 'relative' : 'absolute',
      top: hasTitle ? 0 : topInset + theme.spacing.sm,
      left: hasTitle ? 0 : theme.spacing.md,
      right: hasTitle ? 0 : theme.spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
      paddingTop: hasTitle ? topInset + theme.spacing.sm : 0,
      paddingHorizontal: hasTitle ? theme.spacing.md : 0,
      paddingBottom: hasTitle ? theme.spacing.sm : 0,
    },
    button: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: buttonBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonPlaceholder: {
      width: titleAlign === 'left' ? 0 : 36,
      height: 36,
    },
    title: {
      fontSize: titleAlign === 'left' ? 28 : 20,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      flex: 1,
      textAlign: titleAlign,
      marginLeft: titleAlign === 'left' ? 0 : theme.spacing.md,
      marginRight: theme.spacing.md,
    },
  });

/**
 * Get the top padding needed for content below FloatingHeader
 */
export function useFloatingHeaderPadding() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  return insets.top + theme.spacing.sm + 36 + theme.spacing.md; // topInset + header spacing + button height + extra padding
}
