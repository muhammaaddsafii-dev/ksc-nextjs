import { Pekerjaan } from '@/types';
import { FormData, DokumenEntry } from '../hooks/useFormManagement';
import { applyOverdueInvoiceStatus } from './calculations';

export function transformToFormData(item: Pekerjaan): FormData {
  const actualTenderType = item.tenderType || 'tender';

  return {
    nomorKontrak: item.nomorKontrak,
    namaProyek: item.namaProyek,
    klien: item.klien,
    nilaiKontrak: item.nilaiKontrak,
    namaPerusahaan: item.namaPerusahaan,
    jenisPekerjaan: item.jenisPekerjaan,
    tim: item.tim,
    status: item.status,
    tanggalMulai: new Date(item.tanggalMulai),
    tanggalSelesai: new Date(item.tanggalSelesai),
    progress: item.progress,
    tahapan: applyOverdueInvoiceStatus(item.tahapan),
    anggaran: item.anggaran,
    adendum: item.adendum,
    tenderType: actualTenderType,
    sourceType: (item as any).sourceType || (actualTenderType === 'tender' ? 'tender' : 'non-tender'),
    sourceId: (item as any).sourceId || '',
    aoiFile: item.aoiFile,
    deskripsi: item.deskripsi || [],
    ...generateDummyDocuments(item, actualTenderType),
  };
}

export function generateDummyDocuments(
  _item: Pekerjaan,
  _tenderType: 'tender' | 'non-tender'
): Pick<FormData, 'dokumenTender' | 'dokumenNonTender' | 'dokumenKontrak'> {
  return {
    dokumenTender: {
      dokumenTender: [],
      dokumenAdministrasi: [],
      dokumenTeknis: [],
      dokumenPenawaran: [],
    },
    dokumenNonTender: [],
    dokumenKontrak: [],
  };
}

export function transformToApiData(formData: FormData): Omit<Pekerjaan, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    nomorKontrak: formData.nomorKontrak,
    namaProyek: formData.namaProyek,
    klien: formData.klien,
    nilaiKontrak: formData.nilaiKontrak,
    namaPerusahaan: formData.namaPerusahaan,
    jenisPekerjaan: formData.jenisPekerjaan,
    tim: formData.tim,
    status: formData.status,
    tanggalMulai: formData.tanggalMulai,
    tanggalSelesai: formData.tanggalSelesai,
    progress: formData.progress,
    tahapan: formData.tahapan,
    anggaran: formData.anggaran,
    adendum: formData.adendum,
    tenderType: formData.tenderType,
    aoiFile: formData.aoiFile,
    deskripsi: formData.deskripsi || [],
  };
}

export function getProjectSource(sourceType?: string, sourceId?: string, tenderList?: any[], nonTenderList?: any[]) {
  if (!sourceType || !sourceId) return null;

  if (sourceType === 'tender' && tenderList) {
    return tenderList.find(l => l.id === sourceId);
  }

  if (sourceType === 'non-tender' && nonTenderList) {
    return nonTenderList.find(p => p.id === sourceId);
  }

  return null;
}
