import { NavLink } from 'react-router-dom';
import { LayoutGrid, LogOut, Settings, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth, type AuthUser } from '@/stores/useAuthStore';
import { Avatar } from './Avatar';
import { PlanBadge } from './PlanBadge';

interface Tab {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  /** Only `/account` should match exactly; the others match their subtree. */
  end?: boolean;
}

// Settings is intentionally listed apart so it can be pinned to the bottom (GitHub-style).
const MAIN_TABS: Tab[] = [
  { to: '/account', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/account/profile', label: 'Profile', icon: User },
];
const SETTINGS_TAB: Tab = { to: '/account/settings', label: 'Settings', icon: Settings };

function TabLink({ tab }: { tab: Tab }) {
  const Icon = tab.icon;
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {tab.label}
    </NavLink>
  );
}

/** Left rail: identity block on top, tabs, Settings pinned to the bottom, then Sign out. */
export function Sidebar({ user }: { user: AuthUser }) {
  const { logout } = useAuth();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card/30">
      {/* Identity */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Avatar src={user.pictureUrl} className="h-10 w-10" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.displayName ?? user.email}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <PlanBadge plan={user.plan} />
            {user.organization && (
              <span className="truncate text-xs text-muted-foreground">{user.organization.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {MAIN_TABS.map((t) => (
          <TabLink key={t.to} tab={t} />
        ))}
        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-2">
          <TabLink tab={SETTINGS_TAB} />
          <button
            onClick={() => logout()}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  );
}
