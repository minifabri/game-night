"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "danger" | "team-gym" | "team-couch";
type Size = "md" | "lg";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gold-400 text-void hover:bg-gold-300 shadow-[0_0_0_1px_rgba(221,179,103,0.4)]",
  ghost:
    "bg-transparent text-cream border border-ink-dim/30 hover:border-gold-400/70 hover:text-gold-300",
  danger:
    "bg-transparent text-gym border border-gym/50 hover:bg-gym/10 hover:border-gym",
  "team-gym":
    "bg-gym text-void hover:brightness-110 shadow-[0_0_0_1px_rgba(255,106,69,0.5)]",
  "team-couch":
    "bg-couch text-void hover:brightness-110 shadow-[0_0_0_1px_rgba(87,211,200,0.5)]",
};

const sizeClasses: Record<Size, string> = {
  md: "px-6 py-3 text-sm",
  lg: "px-10 py-4 text-base sm:text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", disabled, children, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-sans font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});
