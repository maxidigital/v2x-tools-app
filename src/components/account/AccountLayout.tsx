import { Outlet } from 'react-router-dom';
import { useAuth } from '@/stores/useAuthStore';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';
import { SignedOut } from './SignedOut';

/**
 * One screen: global header on top, the tab rail on the left, the active tab's content on the right.
 * The tabs are real routes (`<Outlet/>`), so deep links and back/forward work, but it reads as a
 * single account page. Renders the signed-out prompt instead when there's no session.
 */
export function AccountLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <AppHeader />
      {user ? (
        <div className="flex min-h-0 flex-1">
          <Sidebar user={user} />
          <main className="min-w-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      ) : (
        <SignedOut />
      )}
    </div>
  );
}
