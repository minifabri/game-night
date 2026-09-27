"use client";

import { useId, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createAssetUpload } from "@/lib/actions/games";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full rounded-xl border border-ink-dim/25 bg-transparent px-3 py-2 font-sans text-sm text-cream outline-none placeholder:text-ink-dim/50 focus:border-gold-400";

function Label({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">
      {children}
      {hint && <span className="ml-1 normal-case tracking-normal text-ink-dim/70">— {hint}</span>}
    </label>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  maxLength,
  className,
}: {
  label: string;
  hint?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <input
        id={id}
        value={value ?? ""}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}: {
  label: string;
  hint?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "resize-y")}
      />
    </div>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-ink-dim/20 px-3 py-2 text-left"
    >
      <span>
        <span className="block font-sans text-sm text-cream">{label}</span>
        {hint && <span className="block font-sans text-xs text-ink-dim">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-gold-400" : "bg-ink-dim/30"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-void transition-all",
            checked ? "left-[1.4rem]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

/** A team colour; the soft variant used for numbers and glows is derived from it. */
export function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (value: string | undefined) => void;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value ?? fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-ink-dim/25 bg-transparent"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="font-sans text-xs text-ink-dim underline underline-offset-4 hover:text-cream"
          >
            Colore predefinito
          </button>
        )}
      </div>
    </div>
  );
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Picks an image, uploads it to the game's storage folder and returns its URL. */
export function ImageField({
  gameId,
  label,
  value,
  onChange,
  aspect = "aspect-[4/3]",
}: {
  gameId: string;
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  aspect?: string;
}) {
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Scegli un'immagine.");
    if (file.size > MAX_IMAGE_BYTES) return setError("Immagine troppo grande (max 10 MB).");
    setUploading(true);
    try {
      const target = await createAssetUpload({ gameId, filename: file.name });
      if (!target.ok) return setError(target.error);
      const { error: uploadError } = await getSupabaseBrowserClient()
        .storage.from("game-assets")
        .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
      if (uploadError) return setError("Caricamento non riuscito: " + uploadError.message);
      onChange(target.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-start gap-3">
        <div className={cn("w-28 shrink-0 overflow-hidden rounded-lg border border-ink-dim/25 bg-void", aspect)}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-sans text-[0.6rem] text-ink-dim">
              nessuna
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <label
            htmlFor={id}
            className={cn(
              "cursor-pointer rounded-full border border-ink-dim/30 px-3 py-1.5 font-sans text-xs text-cream hover:border-gold-400/70",
              uploading && "pointer-events-none opacity-50"
            )}
          >
            {uploading ? "Carico…" : value ? "Cambia immagine" : "Carica immagine"}
          </label>
          <input
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload(file);
            }}
          />
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="font-sans text-xs text-ink-dim underline underline-offset-4 hover:text-danger"
            >
              Togli
            </button>
          )}
          {error && <p className="font-sans text-xs text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}

/** Small round icon button for move up / down / delete in lists. */
export function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-plum-900/70 font-sans text-sm text-ink-dim disabled:opacity-30",
        danger ? "hover:bg-danger/15 hover:text-danger" : "hover:text-cream"
      )}
    >
      {children}
    </button>
  );
}
