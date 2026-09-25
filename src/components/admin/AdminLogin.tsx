"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { loginAdmin } from "@/lib/actions/admin";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAdmin(password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6">
      <Wordmark size="md" />
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={submit}
        className="flex w-full max-w-xs flex-col gap-4"
      >
        <p className="text-center font-sans text-xs uppercase tracking-[0.4em] text-gold-400">Admin</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-full border border-ink-dim/30 bg-plum-900/50 px-6 py-3 text-center font-sans text-cream outline-none focus:border-gold-400"
        />
        {error && <p className="text-center font-sans text-sm text-gym">{error}</p>}
        <Button type="submit" size="lg" disabled={!password || pending} className="self-center">
          {pending ? "…" : "Entra"}
        </Button>
      </motion.form>
    </div>
  );
}
