import { Badge } from '@/components/ui/badge';

export function TenderBadge({ type }: { type: 'lelang' | 'non-lelang' }) {
  const variant =
    type === 'lelang' ? 'default' : 'secondary';

  return (
    <Badge variant={variant}>
      {type === 'lelang' ? 'Lelang' : 'Non Lelang'}
    </Badge>
  );
}