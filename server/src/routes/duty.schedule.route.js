const express = require('express');
const router = express.Router();
const dutyScheduleController = require('../controllers/duty.schedule.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.put('/:dutyId', authenticate, dutyScheduleController.updateDuty);
router.delete('/:dutyId', authenticate, dutyScheduleController.deleteDuty);

module.exports = router;
