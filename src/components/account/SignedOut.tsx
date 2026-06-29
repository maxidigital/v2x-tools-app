import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Single asn1click login, shared by all products (branded login page wired in v2x-connect-now).
// Bounces back here with #token via ?redirect=<href>. Override with VITE_LOGIN_URL.
const CENTRAL_LOGIN_URL = import.meta.env.VITE_LOGIN_URL ?? 'https://v2xnow.de/asn1click/login';

/** Shown when the silent SSO finds no session: a single call to action to sign in. */
export function SignedOut() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold">Sign in to your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your asn1click account holds your profile, saved aliases and messages, and plan across every
          product.
        </p>
        <Button
          className="mt-5"
          onClick={() =>
            window.location.assign(
              `${CENTRAL_LOGIN_URL}?redirect=${encodeURIComponent(window.location.href)}`
            )
          }
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </div>
    </div>
  );
}
