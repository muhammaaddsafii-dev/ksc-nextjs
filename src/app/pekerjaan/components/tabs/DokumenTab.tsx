'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Download, Upload, Trash2, MapPin, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FormData } from '../../hooks/useFormManagement';
import { toast } from 'sonner';
import { dokumenPekerjaanService, DokumenPekerjaanAPI } from '@/services/pekerjaan.service';

const AoiMapViewer = dynamic(() => import('./AoiMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-72 rounded-lg border bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">Memuat peta…</p>
    </div>
  ),
});

type JenisDokumen =
  | 'dokumen_tender'
  | 'dokumen_administrasi'
  | 'dokumen_teknis'
  | 'dokumen_penawaran'
  | 'dokumen_pekerjaan'
  | 'dokumen_spasial';

interface SectionConfig {
  jenis: JenisDokumen;
  label: string;
  color: { bg: string; icon: string; header: string };
}

const TENDER_SECTIONS: SectionConfig[] = [
  { jenis: 'dokumen_tender',       label: 'Dokumen Tender',        color: { bg: 'bg-[#D4E4F0]', icon: 'text-[#2F5F8C]', header: 'bg-[#E8F0F7]' } },
  { jenis: 'dokumen_administrasi', label: 'Dokumen Administrasi',  color: { bg: 'bg-[#D8E9D5]', icon: 'text-[#416F39]', header: 'bg-[#E8F2E6]' } },
  { jenis: 'dokumen_teknis',       label: 'Dokumen Teknis',        color: { bg: 'bg-[#FFE8D1]', icon: 'text-[#A67039]', header: 'bg-[#FFF3E8]' } },
  { jenis: 'dokumen_penawaran',    label: 'Dokumen Penawaran',     color: { bg: 'bg-[#E8D9F0]', icon: 'text-[#6F5485]', header: 'bg-[#F3EBF7]' } },
  { jenis: 'dokumen_pekerjaan',    label: 'Dokumen Pekerjaan',     color: { bg: 'bg-amber-100',  icon: 'text-amber-700', header: 'bg-amber-50'  } },
];

const NON_TENDER_SECTIONS: SectionConfig[] = [
  { jenis: 'dokumen_pekerjaan', label: 'Dokumen Pekerjaan', color: { bg: 'bg-amber-100', icon: 'text-amber-700', header: 'bg-amber-50' } },
];


interface DokumenTabProps {
  formData: FormData;
  viewMode: boolean;
  pekerjaanId?: string;
}

