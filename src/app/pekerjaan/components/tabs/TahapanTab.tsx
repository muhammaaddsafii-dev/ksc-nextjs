"use client";

import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Upload, X, FileText, Download, CheckCircle2, Circle, Calendar, Flag, AlertTriangle, Clock, Loader2, ArrowUp, ArrowDown, AlertCircle, ListChecks, FolderOpen, FilePlus, ExternalLink, Banknote, TrendingUp } from 'lucide-react';
import { TahapanKerja, TahapanAdendum } from '@/types';
import { FormData } from '../../hooks/useFormManagement';
import { formatDate, formatDateInput } from '@/lib/helpers';
import { toast } from 'sonner';
import { FileIcon } from '../';
import { getFileIconClass } from '../../utils/fileHelpers';
import { calculateWeightedProgress, calculateSisaBobot } from '../../utils/calculations';
import { mockJenisPekerjaan, mockTahapanTemplate } from '@/mocks/data';
import { useState, useMemo } from 'react';

interface TahapanTabProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  viewMode: boolean;
  // newTahapan: TahapanKerja;
  // setNewTahapan: (data: TahapanKerja) => void;
  newTahapan: Omit<TahapanKerja, 'id'>;
  setNewTahapan: (data: Omit<TahapanKerja, 'id'>) => void;
  tahapanManagement: any;
  fileManagement: any;
  handleAddTahapan: () => void;
  handleTahapanFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExistingTahapanFileUpload: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  removeTahapanFile: (fileName: string) => void;
  removeExistingTahapanFile: (idx: number, fileName: string) => void;
}

