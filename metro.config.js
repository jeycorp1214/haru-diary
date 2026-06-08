const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// drizzle 마이그레이션 .sql 파일을 모듈로 해석 (babel inline-import와 연동)
config.resolver.sourceExts.push('sql');

module.exports = config;
