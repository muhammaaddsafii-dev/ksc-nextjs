import { useState } from 'react';
import { toast } from 'sonner';
import { TahapanKerja } from '@/types';

interface UseTahapanManagementProps {
  tahapan: TahapanKerja[];
  onUpdate: (tahapan: TahapanKerja[]) => void;
}

export function useTahapanManagement({ tahapan, onUpdate }: UseTahapanManagementProps) {
  const [editingTahapanId, setEditingTahapanId] = useState<string | null>(null);
  const [editTahapanData, setEditTahapanData] = useState<TahapanKerja | null>(null);

  const handleAddTahapan = (newTahapan: Omit<TahapanKerja, 'id'>) => {
    if (!newTahapan.nama) {
      toast.error('Nama tahapan harus diisi');
      return false;
    }

    // Validasi bobot
    if (newTahapan.bobot <= 0) {
      toast.error('Bobot harus lebih dari 0%');
      return false;
    }

    const totalBobotSekarang = tahapan.reduce((sum, t) => sum + t.bobot, 0);
    if (totalBobotSekarang + newTahapan.bobot > 100) {
      toast.error(`Total bobot melebihi 100%. Sisa bobot: ${(100 - totalBobotSekarang).toFixed(1)}%`);
      return false;
    }

    // Tentukan nomor tahapan berikutnya
    const nomorBerikutnya = tahapan.length > 0
      ? Math.max(...tahapan.map(t => t.nomor || 0)) + 1
      : 1;

    const updatedTahapan = [...tahapan, { ...newTahapan, id: Date.now().toString(), nomor: nomorBerikutnya }];
    onUpdate(updatedTahapan);
    toast.success('Tahapan ditambahkan');
    return true;
  };

  const handleEditTahapan = (tahapan: TahapanKerja) => {
    setEditingTahapanId(tahapan.id);
    setEditTahapanData({ ...tahapan });
  };

  const handleSaveEditTahapan = () => {
    if (!editTahapanData) return false;

    if (!editTahapanData.nama) {
      toast.error('Nama tahapan harus diisi');
      return false;
    }

    if (editTahapanData.bobot <= 0) {
      toast.error('Bobot harus lebih dari 0%');
      return false;
    }

    // Validasi nomor urut
    const newNomor = editTahapanData.nomor;
    const maxNomor = Math.max(...tahapan.map(t => t.nomor || 0));

    if (newNomor < 1) {
      toast.error('Nomor urut minimal 1');
      return false;
    }

    if (newNomor > maxNomor) {
      toast.error(`Nomor urut maksimal ${maxNomor}`);
      return false;
    }

    // Validasi total bobot (exclude tahapan yang sedang diedit)
    const totalBobotLain = tahapan
      .filter(t => t.id !== editingTahapanId)
      .reduce((sum, t) => sum + t.bobot, 0);

    if (totalBobotLain + editTahapanData.bobot > 100) {
      toast.error(`Total bobot melebihi 100%. Sisa bobot: ${(100 - totalBobotLain).toFixed(1)}%`);
      return false;
    }

    // Dapatkan nomor urut lama dari tahapan yang sedang diedit
    const oldTahapan = tahapan.find(t => t.id === editingTahapanId);
    const oldNomor = oldTahapan?.nomor || 0;

    // Jika nomor berubah, atur ulang semua nomor
    let updatedTahapan;
    if (oldNomor !== newNomor) {
      // Buat array baru tanpa tahapan yang sedang diedit
      const otherTahapan = tahapan.filter(t => t.id !== editingTahapanId);

      // Sisipkan tahapan yang diedit pada posisi baru
      const reorderedTahapan = [...otherTahapan];
      reorderedTahapan.splice(newNomor - 1, 0, editTahapanData);

      // Atur ulang semua nomor urut
      updatedTahapan = reorderedTahapan.map((t, index) => ({
        ...t,
        nomor: index + 1
      }));

      toast.success('Tahapan berhasil diperbarui dan urutan disesuaikan');
    } else {
      // Jika nomor tidak berubah, hanya update data tahapan
      updatedTahapan = tahapan.map(t =>
        t.id === editingTahapanId ? editTahapanData : t
      );

      toast.success('Tahapan berhasil diperbarui');
    }

    onUpdate(updatedTahapan);
    setEditingTahapanId(null);
    setEditTahapanData(null);
    return true;
  };

  const handleCancelEditTahapan = () => {
    setEditingTahapanId(null);
    setEditTahapanData(null);
  };

  const handleMoveTahapanUp = (tahapanId: string) => {
    const currentIndex = tahapan.findIndex(t => t.id === tahapanId);
    if (currentIndex <= 0) return; // Sudah di posisi paling atas

    const newTahapan = [...tahapan];
    // Swap dengan tahapan sebelumnya
    [newTahapan[currentIndex - 1], newTahapan[currentIndex]] =
      [newTahapan[currentIndex], newTahapan[currentIndex - 1]];

    // Atur ulang semua nomor urut
    const reorderedTahapan = newTahapan.map((t, index) => ({
      ...t,
      nomor: index + 1
    }));

    onUpdate(reorderedTahapan);
    toast.success('Urutan tahapan diperbarui');
  };

  const handleMoveTahapanDown = (tahapanId: string) => {
    const currentIndex = tahapan.findIndex(t => t.id === tahapanId);
    if (currentIndex >= tahapan.length - 1) return; // Sudah di posisi paling bawah

    const newTahapan = [...tahapan];
    // Swap dengan tahapan sesudahnya
    [newTahapan[currentIndex], newTahapan[currentIndex + 1]] =
      [newTahapan[currentIndex + 1], newTahapan[currentIndex]];

    // Atur ulang semua nomor urut
    const reorderedTahapan = newTahapan.map((t, index) => ({
      ...t,
      nomor: index + 1
    }));

    onUpdate(reorderedTahapan);
    toast.success('Urutan tahapan diperbarui');
  };

  const handleDeleteTahapan = (tahapanId: string) => {
    // Hapus tahapan dan atur ulang nomor urut
    const updatedTahapan = tahapan
      .filter((t) => t.id !== tahapanId)
      .map((t, index) => ({
        ...t,
        nomor: index + 1
      }));

    onUpdate(updatedTahapan);
    toast.success('Tahapan berhasil dihapus dan urutan disesuaikan');
  };

  return {
    editingTahapanId,
    editTahapanData,
    setEditTahapanData,
    handleAddTahapan,
    handleEditTahapan,
    handleSaveEditTahapan,
    handleCancelEditTahapan,
    handleMoveTahapanUp,
    handleMoveTahapanDown,
    handleDeleteTahapan,
  };
}
