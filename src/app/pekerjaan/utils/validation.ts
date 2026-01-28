import { TahapanKerja } from '@/types';
import { FormData } from '../hooks/useFormManagement';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateForm(formData: FormData): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!formData.nomorKontrak) errors.push('Nomor kontrak wajib diisi');
  if (!formData.namaProyek) errors.push('Nama proyek wajib diisi');
  if (!formData.klien) errors.push('Klien wajib diisi');
  if (!formData.pic) errors.push('PIC wajib diisi');
  if (formData.nilaiKontrak <= 0) errors.push('Nilai kontrak harus lebih dari 0');

  // Date validation
  if (formData.tanggalSelesai < formData.tanggalMulai) {
    errors.push('Tanggal selesai tidak boleh lebih awal dari tanggal mulai');
  }

  // Tahapan validation
  if (formData.tahapan.length > 0) {
    const bobotValidation = validateBobot(formData.tahapan);
    if (!bobotValidation.valid) {
      errors.push(bobotValidation.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateBobot(tahapan: TahapanKerja[]): { valid: boolean; message: string } {
  if (tahapan.length === 0) {
    return { valid: true, message: '' };
  }

  const totalBobot = tahapan.reduce((sum, t) => sum + t.bobot, 0);
  
  if (Math.abs(totalBobot - 100) > 0.01) {
    return {
      valid: false,
      message: `Total bobot tahapan harus 100%. Saat ini: ${totalBobot.toFixed(1)}%`
    };
  }

  return { valid: true, message: '' };
}

export function validateDates(startDate: Date, endDate: Date): boolean {
  return endDate >= startDate;
}

export function validateRequired(fields: Record<string, any>): string[] {
  const errors: string[] = [];
  
  Object.entries(fields).forEach(([key, value]) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${key} is required`);
    }
  });

  return errors;
}

export function validateTahapan(tahapan: Omit<TahapanKerja, 'id'>): ValidationResult {
  const errors: string[] = [];

  if (!tahapan.nama) errors.push('Nama tahapan wajib diisi');
  if (tahapan.bobot <= 0) errors.push('Bobot harus lebih dari 0%');
  if (!validateDates(tahapan.tanggalMulai, tahapan.tanggalSelesai)) {
    errors.push('Tanggal selesai tidak boleh lebih awal dari tanggal mulai');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateAnggaran(anggaran: { kategori: string; tahapanId: string }): ValidationResult {
  const errors: string[] = [];

  if (!anggaran.kategori) errors.push('Kategori wajib diisi');
  if (!anggaran.tahapanId) errors.push('Tahapan harus dipilih');

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateSisaBobot(currentTahapan: TahapanKerja[], newBobot: number): { valid: boolean; sisaBobot: number; message: string } {
  const totalBobotSekarang = currentTahapan.reduce((sum, t) => sum + t.bobot, 0);
  const sisaBobot = 100 - totalBobotSekarang;
  
  if (newBobot > sisaBobot) {
    return {
      valid: false,
      sisaBobot,
      message: `Total bobot melebihi 100%. Sisa bobot: ${sisaBobot.toFixed(1)}%`
    };
  }

  return {
    valid: true,
    sisaBobot,
    message: ''
  };
}
