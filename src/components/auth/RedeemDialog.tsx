import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/useAuthStore';

interface RedeemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Non-blocking invite-code prompt. Redeeming promotes a FREE account to BETA (unlimited + private
 * features) and ties it to the code's organization. The app stays usable without a code.
 */
export function RedeemDialog({ open, onOpenChange }: RedeemDialogProps) {
  const { redeem } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await redeem(trimmed);
      setCode('');
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not redeem code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Redeem invite code</DialogTitle>
          <DialogDescription>
            Enter the beta invite code you received to unlock unlimited conversions and private saved
            messages.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            autoFocus
            placeholder="e.g. DLR-7F3KQ"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            disabled={busy}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={submit} disabled={busy || !code.trim()}>
            {busy ? 'Redeeming…' : 'Redeem'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
