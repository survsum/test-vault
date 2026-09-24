const express = require('express');
const { login, refresh, logout, me, changePassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema, changePasswordSchema } = require('../validators/authValidators');

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, validate(changePasswordSchema), changePassword);

module.exports = router;
