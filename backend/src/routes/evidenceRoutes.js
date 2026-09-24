const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const { uploadEvidenceSchema, rejectEvidenceSchema } = require('../validators/evidenceValidators');
const ctrl = require('../controllers/evidenceController');

const router = express.Router();

router.use(requireAuth);
router.get('/', ctrl.listEvidence);
router.get('/:id', ctrl.getEvidence);
router.post('/', requireRole('ADMIN', 'INVESTIGATOR'), upload.single('file'), validate(uploadEvidenceSchema), ctrl.uploadEvidence);
router.post('/:id/approve', requireRole('ADMIN', 'SUPERVISOR'), ctrl.approveEvidence);
router.post('/:id/reject', requireRole('ADMIN', 'SUPERVISOR'), validate(rejectEvidenceSchema), ctrl.rejectEvidence);
router.post('/:id/verify', ctrl.verifyIntegrity);
router.get('/:id/download', ctrl.downloadEvidence);

module.exports = router;
