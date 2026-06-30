import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { AccountLayout } from '@/components/account/AccountLayout';
import { Overview } from '@/pages/Overview';
import { Modules } from '@/pages/Modules';
import { ModuleDetail } from '@/pages/ModuleDetail';
import { Profile } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';
import { useTheme } from '@/hooks/useTheme';
import { useAuth, useAuthStore } from '@/stores/useAuthStore';

export default function App() {
  const { isDark, setTheme } = useTheme();
  const { ready, user } = useAuth();

  // Resolve the session once on load: consume the IdP bounce fragment (#token), hydrate via /me, and
  // run the one-time silent SSO redirect to the IdP host when there's no local session.
  useEffect(() => {
    void useAuthStore.getState().init();
  }, []);

  // Once the user resolves, adopt their account-level theme preference (synced across devices). The
  // no-flash script already applied the local choice; this only corrects it to the stored value.
  useEffect(() => {
    const pref = user?.preferences?.theme;
    if (pref === 'dark' || pref === 'light') setTheme(pref);
  }, [user, setTheme]);

  return (
    <>
      {!ready ? (
        <div className="grid h-full place-items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<Overview />} />
              <Route path="modules" element={<Modules />} />
              <Route path="modules/:moduleId" element={<ModuleDetail />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/account" replace />} />
          </Routes>
        </BrowserRouter>
      )}
      <Toaster theme={isDark ? 'dark' : 'light'} position="bottom-right" richColors />
    </>
  );
}
