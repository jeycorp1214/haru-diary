// Android 11+ package visibility: SpeechRecognizer가 RecognitionService를 조회하도록 manifest <queries> 추가
const { withAndroidManifest } = require('@expo/config-plugins');

const RECOGNITION_SERVICE = 'android.speech.RecognitionService';

module.exports = function withSpeechRecognitionQuery(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries || [];
    if (manifest.queries.length === 0) manifest.queries.push({});
    const q = manifest.queries[0];
    q.intent = q.intent || [];
    const exists = q.intent.some((i) =>
      i.action?.some((a) => a.$?.['android:name'] === RECOGNITION_SERVICE),
    );
    if (!exists) {
      q.intent.push({ action: [{ $: { 'android:name': RECOGNITION_SERVICE } }] });
    }
    return cfg;
  });
};
