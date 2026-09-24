const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getStats } = require('../controllers/dashboardController');

const router = express.Router();

router.use(requireAuth);
router.get('/stats', getStats);

module.exports = router;
