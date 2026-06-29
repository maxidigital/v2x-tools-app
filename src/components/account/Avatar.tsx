import { User } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Round avatar with a user-icon fallback. */
export function Avatar({ src, className }: { src?: string | null; className?: string }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-secondary-foreground',
        className
      )}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </span>
  );
}
