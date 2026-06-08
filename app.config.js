// 빌드 환경(APP_ENV)에 따라 앱 이름·식별자를 분리해 테스트/운영 앱을 기기에 공존시키는 동적 설정.
// app.json을 base(config)로 읽고, dev 빌드일 때만 name/bundleIdentifier/package를 덮어쓴다.
const IS_DEV = process.env.APP_ENV === 'development';

module.exports = ({ config }) => {
  if (!IS_DEV) return config;

  return {
    ...config,
    name: `${config.name} (Dev)`,
    scheme: `${config.scheme}dev`, // 딥링크 충돌 방지 (harudiary → harudiarydev)
    ios: {
      ...config.ios,
      bundleIdentifier: `${config.ios.bundleIdentifier}.dev`,
    },
    android: {
      ...config.android,
      package: `${config.android.package}.dev`,
    },
  };
};