export function TahapanTab({
  formData,
  setFormData,
  viewMode,
  newTahapan,
  setNewTahapan,
  tahapanManagement,
  fileManagement,
  handleAddTahapan,
  handleTahapanFileUpload,
  handleExistingTahapanFileUpload,
  removeTahapanFile,
  removeExistingTahapanFile
}: TahapanTabProps) {
  const sisaBobot = calculateSisaBobot(formData.tahapan);

  // Kalkulasi keuangan — menggunakan invoices[] dengan fallback ke legacy fields
  const nilaiKontrak = formData.nilaiKontrak || 0;
  const totalDitagih = formData.tahapan.reduce((sum, t) => {
    if (t.invoices && t.invoices.length > 0)
      return sum + t.invoices.reduce((s, i) => s + (i.nilaiInvoice || 0), 0);
    return sum + (t.jumlahTagihanInvoice || 0);
  }, 0);
  const totalTerbayar = formData.tahapan.reduce((sum, t) => {
    if (t.invoices && t.invoices.length > 0)
      return sum + t.invoices.reduce((s, i) => s + (i.jumlahTerbayar || 0), 0);
    if (t.statusPembayaran === 'lunas') return sum + (t.jumlahTagihanInvoice || 0);
    return sum;
  }, 0);
  const sisaPiutang = Math.max(totalDitagih - totalTerbayar, 0);
  const belumDitagih = Math.max(nilaiKontrak - totalDitagih, 0);
  const pctDitagih = nilaiKontrak > 0 ? Math.min((totalDitagih / nilaiKontrak) * 100, 100) : 0;
  const pctTerbayar = nilaiKontrak > 0 ? Math.min((totalTerbayar / nilaiKontrak) * 100, 100) : 0;
  const pctPiutang = nilaiKontrak > 0 ? (sisaPiutang / nilaiKontrak) * 100 : 0;
  const terlambatCount = formData.tahapan.reduce((count, t) => {
    if (t.invoices && t.invoices.length > 0)
      return count + t.invoices.filter(i => i.status === 'Terlambat Bayar').length;
    return count + (t.statusPembayaran === 'Terlambat Bayar' ? 1 : 0);
  }, 0);

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  // State untuk template dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedJenisIdForTemplate, setSelectedJenisIdForTemplate] = useState<string>('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  // State untuk Adendum
  const [adendumDialogOpen, setAdendumDialogOpen] = useState(false);
  const [selectedTahapanIdForAdendum, setSelectedTahapanIdForAdendum] = useState<string | null>(null);
  const [newAdendumData, setNewAdendumData] = useState<{
    tanggal: Date;
    keterangan: string;
    files: string[];
  }>({
    tanggal: new Date(),
    keterangan: '',
    files: []
  });

  // State for Sub-Tahapan Input
  const [subTahapanInput, setSubTahapanInput] = useState('');
  const [editSubTahapanInput, setEditSubTahapanInput] = useState('');

  // Group tahapan template by jenis pekerjaan
  const groupedTemplate = useMemo(() => {
    const groups: Record<string, typeof mockTahapanTemplate> = {};

    mockTahapanTemplate.forEach(tahapan => {
      if (!groups[tahapan.jenisPekerjaanId]) {
        groups[tahapan.jenisPekerjaanId] = [];
      }
      groups[tahapan.jenisPekerjaanId].push(tahapan);
    });

    // Sort tahapan by urutan within each group
    Object.keys(groups).forEach(jenisId => {
      groups[jenisId].sort((a, b) => a.urutan - b.urutan);
    });

    return groups;
  }, []);

  // Handler untuk membuka dialog template
  const handleOpenTemplateDialog = () => {
    setTemplateDialogOpen(true);
    setSelectedJenisIdForTemplate('');
    setSelectedTemplates([]);
  };

  // Handler untuk toggle selection template
  const handleToggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };

  // Handler untuk apply template yang dipilih
  const handleApplyTemplates = () => {
    if (selectedTemplates.length === 0) {
      toast.error('Pilih minimal satu template tahapan!');
      return;
    }

    // Get selected templates
    const templates = mockTahapanTemplate.filter(t => selectedTemplates.includes(t.id));

    // Convert templates to TahapanKerja format
    const newTahapanList: Omit<TahapanKerja, 'id'>[] = templates.map((template, index) => ({
      nomor: formData.tahapan.length + index + 1,
      nama: template.nama,
      progress: 0,
      tanggalMulai: new Date(),
      tanggalSelesai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
      status: 'pending' as const,
      bobot: template.bobotDefault,
      files: []
    }));

    // Check if total bobot would exceed 100
    const currentBobot = formData.tahapan.reduce((sum, t) => sum + t.bobot, 0);
    const newBobot = newTahapanList.reduce((sum, t) => sum + t.bobot, 0);

    if (currentBobot + newBobot > 100) {
      toast.error(`Total bobot akan melebihi 100% (${(currentBobot + newBobot).toFixed(1)}%). Silakan sesuaikan bobot tahapan.`);
      return;
    }

    // Add to existing tahapan
    const updatedTahapan = [...formData.tahapan];
    newTahapanList.forEach(tahapan => {
      updatedTahapan.push({
        ...tahapan,
        id: Date.now().toString() + Math.random().toString()
      } as TahapanKerja);
    });

    setFormData({
      ...formData,
      tahapan: updatedTahapan
    });

    toast.success(`${selectedTemplates.length} tahapan berhasil ditambahkan dari template!`);
    setTemplateDialogOpen(false);
    setSelectedTemplates([]);
  };

  // Handler untuk mengisi form dari satu template
  const handleFillFromTemplate = (templateId: string) => {
    const template = mockTahapanTemplate.find(t => t.id === templateId);
    if (!template) return;

    setNewTahapan({
      nomor: formData.tahapan.length + 1,
      nama: template.nama,
      progress: 0,
      tanggalMulai: new Date(),
      tanggalSelesai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      bobot: template.bobotDefault,
      files: []
    });

    setTemplateDialogOpen(false);
    toast.success('Form berhasil diisi dari template! Anda dapat mengeditnya sebelum menambahkan.');
  };

  const getJenisNama = (jenisId: string) => {
    return mockJenisPekerjaan.find(j => j.id === jenisId)?.nama || 'Unknown';
  };

  const getJenisKode = (jenisId: string) => {
    return mockJenisPekerjaan.find(j => j.id === jenisId)?.kode || 'N/A';
  };

  const getJenisWarna = (jenisId: string) => {
    return mockJenisPekerjaan.find(j => j.id === jenisId)?.warna || '#3B82F6';
  };

  // Handlers for Adendum
  const handleOpenAdendumDialog = (tahapanId: string) => {
    setSelectedTahapanIdForAdendum(tahapanId);
    setNewAdendumData({
      tanggal: new Date(),
      keterangan: '',
      files: []
    });
    setAdendumDialogOpen(true);
  };

  const handleAdendumFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Mock upload - in real app would upload to server
      const newFiles = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setNewAdendumData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
    }
  };

  const removeAdendumFile = (fileUrl: string) => {
    setNewAdendumData(prev => ({
      ...prev,
      files: prev.files.filter(f => f !== fileUrl)
    }));
  };

  const handleSaveAdendum = () => {
    if (!selectedTahapanIdForAdendum) return;
    if (!newAdendumData.keterangan) {
      toast.error('Keterangan adendum harus diisi');
      return;
    }

    tahapanManagement.handleAddAdendum(selectedTahapanIdForAdendum, {
      tanggal: newAdendumData.tanggal,
      keterangan: newAdendumData.keterangan,
      files: newAdendumData.files
    });

    setAdendumDialogOpen(false);
  };

  const handleInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileNames = Array.from(files).map(file => `uploads/invoice/${Date.now()}_${file.name}`);
    setNewTahapan({
      ...newTahapan,
      dokumenInvoice: [...(newTahapan.dokumenInvoice || []), ...fileNames]
    });
    toast.success(`${files.length} dokumen invoice ditambahkan`);
  };

  const removeInvoiceFile = (fileName: string) => {
    setNewTahapan({
      ...newTahapan,
      dokumenInvoice: newTahapan.dokumenInvoice?.filter(f => f !== fileName) || []
    });
  };

  const handleEditInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !tahapanManagement.editTahapanData) return;
    const fileNames = Array.from(files).map(file => `uploads/invoice/${Date.now()}_${file.name}`);
    tahapanManagement.setEditTahapanData({
      ...tahapanManagement.editTahapanData,
      dokumenInvoice: [...(tahapanManagement.editTahapanData.dokumenInvoice || []), ...fileNames]
    });
    toast.success(`${files.length} dokumen invoice ditambahkan`);
  };

  const removeEditInvoiceFile = (fileName: string) => {
    if (!tahapanManagement.editTahapanData) return;
    tahapanManagement.setEditTahapanData({
      ...tahapanManagement.editTahapanData,
      dokumenInvoice: tahapanManagement.editTahapanData.dokumenInvoice?.filter((f: string) => f !== fileName) || []
    });
  };

  return (
    <TabsContent value="tahapan" className="space-y-4 px-4 sm:px-6 py-4">
      {!viewMode && (
        <div className="space-y-4">
          {/* Tombol Ambil dari Template */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenTemplateDialog}
              className="h-10 border-2 border-dashed hover:border-solid"
            >
              <ListChecks className="h-4 w-4 mr-2" />
              Ambil dari Template
            </Button>
          </div>

          {/* Form Tambah Tahapan */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Tambah Tahapan Baru</h3>
                <p className="text-xs text-gray-500">Isi form untuk menambahkan tahapan pekerjaan</p>
              </div>
            </div>

            {/* Separator */}
            <div className="my-8">
              <div className="flex items-center px-1">
                <div className="flex-grow border-t-[3px] border-solid border-gray-500"></div>
              </div>
              <div className="flex items-center px-1">
                <div className="flex-grow border-t-[3px] border-solid border-gray-300"></div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Line 1: Nomor Urut, Bobot, Progress, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Nomor Urut</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.tahapan.length > 0 ? Math.max(...formData.tahapan.map(t => t.nomor || 0)) + 1 : 1}
                      className="h-10 pr-8 font-semibold text-center bg-gray-100 border-gray-300"
                      disabled
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                      Auto
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Bobot (%) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newTahapan.bobot || ''}
                      onChange={(e) => setNewTahapan({ ...newTahapan, bobot: Number(e.target.value) })}
                      className="h-10 pr-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                      %
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Sisa bobot: <span className="font-semibold">{sisaBobot.toFixed(1)}%</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newTahapan.status}
                    onValueChange={(v: any) => setNewTahapan({ ...newTahapan, status: v as TahapanKerja['status'] })}
                  >
                    <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Menunggu Bayar">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Menunggu Bayar</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="progress">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-blue-500" />
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="done">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Selesai</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Line 2: Nama Tahapan */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Nama Tahapan <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Contoh: Perencanaan, Desain, Pengembangan..."
                  value={newTahapan.nama}
                  onChange={(e) => setNewTahapan({ ...newTahapan, nama: e.target.value })}
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Line 3: Sub Tahapan */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700">
                  Sub-Tahapan (Opsional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={subTahapanInput}
                    onChange={(e) => setSubTahapanInput(e.target.value)}
                    placeholder="Contoh: Diskusi Awal, Draft 1..."
                    className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (subTahapanInput.trim()) {
                          setNewTahapan({
                            ...newTahapan,
                            subTahapan: [
                              ...(newTahapan.subTahapan || []),
                              {
                                id: Date.now().toString(),
                                nama: subTahapanInput,
                                status: 'pending'
                              }
                            ]
                          });
                          setSubTahapanInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-3 border-gray-300 hover:bg-gray-50"
                    onClick={() => {
                      if (subTahapanInput.trim()) {
                        setNewTahapan({
                          ...newTahapan,
                          subTahapan: [
                            ...(newTahapan.subTahapan || []),
                            {
                              id: Date.now().toString(),
                              nama: subTahapanInput,
                              status: 'pending'
                            }
                          ]
                        });
                        setSubTahapanInput('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newTahapan.subTahapan && newTahapan.subTahapan.length > 0 && (
                  <div className="space-y-1.5 mt-2 bg-gray-50/50 p-2.5 rounded-lg border border-gray-200">
                    {newTahapan.subTahapan.map((sub, idx) => (
                      <div key={sub.id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-md border border-gray-100 shadow-sm group hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-gray-600 font-mono text-[10px] font-medium">
                            {idx + 1}
                          </div>
                          <span className="font-medium text-gray-700">{sub.nama}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTahapan({
                              ...newTahapan,
                              subTahapan: newTahapan.subTahapan?.filter(s => s.id !== sub.id)
                            });
                          }}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Line 4: Deskripsi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Deskripsi (Opsional)
                </Label>
                <Input
                  value={newTahapan.deskripsi || ''}
                  onChange={(e) => setNewTahapan({ ...newTahapan, deskripsi: e.target.value })}
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
                  placeholder="Tambahkan penjelasan detail mengenai tahapan ini..."
                />
              </div>

              {/* Line 5: Tanggal Mulai dan Tanggal Selesai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    <Calendar className="h-3.5 w-3.5 inline mr-1 text-gray-500" />
                    Tanggal Mulai Proyek<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formatDateInput(newTahapan.tanggalMulai)}
                    onChange={(e) => setNewTahapan({ ...newTahapan, tanggalMulai: new Date(e.target.value) })}
                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    <Flag className="h-3.5 w-3.5 inline mr-1 text-gray-500" />
                    Tanggal Selesai (Deadline) Proyek<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formatDateInput(newTahapan.tanggalSelesai)}
                    onChange={(e) => setNewTahapan({ ...newTahapan, tanggalSelesai: new Date(e.target.value) })}
                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Anggaran (Rp)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newTahapan.paguAnggaran || ''}
                    onChange={(e) => setNewTahapan({ ...newTahapan, paguAnggaran: Number(e.target.value) })}
                    className="h-10 pl-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Line 6: Upload Bukti Tahapan */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  <Upload className="h-3.5 w-3.5 inline mr-1 text-gray-500" />
                  Upload Bukti Tahapan (Opsional)
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="tahapan-file-upload-new"
                    type="file"
                    multiple
                    onChange={handleTahapanFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto h-10 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 font-medium"
                    onClick={() => document.getElementById('tahapan-file-upload-new')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih File
                  </Button>
                  <p className="text-xs text-gray-500 flex items-center shrink-0">
                    PDF, Word, Excel, Gambar, dll.
                  </p>
                </div>
                {newTahapan.files && newTahapan.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newTahapan.files.map((file, idx) => {
                      const fileName = file.split('/').pop() || '';
                      return (
                        <div key={idx} className="group flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                          <FileIcon fileName={file} className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs font-medium text-gray-700 max-w-[150px] truncate">
                            {fileName}
                          </span>
                          <button
                            type="button"
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeTahapanFile(file)}
                          >
                            <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Separator Invoice */}
              <div className="my-8 py-4">
                <div className="flex items-center px-1">
                  <div className="flex-grow border-t-[3px] border-solid border-gray-500"></div>
                </div>
                <div className="flex items-center px-1">
                  <div className="flex-grow border-t-[3px] border-solid border-gray-300"></div>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Informasi Invoice
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Tanggal Invoice</Label>
                    <Input
                      type="date"
                      value={newTahapan.tanggalInvoice ? formatDateInput(newTahapan.tanggalInvoice) : ''}
                      onChange={(e) => setNewTahapan({ ...newTahapan, tanggalInvoice: e.target.value ? new Date(e.target.value) : undefined })}
                      className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Perkiraan Invoice Masuk</Label>
                    <Input
                      type="date"
                      value={newTahapan.perkiraanInvoiceMasuk ? formatDateInput(newTahapan.perkiraanInvoiceMasuk) : ''}
                      onChange={(e) => setNewTahapan({ ...newTahapan, perkiraanInvoiceMasuk: e.target.value ? new Date(e.target.value) : undefined })}
                      className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Jumlah Tagihan Invoice</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
                      <Input
                        type="number"
                        value={newTahapan.jumlahTagihanInvoice || ''}
                        onChange={(e) => setNewTahapan({ ...newTahapan, jumlahTagihanInvoice: Number(e.target.value) })}
                        className="h-10 pl-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Status Pembayaran</Label>
                    <Select
                      value={newTahapan.statusPembayaran}
                      onValueChange={(v: any) => setNewTahapan({ ...newTahapan, statusPembayaran: v })}
                    >
                      <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Belum Tagih">🔲 Belum Tagih</SelectItem>
                        <SelectItem value="Menunggu Bayar">⏳ Menunggu Bayar</SelectItem>
                        <SelectItem value="lunas">✅ Lunas</SelectItem>
                        <SelectItem value="Terlambat Bayar">⚠️ Terlambat Bayar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold text-gray-700">Invoice Note</Label>
                    <Input
                      value={newTahapan.invoiceNote || ''}
                      onChange={(e) => setNewTahapan({ ...newTahapan, invoiceNote: e.target.value })}
                      className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Catatan invoice..."
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold text-gray-700">Dokumen Invoice</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="invoice-file-upload-new"
                        type="file"
                        multiple
                        onChange={handleInvoiceFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto h-10 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 font-medium"
                        onClick={() => document.getElementById('invoice-file-upload-new')?.click()}
                      >
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        Upload Invoice
                      </Button>
                    </div>
                    {newTahapan.dokumenInvoice && newTahapan.dokumenInvoice.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {newTahapan.dokumenInvoice.map((file, idx) => (
                          <div key={idx} className="group flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-xs">
                            <span className="truncate max-w-[150px] font-medium text-gray-700">{file.split('/').pop()}</span>
                            <button type="button" onClick={() => removeInvoiceFile(file)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleAddTahapan}
                  className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Tahapan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Dialog Template Tahapan */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pilih Template Tahapan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select Jenis Pekerjaan */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Pilih Jenis Pekerjaan</Label>
              <Select
                value={selectedJenisIdForTemplate}
                onValueChange={setSelectedJenisIdForTemplate}
              >
                <SelectTrigger className="h-10 border-gray-300">
                  <SelectValue placeholder="Pilih Jenis Pekerjaan" />
                </SelectTrigger>
                <SelectContent>
                  {mockJenisPekerjaan
                    .filter((j) => j.aktif && groupedTemplate[j.id])
                    .map((jenis) => (
                      <SelectItem key={jenis.id} value={jenis.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: jenis.warna }}
                          />
                          {jenis.kode} - {jenis.nama}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Daftar Template */}
            {selectedJenisIdForTemplate && groupedTemplate[selectedJenisIdForTemplate] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Template Tahapan ({groupedTemplate[selectedJenisIdForTemplate].length})
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allIds = groupedTemplate[selectedJenisIdForTemplate].map(t => t.id);
                        setSelectedTemplates(allIds);
                      }}
                    >
                      Pilih Semua
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplates([])}
                    >
                      Bersihkan
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-3">
                  {groupedTemplate[selectedJenisIdForTemplate].map((template) => {
                    const isSelected = selectedTemplates.includes(template.id);

                    return (
                      <div
                        key={template.id}
                        className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        onClick={() => handleToggleTemplate(template.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`}>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            #{template.urutan}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{template.nama}</p>
                            {template.deskripsi && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {template.deskripsi}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {template.bobotDefault}%
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-3 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFillFromTemplate(template.id);
                          }}
                          title="Isi Form dari Template Ini"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Isi Form
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Info Total Bobot */}
                {selectedTemplates.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {selectedTemplates.length} tahapan dipilih
                      </span>
                      <span className="font-semibold text-blue-700">
                        Total Bobot: {
                          mockTahapanTemplate
                            .filter(t => selectedTemplates.includes(t.id))
                            .reduce((sum, t) => sum + t.bobotDefault, 0)
                            .toFixed(1)
                        }%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!selectedJenisIdForTemplate && (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Pilih jenis pekerjaan untuk melihat template</p>
              </div>
            )}

            {selectedJenisIdForTemplate && !groupedTemplate[selectedJenisIdForTemplate] && (
              <div className="text-center py-12 text-muted-foreground">
                <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Belum ada template untuk jenis pekerjaan ini</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTemplateDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleApplyTemplates}
              disabled={selectedTemplates.length === 0}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambahkan {selectedTemplates.length > 0 ? `(${selectedTemplates.length})` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Add Adendum */}
      <Dialog open={adendumDialogOpen} onOpenChange={setAdendumDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Adendum</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tanggal Adendum</Label>
              <Input
                type="date"
                value={formatDateInput(newAdendumData.tanggal)}
                onChange={(e) => setNewAdendumData({ ...newAdendumData, tanggal: new Date(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Keterangan Adendum</Label>
              <Input
                placeholder="Jelaskan perubahan adendum..."
                value={newAdendumData.keterangan}
                onChange={(e) => setNewAdendumData({ ...newAdendumData, keterangan: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Dokumen Adendum</Label>
              <div className="flex gap-2">
                <Input
                  id="adendum-file-upload"
                  type="file"
                  multiple
                  onChange={handleAdendumFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('adendum-file-upload')?.click()}
                  className="w-full border-dashed"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Dokumen
                </Button>
              </div>
              {newAdendumData.files.length > 0 && (
                <div className="space-y-1 mt-2">
                  {newAdendumData.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border">
                      <span className="truncate max-w-[200px]">{file.split('/').pop()}</span>
                      <button onClick={() => removeAdendumFile(file)} className="text-red-500 hover:text-red-700">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveAdendum} className="bg-blue-600 hover:bg-blue-700 text-white">
                Simpan Adendum
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timeline Tahapan - Vertical Timeline Style */}
      <div className="space-y-4">
        {formData.tahapan.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Belum ada tahapan yang ditambahkan</p>
          </div>
        ) : (
          <>
            {/* Progress Summary */}
            <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
              {/* Physical Progress */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 sm:p-4 border-b">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-[#416F39]" />
                      Progress Pekerjaan
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {formData.tahapan.filter(t => t.status === 'done').length} dari {formData.tahapan.length} tahapan selesai
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-[#416F39]">
                      {calculateWeightedProgress(formData.tahapan)}%
                    </div>
                    <p className="text-xs text-gray-500">Progress Total</p>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5B8DB8] to-[#416F39] transition-all duration-500 rounded-full"
                    style={{ width: `${calculateWeightedProgress(formData.tahapan)}%` }}
                  />
                </div>
              </div>

              {/* Financial Progress */}
              {nilaiKontrak > 0 && (
                <div className="p-3 sm:p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                      <Banknote className="h-4 w-4 text-indigo-600" />
                      Ringkasan Keuangan
                    </h3>
                    {terlambatCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                        <AlertTriangle className="h-3 w-3" />
                        {terlambatCount} Terlambat Bayar
                      </span>
                    )}
                  </div>

                  {/* Stat Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Nilai Kontrak */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-1">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Nilai Kontrak</p>
                      <p className="text-sm font-bold text-gray-800 leading-tight truncate">{formatRupiah(nilaiKontrak)}</p>
                      <p className="text-[10px] text-gray-400">100%</p>
                    </div>

                    {/* Ditagih */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 space-y-1">
                      <p className="text-[10px] font-medium text-indigo-500 uppercase tracking-wide">Ditagih</p>
                      <p className="text-sm font-bold text-indigo-800 leading-tight truncate">{formatRupiah(totalDitagih)}</p>
                      <p className="text-[10px] text-indigo-400">{pctDitagih.toFixed(1)}%</p>
                    </div>

                    {/* Diterima */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 space-y-1">
                      <p className="text-[10px] font-medium text-green-600 uppercase tracking-wide">Diterima</p>
                      <p className="text-sm font-bold text-green-800 leading-tight truncate">{formatRupiah(totalTerbayar)}</p>
                      <p className="text-[10px] text-green-500">{pctTerbayar.toFixed(1)}%</p>
                    </div>

                    {/* Piutang / Belum Ditagih */}
                    {sisaPiutang > 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-1">
                        <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">Piutang</p>
                        <p className="text-sm font-bold text-amber-800 leading-tight truncate">{formatRupiah(sisaPiutang)}</p>
                        <p className="text-[10px] text-amber-500">{pctPiutang.toFixed(1)}%</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1">
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Belum Ditagih</p>
                        <p className="text-sm font-bold text-slate-700 leading-tight truncate">{formatRupiah(belumDitagih)}</p>
                        <p className="text-[10px] text-slate-400">{(100 - pctDitagih).toFixed(1)}%</p>
                      </div>
                    )}
                  </div>

                  {/* Stacked Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Tagihan vs Kontrak</span>
                      <span>{pctDitagih.toFixed(1)}% ditagih · {pctTerbayar.toFixed(1)}% diterima</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${pctTerbayar}%` }}
                      />
                      <div
                        className="h-full bg-indigo-400 transition-all duration-500"
                        style={{ width: `${Math.max(pctDitagih - pctTerbayar, 0)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Diterima</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />Ditagih (belum lunas)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Vertical Timeline */}
            <div className="relative">
              {/* Timeline Items - Sorted by nomor */}
              <div className="space-y-6">
                {[...formData.tahapan].sort((a, b) => (a.nomor || 0) - (b.nomor || 0)).map((t, idx, arr) => {
                  // Check if overdue
                  const today = new Date();
                  const deadline = new Date(t.tanggalSelesai);
                  const isOverdue = t.status !== 'done' && deadline < today;

                  const statusConfig = {
                    pending: {
                      icon: Circle,
                      dotColor: 'bg-gray-400',
                      cardBg: 'bg-gray-50',
                      cardBorder: 'border-gray-300',
                      titleColor: 'text-gray-700',
                      badgeBg: 'bg-gray-100',
                      badgeText: 'text-gray-700',
                      yearBg: 'bg-gray-100',
                      yearBorder: 'border-gray-300',
                      yearText: 'text-gray-700'
                    },
                    progress: {
                      icon: Circle,
                      dotColor: 'bg-[#5B8DB8]',
                      cardBg: 'bg-blue-50',
                      cardBorder: 'border-[#5B8DB8]',
                      titleColor: 'text-[#2F5F8C]',
                      badgeBg: 'bg-[#5B8DB8]',
                      badgeText: 'text-white',
                      yearBg: 'bg-blue-100',
                      yearBorder: 'border-[#5B8DB8]',
                      yearText: 'text-[#2F5F8C]'
                    },
                    done: {
                      icon: CheckCircle2,
                      dotColor: 'bg-[#416F39]',
                      cardBg: 'bg-green-50',
                      cardBorder: 'border-[#416F39]',
                      titleColor: 'text-[#416F39]',
                      badgeBg: 'bg-[#416F39]',
                      badgeText: 'text-white',
                      yearBg: 'bg-green-100',
                      yearBorder: 'border-[#416F39]',
                      yearText: 'text-[#416F39]'
                    },
                    overdue: {
                      icon: AlertCircle,
                      dotColor: 'bg-red-500',
                      cardBg: 'bg-red-50',
                      cardBorder: 'border-red-400',
                      titleColor: 'text-red-700',
                      badgeBg: 'bg-red-500',
                      badgeText: 'text-white',
                      yearBg: 'bg-red-100',
                      yearBorder: 'border-red-400',
                      yearText: 'text-red-700'
                    }
                  };
                  const config = isOverdue ? statusConfig.overdue : statusConfig[t.status];
                  const StatusIcon = config.icon;

                  return (
                    <div key={t.id} className="relative flex gap-2 sm:gap-4">
                      {/* Vertical Line Segment (not for last item) */}
                      {idx !== arr.length - 1 && (
                        <div className="absolute left-[30px] sm:left-[44px] top-10 sm:top-12 bottom-[-24px] w-0.5 bg-[#416F39] z-0"></div>
                      )}

                      {/* Left: Number Box */}
                      <div className="flex flex-col items-center gap-2 flex-shrink-0 relative z-10">
                        <div className={`w-[60px] sm:w-[88px] h-10 sm:h-12 ${config.yearBg} ${config.yearBorder} border-2 rounded-lg flex items-center justify-center shadow-sm`}>
                          <span className={`text-lg sm:text-xl font-bold ${config.yearText}`}>
                            {t.nomor || idx + 1}
                          </span>
                        </div>
                      </div>

                      {/* Right: Content Card */}
                      <div className="flex-1 min-w-0">
                        {tahapanManagement.editingTahapanId === t.id ? (() => {
                          /* =========== EDIT MODE =========== */
                          const ed = tahapanManagement.editTahapanData!;
                          const editBobot = ed.bobot || 0;
                          const anggaranTahapan = nilaiKontrak > 0 ? Math.round((editBobot / 100) * nilaiKontrak) : 0;
                          const totalInvTahapan = (ed.invoices || []).reduce((s: number, i: any) => s + (i.nilaiInvoice || 0), 0);
                          const pctInvTagih = anggaranTahapan > 0 ? Math.min((totalInvTahapan / anggaranTahapan) * 100, 100) : 0;
                          const invStatusCls: Record<string, string> = {
                            'lunas': 'bg-green-100 text-green-700',
                            'Menunggu Bayar': 'bg-yellow-100 text-yellow-700',
                            'Terlambat Bayar': 'bg-red-100 text-red-700',
                            'Belum Tagih': 'bg-gray-100 text-gray-600',
                          };
                          return (
                            <div className="bg-white border-2 border-blue-300 rounded-xl shadow-md overflow-hidden">
                              {/* Card Header */}
                              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700 flex-shrink-0">
                                    {t.nomor || idx + 1}
                                  </div>
                                  <span className="font-semibold text-gray-900 text-sm truncate">
                                    {ed.nama || t.nama}
                                  </span>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <Button type="button" size="sm" variant="outline"
                                    className="h-8 text-green-700 border-green-300 hover:bg-green-50"
                                    onClick={() => tahapanManagement.handleSaveEditTahapan()}>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Simpan
                                  </Button>
                                  <Button type="button" size="sm" variant="outline"
                                    className="h-8 text-red-600 border-red-300 hover:bg-red-50"
                                    onClick={() => tahapanManagement.handleCancelEditTahapan()}>
                                    <X className="h-3.5 w-3.5 mr-1.5" /> Batal
                                  </Button>
                                </div>
                              </div>

                              {/* INFO DASAR */}
                              <div className="px-4 py-4 border-b space-y-3">
                                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Info Dasar</p>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Nomor urut</Label>
                                    <Input type="number" min="1" className="h-9"
                                      value={ed.nomor || ''}
                                      onChange={(e) => tahapanManagement.setEditTahapanData({ ...ed, nomor: Number(e.target.value) })} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Nama tahapan</Label>
                                    <Input className="h-9" value={ed.nama || ''}
                                      onChange={(e) => tahapanManagement.setEditTahapanData({ ...ed, nama: e.target.value })} />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Deskripsi</Label>
                                  <textarea rows={2}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                    placeholder="Deskripsi tahapan..."
                                    value={ed.deskripsi || ''}
                                    onChange={(e) => tahapanManagement.setEditTahapanData({ ...ed, deskripsi: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Bobot Pekerjaan (%)</Label>
                                    <Input type="number" min="0" max="100" step="0.1" className="h-9"
                                      value={ed.bobot || ''}
                                      onChange={(e) => tahapanManagement.setEditTahapanData({ ...ed, bobot: Number(e.target.value) })} />
                                    <p className="text-[10px] text-gray-400">Kontribusi thd. progress keseluruhan</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Progress (%)</Label>
                                    <Input type="number" min="0" max="100" className="h-9"
                                      value={ed.progress ?? ''}
                                      onChange={(e) => tahapanManagement.setEditTahapanData({ ...ed, progress: Math.min(100, Math.max(0, Number(e.target.value))) })} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Status</Label>
                                    <Select value={ed.status || 'pending'}
                                      onValueChange={(v: any) => tahapanManagement.setEditTahapanData({ ...ed, status: v })}>
                                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="progress">In Progress</SelectItem>
                                        <SelectItem value="done">Selesai</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Tanggal mulai</Label>
                                    <Input type="date" className="h-9"
                                      value={formatDateInput(ed.tanggalMulai || new Date())}
                                      onChange={(e) => tahapanManagement.setEditTahapanData({ ...ed, tanggalMulai: new Date(e.target.value) })} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Tanggal selesai (rencana)</Label>
                                    <Input type="date" className="h-9"
                                      value={formatDateInput(ed.tanggalSelesai || new Date())}
                                      onChange={(e) => tahapanManagement.setEditTahapanData({ ...ed, tanggalSelesai: new Date(e.target.value) })} />
                                  </div>
                                  {/* Progress bar preview */}
                                  <div className="flex flex-col justify-end pb-0.5 space-y-1">
                                    <div className="flex justify-between text-[10px] text-gray-500">
                                      <span>Preview progress</span>
                                      <span className="font-semibold text-gray-700">{ed.progress ?? 0}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#416F39] rounded-full transition-all"
                                        style={{ width: `${ed.progress ?? 0}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* ANGGARAN TAHAPAN */}
                              {nilaiKontrak > 0 && (
                                <div className="px-4 py-4 border-b space-y-3">
                                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Anggaran Tahapan</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Nilai kontrak total (Rp)</Label>
                                      <Input className="h-9 bg-gray-50 text-gray-600" value={nilaiKontrak.toLocaleString('id-ID')} disabled />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Anggaran tahapan ini (Rp)</Label>
                                      <Input className="h-9 bg-gray-50 text-gray-600" value={anggaranTahapan.toLocaleString('id-ID')} disabled />
                                      <p className="text-[11px] text-green-600">Dihitung otomatis dari bobot</p>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#416F39] rounded-full transition-all" style={{ width: `${pctInvTagih}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs mt-1.5 text-gray-500">
                                      <span>Total ditagih: {formatRupiah(totalInvTahapan)}</span>
                                      <span>{pctInvTagih.toFixed(0)}%</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* SUB-TAHAPAN */}
                              <div className="px-4 py-4 border-b space-y-3">
                                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Sub-Tahapan</p>
                                <div className="space-y-2">
                                  {(ed.subTahapan || []).map((sub: any) => (
                                    <div key={sub.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                                      <div className="flex items-center gap-2.5">
                                        <Checkbox checked={sub.status === 'done'}
                                          onCheckedChange={(checked) => tahapanManagement.setEditTahapanData({
                                            ...ed,
                                            subTahapan: ed.subTahapan!.map((s: any) => s.id === sub.id ? { ...s, status: checked ? 'done' : 'pending' } : s)
                                          })} />
                                        <span className={`text-sm ${sub.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>{sub.nama}</span>
                                      </div>
                                      <button type="button"
                                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 border border-gray-200 rounded hover:border-red-200 transition-colors"
                                        onClick={() => tahapanManagement.setEditTahapanData({
                                          ...ed, subTahapan: ed.subTahapan!.filter((s: any) => s.id !== sub.id)
                                        })}>
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <Input value={editSubTahapanInput} onChange={(e) => setEditSubTahapanInput(e.target.value)}
                                    placeholder="Tambah sub-tahapan..." className="h-9 text-sm"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (editSubTahapanInput.trim()) {
                                          tahapanManagement.setEditTahapanData({ ...ed, subTahapan: [...(ed.subTahapan || []), { id: Date.now().toString(), nama: editSubTahapanInput, status: 'pending' }] });
                                          setEditSubTahapanInput('');
                                        }
                                      }
                                    }} />
                                  <Button type="button" variant="outline" className="h-9 px-4 text-sm flex-shrink-0"
                                    onClick={() => {
                                      if (editSubTahapanInput.trim()) {
                                        tahapanManagement.setEditTahapanData({ ...ed, subTahapan: [...(ed.subTahapan || []), { id: Date.now().toString(), nama: editSubTahapanInput, status: 'pending' }] });
                                        setEditSubTahapanInput('');
                                      }
                                    }}>
                                    + Tambah
                                  </Button>
                                </div>
                              </div>

                              {/* INVOICE */}
                              <div className="px-4 py-4 border-b space-y-3">
                                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Invoice</p>
                                <div className="space-y-3">
                                  {(ed.invoices || []).map((inv: any) => {
                                    const sisa = (inv.nilaiInvoice || 0) - (inv.jumlahTerbayar || 0);
                                    return (
                                      <div key={inv.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b">
                                          <span className="text-sm font-semibold text-gray-800">{inv.nomorInvoice || 'Invoice'}</span>
                                          <div className="flex items-center gap-2">
                                            {inv.status && (
                                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${invStatusCls[inv.status] || invStatusCls['Belum Tagih']}`}>
                                                {inv.status}
                                              </span>
                                            )}
                                            <Button type="button" size="sm" variant="outline"
                                              className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                              onClick={() => tahapanManagement.setEditTahapanData({
                                                ...ed, invoices: (ed.invoices || []).filter((i: any) => i.id !== inv.id)
                                              })}>
                                              Hapus
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="p-3 space-y-3">
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                              <Label className="text-xs">Nomor invoice</Label>
                                              <Input className="h-9" value={inv.nomorInvoice || ''}
                                                onChange={(e) => tahapanManagement.setEditTahapanData({
                                                  ...ed, invoices: (ed.invoices || []).map((i: any) => i.id === inv.id ? { ...i, nomorInvoice: e.target.value } : i)
                                                })} />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">Tanggal terbit</Label>
                                              <Input type="date" className="h-9"
                                                value={inv.tanggalTerbit ? formatDateInput(inv.tanggalTerbit) : ''}
                                                onChange={(e) => tahapanManagement.setEditTahapanData({
                                                  ...ed, invoices: (ed.invoices || []).map((i: any) => i.id === inv.id ? { ...i, tanggalTerbit: e.target.value ? new Date(e.target.value) : undefined } : i)
                                                })} />
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                              <Label className="text-xs">Jatuh tempo</Label>
                                              <Input type="date" className="h-9"
                                                value={inv.jatuhTempo ? formatDateInput(inv.jatuhTempo) : ''}
                                                onChange={(e) => tahapanManagement.setEditTahapanData({
                                                  ...ed, invoices: (ed.invoices || []).map((i: any) => i.id === inv.id ? { ...i, jatuhTempo: e.target.value ? new Date(e.target.value) : undefined } : i)
                                                })} />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">Status</Label>
                                              <Select value={inv.status || 'Belum Tagih'}
                                                onValueChange={(v) => tahapanManagement.setEditTahapanData({
                                                  ...ed, invoices: (ed.invoices || []).map((i: any) => i.id === inv.id ? { ...i, status: v } : i)
                                                })}>
                                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="Belum Tagih">🔲 Belum Tagih</SelectItem>
                                                  <SelectItem value="Menunggu Bayar">⏳ Menunggu Bayar</SelectItem>
                                                  <SelectItem value="lunas">✅ Lunas</SelectItem>
                                                  <SelectItem value="Terlambat Bayar">⚠️ Terlambat Bayar</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                              <Label className="text-xs">Nilai invoice (Rp)</Label>
                                              <Input type="number" className="h-9" placeholder="0" value={inv.nilaiInvoice || ''}
                                                onChange={(e) => tahapanManagement.setEditTahapanData({
                                                  ...ed, invoices: (ed.invoices || []).map((i: any) => i.id === inv.id ? { ...i, nilaiInvoice: Number(e.target.value) } : i)
                                                })} />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">Jumlah terbayar (Rp)</Label>
                                              <Input type="number" className="h-9" placeholder="0" value={inv.jumlahTerbayar || ''}
                                                onChange={(e) => tahapanManagement.setEditTahapanData({
                                                  ...ed, invoices: (ed.invoices || []).map((i: any) => i.id === inv.id ? { ...i, jumlahTerbayar: Number(e.target.value) } : i)
                                                })} />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">Sisa tagihan (Rp)</Label>
                                              <Input type="number" className="h-9 bg-gray-50 text-gray-500" value={sisa} disabled />
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Catatan</Label>
                                            <Input className="h-9" placeholder="Catatan invoice..." value={inv.catatan || ''}
                                              onChange={(e) => tahapanManagement.setEditTahapanData({
                                                ...ed, invoices: (ed.invoices || []).map((i: any) => i.id === inv.id ? { ...i, catatan: e.target.value } : i)
                                              })} />
                                          </div>

                                          {/* Dokumen invoice */}
                                          <div className="space-y-2 pt-1 border-t border-gray-100">
                                            <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                                              <FileText className="h-3.5 w-3.5" /> Dokumen Invoice
                                            </Label>
                                            {(inv.files || []).length > 0 && (
                                              <div className="flex flex-wrap gap-1.5">
                                                {(inv.files || []).map((file: string, fi: number) => (
                                                  <div key={fi} className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-1">
                                                    <FileIcon fileName={file} className="h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
                                                    <span className="text-[11px] text-indigo-700 max-w-[140px] truncate">{file.split('/').pop()}</span>
                                                    <button type="button"
                                                      className="ml-0.5 text-indigo-400 hover:text-red-500 transition-colors"
                                                      onClick={() => tahapanManagement.setEditTahapanData({
                                                        ...ed, invoices: (ed.invoices || []).map((i: any) =>
                                                          i.id === inv.id
                                                            ? { ...i, files: (i.files || []).filter((_: string, idx: number) => idx !== fi) }
                                                            : i
                                                        )
                                                      })}>
                                                      <X className="h-3 w-3" />
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            <div>
                                              <input
                                                id={`inv-file-${inv.id}`}
                                                type="file"
                                                multiple
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const newFiles = Array.from(e.target.files || []).map(f => f.name);
                                                  tahapanManagement.setEditTahapanData({
                                                    ...ed, invoices: (ed.invoices || []).map((i: any) =>
                                                      i.id === inv.id
                                                        ? { ...i, files: [...(i.files || []), ...newFiles] }
                                                        : i
                                                    )
                                                  });
                                                  e.target.value = '';
                                                }}
                                              />
                                              <Button type="button" variant="outline" size="sm"
                                                className="h-8 text-xs text-gray-600 border-dashed"
                                                onClick={() => document.getElementById(`inv-file-${inv.id}`)?.click()}>
                                                <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload dokumen
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <Button type="button" variant="outline" className="w-full h-10 text-sm border-dashed"
                                  onClick={() => tahapanManagement.setEditTahapanData({
                                    ...ed, invoices: [...(ed.invoices || []), {
                                      id: Date.now().toString(), nomorInvoice: '', status: 'Belum Tagih', nilaiInvoice: 0, jumlahTerbayar: 0, catatan: ''
                                    }]
                                  })}>
                                  + Tambah invoice
                                </Button>
                              </div>

                              {/* DOKUMEN PENDUKUNG */}
                              <div className="px-4 py-4 space-y-3">
                                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Dokumen Pendukung</p>
                                {t.files && t.files.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {t.files.map((file, fileIdx) => (
                                      <div key={fileIdx} className="group flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 hover:border-gray-300 transition-colors">
                                        <FileIcon fileName={file} className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-xs text-gray-700 max-w-[120px] truncate">{file.split('/').pop()}</span>
                                        <button type="button"
                                          className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                                          onClick={() => removeExistingTahapanFile(idx, file)}>
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div>
                                  <Input id={`tahapan-file-${idx}`} type="file" multiple onChange={(e) => handleExistingTahapanFileUpload(idx, e)} className="hidden" />
                                  <Button type="button" variant="outline" className="h-9 text-sm"
                                    onClick={() => document.getElementById(`tahapan-file-${idx}`)?.click()}>
                                    <Upload className="h-3.5 w-3.5 mr-2" /> Upload dokumen
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })() : (
                          /* =========== VIEW MODE =========== */
                          <div className={`${config.cardBg} border-2 ${config.cardBorder} rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all`}>
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3 mb-3">
                              <div className="flex-1 min-w-0 w-full">
                                <>
                                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <h4 className={`font-bold ${config.titleColor} text-sm sm:text-base truncate`}>{t.nama}</h4>
                                    {t.adendum && t.adendum.length > 0 && (
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1 text-[10px] px-2">
                                        <FilePlus className="h-3 w-3" />
                                        {t.adendum.length > 1 ? `${t.adendum.length} Adendum` : 'Adendum'}
                                      </Badge>
                                    )}
                                    <span className={`px-2.5 py-1 ${config.badgeBg} ${config.badgeText} rounded-full text-xs font-semibold flex items-center gap-1`}>
                                      {isOverdue && <AlertTriangle className="h-3.5 w-3.5" />}
                                      {!isOverdue && t.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                                      {!isOverdue && t.status === 'progress' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                      {!isOverdue && t.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                      {isOverdue ? 'Terlambat' : t.status === 'pending' ? 'Menunggu' : t.status === 'progress' ? 'In Progress' : 'Selesai'}
                                    </span>
                                  </div>

                                  <div className="overflow-hidden border rounded-lg bg-white/50">
                                    <table className="w-full text-xs sm:text-sm text-left">
                                      <tbody className="divide-y divide-gray-100">
                                        {t.subTahapan && t.subTahapan.length > 0 && (
                                          <tr>
                                            <th className="w-[120px] sm:w-[150px] px-3 py-2 font-semibold text-gray-600 bg-gray-50/50 align-top">Sub-Tahapan</th>
                                            <td className="px-3 py-2">
                                              <div className="space-y-1.5">
                                                {t.subTahapan.map((sub, sIdx) => (
                                                  <div key={sub.id || sIdx} className="flex items-start gap-2 text-xs text-gray-700">
                                                    {sub.status === 'done' ? (
                                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                      <Circle className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <span className={sub.status === 'done' ? 'line-through text-gray-400' : ''}>
                                                      {sub.nama}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                        <tr>
                                          <th className="w-[120px] sm:w-[150px] px-3 py-2 font-semibold text-gray-600 bg-gray-50/50 align-top">Bobot</th>
                                          <td className="px-3 py-2">{t.bobot}%</td>
                                        </tr>
                                        <tr>
                                          <th className="px-3 py-2 font-semibold text-gray-600 bg-gray-50/50 align-top">Waktu Pelaksanaan</th>
                                          <td className="px-3 py-2">
                                            <div className="flex flex-wrap items-center gap-1">
                                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                              <span>{formatDate(t.tanggalMulai)}</span>
                                              <span className="text-gray-400">-</span>
                                              <span className={`${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                                                {formatDate(t.tanggalSelesai)}
                                              </span>
                                              {isOverdue && (
                                                <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm font-medium">
                                                  Terlewat
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                        {t.deskripsi && (
                                          <tr>
                                            <th className="px-3 py-2 font-semibold text-gray-600 bg-gray-50/50 align-top">Deskripsi</th>
                                            <td className="px-3 py-2 italic text-gray-700">{t.deskripsi}</td>
                                          </tr>
                                        )}
                                        {t.paguAnggaran && (
                                          <tr>
                                            <th className="px-3 py-2 font-semibold text-gray-600 bg-gray-50/50 align-top">Anggaran</th>
                                            <td className="px-3 py-2 font-medium text-green-700">
                                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(t.paguAnggaran)}
                                            </td>
                                          </tr>
                                        )}
                                        {t.adendum && t.adendum.length > 0 && (
                                          <tr>
                                            <th className="px-3 py-2 font-semibold text-gray-600 bg-gray-50/50 align-top">Riwayat Adendum</th>
                                            <td className="px-3 py-2">
                                              <div className="space-y-2">
                                                {t.adendum.map((ad) => (
                                                  <div key={ad.id} className="bg-yellow-50/50 p-2 rounded-md text-xs space-y-1 border border-yellow-100/50">
                                                    <div className="flex justify-between items-start">
                                                      <span className="font-medium text-gray-900">{formatDate(ad.tanggal)}</span>
                                                      {!viewMode && (
                                                        <button
                                                          onClick={() => tahapanManagement.handleDeleteAdendum(t.id, ad.id)}
                                                          className="text-red-400 hover:text-red-600"
                                                          title="Hapus Adendum"
                                                        >
                                                          <X className="h-3 w-3" />
                                                        </button>
                                                      )}
                                                    </div>
                                                    <p className="text-gray-700">{ad.keterangan}</p>
                                                    {ad.files && ad.files.length > 0 && (
                                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {ad.files.map((f, fIdx) => (
                                                          <a key={fIdx} href={f} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-white border border-yellow-200 px-1.5 py-0.5 rounded text-[10px] text-blue-600 hover:underline">
                                                            <FileText className="h-2.5 w-2.5" />
                                                            Dokumen {fIdx + 1}
                                                          </a>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Invoice & Pembayaran Block */}
                                  {(() => {
                                    const nilaiKontrakTahapan = nilaiKontrak > 0 ? (t.bobot / 100) * nilaiKontrak : null;
                                    const hasNewInvoices = t.invoices && t.invoices.length > 0;
                                    const hasLegacyInvoice = !hasNewInvoices && (t.jumlahTagihanInvoice || t.statusPembayaran || t.tanggalInvoice);
                                    if (!hasNewInvoices && !hasLegacyInvoice && !nilaiKontrakTahapan) return null;

                                    const statusMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
                                      'lunas': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
                                      'Menunggu Bayar': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
                                      'Terlambat Bayar': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
                                      'Belum Tagih': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
                                    };

                                    return (
                                      <div className="mt-3 space-y-2">
                                        {/* Section header + nilai kontrak tahapan */}
                                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                                          <h5 className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                                            <Banknote className="h-3.5 w-3.5 text-indigo-500" />
                                            Invoice &amp; Pembayaran
                                          </h5>
                                          {nilaiKontrakTahapan !== null && (
                                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                                              Nilai Tahapan: {formatRupiah(nilaiKontrakTahapan)} ({t.bobot}%)
                                            </span>
                                          )}
                                        </div>

                                        {/* New invoices[] display */}
                                        {hasNewInvoices && t.invoices!.map((inv) => {
                                          const sty = statusMap[inv.status] ?? statusMap['Belum Tagih'];
                                          const sisa = Math.max((inv.nilaiInvoice || 0) - (inv.jumlahTerbayar || 0), 0);
                                          return (
                                            <div key={inv.id} className={`rounded-lg border ${sty.border} ${sty.bg} p-2.5 space-y-2`}>
                                              {/* Invoice header row */}
                                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-1.5">
                                                  <FileText className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                                                  <span className="text-xs font-semibold text-gray-800">{inv.nomorInvoice || '—'}</span>
                                                </div>
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sty.bg} ${sty.text} ${sty.border}`}>
                                                  <span className={`w-1.5 h-1.5 rounded-full ${sty.dot}`} />
                                                  {inv.status}
                                                </span>
                                              </div>
                                              {/* Amounts grid */}
                                              <div className="grid grid-cols-3 gap-1.5 text-center">
                                                <div className="bg-white/70 rounded-md p-1.5 border border-white">
                                                  <p className="text-[9px] text-gray-500 mb-0.5">Nilai Invoice</p>
                                                  <p className="text-[11px] font-bold text-indigo-700 leading-tight truncate">{formatRupiah(inv.nilaiInvoice || 0)}</p>
                                                </div>
                                                <div className="bg-white/70 rounded-md p-1.5 border border-white">
                                                  <p className="text-[9px] text-gray-500 mb-0.5">Terbayar</p>
                                                  <p className="text-[11px] font-bold text-green-700 leading-tight truncate">{formatRupiah(inv.jumlahTerbayar || 0)}</p>
                                                </div>
                                                <div className="bg-white/70 rounded-md p-1.5 border border-white">
                                                  <p className="text-[9px] text-gray-500 mb-0.5">Sisa</p>
                                                  <p className={`text-[11px] font-bold leading-tight truncate ${sisa > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{formatRupiah(sisa)}</p>
                                                </div>
                                              </div>
                                              {/* Dates + catatan */}
                                              {(inv.tanggalTerbit || inv.jatuhTempo || inv.catatan) && (
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-500 pt-1 border-t border-white/60">
                                                  {inv.tanggalTerbit && <span>Terbit: <span className="text-gray-700 font-medium">{formatDate(inv.tanggalTerbit)}</span></span>}
                                                  {inv.jatuhTempo && <span>Jatuh Tempo: <span className="text-gray-700 font-medium">{formatDate(inv.jatuhTempo)}</span></span>}
                                                  {inv.catatan && <span className="italic text-gray-500">{inv.catatan}</span>}
                                                </div>
                                              )}
                                              {/* Dokumen invoice */}
                                              {inv.files && inv.files.length > 0 && (
                                                <div className="pt-1.5 border-t border-white/60 space-y-1">
                                                  <p className="text-[10px] font-semibold text-gray-500">Dokumen</p>
                                                  <div className="flex flex-wrap gap-1.5">
                                                    {inv.files.map((f, fi) => (
                                                      <a key={fi} href={f} target="_blank" rel="noreferrer"
                                                        className="flex items-center gap-1 bg-white/80 border border-white hover:border-indigo-300 px-2 py-1 rounded text-[10px] text-indigo-700 hover:text-indigo-900 transition-colors">
                                                        <FileText className="h-3 w-3 flex-shrink-0" />
                                                        <span className="max-w-[120px] truncate">{f.split('/').pop() || `Dok ${fi + 1}`}</span>
                                                      </a>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}

                                        {/* Legacy invoice fallback */}
                                        {hasLegacyInvoice && (() => {
                                          const legSty = statusMap[t.statusPembayaran ?? 'Belum Tagih'] ?? statusMap['Belum Tagih'];
                                          return (
                                            <div className={`rounded-lg border ${legSty.border} ${legSty.bg} p-2.5`}>
                                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                                {t.jumlahTagihanInvoice ? (
                                                  <>
                                                    <span className="text-gray-500">Jumlah Tagihan</span>
                                                    <span className="font-semibold text-indigo-700">{formatRupiah(t.jumlahTagihanInvoice)}</span>
                                                  </>
                                                ) : null}
                                                {t.tanggalInvoice && (
                                                  <>
                                                    <span className="text-gray-500">Tanggal Invoice</span>
                                                    <span className="text-gray-700">{formatDate(t.tanggalInvoice)}</span>
                                                  </>
                                                )}
                                                {t.invoiceNote && (
                                                  <>
                                                    <span className="text-gray-500">Catatan</span>
                                                    <span className="italic text-gray-600">{t.invoiceNote}</span>
                                                  </>
                                                )}
                                                {t.statusPembayaran && (
                                                  <>
                                                    <span className="text-gray-500">Status</span>
                                                    <span className={`font-semibold ${legSty.text}`}>{t.statusPembayaran}</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    );
                                  })()}
                                </>
                              </div>

                              {/* Actions */}
                              {!viewMode && (
                                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                                  {tahapanManagement.editingTahapanId === t.id ? (
                                    // Edit mode buttons
                                    <>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 sm:h-8 hover:bg-green-50"
                                        onClick={() => tahapanManagement.handleSaveEditTahapan()}
                                        title="Simpan"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 mr-1" />
                                        Simpan
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 sm:h-8 hover:bg-red-50"
                                        onClick={() => tahapanManagement.handleCancelEditTahapan()}
                                        title="Batal"
                                      >
                                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 mr-1" />
                                        Batal
                                      </Button>
                                    </>
                                  ) : (
                                    // Normal mode buttons
                                    <>
                                      {/* Tombol Naik */}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0"
                                        onClick={() => tahapanManagement.handleMoveTahapanUp(t.id)}
                                        disabled={idx === 0}
                                        title="Pindah ke Atas"
                                      >
                                        <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                      {/* Tombol Turun */}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0"
                                        onClick={() => tahapanManagement.handleMoveTahapanDown(t.id)}
                                        disabled={idx === formData.tahapan.length - 1}
                                        title="Pindah ke Bawah"
                                      >
                                        <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-blue-50 hover:text-blue-600 flex-shrink-0"
                                        onClick={() => tahapanManagement.handleEditTahapan(t)}
                                        title="Edit Tahapan"
                                      >
                                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-yellow-50 hover:text-yellow-600 flex-shrink-0"
                                        onClick={() => handleOpenAdendumDialog(t.id)}
                                        title="Tambah Adendum"
                                      >
                                        <FilePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                                        onClick={() => {
                                          // Hapus tahapan dan atur ulang nomor urut
                                          const updatedTahapan = formData.tahapan
                                            .filter((tahapan) => tahapan.id !== t.id)
                                            .map((tahapan, index) => ({
                                              ...tahapan,
                                              nomor: index + 1
                                            }));

                                          setFormData({
                                            ...formData,
                                            tahapan: updatedTahapan
                                          });
                                          toast.success('Tahapan berhasil dihapus dan urutan disesuaikan');
                                        }}
                                        title="Hapus Tahapan"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Files Section */}
                            {t.files && t.files.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5 sm:gap-2">
                                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  Dokumen ({t.files.length})
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {t.files.map((file, fileIdx) => {
                                    const fileName = file.split('/').pop() || '';
                                    return (
                                      <div key={fileIdx} className="group flex items-center justify-between gap-2 p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <FileIcon fileName={file} className="h-4 w-4 flex-shrink-0" />
                                          <span className="text-xs font-medium text-gray-700 truncate">
                                            {fileName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => fileManagement.handleDownloadFile(file)}
                                            title="Download"
                                          >
                                            <Download className="h-3.5 w-3.5 text-[#2F5F8C]" />
                                          </Button>
                                          {!viewMode && (
                                            <button
                                              type="button"
                                              className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                              onClick={() => removeExistingTahapanFile(idx, file)}
                                              title="Hapus"
                                            >
                                              <X className="h-3.5 w-3.5 text-red-500 hover:text-red-700" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Upload Button */}
                            {!viewMode && (
                              <div className="mt-3">
                                <Input
                                  id={`tahapan-file-${idx}`}
                                  type="file"
                                  multiple
                                  onChange={(e) => handleExistingTahapanFileUpload(idx, e)}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs border-dashed hover:border-solid"
                                  onClick={() => document.getElementById(`tahapan-file-${idx}`)?.click()}
                                >
                                  <>
                                    <Upload className="h-3.5 w-3.5 mr-2" />
                                    Upload Dokumen
                                  </>
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </TabsContent >
  );
}