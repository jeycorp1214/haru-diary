module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // drizzle 마이그레이션: .sql 파일을 문자열로 인라인 import
      ['inline-import', { extensions: ['.sql'] }],
      // Unistyles — StyleSheet 자동 처리(테마/breakpoint 주입). root는 소스 디렉토리.
      ['react-native-unistyles/plugin', { root: 'src' }],
      // reanimated 4 / worklets — 반드시 마지막
      'react-native-worklets/plugin',
    ],
  };
};
