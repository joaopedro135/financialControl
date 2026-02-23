const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');

const { register, login, logout, getMe, updateProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.',
  },
});

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.post('/logout',   logout);
router.get('/me',        protect, getMe);
router.put('/profile',   protect, updateProfile);
router.put('/password',  protect, updatePassword);

module.exports = router;