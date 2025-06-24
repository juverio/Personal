import {
  Transaksi, Pembelian, Penjualan,
  User, Inventori, ArusKas, DetailPembelian, DetailPenjualan
} from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../database/sequelize.js';

// Existing showTransactionPage function
const showTransactionPage = async (req, res) => {
  const { type, startDate, endDate, search, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;

  let whereClause = { user_id: req.session.user.id };

  if (type) {
    if (type === 'pembelian') {
      whereClause.jenis_transaksi = 'pengeluaran';
    } else if (type === 'penjualan') {
      whereClause.jenis_transaksi = 'pemasukan';
    }
  }

  if (startDate && endDate) {
    whereClause.tanggal = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  } else if (startDate) {
    whereClause.tanggal = {
      [Op.gte]: new Date(startDate)
    };
  } else if (endDate) {
    whereClause.tanggal = {
      [Op.lte]: new Date(endDate)
    };
  }

  try {
    let transactions = [];
    let totalTransactions = 0;

    let includeClause = [];
    if (type === 'pembelian') {
      includeClause.push({ model: Pembelian, as: 'pembelian' });
    } else if (type === 'penjualan') {
      includeClause.push({ model: Penjualan, as: 'penjualan' });
    }

    if (search) {
      const searchCondition = {
        [Op.or]: [
          { '$pembelian.nama$': { [Op.like]: `%${search}%` } },
          { '$penjualan.nama$': { [Op.like]: `%${search}%` } },
          { deskripsi: { [Op.like]: `%${search}%` } }
        ]
      };
      whereClause = { ...whereClause, ...searchCondition };
    }

    const { count, rows } = await Transaksi.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['tanggal', 'DESC']],
      distinct: true
    });

    transactions = rows;
    totalTransactions = count;

    const totalPages = Math.ceil(totalTransactions / limit);

    res.render('transaction', {
      user: req.session.user,
      transaksiList: transactions,
      currentPage: parseInt(page),
      totalPages: totalPages,
      query: req.query
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).render('error', { message: 'Failed to load transactions.' });
  }
};

