import { Progress } from '@/components/ui/progress';

interface ProgressSummaryProps {
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
}

export function ProgressSummary({
  completedCount,
  totalCount,
  progressPercentage,
}: ProgressSummaryProps) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
        <div>
          <h3 className="font-semibold text-sm sm:text-base text-gray-900">Progress Keseluruhan</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {completedCount} dari {totalCount} tahapan selesai
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xl sm:text-2xl font-bold text-[#416F39]">
            {progressPercentage.toFixed(0)}%
          </div>
          <p className="text-xs text-gray-500">Progress Total</p>
        </div>
      </div>
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5B8DB8] to-[#416F39] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
