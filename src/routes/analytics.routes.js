const express = require('express');
const router = express.Router();
const analytics = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard-summary', analytics.getDashboardSummary);
router.get('/category-breakdown', analytics.getCategoryBreakdown);
router.get('/trends', analytics.getTrends);
router.get('/export', analytics.exportCsv);

module.exports = router;
