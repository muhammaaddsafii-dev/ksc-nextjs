import { useState } from 'react';
import { Pekerjaan, TahapanKerja, AnggaranItem } from '@/types';
import { toast } from 'sonner';

export type FormData = Omit<Pekerjaan, 'id' | 'createdAt' | 'updatedAt'> & {
  sourceType?: 'lelang' | 'non-lelang' | 'manual';
  sourceId?: string;
  namaPerusahaan: string;
  dokumenLelang?: {
    dokumenTender?: string[];
    dokumenAdministrasi?: string[];
    dokumenTeknis?: string[];
    dokumenPenawaran?: string[];
  };
  dokumenNonLelang?: string[];
  dokumenSPK?: string[];
  dokumenInvoice?: string[];
  aoiFile?: string;
};

export const initialFormData: FormData = {
  nomorKontrak: '',
  namaProyek: '',
  klien: '',
  nilaiKontrak: 0,
  namaPerusahaan: '',
  jenisPekerjaan: '',
  tim: [],
  status: 'persiapan',
  tanggalMulai: new Date(),
  tanggalSelesai: new Date(),
  progress: 0,
  tahapan: [],
  anggaran: [],
  adendum: [],
  tenderType: 'non-tender',
  sourceType: 'manual',
  sourceId: '',
  dokumenLelang: {
    dokumenTender: [],
    dokumenAdministrasi: [],
    dokumenTeknis: [],
    dokumenPenawaran: [],
  },
  dokumenNonLelang: [],
  dokumenSPK: [],
  dokumenInvoice: [],
  aoiFile: undefined,
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
    nomor: 0
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
      nomor: 0
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
    sourceType: 'lelang' | 'non-lelang',
    sourceData: any
  ) => {
    if (sourceType === 'lelang') {
      setFormData({
        ...formData,
        namaProyek: sourceData.namaLelang,
        klien: sourceData.instansi,
        nilaiKontrak: sourceData.nominalTender || sourceData.nilaiPenawaran,
        tanggalMulai: sourceData.tanggalLelang,
        namaPerusahaan: sourceData.namaPerusahaan,
        tim: sourceData.timAssigned,
        tenderType: 'tender',
        sourceType: 'lelang',
        sourceId: sourceData.id,
        dokumenLelang: {
          dokumenTender: sourceData.dokumenTender || [],
          dokumenAdministrasi: sourceData.dokumenAdministrasi || [],
          dokumenTeknis: sourceData.dokumenTeknis || [],
          dokumenPenawaran: sourceData.dokumenPenawaran || [],
        },
      });
      toast.success('Data dari lelang berhasil dimuat');
    } else if (sourceType === 'non-lelang') {
      setFormData({
        ...formData,
        namaProyek: sourceData.namaProyek,
        klien: sourceData.klien,
        nilaiKontrak: sourceData.nilaiEstimasi,
        tanggalMulai: sourceData.tanggalMulai,
        namaPerusahaan: sourceData.namaPerusahaan,
        tenderType: 'non-tender',
        sourceType: 'non-lelang',
        sourceId: sourceData.id,
        dokumenNonLelang: sourceData.dokumen || [],
      });
      toast.success('Data dari non-lelang berhasil dimuat');
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
