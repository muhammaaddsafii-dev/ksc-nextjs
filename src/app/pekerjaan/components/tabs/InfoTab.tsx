import { TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FormData } from '../../hooks/useFormManagement';
import { formatDateInput } from '@/lib/helpers';

interface InfoTabProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  viewMode: boolean;
  selectedItem: any;
  lelangList: any[];
  praKontrakList: any[];
  onLoadFromSource: (type: 'lelang' | 'non-lelang', id: string) => void;
}

export function InfoTab({
  formData,
  setFormData,
  viewMode,
  selectedItem,
  lelangList,
  praKontrakList,
  onLoadFromSource
}: InfoTabProps) {
  const lelangMenang = lelangList.filter(l => l.status === 'menang');
  const praKontrakDeal = praKontrakList.filter(p => p.status === 'kontrak');

  return (
    <TabsContent value="info" className="space-y-4 px-4 sm:px-6 py-4">
      {/* Pilih Source Project - Hanya tampil saat create */}
      {!selectedItem && !viewMode && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Load dari Project Sebelumnya</h3>
          </div>
          <p className="text-sm text-blue-700">
            Pilih project lelang yang menang atau non-lelang yang sudah deal untuk mengisi data otomatis
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Project Lelang (Menang)</Label>
              <Select
                value={formData.sourceType === 'lelang' ? formData.sourceId : ''}
                onValueChange={(value) => onLoadFromSource('lelang', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih project lelang" />
                </SelectTrigger>
                <SelectContent>
                  {lelangMenang.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Tidak ada lelang yang menang
                    </SelectItem>
                  ) : (
                    lelangMenang.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.namaLelang} - {l.instansi}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Project Non-Lelang (Kontrak)</Label>
              <Select
                value={formData.sourceType === 'non-lelang' ? formData.sourceId : ''}
                onValueChange={(value) => onLoadFromSource('non-lelang', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih project non-lelang" />
                </SelectTrigger>
                <SelectContent>
                  {praKontrakDeal.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Tidak ada non-lelang yang deal
                    </SelectItem>
                  ) : (
                    praKontrakDeal.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.namaProyek} - {p.klien}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          {formData.sourceType && formData.sourceType !== 'manual' && (
            <div className="flex items-center gap-2 text-sm text-[#416F39] bg-[#E8F2E6] p-2 rounded border border-[#416F39]">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Data dimuat dari {formData.sourceType === 'lelang' ? 'Lelang' : 'Non-Lelang'}:
                {' '}<strong>
                  {formData.sourceType === 'lelang'
                    ? lelangList.find(l => l.id === formData.sourceId)?.namaLelang
                    : praKontrakList.find(p => p.id === formData.sourceId)?.namaProyek}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="nomorKontrak" className="text-xs sm:text-sm">Nomor Kontrak <span className="text-red-500">*</span></Label>
          <Input
            id="nomorKontrak"
            value={formData.nomorKontrak}
            onChange={(e) => setFormData({ ...formData, nomorKontrak: e.target.value })}
            disabled={viewMode}
            required
            className="text-sm"
          />
        </div>
        <div>
          <Label htmlFor="status" className="text-xs sm:text-sm">Status <span className="text-red-500">*</span></Label>
          <Select
            value={formData.status}
            onValueChange={(value: string) => setFormData({ ...formData, status: value as FormData['status'] })}
            disabled={viewMode}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="persiapan">Persiapan</SelectItem>
              <SelectItem value="berjalan">Berjalan</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
              <SelectItem value="serah_terima">Serah Terima</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tenderType" className="text-xs sm:text-sm">Jenis Tender <span className="text-red-500">*</span></Label>
          <Select
            value={formData.tenderType}
            onValueChange={(value: string) =>
              setFormData({
                ...formData,
                tenderType: value as FormData['tenderType'],
              })
            }
            disabled={viewMode}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Pilih jenis tender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lelang">Lelang</SelectItem>
              <SelectItem value="non-lelang">Non Lelang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="jenisPekerjaan" className="text-xs sm:text-sm">Jenis Pekerjaan <span className="text-red-500">*</span></Label>
          <Select
            value={formData.jenisPekerjaan}
            onValueChange={(value: string) =>
              setFormData({
                ...formData,
                jenisPekerjaan: value as FormData['jenisPekerjaan'],
              })
            }
            disabled={viewMode}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Pilih jenis pekerjaan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AMDAL">AMDAL</SelectItem>
              <SelectItem value="PPKH">PPKH</SelectItem>
              <SelectItem value="LAIN-LAIN">LAIN-LAIN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="namaProyek" className="text-xs sm:text-sm">Nama Proyek <span className="text-red-500">*</span></Label>
          <Input
            id="namaProyek"
            value={formData.namaProyek}
            onChange={(e) => setFormData({ ...formData, namaProyek: e.target.value })}
            disabled={viewMode}
            required
            className="text-sm"
          />
        </div>
        <div>
          <Label htmlFor="klien" className="text-xs sm:text-sm">Klien <span className="text-red-500">*</span></Label>
          <Input
            id="klien"
            value={formData.klien}
            onChange={(e) => setFormData({ ...formData, klien: e.target.value })}
            disabled={viewMode}
            required
            className="text-sm"
          />
        </div>
        <div>
          <Label htmlFor="nilaiKontrak" className="text-xs sm:text-sm">Nilai Kontrak <span className="text-red-500">*</span></Label>
          <Input
            id="nilaiKontrak"
            type="number"
            value={formData.nilaiKontrak}
            onChange={(e) => setFormData({ ...formData, nilaiKontrak: Number(e.target.value) })}
            disabled={viewMode}
            required
            className="text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="pic" className="text-xs sm:text-sm">PIC <span className="text-red-500">*</span></Label>
          <Input
            id="pic"
            value={formData.pic}
            onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
            disabled={viewMode}
            required
            className="text-sm"
          />
        </div>
        <div>
          <Label htmlFor="tanggalMulai" className="text-xs sm:text-sm">Tanggal Mulai <span className="text-red-500">*</span></Label>
          <Input
            id="tanggalMulai"
            type="date"
            value={formatDateInput(formData.tanggalMulai)}
            onChange={(e) => setFormData({ ...formData, tanggalMulai: new Date(e.target.value) })}
            disabled={viewMode}
            required
            className="text-sm"
          />
        </div>
        <div>
          <Label htmlFor="tanggalSelesai" className="text-xs sm:text-sm">Tanggal Selesai <span className="text-red-500">*</span></Label>
          <Input
            id="tanggalSelesai"
            type="date"
            value={formatDateInput(formData.tanggalSelesai)}
            onChange={(e) => setFormData({ ...formData, tanggalSelesai: new Date(e.target.value) })}
            disabled={viewMode}
            required
            className="text-sm"
          />
        </div>
      </div>
    </TabsContent>
  );
}
