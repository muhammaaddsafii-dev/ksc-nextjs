import { useState } from 'react';
import { Pekerjaan, TahapanKerja, AnggaranItem, DeskripsiLog } from '@/types';
import { toast } from 'sonner';

export interface DokumenEntry {
  id: string;
  nama: string;
  kategori: 'SPK' | 'Invoice' | 'Lainnya';
  note: string;
  tanggalUpload: Date;
}

export type FormData = Omit<Pekerjaan, 'id' | 'createdAt' | 'updatedAt'> & {
  sourceType?: 'tender' | 'non-tender' | 'manual';
  sourceId?: string;
  namaPerusahaan: string;
  dokumenTender?: {
    dokumenTender?: string[];
    dokumenAdministrasi?: string[];
    dokumenTeknis?: string[];
    dokumenPenawaran?: string[];
  };
  dokumenNonTender?: string[];
  dokumenKontrak?: DokumenEntry[];
  aoiFile?: string;
  deskripsi?: DeskripsiLog[];
};

export const initialFormData: FormData = {
  nomorKontrak: '',
  namaProyek: '',
  klien: '',
  nilaiKontrak: 0,
  namaPerusahaan: '',
  jenisPekerjaan: '',
  keterangan: '',
  tim: [],
  status: 'persiapan',
  tanggalMulai: new Date(),
  tanggalSelesai: new Date(),
  progress: 0,
  tahapan: [],
  anggaran: [],
  adendum: [],
  tenderType: 'non-tender',
  sourceType: 'manual' as const,
  sourceId: '',
  dokumenTender: {
    dokumenTender: [],
    dokumenAdministrasi: [],
    dokumenTeknis: [],
    dokumenPenawaran: [],
  },
  dokumenNonTender: [],
  dokumenKontrak: [],
  aoiFile: undefined,
  deskripsi: [],
};

interface UseFormManagementProps {
  initialData?: FormData;
  onSubmit?: (data: FormData) => void;
}

export function useFormManagement({
  initialData = initialFormData,
  onSubmit
}: UseFormManagementProps = {}) {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [newTahapan, setNewTahapan] = useState<Omit<TahapanKerja, 'id'>>({
    nama: '',
    progress: 0,
    tanggalMulai: new Date(),
    tanggalSelesai: new Date(),
    status: 'pending',
    bobot: 0,
    files: [],
    nomor: 0,
    subTahapan: [],
    paguAnggaran: 0
  });
  const [newAnggaran, setNewAnggaran] = useState<Omit<AnggaranItem, 'id'>>({
    kategori: '',
    deskripsi: '',
    jumlah: 0,
    realisasi: 0,
    tahapanId: '',
    files: []
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setNewTahapan({
      nama: '',
      progress: 0,
      tanggalMulai: new Date(),
      tanggalSelesai: new Date(),
      status: 'pending',
      bobot: 0,
      files: [],
      nomor: 0,
      subTahapan: [],
      paguAnggaran: 0
    });
    setNewAnggaran({
      kategori: '',
      deskripsi: '',
      jumlah: 0,
      realisasi: 0,
      tahapanId: '',
      files: []
    });
  };

  const loadFromSource = (
    sourceType: 'tender' | 'non-tender',
    sourceData: any
  ) => {
    if (sourceType === 'tender') {
      setFormData({
        ...formData,
        namaProyek: sourceData.namaTender,
        klien: sourceData.instansi,
        nilaiKontrak: sourceData.nominalTender || sourceData.nilaiPenawaran,
        tanggalMulai: sourceData.tanggalTender,
        namaPerusahaan: sourceData.namaPerusahaan,
        tim: sourceData.timAssigned,
        tenderType: 'tender',
        sourceType: 'tender',
        sourceId: sourceData.id,
        dokumenTender: {
          dokumenTender: sourceData.dokumenTender || [],
          dokumenAdministrasi: sourceData.dokumenAdministrasi || [],
          dokumenTeknis: sourceData.dokumenTeknis || [],
          dokumenPenawaran: sourceData.dokumenPenawaran || [],
        },
      });
      toast.success('Data dari tender berhasil dimuat');
    } else if (sourceType === 'non-tender') {
      setFormData({
        ...formData,
        namaProyek: sourceData.namaProyek,
        klien: sourceData.klien,
        nilaiKontrak: sourceData.nilaiEstimasi,
        tanggalMulai: sourceData.tanggalMulai,
        namaPerusahaan: sourceData.namaPerusahaan,
        tenderType: 'non-tender',
        sourceType: 'non-tender',
        sourceId: sourceData.id,
        dokumenNonTender: sourceData.dokumen || [],
      });
      toast.success('Data dari non-tender berhasil dimuat');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return {
    // State
    formData,
    setFormData,
    newTahapan,
    setNewTahapan,
    newAnggaran,
    setNewAnggaran,

    // Actions
    resetForm,
    loadFromSource,
    handleSubmit,
  };
}
