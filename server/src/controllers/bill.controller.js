const billService = require("../services/bill.service");

// Format response chung cho tất cả API
const sendResponse = (res, status, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

// POST /api/bills — RM-7 & RM-9: Tạo hóa đơn và chia tiền
const createBill = async (req, res) => {
  try {
    const { room_id, bill_type, total_amount, billing_month, member_ids, note } = req.body;

    const missingFields = [];
    if (!room_id) missingFields.push("room_id");
    if (!bill_type) missingFields.push("bill_type");
    if (total_amount === undefined || total_amount === null) missingFields.push("total_amount");
    if (!billing_month) missingFields.push("billing_month");
    if (!member_ids || !Array.isArray(member_ids)) missingFields.push("member_ids (array)");

    if (missingFields.length > 0) {
      return sendResponse(res, 400, false, `Thiếu các trường bắt buộc: ${missingFields.join(", ")}`);
    }

    if (!Number.isInteger(total_amount) || total_amount < 1000) {
      return sendResponse(res, 400, false, "total_amount phải là số nguyên và tối thiểu 1,000 VNĐ");
    }

    if (member_ids.length === 0) {
      return sendResponse(res, 400, false, "member_ids phải có ít nhất 1 thành viên");
    }

    const createdBy = req.user?._id || req.body.created_by;

    const { bill, details } = await billService.createBillWithSplit(
      { room_id, bill_type, total_amount, billing_month, member_ids, note },
      createdBy
    );

    return sendResponse(res, 201, true, "Tạo hóa đơn và chia tiền thành công", {
      bill,
      details,
      summary: {
        total_members: details.length,
        total_amount: bill.total_amount,
        billing_month: bill.billing_month,
      },
    });
  } catch (error) {
    // Lỗi trùng hóa đơn cùng loại trong tháng
    if (error.code === 11000) {
      return sendResponse(res, 409, false, "Hóa đơn cùng loại cho phòng này trong tháng đã tồn tại");
    }
    console.error("[BillController] createBill error:", error.message);
    return sendResponse(res, 500, false, error.message || "Lỗi server khi tạo hóa đơn");
  }
};

// PATCH /api/bills/details/:detailId/confirm — RM-11: Xác nhận thanh toán
const confirmPayment = async (req, res) => {
  try {
    const { detailId } = req.params;

    if (!detailId || !/^[a-fA-F0-9]{24}$/.test(detailId)) {
      return sendResponse(res, 400, false, "detailId không hợp lệ");
    }

    const confirmedBy = req.user?._id || req.body.confirmed_by;
    const { detail, bill } = await billService.confirmPayment(detailId, confirmedBy);

    return sendResponse(res, 200, true, "Xác nhận thanh toán thành công", {
      detail,
      bill_status: bill.status,
      bill_id: bill._id,
    });
  } catch (error) {
    const knownErrors = ["Không tìm thấy bill_detail", "Thành viên này đã thanh toán"];
    if (knownErrors.some((msg) => error.message.includes(msg))) {
      return sendResponse(res, 400, false, error.message);
    }
    console.error("[BillController] confirmPayment error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi xác nhận thanh toán");
  }
};

// GET /api/bills/:billId — Lấy chi tiết hóa đơn kèm danh sách thành viên
const getBillDetail = async (req, res) => {
  try {
    const { billId } = req.params;

    if (!billId || !/^[a-fA-F0-9]{24}$/.test(billId)) {
      return sendResponse(res, 400, false, "billId không hợp lệ");
    }

    const { bill, details } = await billService.getBillWithDetails(billId);
    return sendResponse(res, 200, true, "Lấy thông tin hóa đơn thành công", { bill, details });
  } catch (error) {
    if (error.message.includes("Không tìm thấy")) {
      return sendResponse(res, 404, false, error.message);
    }
    console.error("[BillController] getBillDetail error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi lấy thông tin hóa đơn");
  }
};

module.exports = {
  createBill,
  confirmPayment,
  getBillDetail,
};
feat: refactor comments bill.controller
