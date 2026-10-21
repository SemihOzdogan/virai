import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 64,
    paddingHorizontal: 12,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconLabel: { fontSize: 19 },
  copy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 3 },
  chevron: { fontSize: 24, lineHeight: 26 },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: { borderRadius: 20, padding: 18, width: '100%' },
  sheetTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  choice: { alignItems: 'center', flexDirection: 'row', minHeight: 50 },
  choiceText: { flex: 1, fontSize: 16, fontWeight: '600' },
  check: { fontSize: 20, fontWeight: '800' },
});
