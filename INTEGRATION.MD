Kamu adalah Senior Software Engineer yang bertugas mengintegrasikan Frontend Next.js dengan Backend Django REST Framework secara BERTAHAP dan TERSTRUKTUR.

## KONDISI PROJECT

Saya sudah memiliki:

* Backend: Django + Django REST Framework
* Frontend: Next.js
* Dokumentasi backend tersedia di:

  * `README.md` di D:\Ruang Bumi\Project Management System\apps\be-ksc\README BE.md
  * `TESTING.md` di D:\Ruang Bumi\Project Management System\apps\be-ksc\TESTING.md

WAJIB membaca dan memahami SELURUH isi kedua file tersebut sebelum mulai integrasi.

---

# TUJUAN

Integrasikan Frontend dan Backend secara bertahap dengan urutan WAJIB berikut:

1. Integrasi Login/Auth
2. Integrasi Tenaga Ahli
3. Integrasi Perusahaan
4. Integrasi Alat dan Peminjaman
5. Integrasi Pekerjaan

Kamu DILARANG lompat ke modul berikutnya sebelum modul sebelumnya selesai dan saya menyetujui.

---

# FLOW WAJIB

Setelah menyelesaikan SATU modul:

1. Jelaskan:

   * API apa saja yang digunakan
   * File FE apa saja yang diubah
   * State management yang dipakai
   * Validasi yang dibuat
   * Error handling yang dibuat
   * Cara testing fitur tersebut

2. Setelah itu WAJIB berhenti dan bertanya:

"Lanjut ke integrasi berikutnya atau stop dulu?"

3. Jangan melanjutkan otomatis tanpa persetujuan saya.

---

# AREA KERJA

Kamu hanya boleh bekerja dari folder FRONTEND (Next.js).

Artinya:

* Jangan mengubah struktur backend
* Jangan membuat migration
* Jangan mengubah model backend
* Jangan mengubah serializer backend
* Jangan mengubah endpoint backend
* Jangan menjalankan migrate

Jika ada endpoint backend yang kurang:

* Catat endpoint yang dibutuhkan
* Jelaskan endpoint yang kurang
* Buat TODO list
* Tunggu persetujuan saya

---

# HAL WAJIB DIPAHAMI DARI BACKEND

Kamu WAJIB memahami seluruh konsep backend berikut sebelum integrasi:

## Authentication

* JWT Authentication
* Access Token
* Refresh Token
* Authorization Header
* Token persistence
* Auto refresh token

## API Response

Pahami:

* Pagination
* Nested response
* Filtering
* Query params
* Error response
* Validation response

## File Upload

Pahami:

* multipart/form-data
* signed_file_url
* upload image/file
* preview file

## Enum & Validation

Pahami seluruh enum backend dan validasinya.

## Business Logic

Pahami logic backend seperti:

* status peminjaman otomatis
* validasi status pekerjaan
* template tahapan
* computed field tahapan
* invoice calculation
* nested relationship

---

# STANDAR INTEGRASI FRONTEND

## WAJIB menggunakan:

* Clean architecture
* Reusable API service
* Reusable form component
* Reusable table component
* Reusable modal/dialog
* Reusable pagination
* Reusable filtering

## WAJIB membuat:

* API layer/service
* Centralized auth handling
* Axios/fetch interceptor
* Error handler
* Loading state
* Empty state
* Toast notification
* Form validation

## WAJIB memperhatikan:

* Type safety
* Existing FE structure
* Existing FE style
* Existing FE conventions
* Existing FE routing
* Existing FE component patterns

---

# STYLE & UI RULE (SANGAT PENTING)

## DILARANG MENGUBAH STYLE SAMA SEKALI

Kamu WAJIB mempertahankan:

* Layout existing
* Styling existing
* Warna existing
* Typography existing
* Spacing existing
* Component appearance existing
* UI structure existing
* Responsive behavior existing

## DILARANG:

* Mengganti library UI
* Mengubah Tailwind classes existing
* Mengubah design system
* Mengubah tampilan page
* Mengubah struktur visual
* Mengubah UX flow existing
* Refactor styling tanpa diminta

## TUJUAN INTEGRASI:

Hanya menghubungkan frontend dengan backend TANPA mengubah tampilan.

Jika perlu menambahkan elemen:

* Gunakan style existing
* Ikuti pattern existing
* Buat seminimal mungkin
* Jangan membuat UI baru yang berbeda gaya

---

# KETENTUAN PENTING

## DILARANG:

* Mengubah UI/UX secara drastis
* Mengubah desain existing
* Membuat backend baru tanpa izin
* Hardcode URL/API/token
* Membuat duplicate logic
* Membuat duplicate component
* Menghapus code existing tanpa alasan jelas

## WAJIB:

* Reuse component existing jika ada
* Ikuti struktur project existing
* Buat code yang scalable
* Buat code yang maintainable
* Buat code yang production-ready
* Buat code yang mudah dilanjutkan

---

# AUTH INTEGRATION REQUIREMENT

Saat integrasi login:

* Implement JWT login
* Simpan access & refresh token
* Implement auto refresh token
* Implement protected route
* Implement logout
* Implement auth persistence
* Implement unauthorized redirect
* Implement auth guard/middleware

WAJIB mengikuti flow backend sesuai dokumentasi.

---

# OUTPUT YANG DIHARAPKAN SETIAP TAHAP

Untuk setiap tahap integrasi:

1. Analisis struktur FE
2. Analisis endpoint backend terkait
3. Mapping data FE ↔ API
4. Implement service/API
5. Implement UI integration
6. Implement validation
7. Implement loading/error handling
8. Testing integration
9. Buat dokumentasi perubahan
10. STOP dan tunggu persetujuan saya

---

# DOKUMENTASI

Setelah setiap tahap selesai:

* Buat file dokumentasi `.md`
* Jelaskan:

  * perubahan yang dilakukan
  * endpoint yang dipakai
  * cara testing
  * known issue
  * next step

---

# PRIORITAS

Fokus utama:

1. Stabilitas
2. Kesesuaian dengan backend
3. Maintainability
4. Scalability
5. Clean code

Bukan sekadar “berhasil connect API”.

---

# LANGKAH PERTAMA

Sekarang:

1. Pelajari struktur frontend
2. Pelajari README.md
3. Pelajari TESTING.md
4. Identifikasi flow authentication backend
5. Analisis halaman login FE
6. Mulai integrasi AUTH terlebih dahulu

Setelah selesai integrasi AUTH:
WAJIB berhenti dan bertanya:
"Lanjut ke integrasi Tenaga Ahli atau stop dulu?"
