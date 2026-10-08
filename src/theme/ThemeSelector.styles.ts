import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    borderRadius: 14,
  },
  option: {
    minWidth: 58,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
