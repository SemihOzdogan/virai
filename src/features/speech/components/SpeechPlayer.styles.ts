import { StyleSheet } from 'react-native';
import type { ColorTokens } from '../../../theme';

export function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      zIndex: 2,
    },
    player: {
      minHeight: 58,
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    description: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    control: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    controlText: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
