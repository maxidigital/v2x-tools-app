import { useMemo } from 'react';
import { Boxes, FileCode2, Tags } from 'lucide-react';
import * as hub from '@/services/hubClient';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/stores/useAuthStore';
import { Page, PageHeader, Section } from '@/components/account/Page';
import { PlanBadge } from '@/components/account/PlanBadge';

function Stat({ icon: Icon, label, value }: { icon: typeof Tags; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/**
 * Read-only home: counts + lists of what the signed-in user owns in the hub (aliases, saved messages,
 * visible modules) plus a plan summary. Thin client — fetch each list, render. Personal aliases (and
 * any saved messages) require a privileged plan; FREE users just see the public defaults.
 */
export function Overview() {
  const { user } = useAuth();
  const aliases = useAsync(hub.listAliases);
  const messages = useAsync(hub.listMessages);
  const modules = useAsync(hub.listModules);

  const personalAliases = useMemo(
    () => (aliases.data ?? []).filter((a) => a.scope === 'personal'),
    [aliases.data]
  );

  const loading = aliases.loading || messages.loading || modules.loading;
  const error = aliases.error ?? messages.error ?? modules.error;

  return (
    <Page>
      <PageHeader title="Overview" description="What's saved to your account across asn1click." />

      {error && (
        <div className="mb-5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat icon={Tags} label="Personal aliases" value={loading ? '…' : personalAliases.length} />
        <Stat icon={FileCode2} label="Saved messages" value={loading ? '…' : messages.data?.length ?? 0} />
        <Stat icon={Boxes} label="Modules visible" value={loading ? '…' : modules.data?.length ?? 0} />
      </div>

      <Section title="Plan">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4">
          {user && <PlanBadge plan={user.plan} />}
          <span className="text-sm text-muted-foreground">
            {user?.plan === 'FREE'
              ? 'Free plan — public modules and conversion. Redeem an invite code to unlock saving.'
              : 'Saving aliases and messages is enabled on your plan.'}
          </span>
        </div>
      </Section>

      <Section title="Saved messages">
        <List
          loading={messages.loading}
          empty="No saved messages yet."
          rows={(messages.data ?? []).map((m) => ({
            key: m.name,
            primary: m.name,
            secondary: [m.moduleAlias, m.rootType].filter(Boolean).join(' · '),
          }))}
        />
      </Section>

      <Section title="Personal aliases">
        <List
          loading={aliases.loading}
          empty="No personal aliases — you're using the public defaults."
          rows={personalAliases.map((a) => ({
            key: a.alias,
            primary: a.alias,
            secondary: a.moduleId,
          }))}
        />
      </Section>
    </Page>
  );
}

interface Row {
  key: string;
  primary: string;
  secondary?: string;
}

function List({ loading, empty, rows }: { loading: boolean; empty: string; rows: Row[] }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {rows.map((r) => (
        <li key={r.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="truncate text-sm font-medium">{r.primary}</span>
          {r.secondary && (
            <span className="truncate font-mono text-xs text-muted-foreground">{r.secondary}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
