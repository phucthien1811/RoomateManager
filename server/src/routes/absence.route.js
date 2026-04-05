const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absence.controller');

// POST /api/absence-reports — Tạo báo cáo vắng mặt
router.post('/', absenceController.createAbsenceReport);

// GET /api/absence-reports/:room_id — Lấy danh sách báo cáo vắng mặt của một phòng
router.get('/:room_id', absenceController.getAbsenceReports);

// GET /api/absence-reports/detail/:report_id — Lấy chi tiết báo cáo vắng mặt
router.get('/detail/:report_id', absenceController.getAbsenceReportById);

// POST /api/absence-reports/:report_id/approve — Phê duyệt báo cáo vắng mặt
router.post('/:report_id/approve', absenceController.approveAbsenceReport);

// POST /api/absence-reports/:report_id/reject — Từ chối báo cáo vắng mặt
router.post('/:report_id/reject', absenceController.rejectAbsenceReport);

// DELETE /api/absence-reports/:report_id — Xóa báo cáo vắng mặt
router.delete('/:report_id', absenceController.deleteAbsenceReport);

module.exports = router;
