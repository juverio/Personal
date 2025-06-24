// juverio/personal/Personal-7a4bec6da379fef0a96520e220c1c81713745155/routes/transactionRoutes.js

import express from 'express';
// --- MODIFIKASI: Impor showTransactionPage dan createTransaction ---
// Mengapa: Kita perlu mengimpor fungsi `createTransaction` karena route baru ini akan menggunakannya.
// (Meskipun `createTransaction` belum kita tulis, kita akan menuliskannya di langkah berikutnya di controller.
// Import ini memberitahu Node.js untuk 'mengharapkan' fungsi itu dari file controller.)
import { showTransactionPage, createTransaction } from '../controllers/transactionController.js';
import isAuthenticated from '../middleware/authMiddleware.js';

const router = express.Router();

// Route yang sudah ada untuk menampilkan halaman transaksi (GET request)
router.get('/transaction', isAuthenticated, showTransactionPage);

// --- RUTE BARU: Untuk membuat transaksi baru (POST request) ---
// Mengapa:
// 1. `router.post()`: Menunjukkan bahwa route ini akan menangani permintaan HTTP POST,
//    yang digunakan untuk mengirim data ke server untuk dibuat sumber daya baru.
// 2. `'/create'`: Ini adalah path URL spesifik yang akan didengar oleh route ini.
//    (Frontend Anda di `public/transaction.js` sekarang mengirim permintaan ke `/type/create`).
// 3. `isAuthenticated`: Ini adalah middleware yang memastikan bahwa hanya pengguna yang
//    sudah login (terautentikasi) yang dapat mengakses dan mengirim data ke route ini.
// 4. `createTransaction`: Ini adalah fungsi controller yang akan dipanggil ketika
//    permintaan POST diterima di `/type/create`. Fungsi inilah yang akan
//    melakukan logika penyimpanan data ke database.
router.post('/create', isAuthenticated, createTransaction);

export default router;