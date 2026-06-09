// 루트에 1회 마운트되는 확인 다이얼로그. confirm() 싱글톤이 호출하면 테마 Modal 표시 후 resolve.
import { useEffect, useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { setConfirmHandler, type ConfirmOptions } from '@/lib/confirm';
import { Box } from './Box';
import { Button } from './Button';
import { Typography } from './Typography';

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000080',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%' as const,
    maxWidth: 360,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.lg,
    padding: 20,
    gap: 12,
  },
}));

type Pending = { opts: ConfirmOptions; resolve: (ok: boolean) => void };

export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => setConfirmHandler((opts, resolve) => setPending({ opts, resolve })), []);

  function close(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  const opts = pending?.opts;

  return (
    <Modal visible={!!pending} transparent animationType="fade" onRequestClose={() => close(false)}>
      <Pressable style={styles.backdrop} onPress={() => close(false)}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          {opts && (
            <>
              <Typography variant="title">{opts.title}</Typography>
              {opts.message ? <Typography variant="body" color="textMuted">{opts.message}</Typography> : null}
              <Box row gap="sm" justify="flex-end" mt="sm">
                <Button variant="text" onPress={() => close(false)}>
                  {opts.cancelLabel ?? '취소'}
                </Button>
                <Button tone={opts.destructive ? 'danger' : 'primary'} onPress={() => close(true)}>
                  {opts.confirmLabel ?? '확인'}
                </Button>
              </Box>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
