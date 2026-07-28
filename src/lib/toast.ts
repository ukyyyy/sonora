// Custom notification bus — sonner-compatible API surface.
export type ToastKind = "success" | "error" | "info" | "message";
export type ToastItem = { id: number; kind: ToastKind; text: string };

type Listener = (item: ToastItem) => void;
const listeners = new Set<Listener>();
let seq = 1;

function emit(kind: ToastKind, text: string) {
  const item: ToastItem = { id: seq++, kind, text };
  listeners.forEach((l) => l(item));
  return item.id;
}

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const toast = Object.assign(
  (text: string) => emit("message", text),
  {
    success: (text: string) => emit("success", text),
    error: (text: string) => emit("error", text),
    info: (text: string) => emit("info", text),
    message: (text: string) => emit("message", text),
  },
);
