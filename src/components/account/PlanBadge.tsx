import { Badge } from '@/components/ui/badge';
import type { Plan } from '@/stores/useAuthStore';

const PLAN: Record<Plan, { label: string; variant: 'default' | 'primary' | 'success' }> = {
  FREE: { label: 'Free', variant: 'default' },
  BETA: { label: 'Beta', variant: 'success' },
  PRO: { label: 'Pro', variant: 'primary' },
  ORG: { label: 'Org', variant: 'primary' },
};

/** Plan chip, shared by the sidebar identity block and the Profile tab. */
export function PlanBadge({ plan }: { plan: Plan }) {
  const { label, variant } = PLAN[plan];
  return <Badge variant={variant}>{label}</Badge>;
}
