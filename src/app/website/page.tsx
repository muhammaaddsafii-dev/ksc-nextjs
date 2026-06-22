"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus, Edit, Trash2, ImagePlus, X, Loader2, Upload, Save,
  Home, Layers, Building2, Mail, BookOpen,
} from 'lucide-react';
import {
  homeService,
  layananService,
  proyekService,
  proyekImageService,
  aboutService,
  kontakService,
  getApiErrorMessage,
  HomeAPI,
  LayananAPI,
  ProyekAPI,
  AboutAPI,
  KontakAPI,
} from '@/services/landingPage.service';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

// ═══════════════════════════════════════════════════════════════
// TAB: HOME
// ═══════════════════════════════════════════════════════════════

function HomeTab() {
  const [home, setHome] = useState<HomeAPI | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    homeService.get().then(setHome).catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file_hero_image', file);
      const updated = await homeService.update(fd);
      setHome(updated);
      setFile(null);
      setPreview(null);
      toast.success('Hero image berhasil diperbarui');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan'));
    } finally {
      setSaving(false);
    }
  };

  const currentImage = preview ?? home?.signed_file_hero_image_url ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Hero Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer group/hero"
          onClick={() => inputRef.current?.click()}
        >
          {currentImage ? (
            <>
              <img src={currentImage} alt="Hero" className="w-full h-56 object-cover" />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity">
                <Upload className="h-7 w-7 text-white mb-1.5" />
                <p className="text-sm text-white font-medium">Klik untuk ganti hero image</p>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Klik untuk upload gambar hero</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP (maks. 10 MB)</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        <Button onClick={handleSave} disabled={!file || saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: LAYANAN
// ═══════════════════════════════════════════════════════════════

type LayananForm = { title: string; deskripsi: string; file_icon: File | null };
const emptyLayanan: LayananForm = { title: '', deskripsi: '', file_icon: null };

function LayananTab() {
  const [list, setList] = useState<LayananAPI[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LayananAPI | null>(null);
  const [form, setForm] = useState<LayananForm>(emptyLayanan);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    layananService.getAll().then(setList).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyLayanan); setOpen(true); };
  const openEdit = (l: LayananAPI) => {
    setEditing(l);
    setForm({ title: l.title, deskripsi: l.deskripsi, file_icon: null });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title wajib diisi');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('deskripsi', form.deskripsi);
      if (form.file_icon) fd.append('file_icon', form.file_icon);
      if (editing) {
        await layananService.update(editing.id, fd);
        toast.success('Layanan diperbarui');
      } else {
        await layananService.create(fd);
        toast.success('Layanan ditambahkan');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await layananService.delete(id);
      toast.success('Layanan dihapus');
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus'));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Layanan
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Layanan
          </Button>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada layanan</p>
          ) : (
            <div className="space-y-3">
              {list.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {l.signed_file_icon_url && (
                    <img src={l.signed_file_icon_url} alt={l.title} className="h-10 w-10 object-contain rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1" dangerouslySetInnerHTML={{ __html: l.deskripsi }} />
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(l)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(l.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Layanan' : 'Tambah Layanan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Icon Layanan</Label>
              <div
                className="mt-1.5 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => iconRef.current?.click()}
              >
                {form.file_icon ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={URL.createObjectURL(form.file_icon)} alt="icon preview" className="h-12 w-12 object-contain" />
                    <p className="text-xs text-muted-foreground">Klik untuk ganti icon</p>
                  </div>
                ) : editing?.signed_file_icon_url ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={editing.signed_file_icon_url} alt="icon" className="h-12 w-12 object-contain" />
                    <p className="text-xs text-muted-foreground">Klik untuk ganti icon</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Klik untuk upload icon (PNG/SVG)</p>
                )}
                <input ref={iconRef} type="file" className="hidden" accept="image/*" onChange={(e) => setForm(f => ({ ...f, file_icon: e.target.files?.[0] ?? null }))} />
              </div>
            </div>
            <div>
              <Label>Nama Layanan *</Label>
              <Input className="mt-1.5" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nama layanan" />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <div className="mt-1.5">
                <RichTextEditor value={form.deskripsi} onChange={(v) => setForm(f => ({ ...f, deskripsi: v }))} placeholder="Deskripsi layanan..." />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Layanan?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: PROYEK
// ═══════════════════════════════════════════════════════════════

const KATEGORI_OPTIONS = [
  { value: 'gis_kehutanan', label: 'GIS & Kehutanan' },
  { value: 'survey', label: 'Survey' },
  { value: 'kehutanan', label: 'Kehutanan' },
  { value: 'development', label: 'Development' },
];

type ProyekForm = {
  nama_proyek: string;
  deskripsi: string;
  klien: string;
  lokasi: string;
  tahun_pelaksanaan: string;
  durasi: string;
  koordinat_lat: number | null;
  koordinat_lng: number | null;
  kategori: string;
  file_image_cover: File | null;
  pendingImages: File[];
};

const emptyProyek: ProyekForm = {
  nama_proyek: '', deskripsi: '', klien: '', lokasi: '',
  tahun_pelaksanaan: '', durasi: '', koordinat_lat: null, koordinat_lng: null,
  kategori: '', file_image_cover: null, pendingImages: [],
};

function ProyekTab() {
  const [list, setList] = useState<ProyekAPI[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProyekAPI | null>(null);
  const [editingImages, setEditingImages] = useState<ProyekAPI['images']>([]);
  const [form, setForm] = useState<ProyekForm>(emptyProyek);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const pendingImgRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    proyekService.getAll().then(setList).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setEditingImages([]);
    setForm(emptyProyek);
    setOpen(true);
  };

  const openEdit = (p: ProyekAPI) => {
    setEditing(p);
    setEditingImages(p.images);
    setForm({
      nama_proyek: p.nama_proyek, deskripsi: p.deskripsi, klien: p.klien,
      lokasi: p.lokasi, tahun_pelaksanaan: p.tahun_pelaksanaan, durasi: p.durasi,
      koordinat_lat: p.koordinat_lat, koordinat_lng: p.koordinat_lng,
      kategori: p.kategori, file_image_cover: null, pendingImages: [],
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama_proyek.trim()) return toast.error('Nama proyek wajib diisi');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nama_proyek', form.nama_proyek);
      fd.append('deskripsi', form.deskripsi);
      fd.append('klien', form.klien);
      fd.append('lokasi', form.lokasi);
      fd.append('tahun_pelaksanaan', form.tahun_pelaksanaan);
      fd.append('durasi', form.durasi);
      fd.append('kategori', form.kategori);
      if (form.koordinat_lat !== null) fd.append('koordinat_lat', String(form.koordinat_lat));
      if (form.koordinat_lng !== null) fd.append('koordinat_lng', String(form.koordinat_lng));
      if (form.file_image_cover) fd.append('file_image_cover', form.file_image_cover);

      if (editing) {
        await proyekService.update(editing.id, fd);
        toast.success('Proyek diperbarui');
      } else {
        const created = await proyekService.create(fd);
        if (form.pendingImages.length > 0) {
          try {
            await Promise.all(
              form.pendingImages.map(file => proyekImageService.addImage(created.id, file))
            );
          } catch {
            toast.warning('Proyek berhasil dibuat, tapi beberapa gambar galeri gagal diupload');
          }
        }
        toast.success('Proyek ditambahkan');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await proyekService.delete(id);
      toast.success('Proyek dihapus');
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus'));
    } finally {
      setDeleteId(null);
    }
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingImg(true);
    try {
      const newImg = await proyekImageService.addImage(editing.id, file);
      setEditingImages(prev => [...prev, newImg]);
      load();
      toast.success('Gambar ditambahkan');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal upload gambar'));
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imgId: string) => {
    try {
      await proyekImageService.delete(imgId);
      setEditingImages(prev => prev.filter(img => img.id !== imgId));
      load();
      toast.success('Gambar dihapus');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus gambar'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Proyek
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Proyek
          </Button>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada proyek</p>
          ) : (
            <div className="space-y-3">
              {list.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="h-14 w-20 rounded overflow-hidden bg-muted flex-shrink-0">
                    {p.signed_file_image_cover_url && (
                      <img src={p.signed_file_image_cover_url} alt={p.nama_proyek} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm truncate">{p.nama_proyek}</p>
                      {p.kategori_display && <Badge variant="secondary" className="text-xs">{p.kategori_display}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.lokasi} · {p.tahun_pelaksanaan}</p>
                    <p className="text-xs text-muted-foreground">{p.images.length} gambar galeri</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(p)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Proyek' : 'Tambah Proyek'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Cover Image</Label>
              <div
                className="mt-1.5 border-2 border-dashed rounded-lg overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => coverRef.current?.click()}
              >
                {form.file_image_cover ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(form.file_image_cover)}
                      alt="cover preview"
                      className="w-full h-48 object-cover"
                    />
                    <p className="text-xs text-center text-muted-foreground py-1.5">Klik untuk ganti cover</p>
                  </div>
                ) : editing?.signed_file_image_cover_url ? (
                  <div className="relative">
                    <img src={editing.signed_file_image_cover_url} alt="cover" className="w-full h-48 object-cover" />
                    <p className="text-xs text-center text-muted-foreground py-1.5">Klik untuk ganti cover</p>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Klik untuk upload cover proyek</p>
                  </div>
                )}
                <input ref={coverRef} type="file" className="hidden" accept="image/*" onChange={(e) => setForm(f => ({ ...f, file_image_cover: e.target.files?.[0] ?? null }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nama Proyek *</Label>
                <Input className="mt-1.5" value={form.nama_proyek} onChange={(e) => setForm(f => ({ ...f, nama_proyek: e.target.value }))} placeholder="Nama proyek" />
              </div>
              <div>
                <Label>Klien</Label>
                <Input className="mt-1.5" value={form.klien} onChange={(e) => setForm(f => ({ ...f, klien: e.target.value }))} placeholder="Nama klien" />
              </div>
              <div>
                <Label>Lokasi</Label>
                <Input className="mt-1.5" value={form.lokasi} onChange={(e) => setForm(f => ({ ...f, lokasi: e.target.value }))} placeholder="Kota / Provinsi" />
              </div>
              <div>
                <Label>Tahun Pelaksanaan</Label>
                <Input className="mt-1.5" value={form.tahun_pelaksanaan} onChange={(e) => setForm(f => ({ ...f, tahun_pelaksanaan: e.target.value }))} placeholder="2024" />
              </div>
              <div>
                <Label>Durasi</Label>
                <Input className="mt-1.5" value={form.durasi} onChange={(e) => setForm(f => ({ ...f, durasi: e.target.value }))} placeholder="6 Bulan" />
              </div>
              <div className="col-span-2">
                <Label>Kategori</Label>
                <Select value={form.kategori} onValueChange={(v) => setForm(f => ({ ...f, kategori: v }))}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORI_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Deskripsi</Label>
              <div className="mt-1.5">
                <RichTextEditor value={form.deskripsi} onChange={(v) => setForm(f => ({ ...f, deskripsi: v }))} placeholder="Deskripsi proyek..." />
              </div>
            </div>

            <div>
              <Label>Koordinat (klik peta untuk memilih titik)</Label>
              <div className="mt-1.5">
                <MapPicker
                  lat={form.koordinat_lat}
                  lng={form.koordinat_lng}
                  onChange={(lat, lng) => setForm(f => ({ ...f, koordinat_lat: lat, koordinat_lng: lng }))}
                />
              </div>
              {form.koordinat_lat !== null && form.koordinat_lng !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Lat: {form.koordinat_lat.toFixed(6)} · Lng: {form.koordinat_lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Gambar Galeri */}
            <div>
              <Label>Gambar Galeri (ditampilkan sebagai slider di halaman detail)</Label>
              {!editing ? (
                /* Proyek baru: pilih file dulu, upload saat save */
                <div className="mt-1.5 space-y-2">
                  <div className="grid grid-cols-3 gap-3">
                    {form.pendingImages.map((file, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden aspect-video bg-muted">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                          onClick={() => setForm(f => ({ ...f, pendingImages: f.pendingImages.filter((_, i) => i !== idx) }))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors text-muted-foreground"
                      onClick={() => pendingImgRef.current?.click()}
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">Tambah gambar</span>
                    </button>
                    <input
                      ref={pendingImgRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length) setForm(f => ({ ...f, pendingImages: [...f.pendingImages, ...files] }));
                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* Edit proyek: upload/hapus langsung via API */
                <div className="mt-1.5 grid grid-cols-3 gap-3">
                  {editingImages.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-video bg-muted">
                      {img.signed_file_images_url && (
                        <img src={img.signed_file_images_url} alt="gallery" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors text-muted-foreground"
                    onClick={() => imgRef.current?.click()}
                    disabled={uploadingImg}
                  >
                    {uploadingImg ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                    <span className="text-xs">Tambah gambar</span>
                  </button>
                  <input ref={imgRef} type="file" className="hidden" accept="image/*" onChange={handleAddImage} />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Proyek?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: ABOUT
// ═══════════════════════════════════════════════════════════════

function AboutTab() {
  const [data, setData] = useState<AboutAPI>({ id: 1, header: '', deskripsi: '', visi: '', misi: '', standard: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    aboutService.get().then(d => { if (d) setData(d); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await aboutService.update(data);
      setData(updated);
      toast.success('About berhasil disimpan');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Tentang Perusahaan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>Header / Judul</Label>
          <Input className="mt-1.5" value={data.header} onChange={(e) => setData(d => ({ ...d, header: e.target.value }))} placeholder="Membangun Kepercayaan Melalui Keahlian & Dedikasi" />
        </div>
        <div>
          <Label>Deskripsi (paragraf utama)</Label>
          <div className="mt-1.5">
            <RichTextEditor value={data.deskripsi} onChange={(v) => setData(d => ({ ...d, deskripsi: v }))} placeholder="Deskripsi perusahaan..." />
          </div>
        </div>
        <div>
          <Label>Visi</Label>
          <div className="mt-1.5">
            <RichTextEditor value={data.visi} onChange={(v) => setData(d => ({ ...d, visi: v }))} placeholder="Visi perusahaan..." />
          </div>
        </div>
        <div>
          <Label>Misi</Label>
          <div className="mt-1.5">
            <RichTextEditor value={data.misi} onChange={(v) => setData(d => ({ ...d, misi: v }))} placeholder="Misi perusahaan..." />
          </div>
        </div>
        <div>
          <Label>Kualitas / Standard</Label>
          <div className="mt-1.5">
            <RichTextEditor value={data.standard} onChange={(v) => setData(d => ({ ...d, standard: v }))} placeholder="Standar kualitas..." />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: KONTAK
// ═══════════════════════════════════════════════════════════════

function KontakTab() {
  const [data, setData] = useState<KontakAPI>({
    id: 1, nama_perusahaan: '', alamat: '', telepon: '',
    email: '', jam_operasional: '', koordinat_lat: null, koordinat_lng: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    kontakService.get().then(d => { if (d) setData(d); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await kontakService.update(data);
      setData(updated);
      toast.success('Kontak berhasil disimpan');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Informasi Kontak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nama Perusahaan</Label>
            <Input className="mt-1.5" value={data.nama_perusahaan} onChange={(e) => setData(d => ({ ...d, nama_perusahaan: e.target.value }))} placeholder="PT Kurnia Sylva Consultan" />
          </div>
          <div className="col-span-2">
            <Label>Alamat</Label>
            <Input className="mt-1.5" value={data.alamat} onChange={(e) => setData(d => ({ ...d, alamat: e.target.value }))} placeholder="Jl. ..." />
          </div>
          <div>
            <Label>Telepon</Label>
            <Input className="mt-1.5" value={data.telepon} onChange={(e) => setData(d => ({ ...d, telepon: e.target.value }))} placeholder="+62 21 ..." />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1.5" type="email" value={data.email} onChange={(e) => setData(d => ({ ...d, email: e.target.value }))} placeholder="info@..." />
          </div>
          <div className="col-span-2">
            <Label>Jam Operasional</Label>
            <Input className="mt-1.5" value={data.jam_operasional} onChange={(e) => setData(d => ({ ...d, jam_operasional: e.target.value }))} placeholder="Senin - Jumat: 08:00 - 17:00 WIB" />
          </div>
        </div>

        <div>
          <Label>Koordinat Kantor (klik peta untuk memilih titik)</Label>
          <div className="mt-1.5">
            <MapPicker
              lat={data.koordinat_lat}
              lng={data.koordinat_lng}
              onChange={(lat, lng) => setData(d => ({ ...d, koordinat_lat: lat, koordinat_lng: lng }))}
            />
          </div>
          {data.koordinat_lat !== null && data.koordinat_lng !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Lat: {data.koordinat_lat.toFixed(6)} · Lng: {data.koordinat_lng.toFixed(6)}
            </p>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function WebsitePage() {
  return (
    <MainLayout title="Manajemen Website">
      <Tabs defaultValue="home" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="home" className="gap-1.5"><Home className="h-3.5 w-3.5" />Home</TabsTrigger>
          <TabsTrigger value="layanan" className="gap-1.5"><Layers className="h-3.5 w-3.5" />Layanan</TabsTrigger>
          <TabsTrigger value="proyek" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />Proyek</TabsTrigger>
          <TabsTrigger value="about" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />About</TabsTrigger>
          <TabsTrigger value="kontak" className="gap-1.5"><Mail className="h-3.5 w-3.5" />Kontak</TabsTrigger>
        </TabsList>

        <TabsContent value="home"><HomeTab /></TabsContent>
        <TabsContent value="layanan"><LayananTab /></TabsContent>
        <TabsContent value="proyek"><ProyekTab /></TabsContent>
        <TabsContent value="about"><AboutTab /></TabsContent>
        <TabsContent value="kontak"><KontakTab /></TabsContent>
      </Tabs>
    </MainLayout>
  );
}
