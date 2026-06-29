import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

// The converter product lives on its own domain; link out to it (no shared chrome).
const CONVERTER_URL = import.meta.env.VITE_CONVERTER_URL ?? 'https://v2x.tools';

/** Slim global bar: brand on the left, link back to the converter + theme toggle on the right. */
export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold tracking-tight">asn1click</span>
        <span className="text-sm text-muted-foreground">Account</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" asChild>
          <a href={CONVERTER_URL} target="_blank" rel="noreferrer">
            Converter
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
