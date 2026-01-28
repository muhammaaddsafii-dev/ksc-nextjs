import { useState } from 'react';
import { toast } from 'sonner';
import { AnggaranItem } from '@/types';

interface UseAnggaranManagementProps {
  anggaran: AnggaranItem[];
  onUpdate: (anggaran: AnggaranItem[]) => void;
}

export function useAnggaranManagement({ anggaran, onUpdate }: UseAnggaranManagementProps) {
  const [editingAnggaranId, setEditingAnggaranId] = useState<string | null>(null);
  const [editAnggaranData, setEditAnggaranData] = useState<AnggaranItem | null>(null);

  const handleAddAnggaran = (newAnggaran: Omit<AnggaranItem, 'id'>) => {
    if (!newAnggaran.kategori || !newAnggaran.tahapanId) {
      toast.error('Kategori dan Tahapan harus diisi');
      return false;
    }

    const updatedAnggaran = [...anggaran, { ...newAnggaran, id: Date.now().toString() }];
    onUpdate(updatedAnggaran);
    toast.success('Anggaran ditambahkan');
    return true;
  };

  const handleEditAnggaran = (anggaranItem: AnggaranItem) => {
    setEditingAnggaranId(anggaranItem.id);
    setEditAnggaranData({ ...anggaranItem });
  };

  const handleSaveEditAnggaran = () => {
    if (!editAnggaranData) return false;

    if (!editAnggaranData.kategori) {
      toast.error('Kategori harus diisi');
      return false;
    }

    const updatedAnggaran = anggaran.map(a =>
      a.id === editingAnggaranId ? editAnggaranData : a
    );

    onUpdate(updatedAnggaran);
    setEditingAnggaranId(null);
    setEditAnggaranData(null);
    toast.success('Anggaran berhasil diperbarui');
    return true;
  };

  const handleCancelEditAnggaran = () => {
    setEditingAnggaranId(null);
    setEditAnggaranData(null);
  };

  const handleDeleteAnggaran = (anggaranId: string) => {
    const updatedAnggaran = anggaran.filter((item) => item.id !== anggaranId);
    onUpdate(updatedAnggaran);
    toast.success('Anggaran berhasil dihapus');
  };

  return {
    editingAnggaranId,
    editAnggaranData,
    setEditAnggaranData,
    handleAddAnggaran,
    handleEditAnggaran,
    handleSaveEditAnggaran,
    handleCancelEditAnggaran,
    handleDeleteAnggaran,
  };
}
