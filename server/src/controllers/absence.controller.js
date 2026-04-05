const absenceService = require("../services/absence.service");

// Format response chung cho tất cả API
const sendResponse = (res, status, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

// POST /api/absence-reports — Tạo báo cáo vắng mặt
const createAbsenceReport = async (req, res) => {
  try {
    const { room_id, startDate, endDate, reason, note } = req.body;
    const memberId = req.user?._id || req.body.member_id;

    // Kiểm tra các trường bắt buộc
    const missingFields = [];
    if (!memberId) missingFields.push("member_id");
    if (!room_id) missingFields.push("room_id");
    if (!startDate) missingFields.push("startDate");
    if (!endDate) missingFields.push("endDate");
    if (!reason) missingFields.push("reason");

    if (missingFields.length > 0) {
      return sendResponse(res, 400, false, `Thiếu các trường bắt buộc: ${missingFields.join(", ")}`);
    }

    // Kiểm tra định dạng ngày
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return sendResponse(res, 400, false, "Định dạng ngày không hợp lệ");
    }

    // Tạo báo cáo
    const report = await absenceService.createAbsenceReport(memberId, room_id, {
      startDate: start,
      endDate: end,
      reason,
      note,
    });

    return sendResponse(res, 201, true, "Gửi báo cáo thành công", {
      report,
      status: "Chờ duyệt",
    });
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};

// GET /api/absence-reports/:room_id — Lấy danh sách báo cáo vắng mặt của một phòng
const getAbsenceReports = async (req, res) => {
  try {
    const { room_id } = req.params;
    const { status, member_id } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (member_id) filters.memberId = member_id;

    const reports = await absenceService.getAbsenceReports(room_id, filters);

    return sendResponse(res, 200, true, "Lấy danh sách báo cáo thành công", {
      reports,
      total: reports.length,
    });
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};

// GET /api/absence-reports/detail/:report_id — Lấy chi tiết báo cáo vắng mặt
const getAbsenceReportById = async (req, res) => {
  try {
    const { report_id } = req.params;

    const report = await absenceService.getAbsenceReportById(report_id);

    return sendResponse(res, 200, true, "Lấy chi tiết báo cáo thành công", report);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};

// POST /api/absence-reports/:report_id/approve — Phê duyệt báo cáo vắng mặt
const approveAbsenceReport = async (req, res) => {
  try {
    const { report_id } = req.params;
    const approverId = req.user?._id || req.body.approver_id;

    if (!approverId) {
      return sendResponse(res, 400, false, "Không thể xác định người phê duyệt");
    }

    const report = await absenceService.approveAbsenceReport(report_id, approverId);

    return sendResponse(res, 200, true, "Phê duyệt báo cáo thành công", report);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};

// POST /api/absence-reports/:report_id/reject — Từ chối báo cáo vắng mặt
const rejectAbsenceReport = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { rejection_reason } = req.body;
    const approverId = req.user?._id || req.body.approver_id;

    if (!approverId) {
      return sendResponse(res, 400, false, "Không thể xác định người phê duyệt");
    }

    const report = await absenceService.rejectAbsenceReport(
      report_id,
      approverId,
      rejection_reason
    );

    return sendResponse(res, 200, true, "Từ chối báo cáo thành công", report);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};

// DELETE /api/absence-reports/:report_id — Xóa báo cáo vắng mặt
const deleteAbsenceReport = async (req, res) => {
  try {
    const { report_id } = req.params;
    const memberId = req.user?._id || req.body.member_id;

    if (!memberId) {
      return sendResponse(res, 400, false, "Không thể xác định thành viên");
    }

    const result = await absenceService.deleteAbsenceReport(report_id, memberId);

    return sendResponse(res, 200, true, result.message);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};

module.exports = {
  createAbsenceReport,
  getAbsenceReports,
  getAbsenceReportById,
  approveAbsenceReport,
  rejectAbsenceReport,
  deleteAbsenceReport,
};
