"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createGame } from "@/lib/actions/games";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** /admin/nuovo: name the game, pick where to start from, then on to its content editor. */
export function NewGameForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [from, setFrom] = useState<string | null>(null);
  const [games, setGames] = useState<{ id: string; title: string }[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupabaseBrowserClient()
      .from("games")
      .select("id, title")
      .order("created_at", { ascending: false })
      .then(({ data }) => setGames((data as { id: string; title: string }[] | null) ?? []));
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createGame({ title, from });
      if (!result.ok) return setError(result.error);
      router.push(`/admin/giochi/${result.gameId}/contenuti`);
    });
  }

  const options: { id: string | null; label: string; hint: string }[] = [
    { id: null, label: "Da zero", hint: "La scaletta di sempre con testi generici e round vuoti" },
    ...games.map((g) => ({ id: g.id, label: `Copia di «${g.title}»`, hint: "Stessi contenuti e risposte, da modificare" })),
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <AdminHeader back={{ href: "/admin", label: "Giochi" }} title="Nuovo gioco" />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <Panel title="Titolo">
          <input
            autoFocus
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Cani vs Gatti"
            className="w-full rounded-xl border border-ink-dim/25 bg-transparent px-3 py-3 font-sans text-base text-cream outline-none placeholder:text-ink-dim/60 focus:border-gold-400"
          />
          <p className="mt-2 font-sans text-xs text-ink-dim">
            Il gioco nuovo non va in onda finché non lo attivi dalla sua console.
          </p>
        </Panel>

        <Panel title="Parti da">
          <div className="flex flex-col gap-2">
            {options.map((o) => (
              <button
                key={o.id ?? "blank"}
                type="button"
                onClick={() => setFrom(o.id)}
                aria-pressed={from === o.id}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors",
                  from === o.id ? "bg-gold-400/10 ring-1 ring-gold-400" : "border-ink-dim/20 hover:border-ink-dim/50"
                )}
              >
                <p className="font-sans text-sm font-medium text-cream">{o.label}</p>
                <p className="font-sans text-xs text-ink-dim">{o.hint}</p>
              </button>
            ))}
          </div>
        </Panel>

        {error && <p className="text-center font-sans text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" disabled={pending || title.trim().length === 0}>
          {pending ? "Creo…" : "Crea e apri i contenuti"}
        </Button>
      </form>
    </div>
  );
}
