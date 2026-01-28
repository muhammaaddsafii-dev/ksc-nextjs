import { Badge } from '@/components/ui/badge';

export function TenderBadge({ type }: { type: 'tender' | 'non-tender' }) {
  const variant =
    type === 'tender' ? 'default' : 'secondary';

  return (
    <Badge variant={variant}>
      {type === 'tender' ? 'Tender' : 'Non Tender'}
    </Badge>
  );
}