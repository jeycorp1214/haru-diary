module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
      // drizzle 마이그레이션: .sql 파일을 문자열로 인라인 import
      ['inline-import', { extensions: ['.sql'] }],
      // reanimated 4 / worklets — 반드시 마지막
      'react-native-worklets/plugin',
    ],
  };
};
