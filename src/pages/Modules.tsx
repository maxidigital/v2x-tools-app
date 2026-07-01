import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as hub from '@/services/hubClient';
import type { Module } from '@/services/hubClient';
import { useAsync } from '@/hooks/useAsync';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/account/Page';
import { cn } from '@/lib/cn';

/** Readable name from an OID like `AddGrpC {iso(1) …}` → the part before `{`; falls back to moduleId. */
export function moduleName(m: Module): string {
  return (m.oid ?? '').split('{')[0].trim() || m.moduleId;
}

const SCOPES = ['all', 'public', 'private'] as const;
type ScopeFilter = (typeof SCOPES)[number];
type SortKey = 'name' | 'scope' | 'elements';

export function Modules() {
  const modules = useAsync(hub.listModules);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });

  const scope = (params.get('scope') as ScopeFilter) ?? 'all';
  const q = params.get('q') ?? '';
  const patch = (key: string, value: string) =>
    setParams(
      (p) => {
        if (value) p.set(key, value);
        else p.delete(key);
        return p;
      },
      { replace: true }
    );

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const list = modules.data ?? [];
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = list.filter((m) => {
      if (scope !== 'all' && m.scope !== scope) return false;
      if (needle && !`${moduleName(m)} ${m.oid}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    const cmp = (a: Module, b: Module) => {
      if (sort.key === 'elements') return (a.elementCount ?? 0) - (b.elementCount ?? 0);
      if (sort.key === 'scope') return (a.scope ?? '').localeCompare(b.scope ?? '');
      return moduleName(a).localeCompare(moduleName(b));
    };
    filtered.sort((a, b) => (sort.dir === 'asc' ? cmp(a, b) : -cmp(a, b)));
    return filtered;
  }, [list, scope, q, sort]);

  const Th = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <th className={cn('px-4 py-2 font-medium', className)}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {sort.key === k &&
          (sort.dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <PageHeader title="Modules" description="The ASN.1 modules available to you — public and your own." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-border p-0.5">
          {SCOPES.map((s) => (
            <button
              key={s}
              onClick={() => patch('scope', s === 'all' ? '' : s)}
              className={cn(
                'rounded px-3 py-1 text-sm capitalize transition-colors',
                scope === s ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => patch('q', e.target.value)}
          placeholder="Search name or OID…"
          className="h-8 min-w-[12rem] flex-1 rounded-md border border-border bg-transparent px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {modules.error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {modules.error}
        </div>
      )}
      {modules.loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!modules.loading && !modules.error && (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <Th label="Name" k="name" />
                  <Th label="Scope" k="scope" />
                  <Th label="Elements" k="elements" className="text-right" />
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr
                    key={m.oid}
                    onClick={() =>
                      navigate(`/account/modules/${encodeURIComponent(m.moduleId)}`, { state: { module: m } })
                    }
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-4 py-2 font-medium">{moduleName(m)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={m.scope === 'private' ? 'primary' : 'default'}>
                        {m.scope === 'private' ? 'Private' : 'Public'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{m.elementCount ?? 0}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No modules match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {rows.length} of {list.length}
          </p>
        </>
      )}
    </div>
  );
}
