# Integrasi Auth — JWT Login/Logout

## Perubahan yang Dilakukan

### File Baru

| File | Keterangan |
|------|-----------|
| `src/stores/authStore.ts` | Zustand store untuk JWT auth state dengan localStorage persistence |
| `src/lib/api.ts` | Axios instance dengan interceptor auto-inject token dan auto-refresh |
| `src/services/auth.service.ts` | Service layer untuk endpoint auth (login, refresh) |
| `src/middleware.ts` | Next.js middleware untuk route protection |
| `docs/AUTH_INTEGRATION.md` | Dokumentasi ini |

### File Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/app/login/page.tsx` | Ganti mock auth → real JWT via `useAuthStore.login()`, field email → username |
| `src/components/layout/Topbar.tsx` | Logout menggunakan `useAuthStore.logout()`, tampilkan username dari auth state |
| `src/app/providers.tsx` | Tambah `AuthSync` component untuk sync localStorage ↔ cookie |
| `package.json` | Tambah dependency `axios` |

---

## Endpoint yang Digunakan

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/auth/token/` | Login — mendapatkan access & refresh token |
| `POST` | `/api/auth/token/refresh/` | Refresh access token yang expired |

### Request/Response

**Login:**
```
POST /api/auth/token/
Body: { "username": "admin", "password": "password123" }
Response: { "access": "eyJ...", "refresh": "eyJ..." }
```

**Refresh:**
```
POST /api/auth/token/refresh/
Body: { "refresh": "eyJ..." }
Response: { "access": "eyJ..." }
```

**Semua request authenticated:**
```
Authorization: Bearer {access_token}
```

---

## Arsitektur

```
Login Page
    └── useAuthStore.login(username, password)
            └── fetch POST /api/auth/token/        ← langsung fetch (bukan via api.ts)
            └── simpan token ke Zustand + localStorage
            └── set cookie ksc-auth-status=true

api.ts (Axios instance)
    ├── Request interceptor: inject Authorization header dari authStore
    └── Response interceptor: handle 401
            ├── Panggil authStore.refreshAccessToken()
            ├── Retry request dengan token baru
            └── Jika refresh gagal → clearAuth + redirect /login

middleware.ts (Next.js Edge Middleware)
    └── Baca cookie ksc-auth-status
    ├── Jika authenticated + akses /login → redirect /
    └── Jika tidak authenticated + akses protected route → redirect /login
```

---

## State Management

`useAuthStore` (Zustand + persist ke `localStorage['ksc-auth']`):

```typescript
{
  accessToken: string | null    // JWT access token
  refreshToken: string | null   // JWT refresh token
  user: { username: string } | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
```

**Persistence:** Token disimpan di `localStorage` key `ksc-auth` via Zustand persist.

**Cookie sync:** Cookie `ksc-auth-status=true` di-set untuk dibaca oleh Next.js middleware (Edge Runtime tidak bisa baca localStorage).

---

## Cara Testing

### 1. Pastikan backend berjalan
```bash
cd apps/be-ksc
python manage.py runserver
```

### 2. Buat superuser (jika belum ada)
```bash
python manage.py createsuperuser
# username: admin
# password: password123
```

### 3. Test login
1. Buka `http://localhost:3000/login`
2. Masukkan username dan password
3. Pastikan redirect ke `/` setelah berhasil
4. Cek di browser: `localStorage['ksc-auth']` dan cookie `ksc-auth-status`

### 4. Test protected route
1. Hapus cookie `ksc-auth-status` di browser
2. Refresh halaman → harus redirect ke `/login`

### 5. Test logout
1. Klik menu user → Keluar
2. Harus redirect ke `/login`
3. Cek cookie dan localStorage sudah terhapus

### 6. Test auto-refresh (advanced)
1. Login dan catat token
2. Tunggu access token expire (default Django: 5 menit)
3. Lakukan request ke API
4. Interceptor harus auto-refresh dan retry request

---

## Known Issues

1. **Timing cookie pada first load:** Middleware membaca cookie saat request masuk (server-side), namun Zustand rehydrate dari localStorage terjadi di client-side. Ada jeda kecil di mana middleware mungkin belum tahu status auth yang benar. `AuthSync` component di providers.tsx memitigasi ini, tapi bukan solusi sempurna.

2. **Token expiry:** Access token Django defaultnya singkat (5 menit). Jika browser tab diam lama lalu ada request, interceptor akan handle refresh otomatis. Tapi jika refresh token juga expired → user akan di-redirect ke login.

3. **Field login adalah username, bukan email:** Backend Django menggunakan `username`, bukan `email`. User harus login dengan username Django yang dibuat via `createsuperuser`.

---

## Next Step

Modul berikutnya sesuai urutan INTEGRATION.MD: **Integrasi Tenaga Ahli**

Endpoint yang akan digunakan:
- `GET /api/tenaga-ahli/` — list
- `POST /api/tenaga-ahli/` — tambah (form-data jika ada foto)
- `GET /api/tenaga-ahli/{id}/` — detail
- `PUT/PATCH /api/tenaga-ahli/{id}/` — update
- `DELETE /api/tenaga-ahli/{id}/` — hapus
- `POST /api/sertifikat/` — upload sertifikat
- `GET /api/sertifikat/?tenaga_ahli={uuid}` — list sertifikat
