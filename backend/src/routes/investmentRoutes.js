const express = require('express');
const router  = express.Router();

const { createInvestment, getInvestments } = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');

// Todas as rotas de investimento exigem login
router.use(protect);

router.get('/',  getInvestments);
router.post('/', createInvestment);

module.exports = router;