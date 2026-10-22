const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': path.resolve(__dirname, 'src'),
          },
        },
      ],
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};
