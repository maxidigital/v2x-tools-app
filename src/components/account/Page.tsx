import type { ReactNode } from 'react';

/** Consistent padding + max width for a tab's content. */
export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl px-6 py-6">{children}</div>;
}

/** Tab title + optional one-line description. */
export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5 border-b border-border pb-4">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

/** A labelled block within a tab. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
