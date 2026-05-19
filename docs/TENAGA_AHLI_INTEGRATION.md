# Integrasi Tenaga Ahli

## File yang Dibuat/Dimodifikasi

| File | Keterangan |
|------|-----------|
| `src/services/tenagaAhli.service.ts` | **BARU** — API calls + mapping FE↔BE |
| `src/stores/tenagaAhliStore.ts` | **DIUBAH** — ganti mock dengan real async API |
| `src/app/tenaga-ahli/page.tsx` | **DIUBAH** — wire upload, submit multi-step, error handling |

---

## Endpoint yang Digunakan

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `GET` | `/api/tenaga-ahli/` | List semua tenaga ahli (paginated) |
| `POST` | `/api/tenaga-ahli/` | Tambah tenaga ahli (form-data jika ada foto) |
| `PATCH` | `/api/tenaga-ahli/{id}/` | Update tenaga ahli |
| `DELETE` | `/api/tenaga-ahli/{id}/` | Hapus tenaga ahli |
| `POST` | `/api/sertifikat/` | Upload sertifikat (form-data, wajib) |
| `DELETE` | `/api/sertifikat/{id}/` | Hapus sertifikat |

---

## Mapping FE ↔ Backend

### TenagaAhli

| Frontend | Backend | Catatan |
|----------|---------|---------|
| `fotoUrl` | `signed_file_url` | AWS S3 presigned URL (null jika S3 belum dikonfigurasi) |
| `status` | *(tidak ada)* | Default `'tersedia'` — hanya FE |
| `createdAt` | `created_at` | |
| `updatedAt` | `updated_at` | |

### Sertifikat

| Frontend | Backend | Catatan |
|----------|---------|---------|
| `fileUrl` | `signed_file_url` | AWS S3 presigned URL |
| `nomorSertifikat` | *(tidak ada)* | Default `''` — hanya FE |
| `tanggalTerbit` | `created_at` | Dipakai sebagai fallback |
| `tanggalBerlaku` | `created_at` | Dipakai sebagai fallback |

---

## Flow Submit (Multi-step)

```
handleSubmit()
  ├── 1. POST/PATCH /api/tenaga-ahli/   (dengan file_foto jika ada)
  │       → dapat ID tenaga ahli
  ├── 2. DELETE /api/sertifikat/{id}/   (untuk sertifikat yang dihapus user)
  └── 3. POST /api/sertifikat/          (untuk setiap sertifikat baru)
          form-data: tenaga_ahli, nama, file
```

---

## State Baru di Page

| State | Tipe | Fungsi |
|-------|------|--------|
| `fotoFile` | `File \| null` | File foto aktual untuk diupload |
| `fotoPreview` | `string \| undefined` | URL preview (createObjectURL atau signed_file_url) |
| `sertifikatFiles` | `Record<string, File>` | Map dari sertifikat ID → File object |
| `deletedSertifikatIds` | `string[]` | ID sertifikat backend yang perlu dihapus |
| `newSertifikatNama` | `string` | Input nama sertifikat baru |
| `isSubmitting` | `boolean` | Loading state saat submit |
| `isDeleting` | `boolean` | Loading state saat delete |

---

## Identifikasi Sertifikat Baru vs Existing

Sertifikat baru (belum diupload) diberi ID sementara dengan prefix `new_`:
- `new_1716123456789` → belum di backend, perlu diupload
- `abc123-uuid-...` → sudah di backend (ID dari Django)

---

## Perubahan UI (Minimal)

- Tambah **input nama sertifikat** di form (diperlukan backend, field ini hilang di FE original)
- Label "Belum disimpan" pada sertifikat pending
- Tombol download hanya tampil untuk sertifikat existing yang punya `signed_file_url`
- Loading spinner pada tombol "Simpan" dan "Hapus"

---

## Cara Testing

1. Pastikan backend berjalan: `python manage.py runserver`
2. Login terlebih dahulu
3. Buka halaman `/tenaga-ahli`
4. **Test tambah:**
   - Klik "Tambah Tenaga Ahli"
   - Isi nama, jabatan, telepon, email
   - Opsional: upload foto profil
   - Tambah sertifikat (nama + file PDF/JPG)
   - Klik "Tambah" → cek data muncul di tabel
5. **Test edit:** klik Edit → ubah data → simpan
6. **Test delete:** klik ikon hapus → konfirmasi → data hilang dari tabel
7. **Test sertifikat:** buka detail → cek file bisa dibuka via download button

---

## Known Issues

1. **AWS S3 tidak dikonfigurasi:** `signed_file_url` akan `null`. File upload tetap berjalan (file tersimpan di server) tapi preview/download tidak bisa via URL. Foto profil akan menampilkan avatar fallback (inisial nama).

2. **Pagination:** Saat ini hanya load page pertama (20 item). Untuk load lebih banyak, perlu implement pagination di store.

3. **Field FE tidak ada di BE:** `status`, `nomorSertifikat`, `tanggalTerbit`, `tanggalBerlaku` di FE tidak tersimpan ke backend. Data ini hilang setelah refresh.

---

## Next Step

Modul berikutnya: **Integrasi Perusahaan** (`/api/perusahaan/`)
