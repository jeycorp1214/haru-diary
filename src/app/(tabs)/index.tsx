// 일기 타임라인 피드 — 최신순 FlashList + 작성 FAB
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { listEntries } from '@/db/queries/entries';
import { searchEntries } from '@/db/queries/search';
import { queryKeys } from '@/lib/queryKeys';

export default function FeedScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  const feed = useQuery({ queryKey: queryKeys.entries(), queryFn: () => listEntries() });
  const search = useQuery({
    queryKey: queryKeys.search(query.trim()),
    queryFn: () => searchEntries(query),
    enabled: searching,
  });

  const data = searching ? search.data : feed.data;
  const isLoading = searching ? search.isLoading : feed.isLoading;

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('tabs.feed')} />
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('feed.searchPlaceholder')}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <FlashList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/entry/[id]', params: { id: item.id } }} asChild>
            <Pressable style={styles.row}>
              <Text style={styles.emoji}>{item.mood?.emoji ?? '📝'}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title || t('feed.untitled')}
                </Text>
                <Text style={styles.rowPreview} numberOfLines={2}>
                  {item.contentText}
                </Text>
                <Text style={styles.rowDate}>{dayjs(item.entryDate).format('YYYY.MM.DD')}</Text>
              </View>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {searching ? t('feed.noResults') : t('feed.empty')}
              </Text>
            </View>
          ) : null
        }
      />

      <Link href="/entry/new" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabIcon}>＋</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { paddingHorizontal: 16, paddingTop: 8 },
  searchInput: {
    backgroundColor: '#7676801f',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  list: { padding: 16 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  emoji: { fontSize: 28 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowPreview: { fontSize: 14, color: '#666' },
  rowDate: { fontSize: 12, color: '#999', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyText: { color: '#999', textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
