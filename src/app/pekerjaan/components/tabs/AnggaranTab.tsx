import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { AnggaranItem } from '@/types';
import { FormData } from '../../hooks/useFormManagement';
import { formatCurrency } from '@/lib/helpers';
import { toast } from 'sonner';
import { FileIcon } from '../';

interface AnggaranTabProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  viewMode: boolean;
  // newAnggaran: AnggaranItem;
  // setNewAnggaran: (data: AnggaranItem) => void;
  newAnggaran: Omit<AnggaranItem, 'id'>;
  setNewAnggaran: (value: Omit<AnggaranItem, 'id'>) => void;
  anggaranManagement: any;
  fileManagement: any;
  handleAddAnggaran: () => void;
  handleAnggaranFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExistingAnggaranFileUpload: (anggaranId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAnggaranFile: (fileName: string) => void;
  removeExistingAnggaranFile: (anggaranId: string, fileName: string) => void;
  totalAnggaran: number;
  totalRealisasi: number;
}

export function AnggaranTab({
  formData,
  setFormData,
  viewMode,
  newAnggaran,
  setNewAnggaran,
  anggaranManagement,
  fileManagement,
  handleAddAnggaran,
  handleAnggaranFileUpload,
  handleExistingAnggaranFileUpload,
  removeAnggaranFile,
  removeExistingAnggaranFile,
  totalAnggaran,
  totalRealisasi
}: AnggaranTabProps) {
  return (
    <TabsContent value="anggaran" className="space-y-4 px-4 sm:px-6 py-4">
      {formData.tahapan.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">⚠️ Tambahkan Tahapan terlebih dahulu sebelum menambahkan anggaran.</p>
        </div>
      )}
      {!viewMode && formData.tahapan.length > 0 && (
        <div className="space-y-3 p-3 sm:p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
            <Select
              value={newAnggaran.tahapanId}
              onValueChange={(v) => setNewAnggaran({ ...newAnggaran, tahapanId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Tahapan" />
              </SelectTrigger>
              <SelectContent>
                {formData.tahapan.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Kategori"
              value={newAnggaran.kategori}
              onChange={(e) => setNewAnggaran({ ...newAnggaran, kategori: e.target.value })}
            />
            <Input
              placeholder="Deskripsi"
              value={newAnggaran.deskripsi}
              onChange={(e) => setNewAnggaran({ ...newAnggaran, deskripsi: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Jumlah"
              value={newAnggaran.jumlah || ''}
              onChange={(e) => setNewAnggaran({ ...newAnggaran, jumlah: Number(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Realisasi"
              value={newAnggaran.realisasi || ''}
              onChange={(e) => setNewAnggaran({ ...newAnggaran, realisasi: Number(e.target.value) })}
            />
            <Button type="button" onClick={handleAddAnggaran}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Upload Bukti Anggaran (Multiple Files)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="anggaran-file-upload"
                type="file"
                multiple
                onChange={handleAnggaranFileUpload}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('anggaran-file-upload')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Pilih File
              </Button>
            </div>
            {newAnggaran.files && newAnggaran.files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newAnggaran.files.map((file, idx) => {
                  return (
                    <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-md border">
                      <FileIcon fileName={file} className="h-3 w-3" />
                      <span className="text-xs">{file.split('/').pop()}</span>
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive ml-1"
                        onClick={() => removeAnggaranFile(file)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODIFIED: Tampilan anggaran dalam format tabel dikelompokkan per tahapan */}
      <div className="space-y-6">
        {formData.tahapan.map((tahapan) => {
          const anggaranTahapan = formData.anggaran.filter(a => a.tahapanId === tahapan.id);
          const totalTahapan = anggaranTahapan.reduce((sum, a) => sum + a.jumlah, 0);
          const realisasiTahapan = anggaranTahapan.reduce((sum, a) => sum + a.realisasi, 0);

          return (
            <div key={tahapan.id} className="space-y-3">
              {/* Header Tahapan */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{tahapan.nama}</h3>
                      <StatusBadge status={tahapan.status} />
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {anggaranTahapan.length} item anggaran
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="text-xs sm:text-sm text-gray-600">
                    <span className="font-semibold">Total:</span> {formatCurrency(totalTahapan)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    <span className="font-semibold">Realisasi:</span> {formatCurrency(realisasiTahapan)}
                  </div>
                </div>
              </div>

              {/* Responsive Card/Table View */}
              {anggaranTahapan.length === 0 ? (
                <div className="p-8 text-center border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-500 italic">Belum ada anggaran untuk tahapan ini</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {anggaranTahapan.map((a) => {
                      const isEditing = anggaranManagement.editingAnggaranId === a.id;
                      return (
                        <div key={a.id} className="border rounded-lg p-3 bg-white space-y-3 shadow-sm">
                          {/* Header: Kategori & Actions */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 mr-2">
                              {isEditing ? (
                                <Input
                                  value={anggaranManagement.editAnggaranData?.kategori || ''}
                                  onChange={(e) => anggaranManagement.setEditAnggaranData({ ...anggaranManagement.editAnggaranData!, kategori: e.target.value })}
                                  className="h-8 text-sm mb-2"
                                  placeholder="Kategori"
                                />
                              ) : (
                                <h4 className="font-semibold text-gray-900 truncate">{a.kategori}</h4>
                              )}
                            </div>
                            {!viewMode && (
                              <div className="flex items-center gap-1">
                                {isEditing ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => anggaranManagement.handleSaveEditAnggaran()}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => anggaranManagement.handleCancelEditAnggaran()}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => anggaranManagement.handleEditAnggaran(a)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => setFormData({
                                        ...formData,
                                        anggaran: formData.anggaran.filter((item) => item.id !== a.id)
                                      })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Deskripsi */}
                          <div>
                            {isEditing ? (
                              <Input
                                value={anggaranManagement.editAnggaranData?.deskripsi || ''}
                                onChange={(e) => anggaranManagement.setEditAnggaranData({ ...anggaranManagement.editAnggaranData!, deskripsi: e.target.value })}
                                className="h-8 text-sm"
                                placeholder="Deskripsi"
                              />
                            ) : (
                              <p className="text-sm text-gray-600">{a.deskripsi}</p>
                            )}
                          </div>

                          {/* Amounts */}
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Anggaran</p>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={anggaranManagement.editAnggaranData?.jumlah || 0}
                                  onChange={(e) => anggaranManagement.setEditAnggaranData({ ...anggaranManagement.editAnggaranData!, jumlah: Number(e.target.value) })}
                                  className="h-8 text-sm"
                                />
                              ) : (
                                <p className="font-semibold text-sm">{formatCurrency(a.jumlah)}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Realisasi</p>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={anggaranManagement.editAnggaranData?.realisasi || 0}
                                  onChange={(e) => anggaranManagement.setEditAnggaranData({ ...anggaranManagement.editAnggaranData!, realisasi: Number(e.target.value) })}
                                  className="h-8 text-sm"
                                />
                              ) : (
                                <p className="font-semibold text-sm text-emerald-600">{formatCurrency(a.realisasi)}</p>
                              )}
                            </div>
                          </div>

                          {/* Documents */}
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-muted-foreground">Dokumen</p>
                              {!viewMode && (
                                <>
                                  <Input
                                    id={`anggaran-file-mobile-${a.id}`}
                                    type="file"
                                    multiple
                                    onChange={(e) => handleExistingAnggaranFileUpload(a.id, e)}
                                    className="hidden"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => document.getElementById(`anggaran-file-mobile-${a.id}`)?.click()}
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Upload
                                  </Button>
                                </>
                              )}
                            </div>
                            {a.files && a.files.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {a.files.map((file, fileIdx) => (
                                  <div key={fileIdx} className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md border text-xs overflow-hidden max-w-full">
                                    <FileIcon fileName={file} className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate flex-1 max-w-[150px]">{file.split('/').pop()}</span>
                                    <div className="flex items-center ml-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 hover:bg-transparent"
                                        onClick={() => fileManagement.handleDownloadFile(file)}
                                      >
                                        <FileText className="h-3 w-3 text-blue-600" />
                                      </Button>
                                      {!viewMode && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 hover:bg-transparent"
                                          onClick={() => removeExistingAnggaranFile(a.id, file)}
                                        >
                                          <X className="h-3 w-3 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block rounded-lg border overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-8 sm:w-12">#</th>
                          <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Kategori</th>
                          <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm hidden lg:table-cell">Deskripsi</th>
                          <th className="p-2 sm:p-3 text-right font-semibold text-xs sm:text-sm w-24 sm:w-32">Anggaran</th>
                          <th className="p-2 sm:p-3 text-right font-semibold text-xs sm:text-sm w-24 sm:w-32">Realisasi</th>
                          <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-24 sm:w-32">Dokumen</th>
                          {!viewMode && <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-16 sm:w-24">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {anggaranTahapan.map((a, idx) => {
                          const isEditing = anggaranManagement.editingAnggaranId === a.id;

                          return (
                            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                              <td className="p-2 sm:p-3">
                                {isEditing ? (
                                  <Input
                                    value={anggaranManagement.editAnggaranData?.kategori || ''}
                                    onChange={(e) => anggaranManagement.setEditAnggaranData({ ...anggaranManagement.editAnggaranData!, kategori: e.target.value })}
                                    className="h-8 text-xs sm:text-sm"
                                    placeholder="Kategori"
                                  />
                                ) : (
                                  <span className="text-xs sm:text-sm font-medium text-gray-900">{a.kategori}</span>
                                )}
                              </td>
                              <td className="p-2 sm:p-3 hidden lg:table-cell">
                                {isEditing ? (
                                  <Input
                                    value={anggaranManagement.editAnggaranData?.deskripsi || ''}
                                    onChange={(e) => anggaranManagement.setEditAnggaranData({ ...anggaranManagement.editAnggaranData!, deskripsi: e.target.value })}
                                    className="h-8 text-xs sm:text-sm"
                                    placeholder="Deskripsi"
                                  />
                                ) : (
                                  <span className="text-xs sm:text-sm text-gray-600">{a.deskripsi}</span>
                                )}
                              </td>
                              <td className="p-2 sm:p-3 text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={anggaranManagement.editAnggaranData?.jumlah || 0}
                                    onChange={(e) => anggaranManagement.setEditAnggaranData({ ...anggaranManagement.editAnggaranData!, jumlah: Number(e.target.value) })}
                                    className="h-8 text-xs sm:text-sm text-right"
                                    placeholder="Jumlah"
                                  />
                                ) : (
                                  <span className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(a.jumlah)}</span>
                                )}
                              </td>
                              <td className="p-2 sm:p-3 text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={anggaranManagement.editAnggaranData?.realisasi || 0}
                                    onChange={(e) => anggaranManagement.setEditAnggaranData({ ...anggaranManagement.editAnggaranData!, realisasi: Number(e.target.value) })}
                                    className="h-8 text-xs sm:text-sm text-right"
                                    placeholder="Realisasi"
                                  />
                                ) : (
                                  <span className="text-xs sm:text-sm font-semibold text-emerald-600 whitespace-nowrap">{formatCurrency(a.realisasi)}</span>
                                )}
                              </td>
                              <td className="p-2 sm:p-3">
                                <div className="flex items-center justify-center gap-2">
                                  {/* Show file count */}
                                  {a.files && a.files.length > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {a.files.length} file
                                      </Badge>
                                      {/* Download all files */}
                                      {a.files.map((file, fileIdx) => {
                                        return (
                                          <Button
                                            key={fileIdx}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                            onClick={() => fileManagement.handleDownloadFile(file)}
                                            title={file.split('/').pop()}
                                          >
                                            <FileIcon fileName={file} className="h-3 w-3 sm:h-4 sm:w-4" />
                                          </Button>
                                        );
                                      })}
                                      {!viewMode && (
                                        <>
                                          <Input
                                            id={`anggaran-file-${a.id}`}
                                            type="file"
                                            multiple
                                            onChange={(e) => handleExistingAnggaranFileUpload(a.id, e)}
                                            className="hidden"
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                            onClick={() => document.getElementById(`anggaran-file-${a.id}`)?.click()}
                                            title="Upload dokumen"
                                          >
                                            <Upload className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    !viewMode && (
                                      <>
                                        <Input
                                          id={`anggaran-file-${a.id}`}
                                          type="file"
                                          multiple
                                          onChange={(e) => handleExistingAnggaranFileUpload(a.id, e)}
                                          className="hidden"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-6 sm:h-7 text-xs"
                                          onClick={() => document.getElementById(`anggaran-file-${a.id}`)?.click()}
                                        >
                                          <Upload className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                          Upload
                                        </Button>
                                      </>
                                    )
                                  )}
                                </div>
                              </td>
                              {!viewMode && (
                                <td className="p-2 sm:p-3 text-center">
                                  {isEditing ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 hover:bg-green-50"
                                        onClick={() => anggaranManagement.handleSaveEditAnggaran()}
                                        title="Simpan"
                                      >
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 hover:bg-red-50"
                                        onClick={() => anggaranManagement.handleCancelEditAnggaran()}
                                        title="Batal"
                                      >
                                        <X className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 hover:bg-blue-50"
                                        onClick={() => anggaranManagement.handleEditAnggaran(a)}
                                        title="Edit"
                                      >
                                        <Edit className="h-4 w-4 text-blue-600" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 hover:bg-red-50"
                                        onClick={() => setFormData({
                                          ...formData,
                                          anggaran: formData.anggaran.filter((item) => item.id !== a.id)
                                        })}
                                        title="Hapus"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 sm:p-4 bg-muted rounded-lg">
        <div className="flex justify-between text-sm sm:text-base">
          <span>Total Anggaran:</span>
          <span className="font-bold">{formatCurrency(totalAnggaran)}</span>
        </div>
        <div className="flex justify-between text-sm sm:text-base">
          <span>Total Realisasi:</span>
          <span className="font-bold">{formatCurrency(totalRealisasi)}</span>
        </div>
      </div>
    </TabsContent>
  );
}
