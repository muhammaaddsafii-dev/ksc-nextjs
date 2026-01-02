"use client";

import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from 'sonner';
import { Building2, Bell, Palette, Globe } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const { profil, settings, updateProfil, updateSettings, toggleTheme } = useSettingsStore();
  const [profilForm, setProfilForm] = useState(profil);

  const handleSaveProfil = () => {
    updateProfil(profilForm);
    toast.success('Profil perusahaan berhasil disimpan');
  };

  return (
    <MainLayout title="Profil & Settings">
      <div className="space-y-6 max-w-4xl">
        {/* Company Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Profil Perusahaan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="namaPerusahaan">Nama Perusahaan</Label>
                <Input
                  id="namaPerusahaan"
                  value={profilForm.namaPerusahaan}
                  onChange={(e) => setProfilForm({ ...profilForm, namaPerusahaan: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Input
                  id="alamat"
                  value={profilForm.alamat}
                  onChange={(e) => setProfilForm({ ...profilForm, alamat: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="telepon">Telepon</Label>
                <Input
                  id="telepon"
                  value={profilForm.telepon}
                  onChange={(e) => setProfilForm({ ...profilForm, telepon: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profilForm.email}
                  onChange={(e) => setProfilForm({ ...profilForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profilForm.website}
                  onChange={(e) => setProfilForm({ ...profilForm, website: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="npwp">NPWP</Label>
                <Input
                  id="npwp"
                  value={profilForm.npwp}
                  onChange={(e) => setProfilForm({ ...profilForm, npwp: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="direktur">Direktur Utama</Label>
                <Input
                  id="direktur"
                  value={profilForm.direktur}
                  onChange={(e) => setProfilForm({ ...profilForm, direktur: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfil}>Simpan Profil</Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Tampilan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Aktifkan mode gelap untuk tampilan yang lebih nyaman di malam hari
                </p>
              </div>
              <Switch
                checked={settings.theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Aktifkan Notifikasi</Label>
                <p className="text-sm text-muted-foreground">
                  Terima notifikasi untuk deadline, dokumen expired, dan update penting lainnya
                </p>
              </div>
              <Switch
                checked={settings.notifikasi}
                onCheckedChange={(checked: boolean) => {
                  updateSettings({ notifikasi: checked });
                  toast.success(checked ? 'Notifikasi diaktifkan' : 'Notifikasi dinonaktifkan');
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Bahasa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bahasa Aplikasi</Label>
                <p className="text-sm text-muted-foreground">
                  Pilih bahasa yang digunakan dalam aplikasi
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={settings.language === 'id' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateSettings({ language: 'id' });
                    toast.success('Bahasa diubah ke Indonesia');
                  }}
                >
                  Indonesia
                </Button>
                <Button
                  variant={settings.language === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateSettings({ language: 'en' });
                    toast.success('Language changed to English');
                  }}
                >
                  English
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versi Aplikasi</span>
                <span>1.0.0</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span>Frontend Prototype</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database</span>
                <span>Mock Data (In-Memory)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
