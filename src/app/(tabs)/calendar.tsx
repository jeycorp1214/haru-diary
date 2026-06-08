// 감정 캘린더 — 월별 일기를 감정 색상 점으로 마킹, 날짜 탭 시 상세 이동
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';

import { entriesInMonth } from '@/db/queries/entries';
import { moodColor } from '@/constants/mood';

export default function CalendarScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const [yearMonth, setYearMonth] = useState(dayjs().format('YYYY-MM'));

  const { data } = useQuery({
    queryKey: ['entries', 'month', yearMonth],
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
    <View style={{ flex: 1 }}>
      <Calendar
        current={`${yearMonth}-01`}
        markedDates={marked}
        onDayPress={onDayPress}
        onMonthChange={(m) => setYearMonth(dayjs(m.dateString).format('YYYY-MM'))}
        theme={
          isDark
            ? {
                calendarBackground: '#000',
                dayTextColor: '#fff',
                monthTextColor: '#fff',
                textSectionTitleColor: '#aaa',
              }
            : undefined
        }
      />
    </View>
  );
}
