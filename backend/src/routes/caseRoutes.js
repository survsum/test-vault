const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createCaseSchema, updateCaseSchema, assignInvestigatorsSchema } = require('../validators/caseValidators');
const ctrl = require('../controllers/caseController');

const router = express.Router();

router.use(requireAuth);
router.get('/', ctrl.listCases);
router.get('/:id', ctrl.getCase);
router.post('/', requireRole('ADMIN', 'SUPERVISOR'), validate(createCaseSchema), ctrl.createCase);
router.patch('/:id', requireRole('ADMIN', 'SUPERVISOR'), validate(updateCaseSchema), ctrl.updateCase);
router.post('/:id/assign', requireRole('ADMIN', 'SUPERVISOR'), validate(assignInvestigatorsSchema), ctrl.assignInvestigators);

module.exports = router;
