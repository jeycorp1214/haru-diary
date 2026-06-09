// 일기를 PDF로 내보내기 — HTML 조립 후 expo-print로 PDF 생성·공유 (전체/단일)
import dayjs from 'dayjs';
import { File } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { allEntriesForExport, getEntry } from '@/db/queries/entries';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 로컬 사진 uri → data URI. Android <img>는 file:// 미지원이라 base64 임베드 필요
async function photoToDataUri(uri: string): Promise<string | null> {
  try {
    const b64 = await new File(uri).base64();
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${b64}`;
  } catch {
    return null; // 파일 누락 등 — 해당 사진만 건너뜀
  }
}

type ExportEntry = Awaited<ReturnType<typeof allEntriesForExport>>[number];

// 일기 1건 → HTML 섹션. 본문은 tentap이 저장한 HTML(content)을 그대로 사용
async function entrySectionHtml(e: ExportEntry, untitled: string): Promise<string> {
  const photos = (
    await Promise.all(
      e.photos.map(async (p) => {
        const data = await photoToDataUri(p.uri);
        return data ? `<img class="photo" src="${data}" />` : '';
      }),
    )
  ).join('');

  const meta = [e.locationName, e.weather, e.tempC != null ? `${Math.round(e.tempC)}°` : null]
    .filter(Boolean)
    .map((x) => escapeHtml(String(x)))
    .join(' · ');

  const tags = e.entryTags.map((et) => `#${escapeHtml(et.tag.name)}`).join(' ');

  return `<section class="entry">
    <div class="date">${escapeHtml(dayjs(e.entryDate).format('YYYY.MM.DD'))}</div>
    <h1>${e.mood?.emoji ?? ''} ${escapeHtml(e.title || untitled)}</h1>
    ${meta ? `<div class="meta">📍 ${meta}</div>` : ''}
    <div class="body">${e.content || `<p>${escapeHtml(e.contentText)}</p>`}</div>
    ${photos ? `<div class="photos">${photos}</div>` : ''}
    ${tags ? `<div class="tags">${tags}</div>` : ''}
  </section>`;
}

// 한글은 webview 시스템 폰트로 렌더. 일기마다 페이지 분리
function wrapHtml(sections: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, 'Noto Sans KR', sans-serif; color: #222; padding: 24px; }
    .entry { page-break-after: always; }
    .entry:last-child { page-break-after: auto; }
    .date { color: #888; font-size: 13px; }
    h1 { font-size: 22px; margin: 4px 0 8px; }
    .meta { color: #666; font-size: 13px; margin-bottom: 12px; }
    .body { font-size: 15px; line-height: 1.7; }
    .body img { max-width: 100%; }
    .photos { margin-top: 12px; }
    .photo { width: 31%; border-radius: 8px; margin: 0 1% 8px 0; vertical-align: top; }
    .tags { margin-top: 12px; color: #208AEF; font-size: 14px; }
  </style></head><body>${sections}</body></html>`;
}

async function shareHtmlAsPdf(html: string) {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}

// 전체 일기 → PDF
export async function exportEntriesPdf(untitled: string) {
  const entries = await allEntriesForExport();
  const sections = (await Promise.all(entries.map((e) => entrySectionHtml(e, untitled)))).join('');
  await shareHtmlAsPdf(wrapHtml(sections));
}

// 단일 일기 → PDF
export async function exportEntryPdf(id: string, untitled: string) {
  const entry = await getEntry(id);
  if (!entry) return;
  await shareHtmlAsPdf(wrapHtml(await entrySectionHtml(entry, untitled)));
}
