# Perencanaan Sistem Notifikasi — KSC Project Management

## Ringkasan Temuan Codebase

| Aspek | Status |
|---|---|
| Backend notification model | Belum ada |
| Backend notification endpoint | Belum ada |
| Frontend notification UI | Belum ada (hanya toggle boolean di settingsStore) |
| Toast library (Sonner) | Sudah terpasang, siap pakai |
| Zustand stores | Sudah ada pattern, tinggal tambah store baru |

---

## Arsitektur yang Direkomendasikan

### Polling, bukan WebSocket

Untuk sistem manajemen proyek ini, **polling setiap 60 detik** sudah cukup — notifikasi berbasis deadline tidak perlu real-time sub-detik. WebSocket (Django Channels + Redis) menambah kompleksitas infrastruktur yang tidak sebanding dengan manfaatnya di sini.

```
Frontend (Next.js)                    Backend (Django)
──────────────────                    ────────────────
useNotifikasi hook                    /api/notifikasi/
  └─ polling 60s ──── GET ──────────► NotifikasiViewSet
                                           └─ compute on-the-fly dari:
notifikasiStore (Zustand)                      Tahapan, Invoice, Pekerjaan
  └─ notifikasi[]                         ─── + filter is_read
  └─ unreadCount
                      PATCH ─────────► /api/notifikasi/{id}/baca/
NotificationBell                      /api/notifikasi/baca-semua/
  └─ dropdown panel
  └─ badge count
  └─ Sonner toast (baru masuk)
```

### Dua Jenis Notifikasi

| Jenis | Cara Generate | Disimpan di DB? |
|---|---|---|
| **Deadline-based** (kondisi 2, 4, 5) | Dihitung saat request masuk (`tanggal_selesai < today`) | Ya (agar bisa mark-read) |
| **Status-based** (kondisi 1, 3) | Django Signal saat save Invoice/Tahapan | Ya |

---

## Mapping Kondisi → Implementasi

### Kondisi 1 — Tahapan selesai, invoice belum tagih
- **Trigger**: Django signal `post_save` pada model `Tahapan`
- **Check**: `tahapan.status == 'selesai'` AND (`tahapan.invoices` kosong OR semua invoice `status == 'belum_tagih'`)
- **Tipe notif**: `TAHAPAN_BELUM_TAGIH`

### Kondisi 2 — Deadline tahapan terlewati
- **Trigger**: dihitung saat endpoint `/api/notifikasi/` dipanggil
- **Check**: `tahapan.tanggal_selesai < today` AND `tahapan.status != 'selesai'`
- **Tipe notif**: `TAHAPAN_DEADLINE_LEWAT`

### Kondisi 3 — Invoice pembayaran terlambat
- **Trigger**: Django signal `post_save` pada model `Invoice`
- **Check**: `invoice.jatuh_tempo < today` AND `invoice.status not in ['lunas']`
- **Auto-update**: update `invoice.status` → `terlambat_bayar` sekaligus
- **Tipe notif**: `INVOICE_TERLAMBAT`

### Kondisi 4 — Deadline pekerjaan overall terlewati
- **Trigger**: dihitung saat endpoint dipanggil
- **Check**: `pekerjaan.tanggal_selesai < today` AND `pekerjaan.status_pekerjaan != 'selesai'`
- **Tipe notif**: `PEKERJAAN_DEADLINE_LEWAT`

### Kondisi 5 — Deadline tender mendekat
- **Trigger**: dihitung saat endpoint dipanggil
- **Check**: `pekerjaan.tanggal_tender` dalam 7 hari ke depan AND `status_tender == 'pengajuan'`
- **Tipe notif**: `TENDER_DEADLINE_DEKAT`

---

## Model Database Baru (Django)

