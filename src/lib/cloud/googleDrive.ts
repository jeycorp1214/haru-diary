// Google Drive 클라우드 백업 — OAuth(expo-auth-session) 후 백업 JSON 업로드.
// client ID는 EXPO_PUBLIC_GOOGLE_*_CLIENT_ID 환경변수(미설정 시 'unconfigured').
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { buildBackupJson } from '@/lib/backup';

WebBrowser.maybeCompleteAuthSession();

const CLIENT = {
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

// client ID 미설정 시 useAuthRequest가 throw하므로, 이 값이 true일 때만 useDriveBackup 호출
export const isDriveConfigured = Boolean(CLIENT.android || CLIENT.ios || CLIENT.web);

export type BackupResult = 'ok' | 'cancel';

async function uploadToDrive(accessToken: string, json: string) {
  const boundary = 'haru-backup-boundary';
  const metadata = { name: `haru-backup-${Date.now()}.json`, mimeType: 'application/json' };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
    json +
    `\r\n--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!res.ok) throw new Error(`Drive 업로드 실패: ${res.status}`);
}

export function useDriveBackup() {
  const [, , promptAsync] = Google.useAuthRequest({
    androidClientId: CLIENT.android,
    iosClientId: CLIENT.ios,
    webClientId: CLIENT.web,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  async function backup(): Promise<BackupResult> {
    const res = await promptAsync();
    if (res.type !== 'success') return 'cancel';
    const token = res.authentication?.accessToken;
    if (!token) return 'cancel';
    await uploadToDrive(token, await buildBackupJson());
    return 'ok';
  }

  return { backup };
}
