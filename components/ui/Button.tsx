import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap font-medium " +
  "transition-colors duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const SIZES = {
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

const VARIANTS: Record<Variant, string> = {
  // accent-ink on accent is checked for AA contrast. See DESIGN_PLAN.md section 3.2.
  primary: "bg-accent text-accent-ink hover:bg-accent-hi",
  secondary: "border border-border bg-surface text-text hover:bg-surface-hi",
  ghost: "text-muted hover:text-text",
};

type Props = {
  variant?: Variant;
  size?: keyof typeof SIZES;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props & ComponentProps<"button">) {
  return (
    <button className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props & ComponentProps<typeof Link>) {
  return (
    <Link className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}
