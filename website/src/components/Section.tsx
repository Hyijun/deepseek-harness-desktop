import type { ReactNode } from "react";

export interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, children, className = "" }: SectionProps) {
  return (
    <section id={id} className={`relative py-24 sm:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl px-5">{children}</div>
    </section>
  );
}

export interface SectionHeaderProps {
  kicker: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}

export function SectionHeader({ kicker, title, subtitle, align = "center" }: SectionHeaderProps) {
  const alignCls = align === "center" ? "items-center text-center" : "items-start text-left";
  return (
    <div className={`reveal flex flex-col ${alignCls}`}>
      <span className="text-xs font-semibold tracking-[0.2em] text-accent-2 uppercase">{kicker}</span>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">{subtitle}</p> : null}
    </div>
  );
}
