module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^@notifee/react-native$': '<rootDir>/test-mocks/notifee.ts',
    '^react-native-blob-util$': '<rootDir>/test-mocks/reactNativeBlobUtil.ts',
  },
};
