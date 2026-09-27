"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutAdmin } from "@/lib/actions/admin";

/** Top bar of every admin page: back link (except on the hub), title, logout. */
export function AdminHeader({
  back,
  title,
  subtitle,
}: {
  back?: { href: string; label: string };
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-block font-sans text-xs uppercase tracking-[0.2em] text-ink-dim hover:text-gold-300"
          >
            ← {back.label}
          </Link>
        )}
        <h1 className="truncate font-display text-2xl font-medium text-cream">{title}</h1>
        {subtitle && <p className="font-sans text-xs uppercase tracking-[0.25em] text-gold-400">{subtitle}</p>}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await logoutAdmin();
            router.refresh();
          })
        }
        className="shrink-0 font-sans text-xs uppercase tracking-[0.2em] text-ink-dim hover:text-gold-300"
      >
        Esci
      </button>
    </header>
  );
}
