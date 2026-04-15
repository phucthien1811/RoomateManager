const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, notificationController.listMyNotifications);
router.put('/read-all', authenticate, notificationController.markAllAsRead);
router.put('/:notificationId/read', authenticate, notificationController.markOneAsRead);
router.delete('/', authenticate, notificationController.clearMyNotifications);

module.exports = router;