export function DokumenTab({ formData, viewMode, pekerjaanId }: DokumenTabProps) {
  const [docs, setDocs] = useState<DokumenPekerjaanAPI[]>([]);
  const [activeUploadSection, setActiveUploadSection] = useState<JenisDokumen | null>(null);
  const [uploadKeterangan, setUploadKeterangan] = useState('');
  const [uploadTanggalBerlaku, setUploadTanggalBerlaku] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingAoi, setUploadingAoi] = useState(false);

  useEffect(() => {
    if (!pekerjaanId) {
      setDocs([]);
      return;
    }
    dokumenPekerjaanService.getByPekerjaan(pekerjaanId).then(setDocs).catch(() => {});
  }, [pekerjaanId]);

  const sections = formData.tenderType === 'tender' ? TENDER_SECTIONS : NON_TENDER_SECTIONS;

  const handleUpload = async (jenis: JenisDokumen, files: FileList) => {
    if (!pekerjaanId) {
      toast.error('Simpan pekerjaan terlebih dahulu untuk mengupload dokumen');
      return;
    }
    setUploading(true);
    try {
      const uploaded: DokumenPekerjaanAPI[] = [];
      for (const file of Array.from(files)) {
        const result = await dokumenPekerjaanService.upload(
          pekerjaanId,
          file.name,
          uploadKeterangan,
          file,
          file.name,
          jenis,
          uploadTanggalBerlaku || undefined,
        );
        uploaded.push(result);
      }
      setDocs(prev => [...prev, ...uploaded]);
      setUploadKeterangan('');
      setUploadTanggalBerlaku('');
      setActiveUploadSection(null);
      toast.success(`${files.length} dokumen berhasil diupload`);
    } catch {
      toast.error('Gagal mengupload dokumen');
    } finally {
      setUploading(false);
    }
  };

  const handleAoiUpload = async (file: File) => {
    if (!pekerjaanId) {
      toast.error('Simpan pekerjaan terlebih dahulu untuk mengupload file AOI');
      return;
    }
    setUploadingAoi(true);
    try {
      const existing = docs.find(d => d.jenis_dokumen === 'dokumen_spasial');
      if (existing) {
        await dokumenPekerjaanService.delete(existing.id);
        setDocs(prev => prev.filter(d => d.id !== existing.id));
      }
      const result = await dokumenPekerjaanService.upload(
        pekerjaanId,
        file.name,
        '',
        file,
        file.name,
        'dokumen_spasial',
      );
      setDocs(prev => [...prev, result]);
      toast.success('File AOI berhasil diupload');
    } catch {
      toast.error('Gagal mengupload file AOI');
    } finally {
      setUploadingAoi(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dokumenPekerjaanService.delete(id);
      setDocs(prev => prev.filter(d => d.id !== id));
      toast.success('Dokumen dihapus');
    } catch {
      toast.error('Gagal menghapus dokumen');
    }
  };

  const renderSection = (section: SectionConfig) => {
    const sectionDocs = docs.filter(d => (d.jenis_dokumen || 'dokumen_pekerjaan') === section.jenis);
    const inputId = `upload-${section.jenis}`;
    const isUploadOpen = activeUploadSection === section.jenis;

    return (
      <div key={section.jenis}>
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className={`p-1.5 sm:p-2 ${section.color.bg} rounded-lg`}>
            <FileText className={`h-4 w-4 sm:h-5 sm:w-5 ${section.color.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm sm:text-base text-gray-900">{section.label}</h4>
            <p className="text-xs text-gray-500">{sectionDocs.length} dokumen</p>
          </div>
          <Badge variant="secondary" className="ml-auto flex-shrink-0">{sectionDocs.length}</Badge>
          {!viewMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-shrink-0 h-8 px-3 text-xs"
              onClick={() => {
                if (isUploadOpen) {
                  setActiveUploadSection(null);
                } else {
                  setActiveUploadSection(section.jenis);
                  setUploadKeterangan('');
                  setUploadTanggalBerlaku('');
                }
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Upload
            </Button>
          )}
        </div>

        {/* Upload panel */}
        {!viewMode && isUploadOpen && (
          <div className="border rounded-lg p-3 sm:p-4 bg-muted/30 space-y-3 mb-3">
            <p className="text-xs font-medium text-muted-foreground">
              Upload ke <span className="font-semibold">{section.label}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Keterangan</Label>
                <Textarea
                  value={uploadKeterangan}
                  onChange={(e) => setUploadKeterangan(e.target.value)}
                  placeholder="Tulis keterangan dokumen..."
                  rows={1}
                  className="resize-none text-sm h-9 min-h-[36px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tanggal Berlaku (opsional)</Label>
                <Input
                  type="date"
                  value={uploadTanggalBerlaku}
                  onChange={(e) => setUploadTanggalBerlaku(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            {!pekerjaanId && (
              <p className="text-xs text-amber-600">Simpan pekerjaan terlebih dahulu untuk mengupload dokumen.</p>
            )}
            <div>
              <Input
                id={inputId}
                type="file"
                multiple
                className="hidden"
                disabled={!pekerjaanId || uploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUpload(section.jenis, e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-dashed hover:border-solid"
                disabled={!pekerjaanId || uploading}
                onClick={() => document.getElementById(inputId)?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Mengupload...' : 'Pilih File & Upload'}
              </Button>
            </div>
          </div>
        )}

        {sectionDocs.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed rounded-lg bg-gray-50 mb-3">
            <FileText className="h-8 w-8 mx-auto mb-1 text-gray-300" />
            <p className="text-xs text-gray-400">Belum ada dokumen</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto mb-3">
            <table className="w-full min-w-[520px]">
              <thead className={section.color.header}>
                <tr>
                  <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-10">#</th>
                  <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama File</th>
                  <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm min-w-[120px]">Keterangan</th>
<th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sectionDocs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-2 sm:p-3 text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center gap-1.5">
                        <FileText className={`h-3.5 w-3.5 ${section.color.icon} flex-shrink-0`} />
                        <span className="text-xs sm:text-sm font-medium truncate max-w-[180px]">
                          {doc.nama}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 text-xs text-muted-foreground">
                      {doc.keterangan || <span className="italic opacity-50">—</span>}
                    </td>
<td className="p-2 sm:p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {doc.signed_file_url ? (
                          <a href={doc.signed_file_url} target="_blank" rel="noopener noreferrer">
                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        ) : (
                          <Button
                            type="button" variant="ghost" size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => toast.info('File belum tersedia')}
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!viewMode && (
                          <Button
                            type="button" variant="ghost" size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDelete(doc.id)}
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <TabsContent value="dokumen" className="space-y-6 px-3 sm:px-6 py-4 w-full overflow-x-hidden">

      {/* ── Dokumen sections ── */}
      <div className="space-y-4">
        {sections.map(renderSection)}
      </div>

      {/* ── AOI File ── */}
      {(() => {
        const aoiDoc = docs.find(d => d.jenis_dokumen === 'dokumen_spasial');
        return (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="p-1.5 sm:p-2 bg-[#E3F2FD] rounded-lg">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#1976D2]" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900">Area of Interest (AOI)</h4>
                <p className="text-xs text-gray-500">{aoiDoc ? 'File AOI terupload' : 'Belum ada file AOI'}</p>
              </div>
              {aoiDoc && <Badge variant="secondary">✓</Badge>}
            </div>

            {!aoiDoc ? (
              <div className="p-6 text-center border-2 border-dashed rounded-lg bg-gray-50">
                <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 mb-3">Belum ada file AOI (GeoJSON/KML/Shapefile)</p>
                {!viewMode && (
                  <>
                    <input
                      id="aoi-upload"
                      type="file"
                      accept=".geojson,.json,.kml,.shp,.zip"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { handleAoiUpload(file); e.target.value = ''; }
                      }}
                    />
                    <Button type="button" variant="outline" disabled={uploadingAoi}
                      onClick={() => document.getElementById('aoi-upload')?.click()}>
                      {uploadingAoi ? <><span className="animate-spin mr-2">⟳</span>Mengupload...</> : <><Upload className="h-4 w-4 mr-2" />Upload AOI</>}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Info file + aksi */}
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead className="bg-[#E3F2FD]">
                      <tr>
                        <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama File</th>
                        <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50">
                        <td className="p-2 sm:p-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[#1976D2] flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium truncate">{aoiDoc.nama}</span>
                          </div>
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {aoiDoc.signed_file_url && (
                              <a href={aoiDoc.signed_file_url} target="_blank" rel="noreferrer">
                                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </a>
                            )}
                            {!viewMode && (
                              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                                onClick={() => handleDelete(aoiDoc.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {!viewMode && (
                    <div className="p-2 border-t">
                      <input id="aoi-reupload" type="file" accept=".geojson,.json,.kml,.shp,.zip"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { handleAoiUpload(file); e.target.value = ''; }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" className="w-full border-dashed hover:border-solid"
                        disabled={uploadingAoi}
                        onClick={() => document.getElementById('aoi-reupload')?.click()}>
                        {uploadingAoi ? <><span className="animate-spin mr-2">⟳</span>Mengupload...</> : <><Upload className="h-4 w-4 mr-2" />Ganti File AOI</>}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Map viewer – hanya ditampilkan saat view mode */}
                {viewMode && aoiDoc.signed_file_url && (
                  <AoiMapViewer fileUrl={aoiDoc.signed_file_url} fileName={aoiDoc.nama} />
                )}
              </div>
            )}
          </div>
        );
      })()}
    </TabsContent>
  );
}
