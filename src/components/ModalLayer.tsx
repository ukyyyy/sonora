import { useEffect, useRef, useState } from "react";
import { useUI } from "@/lib/ui";

export function ModalLayer() {
  const { _prompt, _confirm, _closePrompt, _closeConfirm } = useUI();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (_prompt) {
      setValue(_prompt.defaultValue ?? "");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [_prompt?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (_prompt) _closePrompt(null);
        else if (_confirm) _closeConfirm(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [_prompt, _confirm, _closePrompt, _closeConfirm]);

  const open = _prompt || _confirm;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4 animate-liquid-in" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(14px)" }}>
      <div
        className="w-full max-w-md rounded-3xl glass-strong ring-chrome p-6 relative"
        style={{ boxShadow: "0 40px 100px -30px rgba(0,0,0,0.9)" }}
      >
        {_prompt && (
          <form
            onSubmit={(e) => { e.preventDefault(); _closePrompt(value.trim() ? value.trim() : null); }}
            className="space-y-5"
          >
            <div>
              <h3 className="text-xl font-medium tracking-tight">{_prompt.title}</h3>
              {_prompt.description && <p className="mt-1 text-sm text-muted-foreground">{_prompt.description}</p>}
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={_prompt.placeholder ?? ""}
                maxLength={120}
                className="w-full bg-black/40 rounded-2xl px-4 py-3 text-base outline-none ring-chrome focus:shadow-[0_0_0_2px_rgba(255,255,255,0.14)] transition"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => _closePrompt(null)}
                className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
              >
                {_prompt.cancelLabel ?? "Abbrechen"}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full text-sm font-medium gradient-brand ring-chrome hover:brightness-110 transition"
              >
                {_prompt.confirmLabel ?? "Erstellen"}
              </button>
            </div>
          </form>
        )}

        {_confirm && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-medium tracking-tight">{_confirm.title}</h3>
              {_confirm.description && <p className="mt-1 text-sm text-muted-foreground">{_confirm.description}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => _closeConfirm(false)}
                className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
              >
                {_confirm.cancelLabel ?? "Abbrechen"}
              </button>
              <button
                onClick={() => _closeConfirm(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium ring-chrome hover:brightness-110 transition ${_confirm.destructive ? "bg-destructive text-destructive-foreground" : "gradient-brand"}`}
              >
                {_confirm.confirmLabel ?? "OK"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
