import express from 'express';
import {
  showHome,
  showProfile,
  showNotFound
} from '../controllers/pageController.js';

import isAuthenticated  from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', isAuthenticated, showHome);
router.get('/profile', isAuthenticated, showProfile);

// fallback jika halaman tidak ditemukan
router.use(showNotFound);

export default router;
