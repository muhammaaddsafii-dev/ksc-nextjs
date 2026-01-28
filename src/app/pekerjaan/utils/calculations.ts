import { TahapanKerja } from '@/types';

/**
 * Calculate weighted progress based on completed tahapan
 */
export function calculateWeightedProgress(tahapan: TahapanKerja[]): number {
  if (tahapan.length === 0) return 0;
  
  return tahapan.reduce((total, t) => {
    // Only count tahapan with status 'done' (completed)
    if (t.status === 'done') {
      return total + t.bobot;
    }
    return total;
  }, 0);
}

/**
 * Calculate total bobot from tahapan array
 */
export function calculateTotalBobot(tahapan: TahapanKerja[]): number {
  return tahapan.reduce((sum, t) => sum + t.bobot, 0);
}

/**
 * Calculate remaining bobot (100 - total)
 */
export function calculateSisaBobot(tahapan: TahapanKerja[]): number {
  return 100 - calculateTotalBobot(tahapan);
}

/**
 * Validate total bobot does not exceed 100%
 */
export function validateTotalBobot(tahapan: TahapanKerja[]): { isValid: boolean; message?: string } {
  const totalBobot = calculateTotalBobot(tahapan);
  
  if (Math.abs(totalBobot - 100) > 0.01) {
    return {
      isValid: false,
      message: `Total bobot tahapan harus 100%. Saat ini: ${totalBobot.toFixed(1)}%`
    };
  }
  
  return { isValid: true };
}
