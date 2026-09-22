import { cn } from "@/lib/cn";

export function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-plum-700/60 bg-plum-900/40 p-5", className)}>
      <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
        {title}
      </h2>
      {children}
    </section>
  );
}