```python
class Notifikasi(TimeStampedModel):
    TIPE_CHOICES = [
        ('TAHAPAN_BELUM_TAGIH',     'Tahapan Selesai, Invoice Belum Tagih'),
        ('TAHAPAN_DEADLINE_LEWAT',  'Deadline Tahapan Terlewati'),
        ('INVOICE_TERLAMBAT',       'Pembayaran Invoice Terlambat'),
        ('PEKERJAAN_DEADLINE_LEWAT','Deadline Pekerjaan Terlewati'),
        ('TENDER_DEADLINE_DEKAT',   'Deadline Tender Mendekat'),
    ]
    tipe      = CharField(max_length=30, choices=TIPE_CHOICES)
    judul     = CharField(max_length=200)
    pesan     = TextField()
    pekerjaan = FK(Pekerjaan, null=True, blank=True, on_delete=SET_NULL, related_name='notifikasi')
    tahapan   = FK(Tahapan,   null=True, blank=True, on_delete=SET_NULL, related_name='notifikasi')
    invoice   = FK(Invoice,   null=True, blank=True, on_delete=SET_NULL, related_name='notifikasi')
    is_read   = BooleanField(default=False)
    # created_at, updated_at dari TimeStampedModel

    class Meta:
        ordering = ['-created_at']
```

---

## Rencana Pengerjaan (5 Fase)

| Fase | Area | Deskripsi |
|---|---|---|
| 1 | Backend | Model Notifikasi + REST API endpoints |
| 2 | Backend | Logic generator (Signals + on-the-fly checks) |
| 3 | Frontend | Service layer + Zustand store |
| 4 | Frontend | UI Components (Bell, Dropdown, Item) |
| 5 | Full-stack | Testing, polish, edge cases |

---

## Prompt untuk Agent AI

> Jalankan **secara berurutan** Fase 1 → Fase 2 → migrate → Fase 3 → Fase 4 → Fase 5

---

### PROMPT FASE 1 — Backend: Model & API

```
Kamu adalah backend developer Django.

Konteks proyek:
- Backend Django berada di: D:\Ruang Bumi\Project Management System\apps\be-ksc
- Struktur Django apps ada di folder `apps/`
- Ada apps: pekerjaan, invoice, tahapan, alat, tenaga_ahli, perusahaan, dokumen, core
- Semua model extends `TimeStampedModel` dari core (ada created_at, updated_at)
- Auth menggunakan JWT (djangorestframework-simplejwt)
- URL routing ada di config/urls.py

TUGASMU: Buat app Django baru bernama `notifikasi` untuk sistem notifikasi.

Yang harus dibuat:
1. Buat folder `apps/notifikasi/` dengan struktur standar Django app:
   - __init__.py, apps.py, models.py, serializers.py, views.py, urls.py, migrations/

2. Model `Notifikasi` (di models.py):
   - extends TimeStampedModel dari core.models
   - Field: tipe (CharField, max_length=30, choices lihat bawah)
   - Field: judul (CharField, max_length=200)
   - Field: pesan (TextField)
   - Field: pekerjaan (FK ke pekerjaan.Pekerjaan, null=True, blank=True, on_delete=SET_NULL, related_name='notifikasi')
   - Field: tahapan (FK ke pekerjaan.Tahapan, null=True, blank=True, on_delete=SET_NULL, related_name='notifikasi')
   - Field: invoice (FK ke invoice.Invoice, null=True, blank=True, on_delete=SET_NULL, related_name='notifikasi')
   - Field: is_read (BooleanField, default=False)
   - TIPE_CHOICES: 'TAHAPAN_BELUM_TAGIH', 'TAHAPAN_DEADLINE_LEWAT', 'INVOICE_TERLAMBAT', 'PEKERJAAN_DEADLINE_LEWAT', 'TENDER_DEADLINE_DEKAT'
   - Meta: ordering = ['-created_at']

3. Serializer `NotifikasiSerializer`:
   - Semua field + nama_pekerjaan (dari pekerjaan.nama_proyek), nama_tahapan (dari tahapan.nama_tahapan)
   - read-only semua field kecuali is_read

4. ViewSet `NotifikasiViewSet`:
   - GET /api/notifikasi/ → list semua notifikasi, filter by is_read query param
   - PATCH /api/notifikasi/{id}/baca/ → set is_read=True untuk satu notif
   - POST /api/notifikasi/baca-semua/ → set is_read=True semua
   - GET /api/notifikasi/jumlah-belum-baca/ → return {"count": N}

5. Daftarkan di:
   - apps/notifikasi/apps.py → AppConfig dengan name='apps.notifikasi'
   - config/settings.py → tambahkan 'apps.notifikasi' di INSTALLED_APPS
   - config/urls.py → include('apps.notifikasi.urls') dengan prefix 'api/notifikasi'

6. Buat migration: python manage.py makemigrations notifikasi

Jangan jalankan migrate, cukup makemigrations.
Tidak perlu authentication per-user — notifikasi bersifat global (satu perusahaan).
```

