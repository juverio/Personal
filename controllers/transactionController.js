import {
  Transaksi, Pembelian, Penjualan,
  User, Inventori, ArusKas,  DetailPembelian, DetailPenjualan
} from '../models/index.js';
import { Op } from 'sequelize';

const showTransactionPage = async (req, res) => {
  try {
    const { type = 'pembelian', startDate, endDate, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (startDate && endDate) {
      whereClause.tanggal = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const includeOptions = [
      { model: User, attributes: ['name'] },
      { model: ArusKas },
    ];

    if (type === 'penjualan') {
      includeOptions.push({ model: Penjualan });
    } else {
      includeOptions.push({ model: Pembelian });
    }

    const { rows: transaksiList, count } = await Transaksi.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [['tanggal', 'DESC']],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.render('transaction', {
      user: req.session.user,
      transaksiList,
      selectedType: type,
      startDate,
      endDate,
      currentPage: Number(page),
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan saat memuat transaksi');
  }
};

export default showTransactionPage;