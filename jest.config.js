module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^@notifee/react-native$': '<rootDir>/test-mocks/notifee.ts',
  },
};
