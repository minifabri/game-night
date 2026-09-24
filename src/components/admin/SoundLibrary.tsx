"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { addSound, createSoundUpload, deleteSound, setAutoEffect } from "@/lib/actions/audio";
import { AUTO_EVENTS, CIAO_DARWIN_PACK, searchUrl, youtubeSearchUrl } from "@/lib/audio/catalog";
import { getAudioEngine } from "@/lib/audio/engine";
import { Button } from "@/components/ui/Button";
import type { Sound, SoundKind, SoundRef } from "@/lib/types";

const MAX_BYTES = 50 * 1024 * 1024;

interface SoundLibraryProps {
  sounds: Sound[];
  autoMap: Record<string, SoundRef | "off">;
}

export function SoundLibrary({ sounds, autoMap }: SoundLibraryProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<SoundKind>("sfx");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setName("");
    setUrl("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      if (mode === "url") {
        const result = await addSound({ name, kind, url: url.trim() });
        if (!result.ok) return setError(result.error);
        resetForm();
        return;
      }

      if (!file) return setError("Scegli un file audio.");
      if (file.size > MAX_BYTES) return setError("File troppo grande (max 50 MB).");

      const upload = await createSoundUpload(file.name);
      if (!upload.ok) return setError(upload.error);

      const { error: uploadError } = await getSupabaseBrowserClient()
        .storage.from("sounds")
        .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type || "audio/mpeg" });
      if (uploadError) return setError("Upload non riuscito: " + uploadError.message);

      const result = await addSound({ name, kind, storagePath: upload.path });
      if (!result.ok) return setError(result.error);
      resetForm();
    });
  }

  function prefill(entry: (typeof CIAO_DARWIN_PACK)[number]) {
    setName(entry.name);
    setKind(entry.kind);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteSound(id);
      setConfirmDelete(null);
      if (!result.ok) setError(result.error);
    });
  }

  function assign(event: string, ref: string) {
    setError(null);
    startTransition(async () => {
      const result = await setAutoEffect(event, ref);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="border-t border-plum-700/60 pt-5">
      <h3 className="mb-3 font-sans text-[0.7rem] uppercase tracking-[0.25em] text-gold-400/80">Libreria suoni</h3>

      <form ref={formRef} onSubmit={submit} className="mb-4 flex flex-col gap-2 rounded-xl border border-ink-dim/15 p-3">
        <div className="flex gap-2 font-sans text-xs">
          {(["file", "url"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full border px-3 py-1",
                mode === m ? "border-gold-400 text-gold-300" : "border-ink-dim/25 text-ink-dim"
              )}
            >
              {m === "file" ? "Carica file" : "Link mp3"}
            </button>
          ))}
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as SoundKind)}
            className="ml-auto rounded-full border border-ink-dim/25 bg-plum-900 px-3 py-1 text-cream"
          >
            <option value="sfx">Effetto</option>
            <option value="music">Colonna sonora</option>
          </select>
        </div>
        <input
          type="text"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome (es. Risata Laurenti)"
          className="rounded-lg border border-ink-dim/25 bg-transparent px-3 py-2 font-sans text-sm text-cream outline-none placeholder:text-ink-dim/60 focus:border-gold-400"
        />
        {mode === "file" ? (
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null;
              setFile(picked);
              if (picked && !name) setName(picked.name.replace(/\.[^.]+$/, "").slice(0, 60));
            }}
            className="font-sans text-xs text-ink-dim file:mr-3 file:rounded-full file:border file:border-gold-400/60 file:bg-transparent file:px-3 file:py-1 file:text-gold-300"
          />
        ) : (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…/suono.mp3"
            className="rounded-lg border border-ink-dim/25 bg-transparent px-3 py-2 font-sans text-sm text-cream outline-none placeholder:text-ink-dim/60 focus:border-gold-400"
          />
        )}
        <Button type="submit" size="md" disabled={pending || !name.trim()}>
          {pending ? "Salvataggio…" : "Aggiungi alla libreria"}
        </Button>
      </form>

      {sounds.length > 0 && (
        <ul className="mb-5 flex flex-col gap-1.5">
          {sounds.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-lg border border-ink-dim/15 px-3 py-1.5">
              <button
                type="button"
                aria-label={`Anteprima ${s.name}`}
                onClick={() => {
                  const engine = getAudioEngine();
                  engine.unlock().then(() => engine.playEffect({ ref: s.id, url: s.url }));
                }}
                className="text-gold-300 hover:text-gold-200"
              >
                <HeadphonesIcon />
              </button>
              <span className="min-w-0 flex-1 truncate font-sans text-sm text-ink">{s.name}</span>
              <span className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-ink-dim">
                {s.kind === "music" ? "musica" : "effetto"}
              </span>
              {confirmDelete === s.id ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(s.id)}
                  className="font-sans text-xs text-gym"
                >
                  Conferma
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(s.id)}
                  className="font-sans text-xs text-ink-dim hover:text-gym"
                >
                  Elimina
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <h3 className="mb-1 font-sans text-[0.7rem] uppercase tracking-[0.25em] text-gold-400/80">
        Catalogo Ciao Darwin
      </h3>
      <p className="mb-3 font-sans text-xs text-ink-dim">
        I clip originali sono protetti da copyright e non sono inclusi nell&apos;app: cercali, scarica l&apos;mp3 e
        caricalo qui. &quot;Prepara&quot; compila il modulo sopra con nome e tipo.
      </p>
      <ul className="flex flex-col gap-2">
        {CIAO_DARWIN_PACK.map((entry) => {
          const inLibrary = sounds.find((s) => s.name.trim().toLowerCase() === entry.name.toLowerCase());
          const event = entry.suggestedFor ? AUTO_EVENTS.find((e) => e.id === entry.suggestedFor) : undefined;
          const assigned = inLibrary && entry.suggestedFor && autoMap[entry.suggestedFor] === inLibrary.id;
          return (
            <li key={entry.name} className="rounded-xl border border-ink-dim/15 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-cream">
                    {entry.name}
                    {inLibrary && <span className="ml-2 text-xs text-couch">✓ in libreria</span>}
                  </p>
                  <p className="mt-0.5 font-sans text-xs text-ink-dim">{entry.hint}</p>
                </div>
                {!inLibrary && (
                  <button
                    type="button"
                    onClick={() => prefill(entry)}
                    className="shrink-0 rounded-full border border-gold-400/60 px-3 py-1 font-sans text-xs text-gold-300"
                  >
                    Prepara
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 font-sans text-xs">
                <a href={searchUrl(entry.query)} target="_blank" rel="noreferrer" className="text-gold-300 underline">
                  Cerca su Myinstants
                </a>
                <a
                  href={youtubeSearchUrl(entry.query)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold-300 underline"
                >
                  YouTube
                </a>
                {inLibrary && event && (
                  <button
                    type="button"
                    disabled={pending || Boolean(assigned)}
                    onClick={() => assign(event.id, inLibrary.id)}
                    className="ml-auto rounded-full border border-couch/50 px-3 py-1 text-couch disabled:opacity-60"
                  >
                    {assigned ? `Usato per: ${event.label}` : `Usa per: ${event.label}`}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {error && <p className="mt-3 text-center font-sans text-sm text-gym">{error}</p>}
    </div>
  );
}

function HeadphonesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" strokeLinecap="round" />
      <rect x="3" y="14" width="5" height="7" rx="1.5" />
      <rect x="16" y="14" width="5" height="7" rx="1.5" />
    </svg>
  );
}
