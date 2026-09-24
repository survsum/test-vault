const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN', 'SUPERVISOR'));
router.get('/case/:caseId', ctrl.caseSummaryReport);
router.get('/evidence-summary', ctrl.evidenceSummaryReport);
router.get('/chain-of-custody/:evidenceId', ctrl.chainOfCustodyReport);
router.get('/audit', ctrl.auditReport);

module.exports = router;
