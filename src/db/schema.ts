// 일기 앱 관계형 스키마 정의 (drizzle-orm + expo-sqlite). FTS5 가상테이블은 client.ts 부트스트랩 참조.
import { relations } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// 감정 정의표 (시드 고정). score는 통계 집계용 -2..2
export const moods = sqliteTable('moods', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  emoji: text('emoji').notNull(),
  label: text('label').notNull(),
  score: integer('score').notNull(),
});

// 일기 본문 + 메타(날짜/감정/날씨/위치)
export const entries = sqliteTable(
  'entries',
  {
    id: text('id').primaryKey(),
    entryDate: text('entry_date').notNull(), // 일기 귀속 날짜 YYYY-MM-DD (캘린더/스트릭 기준)
    title: text('title'),
    content: text('content'), // 리치텍스트 직렬화(tentap 산출물)
    contentText: text('content_text').notNull(), // FTS·미리보기용 평문
    moodId: text('mood_id').references(() => moods.id), // 단일 대표 감정
    weather: text('weather'),
    tempC: real('temp_c'),
    locationName: text('location_name'),
    lat: real('lat'),
    lng: real('lng'),
    createdAt: integer('created_at').notNull(), // epoch ms
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('idx_entries_entry_date').on(t.entryDate), // 캘린더/스트릭
    index('idx_entries_created_at').on(t.createdAt), // 타임라인 피드 정렬
  ],
);

// 활동/주제 태그
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
});

// 일기 ↔ 태그 m:n
export const entryTags = sqliteTable(
  'entry_tags',
  {
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.entryId, t.tagId] }),
    index('idx_entry_tags_tag_id').on(t.tagId), // 태그 → 일기 역참조
  ],
);

// 첨부 사진 (uri = documentDirectory 내 영구 경로)
export const photos = sqliteTable(
  'photos',
  {
    id: text('id').primaryKey(),
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    uri: text('uri').notNull(),
    width: integer('width'),
    height: integer('height'),
    sort: integer('sort').notNull().default(0),
  },
  (t) => [index('idx_photos_entry_id').on(t.entryId)], // 일기별 사진 조회
);

// --- relations (쿼리 조인 편의) ---

export const entriesRelations = relations(entries, ({ one, many }) => ({
  mood: one(moods, { fields: [entries.moodId], references: [moods.id] }),
  photos: many(photos),
  entryTags: many(entryTags),
}));

export const moodsRelations = relations(moods, ({ many }) => ({
  entries: many(entries),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  entryTags: many(entryTags),
}));

export const entryTagsRelations = relations(entryTags, ({ one }) => ({
  entry: one(entries, { fields: [entryTags.entryId], references: [entries.id] }),
  tag: one(tags, { fields: [entryTags.tagId], references: [tags.id] }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  entry: one(entries, { fields: [photos.entryId], references: [entries.id] }),
}));

// 추론 타입
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type Mood = typeof moods.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
