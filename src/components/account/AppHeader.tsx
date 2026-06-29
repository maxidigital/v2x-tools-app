import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// The Web Tools surface lives on its own domain; link out to it in the same tab.
const WEB_TOOLS_URL = import.meta.env.VITE_WEB_TOOLS_URL ?? 'https://v2x.tools';

// Theme is an account preference and lives only in Settings → Preferences (persisted/synced),
// GitHub-style — no quick toggle here (a non-persisting one would fight the saved value on reload).
/** Slim global bar: brand on the left, link to the Web Tools on the right. */
export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold tracking-tight">asn1click</span>
        <span className="text-sm text-muted-foreground">Account</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" asChild>
          <a href={WEB_TOOLS_URL}>
            Web Tools
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </header>
  );
}