// --- NEW FUNCTION: createTransaction ---
// Why: This function handles the actual saving of transaction data to the database.
const createTransaction = async (req, res) => {
  // Why: Destructure (ambil) semua data yang dikirim dari frontend
  const {
    inputDate,      // Tgl. Input Transaksi
    dueDate,        // Tgl. Jatuh Tempo
    invoiceCode,    // Kode Invoice
    docType,        // Jenis Dok. Transaksi (e.g., 'Pembelian', 'Penjualan')
    supplierName,   // Nama Supplier/Cust
    invoiceDate,    // Tanggal Invoice
    items,          // Array dari objek item (daftar barang yang ditambahkan)
    jenis_transaksi // 'pemasukan' atau 'pengeluaran' (ditentukan di frontend)
  } = req.body;

  // Why: Mendapatkan user_id dari sesi (disediakan oleh middleware isAuthenticated)
  const userId = req.session.user.id;

  // --- Start a Sequelize Transaction ---
  // Why: Memulai transaksi database untuk memastikan operasi atomik.
  // Ini berarti semua langkah dalam blok try{} akan dianggap sebagai satu unit.
  // Jika ada satu langkah yang gagal, semua perubahan akan di-rollback.
  const t = await sequelize.transaction();

  try {
    // 1. Membuat record Transaksi utama
    // Why: Ini adalah entri utama yang mengikat pembelian/penjualan ke user dan tanggal.
    // Jumlahnya akan diperbarui nanti setelah menghitung total item.
    const newTransaksi = await Transaksi.create({
      user_id: userId,
      tanggal: new Date(inputDate), // Mengubah string tanggal menjadi objek Date
      jenis_transaksi: jenis_transaksi, // Contoh: 'pemasukan' atau 'pengeluaran'
      jumlah: 0, // Placeholder, akan diperbarui setelah menghitung total item
      deskripsi: `Transaksi ${docType} Invoice ${invoiceCode} from/to ${supplierName || 'N/A'}`
    }, { transaction: t }); // Pastikan operasi ini bagian dari transaksi 't'

    let parentTransaction; // Ini akan menyimpan objek Pembelian atau Penjualan yang dibuat
    let totalTransactionAmount = 0; // Mengakumulasi total biaya/penjualan dari semua item

    // 2. Membuat record Pembelian atau Penjualan, terkait dengan Transaksi
    // Why: Memisahkan detail pembelian dan penjualan.
    if (jenis_transaksi === 'pengeluaran') { // Jika jenis transaksi adalah pengeluaran, berarti ini Pembelian
      parentTransaction = await Pembelian.create({
        transaksi_id: newTransaksi.transaksi_id, // Mengaitkan ke Transaksi yang baru dibuat
        user_id: userId,
        nama: supplierName,
        tanggal_pembelian: new Date(invoiceDate),
        total_biaya: 0, // Placeholder, akan diperbarui nanti
        status_pengiriman: 'Diproses' // Status default untuk Pembelian
      }, { transaction: t });
    } else { // Jika jenis transaksi adalah pemasukan, berarti ini Penjualan
      parentTransaction = await Penjualan.create({
        transaksi_id: newTransaksi.transaksi_id, // Mengaitkan ke Transaksi yang baru dibuat
        user_id: userId,
        tanggal_penjualan: new Date(invoiceDate),
        total_penjualan: 0, // Placeholder, akan diperbarui nanti
        status_pengiriman: 'Dikirim' // Status default untuk Penjualan
      }, { transaction: t });
    }

    // 3. Memproses setiap item: Membuat record Detail dan memperbarui stok Inventori
    // Why: Ini adalah inti dari transaksi, di mana setiap barang diproses.
    for (const item of items) {
      // Mencari item yang sesuai di Inventori untuk memperbarui stoknya
      const inventoriItem = await Inventori.findOne({
        where: { kode_barang: item.kode_barang },
        transaction: t // Pastikan pencarian ini juga bagian dari transaksi 't'
      });

      if (!inventoriItem) {
        // Why: Jika barang tidak ditemukan di inventori, batalkan transaksi dan beri tahu frontend.
        throw new Error(`Barang dengan kode '${item.kode_barang}' tidak ditemukan di inventori.`);
      }

      if (jenis_transaksi === 'pengeluaran') { // Jika Pembelian (pengeluaran kas)
        // Membuat record DetailPembelian
        await DetailPembelian.create({
          pembelian_id: parentTransaction.pembelian_id,
          inventori_id: inventoriItem.inventori_id,
          kode_barang: item.kode_barang,
          nama_barang: item.nama_barang,
          bagian: item.bagian,
          qty: item.qty,
          disc: item.disc,
          harga_satuan: item.harga_satuan,
          subtotal: item.subtotal
        }, { transaction: t });

        // Memperbarui stok inventori: menambah jumlah untuk pembelian
        await inventoriItem.update({
          jumlah_stok: inventoriItem.jumlah_stok + item.qty
        }, { transaction: t });

      } else { // Jika Penjualan (pemasukan kas)
        // Why: Periksa stok sebelum mengurangi
        if (inventoriItem.jumlah_stok < item.qty) {
            throw new Error(`Stok barang '${item.nama_barang}' tidak cukup. Tersedia: ${inventoriItem.jumlah_stok}, Diminta: ${item.qty}.`);
        }
        // Membuat record DetailPenjualan
        await DetailPenjualan.create({
          penjualan_id: parentTransaction.penjualan_id,
          inventori_id: inventoriItem.inventori_id,
          kode_barang: item.kode_barang,
          nama_barang: item.nama_barang,
          bagian: item.bagian,
          qty: item.qty,
          disc: item.disc,
          harga_satuan: item.harga_satuan,
          subtotal: item.subtotal
        }, { transaction: t });

        // Memperbarui stok inventori: mengurangi jumlah untuk penjualan
        await inventoriItem.update({
          jumlah_stok: inventoriItem.jumlah_stok - item.qty
        }, { transaction: t });
      }
      totalTransactionAmount += item.subtotal; // Akumulasi total dari semua subtotal item
    }

    // 4. Memperbarui kolom total di transaksi induk (Pembelian atau Penjualan)
    // Why: Mengisi nilai total yang sebenarnya setelah semua item diproses.
    if (jenis_transaksi === 'pengeluaran') {
        await parentTransaction.update({ total_biaya: totalTransactionAmount }, { transaction: t });
    } else {
        await parentTransaction.update({ total_penjualan: totalTransactionAmount }, { transaction: t });
    }

    // 5. Memperbarui kolom `jumlah` di record `Transaksi` utama
    // Why: Memastikan Transaksi utama memiliki nilai total yang benar.
    await newTransaksi.update({ jumlah: totalTransactionAmount }, { transaction: t });

    // 6. Memperbarui ArusKas (Arus Kas)
    // Why: Mencatat dampak finansial dari transaksi.
    // Menemukan record ArusKas terakhir untuk mendapatkan saldo terkini
    const currentArusKas = await ArusKas.findOne({ order: [['cashflow_id', 'DESC']] }, { transaction: t });
    let newSaldo = currentArusKas ? currentArusKas.saldo : 0; // Jika tidak ada record sebelumnya, mulai dari 0

    if (jenis_transaksi === 'pemasukan') { // Jika transaksi ini adalah pemasukan (misal: Penjualan)
      newSaldo += totalTransactionAmount;
      await ArusKas.create({
        transaksi_id: newTransaksi.transaksi_id,
        pemasukan: totalTransactionAmount,
        pengeluaran: 0,
        saldo: newSaldo
      }, { transaction: t });
    } else { // Jika transaksi ini adalah pengeluaran (misal: Pembelian)
      newSaldo -= totalTransactionAmount;
      await ArusKas.create({
        transaksi_id: newTransaksi.transaksi_id,
        pemasukan: 0,
        pengeluaran: totalTransactionAmount,
        saldo: newSaldo
      }, { transaction: t });
    }

    // --- Commit transaksi ---
    // Why: Jika semua langkah di atas berhasil tanpa error, simpan semua perubahan ke database secara permanen.
    await t.commit();

    // Mengirim respon sukses ke frontend
    res.status(201).json({ success: true, message: 'Transaksi berhasil dibuat!' });
  } catch (error) {
    // --- Rollback transaksi jika ada error ---
    // Why: Jika ada error di langkah manapun dalam blok try, semua perubahan yang telah
    // terjadi dalam transaksi ini akan dibatalkan untuk menjaga konsistensi database.
    await t.rollback();
    console.error('Error creating transaction:', error); // Log error untuk debugging di server
    res.status(500).json({ success: false, message: error.message || 'Gagal membuat transaksi.' });
  }
};

// --- Export kedua fungsi ---
// Why: Agar showTransactionPage dan createTransaction bisa diimpor oleh transactionRoutes.js
export {
  showTransactionPage,
  createTransaction
};