import { TahapanKerja, Invoice } from '@/types';

/**
 * Update invoice status to Terlambat Bayar if jatuh tempo has passed and not yet lunas
 */
export function applyOverdueInvoiceStatus(tahapan: TahapanKerja[]): TahapanKerja[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tahapan.map(t => {
    if (!t.invoices || t.invoices.length === 0) return t;
    const updatedInvoices = t.invoices.map((inv: Invoice) => {
      if (!inv.jatuhTempo || inv.status === 'lunas') return inv;
      const jatuhTempo = new Date(inv.jatuhTempo);
      jatuhTempo.setHours(0, 0, 0, 0);
      if (jatuhTempo < today) {
        return { ...inv, status: 'Terlambat Bayar' as const };
      }
      return inv;
    });
    return { ...t, invoices: updatedInvoices };
  });
}

/**
 * Calculate weighted progress based on completed tahapan
 */
export function calculateWeightedProgress(tahapan: TahapanKerja[]): number {
  if (tahapan.length === 0) return 0;

  const totalprogress = tahapan.reduce((total, t) => {
    if (t.status === 'done') {
      return total + (t.bobot || 0);
    }
    return total;
  }, 0);

  return Number(totalprogress.toFixed(1));
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
