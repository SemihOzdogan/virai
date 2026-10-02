const path = require('node:path');

module.exports = {
  dependencies: {
    'react-native-safe-area-context': {
      platforms: {
        android: {
          libraryName: 'virai_safeareacontext',
          cmakeListsPath: path.resolve(
            __dirname,
            'android/app/src/main/jni/safeareacontext/CMakeLists.txt',
          ),
        },
      },
    },
  },
};
