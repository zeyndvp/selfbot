# WhatsApp Bot - Multi-featured Baileys Bot

Bot WhatsApp ini dibangun menggunakan [Baileys](https://github.com/adiwajshing/Baileys), pustaka powerful untuk berinteraksi dengan WhatsApp Web API. Bot ini dirancang dengan struktur modular, memungkinkan penambahan plugin baru dengan sangat mudah dan fleksibel.

## ✨ Fitur Utama
- **Sistem Plugin Modular**: Tambahkan fitur hanya dengan membuat file baru di folder `plugins/`.
- **Auto Presence**: Menyimulasikan aktivitas pengguna seperti mengetik, membaca pesan, dan online status.
- **Logger Warna**: Menampilkan log perintah dengan warna berbeda untuk kemudahan debugging.
- **Upload Status/Story**: Kirim teks atau media ke status pribadi dan story grup dengan atau tanpa mention.
- **Prefix & Command Handler**: Mendukung banyak prefix dan command sekaligus.
- **Support Private & Group Chat**
- **Anti Blacklist**: Pengirim yang diblacklist tidak diproses.
- **Auto React di Status**: Memberi reaksi otomatis di status kontak.

## 🧩 Contoh Plugin
Buat plugin baru dalam folder `plugins/` seperti ini:

```js
export default {
  name: "Testing",
  command: ["test", "testing"],
  models: "%prefix%command",
  run: async (m, { sock }) => {
    await m.reply(`Halo ${m.pushName}, ini fitur test!`);
  }
}
```

## ⚙️ Konfigurasi
Pengaturan utama bot disimpan di file `setting.js`:

```js
export default {
  owner: ["628xxx"],
  botName: "WhatsApp Bot",
  prefix: [".", "/", "!"]
};
```

## 💬 Daftar Command Utama
| Command     | Deskripsi                                 |
|-------------|-------------------------------------------|
| .test       | Menjalankan fitur testing                 |
| .upsw       | Upload status ke story atau grup          |
| .menu       | Menampilkan daftar menu                   |
| .ping       | Mengecek status bot                       |
| .owner      | Informasi kontak pemilik bot              |

## 🚀 Cara Menjalankan
1. Clone repositori ini:
   ```bash
   git clone https://github.com/username/repo-name
   cd repo-name
   ```
2. Install dependency:
   ```bash
   npm install
   ```
3. Jalankan bot:
   ```bash
   node index.js
   ```

## 📁 Struktur Direktori
```
├── lib/            # Fungsi bantuan
├── plugins/        # Folder tempat plugin dibuat
├── store/          # Data cache & story
├── setting.js      # Pengaturan utama bot
├── handler.js      # Message handler utama
├── connection.js   # Koneksi ke WhatsApp
```

## 📸 Contoh Log
```
[ CMD ] 06/04/25 14:21:30  conversation  from [6281234567890]  Aldi  in [120363123456789@g.us]  WhatsApp Bot
```

## 👑 Thanks To
- **Lutfi Joestars** – Referensi dan pemilik dasar code awal
- **Zeyn** – Owner utama project ini
- **Baileys Team** – Library WhatsApp Web paling powerful
- **Developer komunitas open source** yang selalu menginspirasi

---

> Dibuat dengan ❤️ untuk komunitas bot WhatsApp
