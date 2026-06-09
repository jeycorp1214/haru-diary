// 전역 토스트 싱글톤 — 컴포넌트 밖(mutation onSuccess 등)에서도 호출 가능. 루트 ToastHost가 구독.
export type ToastVariant = 'success' | 'error' | 'info';
export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

let counter = 0;
const listeners = new Set<(item: ToastItem) => void>();

function show(message: string, variant: ToastVariant, duration = 3000) {
  const item: ToastItem = { id: ++counter, message, variant, duration };
  listeners.forEach((l) => l(item));
}

export const toast = {
  show: (message: string, duration?: number) => show(message, 'info', duration),
  success: (message: string, duration?: number) => show(message, 'success', duration),
  error: (message: string, duration?: number) => show(message, 'error', duration),
  info: (message: string, duration?: number) => show(message, 'info', duration),
};

export function subscribeToast(fn: (item: ToastItem) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