---

### PROMPT FASE 2 — Backend: Logic Generator Notifikasi

```
Kamu adalah backend developer Django.

Konteks:
- Backend ada di: D:\Ruang Bumi\Project Management System\apps\be-ksc
- App notifikasi sudah dibuat di apps/notifikasi/ (Fase 1 selesai)
- Model Notifikasi sudah ada dengan field: tipe, judul, pesan, pekerjaan_fk, tahapan_fk, invoice_fk, is_read
- Model Tahapan ada di apps/pekerjaan/models.py: field status ('pending','in_progress','selesai'), tanggal_selesai, nama_tahapan
- Model Invoice ada di apps/invoice/models.py: field status ('belum_tagih','menunggu_bayar','lunas','terlambat_bayar'), jatuh_tempo, nomor_invoice
- Model Pekerjaan ada di apps/pekerjaan/models.py: field status_pekerjaan ('persiapan','berjalan','selesai'), tanggal_selesai, tanggal_tender, status_tender, nama_proyek, jenis_tender

TUGASMU: Buat logic generator notifikasi.

1. Buat file `apps/notifikasi/services.py` dengan fungsi-fungsi berikut:

   a. `buat_atau_skip_notifikasi(tipe, judul, pesan, pekerjaan=None, tahapan=None, invoice=None)`
      - Cek apakah notifikasi dengan kombinasi (tipe + pekerjaan/tahapan/invoice + is_read=False) sudah ada
      - Jika belum ada → buat baru
      - Jika sudah ada → skip (jangan duplikat)
      - Return tuple (notif_object, created_bool)

   b. `cek_notifikasi_deadline_tahapan()`
      - Query semua Tahapan dimana tanggal_selesai < today DAN status != 'selesai'
      - Untuk setiap tahapan → panggil buat_atau_skip_notifikasi dengan tipe TAHAPAN_DEADLINE_LEWAT
      - Judul: "Deadline Tahapan Terlewati"
      - Pesan: f"Tahapan '{tahapan.nama_tahapan}' pada proyek '{tahapan.pekerjaan.nama_proyek}' melewati deadline pada {tanggal_selesai}"

   c. `cek_notifikasi_deadline_pekerjaan()`
      - Query semua Pekerjaan dimana tanggal_selesai < today DAN status_pekerjaan != 'selesai'
      - Untuk setiap pekerjaan → buat_atau_skip_notifikasi dengan tipe PEKERJAAN_DEADLINE_LEWAT
      - Judul: "Deadline Proyek Terlewati"
      - Pesan: f"Proyek '{pekerjaan.nama_proyek}' melewati batas waktu penyelesaian pada {tanggal_selesai}"

   d. `cek_notifikasi_deadline_tender(hari_warning=7)`
      - Query Pekerjaan dimana jenis_tender='tender', status_tender='pengajuan',
        dan tanggal_tender antara today dan today+7 hari
      - Untuk setiap tender → buat_atau_skip_notifikasi dengan tipe TENDER_DEADLINE_DEKAT
      - Judul: "Deadline Tender Mendekat"
      - Pesan: f"Tender '{pekerjaan.nama_proyek}' memiliki batas waktu pengajuan pada {tanggal_tender} ({sisa_hari} hari lagi)"

   e. `jalankan_semua_cek_deadline()`
      - Panggil ketiga fungsi cek di atas secara berurutan
      - Return dict ringkasan: {"tahapan": count, "pekerjaan": count, "tender": count}

2. Buat file `apps/notifikasi/signals.py` dengan:

   a. Signal untuk Tahapan (kondisi 1 — tahapan selesai tapi invoice belum tagih):
      - @receiver(post_save, sender=Tahapan)
      - Jika instance.status == 'selesai':
        → cek apakah semua invoice di tahapan itu statusnya 'belum_tagih' atau tidak ada invoice
        → jika ya → buat_atau_skip_notifikasi dengan tipe TAHAPAN_BELUM_TAGIH
        → Judul: "Invoice Belum Ditagihkan"
        → Pesan: f"Tahapan '{tahapan.nama_tahapan}' sudah selesai namun invoice belum ditagihkan"

   b. Signal untuk Invoice (kondisi 3 — invoice terlambat):
      - @receiver(post_save, sender=Invoice)
      - Jika instance.jatuh_tempo < today AND instance.status not in ['lunas']:
        → Update status via: Invoice.objects.filter(pk=instance.pk).update(status='terlambat_bayar')
          (WAJIB pakai .update() bukan .save() untuk hindari infinite signal loop)
        → buat_atau_skip_notifikasi dengan tipe INVOICE_TERLAMBAT
        → Judul: "Pembayaran Invoice Terlambat"
        → Pesan: f"Invoice '{invoice.nomor_invoice}' telah melewati jatuh tempo pada {jatuh_tempo}"

3. Daftarkan signals di `apps/notifikasi/apps.py`:
   - Override method ready() untuk import signals

4. Update ViewSet di apps/notifikasi/views.py:
   - Override method `list()` di NotifikasiViewSet
   - Sebelum return queryset, panggil `jalankan_semua_cek_deadline()` dari services.py
   - Ini memastikan deadline-based notifications selalu fresh saat user membuka panel notifikasi

Gunakan `from django.utils import timezone` untuk semua perbandingan tanggal.
Import models dengan lazy import di signals untuk hindari circular import.
```

