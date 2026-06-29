import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/account/Avatar';
import { PlanBadge } from '@/components/account/PlanBadge';
import { Page, PageHeader } from '@/components/account/Page';
import { RedeemDialog } from '@/components/auth/RedeemDialog';
import { useAuth } from '@/stores/useAuthStore';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-40 shrink-0 text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

/** Read-only identity from `/me` (the `user` already in the auth store). FREE users can redeem here. */
export function Profile() {
  const { user } = useAuth();
  const [redeemOpen, setRedeemOpen] = useState(false);
  if (!user) return null;

  return (
    <Page>
      <PageHeader title="Profile" description="Your identity across asn1click products." />

      <div className="mb-6 flex items-center gap-4">
        <Avatar src={user.pictureUrl} className="h-16 w-16" />
        <div>
          <p className="text-lg font-semibold">{user.displayName ?? user.email}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-card px-4">
        <Field label="Name" value={user.displayName ?? '—'} />
        <Field label="Email" value={user.email} />
        <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
          <span className="w-40 shrink-0 text-sm font-medium text-muted-foreground">Plan</span>
          <div className="flex items-center gap-3">
            <PlanBadge plan={user.plan} />
            {user.plan === 'FREE' && (
              <Button variant="outline" size="sm" onClick={() => setRedeemOpen(true)}>
                Redeem invite code
              </Button>
            )}
          </div>
        </div>
        <Field label="Organization" value={user.organization?.name ?? '—'} />
        <Field label="Role" value={user.role} />
      </div>

      <RedeemDialog open={redeemOpen} onOpenChange={setRedeemOpen} />
    </Page>
  );
}
