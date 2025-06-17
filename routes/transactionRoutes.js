import express from 'express';
import showTransactionPage from '../controllers/transactionController.js';
import isAuthenticated from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/transaction', isAuthenticated, showTransactionPage);

export default router;