// 작성 중 이탈 방지 — 뒤로/제스처로 나갈 때 dirty면 확인 다이얼로그. expo-router beforeRemove.
// isDirty/opts는 ref로 최신값 유지(구독은 1회). 저장 성공 시 isDirty가 false면 가드 통과.
import { useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';

import { confirm, type ConfirmOptions } from '@/lib/confirm';

export function useUnsavedGuard(isDirty: () => boolean, opts: ConfirmOptions) {
  const navigation = useNavigation();
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e: { preventDefault: () => void; data: { action: object } }) => {
      if (!dirtyRef.current()) return;
      e.preventDefault();
      confirm(optsRef.current).then((ok) => {
        if (ok) navigation.dispatch(e.data.action as Parameters<typeof navigation.dispatch>[0]);
      });
    });
    return sub;
  }, [navigation]);
}
