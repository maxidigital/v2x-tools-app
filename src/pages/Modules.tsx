import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

export function Modules() {
  const modules = useAsync(hub.listModules);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

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

  const list = modules.data ?? [];
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter((m) => {
      if (scope !== 'all' && m.scope !== scope) return false;
      if (needle && !`${moduleName(m)} ${m.oid}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [list, scope, q]);

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
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Scope</th>
                  <th className="px-4 py-2 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
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
                    <td className="px-4 py-2 text-muted-foreground">{(m.uploadedAt ?? '').slice(0, 10)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
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
            {filtered.length} of {list.length}
          </p>
        </>
      )}
    </div>
  );
}
