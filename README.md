# Kantong – Aplikasi Keuangan Pribadi

Web app sederhana untuk mencatat pemasukan dan pengeluaran. HTML + CSS + JavaScript murni, tanpa server sendiri. Login dan data memakai Supabase, hosting memakai GitHub Pages.

Struktur file:

```
index.html            halaman aplikasi
style.css             tampilan (responsif, mendukung mode gelap)
app.js                logika aplikasi
config.js             URL dan kunci Supabase (isi sendiri)
supabase-schema.sql   tabel + Row Level Security
```

## 1. Buat project Supabase

1. Daftar/masuk di https://supabase.com, lalu klik **New project**.
2. Isi nama (mis. `kantong`), buat **Database Password** (simpan), pilih region terdekat (mis. Singapore).
3. Tunggu sampai project selesai dibuat (1–2 menit).

## 2. Buat tabel dan Row Level Security

1. Menu kiri → **SQL Editor** → **New query**.
2. Salin seluruh isi `supabase-schema.sql`, tempel, klik **Run**.
3. Cek di **Table Editor**: tabel `transactions` muncul, dan ada label **RLS enabled**.

Skrip ini membuat tabel dan empat policy (select/insert/update/delete) yang membatasi akses hanya ke baris milik pengguna yang sedang login (`user_id = auth.uid()`). Kolom `user_id` terisi otomatis dari sesi login, jadi aplikasi tidak perlu mengirimnya.

Kategori disimpan sebagai teks. Untuk mengubah daftar kategori, edit objek `CATS` di `app.js`.

## 3. Atur Authentication

1. **Authentication → Sign In / Providers**: pastikan **Email** aktif.
2. **Confirm email**:
   - Aktif (default): pengguna harus klik link di email sebelum bisa masuk. Lebih aman.
   - Nonaktif: pengguna bisa langsung masuk setelah daftar. Praktis untuk pemakaian pribadi.
3. **Authentication → URL Configuration**:
   - **Site URL**: isi URL GitHub Pages Anda, mis. `https://USERNAME.github.io/kantong/`
   - **Redirect URLs**: tambahkan URL yang sama, dan `http://localhost:8000` untuk uji lokal.

   Tanpa ini, link konfirmasi email akan mengarah ke alamat yang salah.
4. Jika ingin aplikasi hanya untuk Anda sendiri, setelah mendaftar akun, matikan **Allow new users to sign up** di pengaturan Authentication.

## 4. Ambil konfigurasi API

1. **Project Settings → API** (atau **API Keys**).
2. Salin **Project URL** (`https://xxxx.supabase.co`).
3. Salin kunci **anon** (atau **publishable**, berawalan `sb_publishable_`).
4. Buka `config.js` dan isi:

```js
const SUPABASE_URL = "https://xxxx.supabase.co";
const SUPABASE_ANON_KEY = "kunci-anon-anda";
```

Catatan keamanan: kunci anon/publishable memang dirancang untuk terlihat di browser, karena data dilindungi RLS. **Jangan pernah** memakai kunci `service_role` atau `secret` di file ini, karena kunci tersebut melewati RLS.

## 5. Uji di komputer

```bash
cd kantong
python3 -m http.server 8000
```

Buka http://localhost:8000, daftar akun, lalu coba catat transaksi.

Tes RLS: daftar dengan dua email berbeda. Data akun A tidak boleh terlihat di akun B.

## 6. Deploy ke GitHub Pages

1. Buat repository baru di GitHub (mis. `kantong`), publik.
2. Upload semua file (`index.html`, `style.css`, `app.js`, `config.js`) ke root repository. Atau lewat terminal:

```bash
cd kantong
git init
git add index.html style.css app.js config.js README.md supabase-schema.sql
git commit -m "Kantong pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/kantong.git
git push -u origin main
```

3. Di GitHub: **Settings → Pages**. Pada **Build and deployment**, pilih **Source: Deploy from a branch**, branch `main`, folder `/ (root)`, klik **Save**.
4. Tunggu 1–2 menit. Alamat aplikasi: `https://USERNAME.github.io/kantong/`
5. Pastikan URL ini sudah dimasukkan di **Site URL** Supabase (langkah 3).

Tips di HP: buka URL di Chrome/Safari, lalu pilih **Tambahkan ke layar utama** supaya terasa seperti aplikasi.

## Pemecahan masalah

| Masalah | Solusi |
|---|---|
| "Invalid API key" | `config.js` salah isi, atau ada spasi/kutip yang terbawa. |
| Gagal menyimpan: `new row violates row-level security policy` | Skrip SQL belum dijalankan penuh, atau Anda belum login. |
| Setelah daftar tidak bisa masuk | Konfirmasi email dulu (cek folder spam), atau matikan **Confirm email**. |
| Link email membuka `localhost` | Perbaiki **Site URL** di URL Configuration. |
| Halaman kosong di GitHub Pages | Cek **Settings → Pages**; pastikan `index.html` ada di root. |
| Perubahan tidak muncul | Tunggu proses deploy selesai (tab **Actions**), lalu muat ulang paksa (Ctrl+Shift+R). |
