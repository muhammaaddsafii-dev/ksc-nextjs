import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Pekerjaan } from '@/types';
import { FormData } from '../../hooks/useFormManagement';

interface PekerjaanFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit' | 'view';
  formData: FormData;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  selectedItem?: Pekerjaan | null;
}

export function PekerjaanFormModal({
  open,
  onOpenChange,
  mode,
  formData,
  onSubmit,
  children,
  selectedItem
}: PekerjaanFormModalProps) {
  const [activeTab, setActiveTab] = useState('info');

  const getTitle = () => {
    if (mode === 'view') return 'Detail Pekerjaan';
    if (mode === 'edit') return 'Edit Pekerjaan';
    return 'Tambah Pekerjaan Baru';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none sm:max-w-4xl sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0 rounded-none sm:rounded-lg">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop View - Tab List */}
          <div className="hidden lg:block px-4 sm:px-6 border-b">
            <TabsList className="w-full grid grid-cols-5 gap-1 bg-transparent h-auto p-0">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
              >
                Informasi
              </TabsTrigger>
              <TabsTrigger
                value="dokumen"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
              >
                Dokumen
              </TabsTrigger>
              <TabsTrigger
                value="tim"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
              >
                Tim
              </TabsTrigger>
              <TabsTrigger
                value="tahapan"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
              >
                Tahapan
              </TabsTrigger>
              <TabsTrigger
                value="anggaran"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
              >
                Anggaran
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Mobile/Tablet View - Dropdown */}
          <div className="lg:hidden px-4 sm:px-6 py-3 border-b bg-muted/30">
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Navigasi</Label>
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full h-11 bg-background">
                <SelectValue>
                  {activeTab === 'info' && 'Informasi'}
                  {activeTab === 'dokumen' && 'Dokumen'}
                  {activeTab === 'tim' && 'Tim'}
                  {activeTab === 'tahapan' && 'Tahapan'}
                  {activeTab === 'anggaran' && 'Anggaran'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informasi</SelectItem>
                <SelectItem value="dokumen">Dokumen</SelectItem>
                <SelectItem value="tim">Tim</SelectItem>
                <SelectItem value="tahapan">Tahapan</SelectItem>
                <SelectItem value="anggaran">Anggaran</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={onSubmit}>
            {children}

            {mode !== 'view' && (
              <div className="flex justify-end gap-2 px-4 sm:px-6 py-4 border-t bg-muted/30">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {mode === 'edit' ? 'Simpan Perubahan' : 'Tambah'}
                </Button>
              </div>
            )}
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