---

### PROMPT FASE 3 — Frontend: Service & Zustand Store

```
Kamu adalah frontend developer Next.js + TypeScript.

Konteks:
- Frontend Next.js ada di: D:\Ruang Bumi\Project Management System\apps\ksc-nextjs\src
- API base URL diatur di lib/api.ts menggunakan axios dengan JWT interceptor
- State management menggunakan Zustand 5.x (lihat contoh pattern di stores/pekerjaanStore.ts)
- TypeScript types ada di types/index.ts
- Backend endpoint baru:
  - GET    /api/notifikasi/                      → list notifikasi
  - PATCH  /api/notifikasi/{id}/baca/            → tandai satu notif dibaca
  - POST   /api/notifikasi/baca-semua/           → tandai semua dibaca
  - GET    /api/notifikasi/jumlah-belum-baca/    → return { count: N }

TUGASMU: Buat service dan store untuk notifikasi.

1. Tambahkan types di `src/types/index.ts`:

   export type TipeNotifikasi =
     | 'TAHAPAN_BELUM_TAGIH'
     | 'TAHAPAN_DEADLINE_LEWAT'
     | 'INVOICE_TERLAMBAT'
     | 'PEKERJAAN_DEADLINE_LEWAT'
     | 'TENDER_DEADLINE_DEKAT';

   export interface Notifikasi {
     id: number;
     tipe: TipeNotifikasi;
     judul: string;
     pesan: string;
     pekerjaan: number | null;
     nama_pekerjaan: string | null;
     tahapan: number | null;
     nama_tahapan: string | null;
     invoice: number | null;
     is_read: boolean;
     created_at: string;
   }

2. Buat `src/services/notifikasi.service.ts`:
   - getAll(isRead?: boolean): Promise<Notifikasi[]>
     → GET /api/notifikasi/ dengan optional query ?is_read=false
   - getUnreadCount(): Promise<number>
     → GET /api/notifikasi/jumlah-belum-baca/ → return response.data.count
   - markAsRead(id: number): Promise<void>
     → PATCH /api/notifikasi/{id}/baca/
   - markAllAsRead(): Promise<void>
     → POST /api/notifikasi/baca-semua/

3. Buat `src/stores/notifikasiStore.ts` dengan Zustand:
   State:
   - notifikasi: Notifikasi[]
   - unreadCount: number
   - isLoading: boolean
   - error: string | null

   Actions:
   - fetchNotifikasi() → call service.getAll() + update state + hitung unreadCount
   - tandaiBaca(id: number) → optimistic update di state, lalu call service.markAsRead(id)
   - tandaiSemuaBaca() → optimistic update semua item, lalu call service.markAllAsRead()

   Gunakan pattern yang sama dengan stores/pekerjaanStore.ts yang sudah ada.

4. Buat custom hook `src/hooks/useNotifikasi.ts`:
   - Jalankan fetchNotifikasi() saat mount
   - Poll fetchNotifikasi() setiap 60000ms (60 detik) dengan setInterval
   - Cleanup interval saat unmount
   - Cek authStore — jangan poll jika user belum login (tidak ada token)
   - Expose: { notifikasi, unreadCount, isLoading, tandaiBaca, tandaiSemuaBaca, refresh }

Ikuti TypeScript strict yang sudah ada di codebase.
Gunakan axios instance dari lib/api.ts (bukan fetch langsung).
```

