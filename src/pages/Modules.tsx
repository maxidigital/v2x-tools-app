import { useMemo, useState } from 'react';
import { Boxes } from 'lucide-react';
import * as hub from '@/services/hubClient';
import type { Module, ModuleElement } from '@/services/hubClient';
import { useAsync } from '@/hooks/useAsync';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/account/Page';
import { cn } from '@/lib/cn';

/** Readable name from an OID like `AddGrpC {iso(1) …}` → the module name before the `{`; falls back to moduleId. */
function displayName(m: Module): string {
  return (m.oid ?? '').split('{')[0].trim() || m.moduleId;
}

export function Modules() {
  const modules = useAsync(hub.listModules);
  const [selected, setSelected] = useState<Module | null>(null);

  // Auto-select the first module once the list loads.
  const list = modules.data ?? [];
  const current = selected ?? list[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <PageHeader title="Modules" description="The ASN.1 modules available to you — public and your own." />

      {modules.error && (
        <div className="mb-5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {modules.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[18rem_1fr]">
        {/* List */}
        <aside className="flex flex-col gap-1">
          {modules.loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!modules.loading && list.length === 0 && (
            <p className="text-sm text-muted-foreground">No modules available.</p>
          )}
          {list.map((m) => {
            const active = current?.oid === m.oid;
            return (
              <button
                key={m.oid}
                onClick={() => setSelected(m)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors',
                  active ? 'border-border bg-accent' : 'border-transparent hover:bg-accent/60'
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{displayName(m)}</span>
                  <Badge variant={m.scope === 'private' ? 'primary' : 'default'}>
                    {m.scope === 'private' ? 'Private' : 'Public'}
                  </Badge>
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">{m.oid}</span>
              </button>
            );
          })}
        </aside>

        {/* Detail */}
        <section className="min-w-0">
          {current ? <ModuleDetail module={current} /> : null}
        </section>
      </div>
    </div>
  );
}

function ModuleDetail({ module }: { module: Module }) {
  const structure = useAsync(() => hub.getModuleStructure(module.oid), [module.oid]);

  const elements = useMemo<ModuleElement[]>(
    () => (structure.data?.modules ?? []).flatMap((mod) => mod.elements ?? []),
    [structure.data]
  );

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Boxes className="h-4 w-4 text-muted-foreground" />
        <span className="truncate text-sm font-semibold">{displayName(module)}</span>
        {!structure.loading && (
          <span className="ml-auto text-xs text-muted-foreground">{elements.length} types</span>
        )}
      </div>

      <div className="p-3">
        {structure.loading && <p className="px-1 text-sm text-muted-foreground">Loading structure…</p>}
        {structure.error && <p className="px-1 text-sm text-destructive">{structure.error}</p>}
        {!structure.loading && !structure.error && elements.length === 0 && (
          <p className="px-1 text-sm text-muted-foreground">No types defined.</p>
        )}
        <div className="flex flex-col gap-1.5">
          {elements.map((el) => (
            <ElementRow key={el.name} el={el} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** One type: name + kind, expandable (native <details>) to its members with their types. */
function ElementRow({ el }: { el: ModuleElement }) {
  const members = el.fields ?? el.options ?? [];
  const count = members.length || el.values?.length || 0;

  return (
    <details className="group rounded-md border border-border/60 open:bg-accent/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm">
        <span className="font-medium">{el.name}</span>
        <Badge variant="outline" className="font-mono text-[10px]">
          {el.kind}
        </Badge>
        {count > 0 && <span className="ml-auto text-xs text-muted-foreground">{count}</span>}
      </summary>

      <div className="border-t border-border/60 px-3 py-2">
        {members.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {members.map((f) => (
              <li key={f.name} className="flex items-baseline justify-between gap-3">
                <span className="truncate">
                  {f.name}
                  {f.optional && <span className="ml-1 text-xs text-muted-foreground">optional</span>}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">{f.type}</span>
              </li>
            ))}
          </ul>
        )}
        {el.values && el.values.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 text-xs">
            {el.values.map((v) => (
              <li key={v} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-secondary-foreground">
                {v}
              </li>
            ))}
          </ul>
        )}
        {count === 0 && <p className="text-xs text-muted-foreground">No members.</p>}
      </div>
    </details>
  );
}
