// drizzle 마이그레이션 .sql 파일을 문자열 모듈로 인식 (babel inline-import 연동)
declare module '*.sql' {
  const content: string;
  export default content;
}