---

### PROMPT FASE 4 — Frontend: UI Components

```
Kamu adalah frontend developer Next.js + TypeScript + Tailwind CSS dan Backend Django developer.

Konteks:
- Frontend ada di: D:\Ruang Bumi\Project Management System\apps\ksc-nextjs\src
- Backend Django ada di D:\Ruang Bumi\Project Management System\apps\be-ksc
- UI menggunakan ShadcN UI (Radix UI primitives) + Tailwind CSS
- Baca dulu file src/components/layout/Topbar.tsx sebelum mulai
- Zustand store notifikasi sudah ada di src/stores/notifikasiStore.ts
- Hook useNotifikasi sudah ada di src/hooks/useNotifikasi.ts
- Toast menggunakan Sonner (sudah installed), import: import { toast } from 'sonner'
- Icons menggunakan lucide-react (sudah installed)

TUGASMU: Buat UI components untuk sistem notifikasi.

1. Buat `src/components/NotificationBell.tsx`:
   - Button dengan icon Bell dari lucide-react
   - Badge merah di pojok kanan atas menampilkan unreadCount (sembunyikan jika 0)
   - Klik buka/tutup panel menggunakan Popover dari ShadcN UI (@/components/ui/popover)
   - Di dalam Popover render komponen NotificationPanel

2. Buat `src/components/NotificationPanel.tsx`:
   - Header "Notifikasi" di kiri + tombol "Tandai Semua Dibaca" di kanan
   - Jika notifikasi kosong → tampilkan empty state (icon Bell, teks "Tidak ada notifikasi")
   - List NotificationItem, max-height 400px dengan overflow-y-auto
   - Pisahkan section "Belum Dibaca" dan "Sudah Dibaca" jika keduanya ada isinya

3. Buat `src/components/NotificationItem.tsx`:
   Props: notif (Notifikasi), onRead: (id: number) => void

   Icon per tipe (dari lucide-react):
   - TAHAPAN_BELUM_TAGIH     → FileText  (warna amber/kuning)
   - TAHAPAN_DEADLINE_LEWAT  → Clock     (warna merah)
   - INVOICE_TERLAMBAT       → AlertCircle (warna merah)
   - PEKERJAAN_DEADLINE_LEWAT → AlertTriangle (warna merah)
   - TENDER_DEADLINE_DEKAT   → Calendar  (warna biru)

   Layout item:
   - Background: is_read=false → bg-blue-50, is_read=true → bg-white
   - Tampilkan: judul (font-semibold), pesan (text-sm text-gray-600), waktu relatif (text-xs text-gray-400)
   - Jika ada nama_pekerjaan → tampilkan sebagai badge kecil (text-xs, bg-gray-100, rounded)
   - Klik seluruh item → panggil onRead(notif.id)

4. Update `src/components/layout/Topbar.tsx`:
   - Import NotificationBell
   - Pasang NotificationBell di area kanan topbar, sebelum avatar/profil user
   - Gunakan hook useNotifikasi di Topbar untuk menyuplai data ke NotificationBell

5. Tambahkan toast trigger di `src/app/providers.tsx` atau di useNotifikasi hook:
   - Setiap kali fetchNotifikasi() selesai dan ada notifikasi baru (is_read=false yang belum di-toast),
     tampilkan toast() dari 'sonner'
   - Gunakan toast.error() untuk tipe deadline/terlambat, toast.warning() untuk TAHAPAN_BELUM_TAGIH,
     toast.info() untuk TENDER_DEADLINE_DEKAT
   - Simpan ID notifikasi yang sudah di-toast di useRef untuk hindari duplikat toast

Semua komponen harus TypeScript strict.
Ikuti styling pattern yang ada di komponen ShadcN lain di codebase.
```

---

### PROMPT FASE 5 — Testing & Polish

