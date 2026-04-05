const AbsenceReport = require("../models/absence.report.model");
const BillDetail = require("../models/bill.detail.model");
const RoomBill = require("../models/room.bill.model");

/**
 * Tính số ngày vắng mặt trong một tháng
 * @param {Date} startDate - Ngày bắt đầu vắng
 * @param {Date} endDate - Ngày kết thúc vắng
 * @param {number} year - Năm cần tính
 * @param {number} month - Tháng cần tính (1-12)
 * @returns {number} Số ngày vắng mặt trong tháng
 */
const calculateAbsenceDaysInMonth = (startDate, endDate, year, month) => {
  // Lấy ngày đầu và cuối của tháng
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  // Xác định khoảng vắng mặt trong tháng
  const absenceStart = new Date(startDate);
  const absenceEnd = new Date(endDate);

  // Nếu khoảng vắng mặt không trùng với tháng, trả về 0
  if (absenceEnd < monthStart || absenceStart > monthEnd) {
    return 0;
  }

  // Tính ngày bắt đầu và kết thúc trong tháng
  const effectiveStart =
    absenceStart > monthStart ? absenceStart : monthStart;
  const effectiveEnd = absenceEnd < monthEnd ? absenceEnd : monthEnd;

  // Tính số ngày (tính cả ngày bắt đầu và kết thúc)
  const diffTime = effectiveEnd - effectiveStart;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(0, diffDays);
};

/**
 * Tính số ngày trong tháng
 * @param {number} year - Năm
 * @param {number} month - Tháng (1-12)
 * @returns {number} Số ngày trong tháng
 */
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

/**
 * Tính tỷ lệ chi phí dựa trên ngày vắng mặt đã được duyệt
 * @param {string} memberId - ID của thành viên
 * @param {number} year - Năm hóa đơn
 * @param {number} month - Tháng hóa đơn
 * @returns {number} Tỷ lệ chi phí (0-1). Ví dụ: 0.5 = 50% phải trả
 */
const calculateCostRatioByAbsence = async (memberId, year, month) => {
  try {
    // Lấy tất cả báo cáo vắng mặt đã được duyệt của thành viên
    const approvedReports = await AbsenceReport.find({
      member: memberId,
      status: "Đã duyệt",
      // Lấy báo cáo có ngày giao cắt với tháng cần tính
      $expr: {
        $and: [
          { $gte: ["$endDate", new Date(year, month - 1, 1)] },
          { $lte: ["$startDate", new Date(year, month, 0)] },
        ],
      },
    });

    // Nếu không có báo cáo vắng mặt, phải trả 100%
    if (approvedReports.length === 0) {
      return 1;
    }

    // Tính tổng số ngày vắng mặt trong tháng
    let totalAbsenceDays = 0;
    approvedReports.forEach((report) => {
      const absenceDays = calculateAbsenceDaysInMonth(
        report.startDate,
        report.endDate,
        year,
        month
      );
      totalAbsenceDays += absenceDays;
    });

    // Tính số ngày trong tháng
    const daysInMonth = getDaysInMonth(year, month);

    // Tính số ngày phải trả = tổng ngày - ngày vắng mặt
    const payableDays = Math.max(0, daysInMonth - totalAbsenceDays);

    // Tính tỷ lệ chi phí
    const costRatio = payableDays / daysInMonth;

    return costRatio;
  } catch (error) {
    console.error("Lỗi tính tỷ lệ chi phí:", error);
    return 1; // Nếu có lỗi, mặc định phải trả 100%
  }
};

/**
 * Cập nhật chi phí cho hóa đơn dựa trên báo cáo vắng mặt
 * @param {string} billId - ID hóa đơn
 * @returns {object} Kết quả cập nhật
 */
const updateBillByAbsence = async (billId) => {
  try {
    // Lấy thông tin hóa đơn
    const bill = await RoomBill.findById(billId).populate("details");

    if (!bill) {
      throw new Error("Hóa đơn không tồn tại");
    }

    // Lấy năm và tháng từ billing_month (assume định dạng: YYYY-MM)
    const [year, month] = bill.billing_month.split("-").map(Number);

    // Cập nhật từng chi tiết hóa đơn
    let totalUpdatedAmount = 0;
    const updatedDetails = [];

    for (const detail of bill.details) {
      // Tính tỷ lệ chi phí cho thành viên này
      const costRatio = await calculateCostRatioByAbsence(
        detail.member,
        year,
        month
      );

      // Tính chi phí sau khi được giảm
      const updatedAmount = Math.round(detail.original_amount * costRatio);
      const absenceDiscount =
        detail.original_amount - updatedAmount;

      // Cập nhật chi tiết
      detail.actual_amount = updatedAmount;
      detail.absence_discount = absenceDiscount;
      detail.cost_ratio = costRatio;

      await detail.save();

      totalUpdatedAmount += updatedAmount;
      updatedDetails.push({
        member: detail.member,
        original_amount: detail.original_amount,
        actual_amount: updatedAmount,
        absence_discount: absenceDiscount,
        cost_ratio: costRatio,
      });
    }

    // Cập nhật tổng tiền hóa đơn
    bill.total_amount = totalUpdatedAmount;
    await bill.save();

    return {
      success: true,
      message: "Cập nhật chi phí theo vắng mặt thành công",
      bill: {
        id: bill._id,
        original_total: bill.details.reduce((sum, d) => sum + d.original_amount, 0),
        updated_total: totalUpdatedAmount,
        details: updatedDetails,
      },
    };
  } catch (error) {
    console.error("Lỗi cập nhật hóa đơn:", error);
    throw error;
  }
};

/**
 * Lấy báo cáo chi tiết về chi phí vắng mặt của thành viên
 * @param {string} memberId - ID thành viên
 * @param {number} year - Năm
 * @param {number} month - Tháng
 * @returns {object} Báo cáo chi tiết
 */
const getAbsenceCostReport = async (memberId, year, month) => {
  try {
    const daysInMonth = getDaysInMonth(year, month);

    // Lấy báo cáo vắng mặt đã duyệt
    const approvedReports = await AbsenceReport.find({
      member: memberId,
      status: "Đã duyệt",
      $expr: {
        $and: [
          { $gte: ["$endDate", new Date(year, month - 1, 1)] },
          { $lte: ["$startDate", new Date(year, month, 0)] },
        ],
      },
    });

    // Tính tổng ngày vắng
    let totalAbsenceDays = 0;
    const absenceDetails = [];

    approvedReports.forEach((report) => {
      const absenceDays = calculateAbsenceDaysInMonth(
        report.startDate,
        report.endDate,
        year,
        month
      );
      totalAbsenceDays += absenceDays;

      absenceDetails.push({
        reason: report.reason,
        startDate: report.startDate,
        endDate: report.endDate,
        absenceDays: absenceDays,
      });
    });

    const payableDays = Math.max(0, daysInMonth - totalAbsenceDays);
    const costRatio = payableDays / daysInMonth;

    return {
      member: memberId,
      month: `${year}-${String(month).padStart(2, "0")}`,
      daysInMonth: daysInMonth,
      absenceDays: totalAbsenceDays,
      payableDays: payableDays,
      costRatio: costRatio,
      costPercentage: `${(costRatio * 100).toFixed(2)}%`,
      absenceDetails: absenceDetails,
    };
  } catch (error) {
    console.error("Lỗi lấy báo cáo chi phí:", error);
    throw error;
  }
};

module.exports = {
  calculateAbsenceDaysInMonth,
  getDaysInMonth,
  calculateCostRatioByAbsence,
  updateBillByAbsence,
  getAbsenceCostReport,
};
