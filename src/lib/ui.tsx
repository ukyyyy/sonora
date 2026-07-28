import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type PromptOpts = { title: string; description?: string; placeholder?: string; defaultValue?: string; confirmLabel?: string; cancelLabel?: string };
type ConfirmOpts = { title: string; description?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean };

type PromptState = PromptOpts & { id: number; resolve: (v: string | null) => void };
type ConfirmState = ConfirmOpts & { id: number; resolve: (v: boolean) => void };

type Ctx = {
  prompt: (opts: PromptOpts) => Promise<string | null>;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
  _prompt: PromptState | null;
  _confirm: ConfirmState | null;
  _closePrompt: (v: string | null) => void;
  _closeConfirm: (v: boolean) => void;
};

const UICtx = createContext<Ctx | null>(null);
let idSeq = 1;

export function UIProvider({ children }: { children: ReactNode }) {
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const prompt = useCallback((opts: PromptOpts) => {
    return new Promise<string | null>((resolve) => {
      setPromptState({ ...opts, id: idSeq++, resolve });
    });
  }, []);
  const confirm = useCallback((opts: ConfirmOpts) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...opts, id: idSeq++, resolve });
    });
  }, []);

  const _closePrompt = useCallback((v: string | null) => {
    setPromptState((cur) => { cur?.resolve(v); return null; });
  }, []);
  const _closeConfirm = useCallback((v: boolean) => {
    setConfirmState((cur) => { cur?.resolve(v); return null; });
  }, []);

  return (
    <UICtx.Provider value={{ prompt, confirm, _prompt: promptState, _confirm: confirmState, _closePrompt, _closeConfirm }}>
      {children}
    </UICtx.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UICtx);
  if (!ctx) throw new Error("useUI must be inside UIProvider");
  return ctx;
}
