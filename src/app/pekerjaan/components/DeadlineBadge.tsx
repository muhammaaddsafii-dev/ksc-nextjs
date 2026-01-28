import { CheckCircle2, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Pekerjaan } from '@/types';

interface DeadlineStatus {
  level: 'safe' | 'warning' | 'critical' | 'overdue';
  message: string;
  count?: number;
  daysRemaining?: number;
  daysOverdue?: number;
}

function getDeadlineStatus(item: Pekerjaan): DeadlineStatus {
  if (!item.tahapan || item.tahapan.length === 0) {
    return { level: 'safe', message: 'Belum ada tahapan' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const projectDeadline = new Date(item.tanggalSelesai);
  projectDeadline.setHours(0, 0, 0, 0);

  const daysUntilProjectDeadline = Math.ceil((projectDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const overdueTahapan = item.tahapan.filter(t => {
    if (t.status === 'done') return false;
    const tahapanDeadline = new Date(t.tanggalSelesai);
    tahapanDeadline.setHours(0, 0, 0, 0);
    return tahapanDeadline < today;
  });

  if (daysUntilProjectDeadline < 0) {
    return {
      level: 'overdue',
      message: 'Proyek melewati deadline',
      count: overdueTahapan.length,
      daysOverdue: Math.abs(daysUntilProjectDeadline)
    };
  }

  if (daysUntilProjectDeadline <= 7) {
    return {
      level: 'critical',
      message: `Kritis: ${daysUntilProjectDeadline} hari lagi`,
      count: overdueTahapan.length,
      daysRemaining: daysUntilProjectDeadline
    };
  }

  if (overdueTahapan.length > 0) {
    return {
      level: 'warning',
      message: overdueTahapan.length === 1
        ? '1 tahapan terlewat'
        : `${overdueTahapan.length} tahapan terlewat`,
      count: overdueTahapan.length
    };
  }

  return {
    level: 'safe',
    message: 'Semua tahapan dalam jadwal',
    count: 0
  };
}

interface DeadlineBadgeProps {
  item: Pekerjaan;
}

export function DeadlineBadge({ item }: DeadlineBadgeProps) {
  const deadlineStatus = getDeadlineStatus(item);

  return (
    <div className="flex justify-center">
      {deadlineStatus.level === 'safe' && (
        <Badge className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100 whitespace-nowrap" title="Semua tahapan dalam jadwal">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aman
        </Badge>
      )}

      {deadlineStatus.level === 'warning' && (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100 whitespace-nowrap" title={deadlineStatus.message}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          {deadlineStatus.count} Terlewat
        </Badge>
      )}

      {deadlineStatus.level === 'critical' && (
        <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100 whitespace-nowrap" title={deadlineStatus.message}>
          <AlertCircle className="h-3 w-3 mr-1" />
          Kritis ({deadlineStatus.daysRemaining}h)
        </Badge>
      )}

      {deadlineStatus.level === 'overdue' && (
        <Badge className="bg-gray-800 text-white border-gray-900 hover:bg-gray-800 whitespace-nowrap" title={deadlineStatus.message}>
          <Clock className="h-3 w-3 mr-1" />
          Terlewat ({deadlineStatus.daysOverdue}h)
        </Badge>
      )}
    </div>
  );
}
