const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absence.controller');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/absence-reports — Tạo báo cáo vắng mặt
router.post('/', authenticate, absenceController.createAbsenceReport);

// GET /api/absence-reports/detail/:report_id — Lấy chi tiết báo cáo vắng mặt (MUST come before /:room_id)
router.get('/detail/:report_id', authenticate, absenceController.getAbsenceReportById);

// POST /api/absence-reports/:report_id/approve — Phê duyệt báo cáo vắng mặt
router.post('/:report_id/approve', authenticate, absenceController.approveAbsenceReport);

// POST /api/absence-reports/:report_id/reject — Từ chối báo cáo vắng mặt
router.post('/:report_id/reject', authenticate, absenceController.rejectAbsenceReport);

// DELETE /api/absence-reports/:report_id — Xóa báo cáo vắng mặt
router.delete('/:report_id', authenticate, absenceController.deleteAbsenceReport);

// GET /api/absence-reports/:room_id — Lấy danh sách báo cáo vắng mặt của một phòng (MUST come last - catch-all)
router.get('/:room_id', authenticate, absenceController.getAbsenceReports);

module.exports = router;
