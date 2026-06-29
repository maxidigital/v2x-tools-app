import { useState, type ReactNode } from 'react';
import { Building2, Check, KeyRound, Loader2, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Page, PageHeader } from '@/components/account/Page';
import { cn } from '@/lib/cn';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/stores/useAuthStore';

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-border bg-card p-4">{children}</div>;
}

function CardHeader({ icon: Icon, title, badge }: { icon: typeof KeyRound; title: string; badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold">{title}</h2>
      {badge && <span className="ml-auto">{badge}</span>}
    </div>
  );
}

/**
 * Preferences — the one functional section. The user's choices are persisted server-side as a JSON
 * object on their account (`PUT /api/auth/me/preferences`), so they follow the account across devices
 * and products. Theme is the first such preference.
 */
function Preferences() {
  const { user, savePreferences } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  // The stored preference wins as the source of truth; fall back to the live (localStorage) theme.
  const stored = user?.preferences?.theme;
  const current = stored === 'light' || stored === 'dark' ? stored : theme;

  async function choose(next: 'dark' | 'light') {
    if (next === current && stored === next) return;
    setTheme(next); // apply instantly
    setSaving(true);
    try {
      await savePreferences({ theme: next });
      toast.success('Preferences saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  }

  const options: { value: 'dark' | 'light'; label: string; icon: typeof Moon }[] = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
  ];

  return (
    <Card>
      <CardHeader
        icon={Moon}
        title="Preferences"
        badge={saving ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      />
      <div className="mt-3">
        <p className="text-sm font-medium">Theme</p>
        <p className="text-xs text-muted-foreground">Saved to your account and synced across devices.</p>
        <div className="mt-2 inline-flex rounded-md border border-border p-0.5">
          {options.map((o) => {
            const Icon = o.icon;
            const active = o.value === current;
            return (
              <button
                key={o.value}
                onClick={() => choose(o.value)}
                disabled={saving}
                className={cn(
                  'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60',
                  active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {o.label}
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function ComingSoon({ icon: Icon, title, children }: { icon: typeof KeyRound; title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader icon={Icon} title={title} badge={<Badge variant="outline">Coming soon</Badge>} />
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </Card>
  );
}

export function Settings() {
  return (
    <Page>
      <PageHeader title="Settings" description="Manage your account, organization and API access." />
      <div className="flex flex-col gap-3">
        <Preferences />
        <ComingSoon icon={Building2} title="Organization">
          Members, seats and billing for your organization.
        </ComingSoon>
        <ComingSoon icon={KeyRound} title="API keys">
          Create and revoke personal keys for the programmatic API.
        </ComingSoon>
      </div>
    </Page>
  );
}
