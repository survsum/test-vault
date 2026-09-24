const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema, resetPasswordSchema } = require('../validators/userValidators');
const ctrl = require('../controllers/userController');

const router = express.Router();

router.use(requireAuth);
router.get('/investigators', requireRole('ADMIN', 'SUPERVISOR'), ctrl.listInvestigators);
router.get('/', requireRole('ADMIN'), ctrl.listUsers);
router.get('/:id', requireRole('ADMIN'), ctrl.getUser);
router.post('/', requireRole('ADMIN'), validate(createUserSchema), ctrl.createUser);
router.patch('/:id', requireRole('ADMIN'), validate(updateUserSchema), ctrl.updateUser);
router.delete('/:id', requireRole('ADMIN'), ctrl.deleteUser);
router.post('/:id/restore', requireRole('ADMIN'), ctrl.restoreUser);
router.post('/:id/reset-password', requireRole('ADMIN'), validate(resetPasswordSchema), ctrl.resetPassword);

module.exports = router;
