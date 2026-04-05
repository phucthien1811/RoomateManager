const billAbsenceService = require("../services/bill.absence.service");

// Format response chung
const sendResponse = (res, status, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

/**
 * POST /api/bills/:bill_id/apply-absence
 * Tính toán lại chi phí hóa đơn dựa trên báo cáo vắng mặt đã duyệt
 */
const applyAbsenceToBill = async (req, res) => {
  try {
    const { bill_id } = req.params;

    const result = await billAbsenceService.updateBillByAbsence(bill_id);

    return sendResponse(res, 200, true, result.message, result.bill);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};

/**
 * GET /api/members/:member_id/absence-cost-report
 * Lấy báo cáo chi phí vắng mặt của thành viên
 */
const getAbsenceCostReport = async (req, res) => {
  try {
    const { member_id } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return sendResponse(
        res,
        400,
        false,
        "Vui lòng cung cấp year và month (YYYY-MM)"
      );
    }

    const [y, m] = year.split("-");
    const reportYear = parseInt(y || year);
    const reportMonth = parseInt(m || month);

    if (isNaN(reportYear) || isNaN(reportMonth) || reportMonth < 1 || reportMonth > 12) {
      return sendResponse(res, 400, false, "Year hoặc month không hợp lệ");
    }

    const report = await billAbsenceService.getAbsenceCostReport(
      member_id,
      reportYear,
      reportMonth
    );

    return sendResponse(
      res,
      200,
      true,
      "Lấy báo cáo chi phí vắng mặt thành công",
      report
    );
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};

module.exports = {
  applyAbsenceToBill,
  getAbsenceCostReport,
};
