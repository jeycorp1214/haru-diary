// 전역 확인 다이얼로그 싱글톤 — `if (await confirm({...}))` 형태. 루트 ConfirmHost가 처리.
export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type Handler = (opts: ConfirmOptions, resolve: (ok: boolean) => void) => void;

let handler: Handler | null = null;

export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (handler) handler(opts, resolve);
    else resolve(false);
  });
}

export function setConfirmHandler(fn: Handler) {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}
