const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

const router = express.Router();

router.use(requireAuth);
router.get('/', ctrl.listNotifications);
router.post('/:id/read', ctrl.markAsRead);
router.post('/read-all', ctrl.markAllAsRead);
router.delete('/read', ctrl.clearRead);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
