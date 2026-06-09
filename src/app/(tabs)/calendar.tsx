// 감정 캘린더 — 월별 일기를 감정 색상 점으로 마킹, 날짜 탭 시 상세 이동
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box } from '@/components/ui';
import { entriesInMonth } from '@/db/queries/entries';
import { moodColor } from '@/constants/mood';
import { queryKeys } from '@/lib/queryKeys';
import { FONT_FAMILY, FONT_FAMILY_BOLD } from '@/lib/fonts';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const fontKey = useSettingsStore((s) => s.fontFamily);
  const [yearMonth, setYearMonth] = useState(dayjs().format('YYYY-MM'));

  // 캘린더 내부 텍스트는 RN Text 직접 생성이 아니라 라이브러리 theme로 글꼴 지정
  const fontTheme = {
    textDayFontFamily: FONT_FAMILY[fontKey],
    textMonthFontFamily: FONT_FAMILY_BOLD[fontKey],
    textDayHeaderFontFamily: FONT_FAMILY[fontKey],
  };

  const { data } = useQuery({
    queryKey: queryKeys.entriesMonth(yearMonth),
    queryFn: () => entriesInMonth(yearMonth),
  });

  // 날짜별 그룹 + 마킹(대표 = 첫 일기 감정)
  const byDate: Record<string, NonNullable<typeof data>> = {};
  const marked: Record<string, { marked: boolean; dotColor: string }> = {};
  data?.forEach((e) => {
    (byDate[e.entryDate] ??= []).push(e);
  });
  Object.entries(byDate).forEach(([date, list]) => {
    marked[date] = { marked: true, dotColor: moodColor(list[0].mood?.score) };
  });

  function onDayPress(day: DateData) {
    const list = byDate[day.dateString];
    if (list?.length) {
      router.push({ pathname: '/entry/[id]', params: { id: list[0].id } });
    }
  }

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('tabs.calendar')} />
      <Calendar
        current={`${yearMonth}-01`}
        markedDates={marked}
        onDayPress={onDayPress}
        onMonthChange={(m) => setYearMonth(dayjs(m.dateString).format('YYYY-MM'))}
        theme={
          isDark
            ? {
                ...fontTheme,
                calendarBackground: '#000',
                dayTextColor: '#fff',
                monthTextColor: '#fff',
                textSectionTitleColor: '#aaa',
              }
            : fontTheme
        }
      />
    </Box>
  );
}
