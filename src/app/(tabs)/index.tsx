// 일기 타임라인 피드 — 최신순 FlashList + 작성 FAB
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Icon, Input, Typography } from '@/components/ui';
import { listEntries } from '@/db/queries/entries';
import { searchEntries } from '@/db/queries/search';
import { queryKeys } from '@/lib/queryKeys';

const styles = StyleSheet.create((theme) => ({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

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
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('tabs.feed')} />
      <Box px="md">
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t('feed.searchPlaceholder')}
          leftIcon="search"
          clearable
          returnKeyType="search"
        />
      </Box>
      <FlashList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/entry/[id]', params: { id: item.id } }} asChild>
            <Pressable>
              <Box row gap="md" py="sm">
                <Text style={{ fontSize: 28 }}>{item.mood?.emoji ?? '📝'}</Text>
                <Box flex={1} gap="xs">
                  <Typography variant="bodyStrong" numberOfLines={1}>
                    {item.title || t('feed.untitled')}
                  </Typography>
                  <Typography variant="caption" numberOfLines={2}>
                    {item.contentText}
                  </Typography>
                  <Typography variant="caption" color="textDisabled">
                    {dayjs(item.entryDate).format('YYYY.MM.DD')}
                  </Typography>
                </Box>
              </Box>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Box align="center" pt="xl" px="lg">
              <Typography variant="caption" style={{ textAlign: 'center' }}>
                {searching ? t('feed.noResults') : t('feed.empty')}
              </Typography>
            </Box>
          ) : null
        }
      />

      <Link href="/entry/new" asChild>
        <Pressable style={styles.fab}>
          <Icon name="add" size={28} color="onPrimary" />
        </Pressable>
      </Link>
    </Box>
  );
}
