import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  artwork: StyleSheet.absoluteFill,
  frame: {
    width: '100%',
    alignSelf: 'stretch',
    aspectRatio: 360 / 220,
    marginTop: 18,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  caption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 7,
    fontSize: 11,
  },
});