```
Kamu adalah full-stack developer.

Konteks:
- Backend Django: D:\Ruang Bumi\Project Management System\apps\be-ksc
- Frontend Next.js: D:\Ruang Bumi\Project Management System\apps\ksc-nextjs\src
- Sistem notifikasi sudah diimplementasikan di Fase 1-4

TUGASMU: Verifikasi dan polish sistem notifikasi.

1. Backend — Verifikasi semua endpoint:
   - Baca apps/notifikasi/views.py dan pastikan response format konsisten:
     { id, tipe, judul, pesan, nama_pekerjaan, nama_tahapan, invoice, is_read, created_at }
   - Pastikan endpoint sudah ter-include di config/urls.py dengan prefix yang benar
   - Pastikan JWT authentication sudah diterapkan di ViewSet (IsAuthenticated permission)

2. Backend — Tambahkan management command (untuk cron job di production):
   - Buat: apps/notifikasi/management/__init__.py
   - Buat: apps/notifikasi/management/commands/__init__.py
   - Buat: apps/notifikasi/management/commands/cek_notifikasi.py
   - Command ini memanggil jalankan_semua_cek_deadline() dari services.py
   - Bisa dijalankan via: python manage.py cek_notifikasi

3. Frontend — Error handling:
   - Di useNotifikasi hook: wrap fetch dalam try/catch, jangan crash jika network error
   - Di notifikasiStore: jika markAsRead gagal → rollback optimistic update
   - Di NotificationPanel: tampilkan loading skeleton saat isLoading=true

4. Frontend — Verifikasi tidak ada memory leak:
   - Baca hooks/useNotifikasi.ts dan pastikan clearInterval dipanggil saat unmount
   - Pastikan interval tidak berjalan ketika user logout

5. Edge cases yang harus diverifikasi secara manual:
   a. Buka panel notifikasi → klik "Tandai Semua Dibaca" → badge count jadi 0
   b. Tahapan yang sudah selesai tapi invoicenya diisi kemudian → notif TAHAPAN_BELUM_TAGIH hilang (is_read atau resolved)
   c. Invoice yang sudah lunas → tidak ada notif terlambat
   d. Notifikasi dari tahapan yang dihapus → tidak menyebabkan error (FK SET_NULL sudah benar)

Laporkan perubahan yang dibuat dan temuan yang perlu perhatian developer.
```

---

## Urutan Eksekusi

```
1. Jalankan PROMPT FASE 1 (Backend: Model & API)
2. Jalankan PROMPT FASE 2 (Backend: Logic Generator)
3. Jalankan di server Django:
      python manage.py makemigrations notifikasi
      python manage.py migrate
4. Test manual: GET http://localhost:8000/api/notifikasi/
5. Jalankan PROMPT FASE 3 (Frontend: Service & Store)
6. Jalankan PROMPT FASE 4 (Frontend: UI Components)
7. Jalankan PROMPT FASE 5 (Testing & Polish)
```

---

## Rekomendasi & Saran

### Yang Wajib Diperhatikan

1. **Hindari duplikasi notifikasi** — fungsi `buat_atau_skip_notifikasi()` di Fase 2 adalah kunci.
   Tanpa ini, setiap kali user buka panel notifikasi, deadline yang sama akan terus menghasilkan notif baru.

2. **Signal `Invoice` hati-hati infinite loop** — saat update status invoice ke `terlambat_bayar`
   dari dalam signal, WAJIB gunakan:
   ```python
   Invoice.objects.filter(pk=instance.pk).update(status='terlambat_bayar')
   ```
   Bukan `instance.save()`, karena `instance.save()` akan trigger signal lagi secara rekursif.

3. **Polling hanya saat user login** — di `useNotifikasi` hook, cek `authStore` sebelum mulai polling.
   Jangan poll jika token tidak ada.

4. **Notifikasi tender (kondisi 5) — field yang dipakai**: `pekerjaan.tanggal_tender` dan
   `pekerjaan.status_tender == 'pengajuan'`. Warning window 7 hari bisa dijadikan configurable di settings.

### Saran Tambahan (Future)

- Tambahkan field `link` di model Notifikasi → bisa langsung navigasi ke halaman terkait saat klik notif
- Tambahkan filter per kategori di panel notifikasi (deadline / invoice / tender)
- Pertimbangkan auto-delete notifikasi yang sudah >30 hari untuk jaga performa DB
- Jika user base berkembang (multi-user), tambahkan FK `user` di model Notifikasi agar tiap user punya notif sendiri
