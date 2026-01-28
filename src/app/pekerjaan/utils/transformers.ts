import { Pekerjaan } from '@/types';
import { FormData } from '../hooks/useFormManagement';

export function transformToFormData(item: Pekerjaan): FormData {
  const actualTenderType = item.tenderType || 'lelang';

  return {
    nomorKontrak: item.nomorKontrak,
    namaProyek: item.namaProyek,
    klien: item.klien,
    nilaiKontrak: item.nilaiKontrak,
    pic: item.pic,
    jenisPekerjaan: item.jenisPekerjaan,
    tim: item.tim,
    status: item.status,
    tanggalMulai: new Date(item.tanggalMulai),
    tanggalSelesai: new Date(item.tanggalSelesai),
    progress: item.progress,
    tahapan: item.tahapan,
    anggaran: item.anggaran,
    adendum: item.adendum,
    tenderType: actualTenderType,
    sourceType: (item as any).sourceType || (actualTenderType === 'lelang' ? 'lelang' : 'non-lelang'),
    sourceId: (item as any).sourceId || '',
    ...generateDummyDocuments(item, actualTenderType),
  };
}

export function generateDummyDocuments(
  item: Pekerjaan,
  tenderType: 'lelang' | 'non-lelang'
): Pick<FormData, 'dokumenLelang' | 'dokumenNonLelang' | 'dokumenSPK' | 'dokumenInvoice'> {
  return {
    dokumenLelang: tenderType === 'lelang' ? {
      dokumenTender: [
        `Dokumen_RKS_Tender_${item.namaProyek.substring(0, 10)}.pdf`,
        `Spesifikasi_Teknis_${item.klien.substring(0, 8)}.pdf`,
      ],
      dokumenAdministrasi: [
        `SIUP_Perusahaan.pdf`,
        `TDP_${item.klien.substring(0, 8)}.pdf`,
        `NPWP_Perusahaan.pdf`,
      ],
      dokumenTeknis: [
        `Gambar_Teknis_${item.namaProyek.substring(0, 10)}.dwg`,
        `RAB_Detail.xlsx`,
        `Metode_Pelaksanaan.pdf`,
        `Spesifikasi_Material.pdf`,
      ],
      dokumenPenawaran: [
        `Surat_Penawaran_Harga.pdf`,
        `Breakdown_Harga.xlsx`,
      ],
    } : {
      dokumenTender: [],
      dokumenAdministrasi: [],
      dokumenTeknis: [],
      dokumenPenawaran: [],
    },
    dokumenNonLelang: tenderType === 'non-lelang' ? [
      `Proposal_Teknis_${item.namaProyek.substring(0, 10)}.pdf`,
      `Company_Profile_${item.klien.substring(0, 8)}.pdf`,
      `RAB_${item.namaProyek.substring(0, 10)}.xlsx`,
      `Surat_Penawaran_Harga.pdf`,
      `Portfolio_Proyek.pdf`,
    ] : [],
    dokumenSPK: [
      `SPK_${item.nomorKontrak}_${item.namaProyek.substring(0, 10)}.pdf`,
      `SPK_Adendum_01_${item.nomorKontrak}.pdf`,
    ],
    dokumenInvoice: [
      `Invoice_Termin_1_${item.nomorKontrak}.pdf`,
      `Invoice_Termin_2_${item.nomorKontrak}.pdf`,
      `Invoice_Termin_3_${item.nomorKontrak}.pdf`,
    ],
  };
}

export function transformToApiData(formData: FormData): Omit<Pekerjaan, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    nomorKontrak: formData.nomorKontrak,
    namaProyek: formData.namaProyek,
    klien: formData.klien,
    nilaiKontrak: formData.nilaiKontrak,
    pic: formData.pic,
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
  };
}

export function getProjectSource(sourceType?: string, sourceId?: string, lelangList?: any[], praKontrakList?: any[]) {
  if (!sourceType || !sourceId) return null;

  if (sourceType === 'lelang' && lelangList) {
    return lelangList.find(l => l.id === sourceId);
  }

  if (sourceType === 'non-lelang' && praKontrakList) {
    return praKontrakList.find(p => p.id === sourceId);
  }

  return null;
}
