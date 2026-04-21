const billService = require("../services/bill.service");

// Format response chung cho tất cả API
const sendResponse = (res, status, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

// PATCH /api/bills/:billId/images — RM-8: Cập nhật ảnh hóa đơn thực tế
const uploadBillImages = async (req, res) => {
  try {
    const { billId } = req.params;

    if (!billId || !/^[a-fA-F0-9]{24}$/.test(billId)) {
      return sendResponse(res, 400, false, "billId không hợp lệ");
    }

    const { images } = req.body;
    if (!Array.isArray(images) || images.length === 0) {
      return sendResponse(res, 400, false, "Vui lòng gửi mảng images (tối đa 5)");
    }
    if (images.length > 5) {
      return sendResponse(res, 400, false, "Tối đa 5 ảnh hóa đơn");
    }

    const requesterId = req.user?._id;
    if (!requesterId) {
      return sendResponse(res, 401, false, "Chưa xác thực");
    }

    const bill = await billService.uploadBillImages(billId, images, requesterId);
    return sendResponse(res, 200, true, "Cập nhật ảnh hóa đơn thành công", { bill_images: bill.bill_images });
  } catch (error) {
    if (error.message.includes("không có quyền")) {
      return sendResponse(res, 403, false, error.message);
    }
    if (error.message.includes("Không tìm thấy")) {
      return sendResponse(res, 404, false, error.message);
    }
    console.error("[BillController] uploadBillImages error:", error.message);
    return sendResponse(res, 500, false, error.message || "Lỗi server khi cập nhật ảnh hóa đơn");
  }
};

// POST /api/bills — RM-7 & RM-9: Tạo hóa đơn và chia tiền
const createBill = async (req, res) => {
  try {
    const {
      room_id,
      bill_type,
      bill_type_other,
      total_amount,
      billing_month,
      bill_date,
      payer_id,
      member_ids,
      custom_splits,
      note,
    } = req.body;

    const missingFields = [];
    if (!room_id) missingFields.push("room_id");
    if (!bill_type) missingFields.push("bill_type");
    if (bill_type === "other" && !bill_type_other?.trim()) missingFields.push("bill_type_other");
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
      {
        room_id,
        bill_type,
        bill_type_other,
        total_amount,
        billing_month,
        bill_date,
        payer_id,
        member_ids,
        custom_splits,
        note,
      },
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
      const keyPattern = error.keyPattern || {};
      const legacyPatternHit =
        keyPattern.room_id &&
        keyPattern.bill_type &&
        keyPattern.billing_month &&
        !keyPattern.bill_type_other;

      if (legacyPatternHit && req.body?.bill_type === "other") {
        return sendResponse(
          res,
          409,
          false,
          "Database đang dùng unique index cũ (không tách bill_type_other). Hãy restart backend để sync index mới hoặc chạy script drop index cũ."
        );
      }

      if (req.body?.bill_type === "other") {
        return sendResponse(
          res,
          409,
          false,
          "Hóa đơn loại Khác với nội dung này trong tháng đã tồn tại"
        );
      }
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
    const knownErrors = [
      "Không tìm thấy bill_detail",
      "Thành viên này đã thanh toán",
      "Bạn không có quyền xác nhận",
      "Không tìm thấy hóa đơn",
    ];
    if (knownErrors.some((msg) => error.message.includes(msg))) {
      const statusCode = error.message.includes("Bạn không có quyền") ? 403 : 400;
      return sendResponse(res, statusCode, false, error.message);
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

// GET /api/bills/history/:roomId — Lấy lịch sử hóa đơn của phòng
const getBillHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page, limit, bill_type, from_month, to_month, sort_by, sort_order } = req.query;

    if (!roomId || !/^[a-fA-F0-9]{24}$/.test(roomId)) {
      return sendResponse(res, 400, false, "roomId không hợp lệ");
    }

    // Validate month format if provided (YYYY-MM)
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (from_month && !monthRegex.test(from_month)) {
      return sendResponse(res, 400, false, "from_month phải theo định dạng YYYY-MM");
    }
    if (to_month && !monthRegex.test(to_month)) {
      return sendResponse(res, 400, false, "to_month phải theo định dạng YYYY-MM");
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
      billType: bill_type || null,
      fromMonth: from_month || null,
      toMonth: to_month || null,
      sortBy: sort_by || "billing_month",
      sortOrder: sort_order || "desc",
    };

    const result = await billService.getBillHistory(roomId, options);

    return sendResponse(res, 200, true, "Lấy lịch sử hóa đơn thành công", result);
  } catch (error) {
    console.error("[BillController] getBillHistory error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi lấy lịch sử hóa đơn");
  }
};

module.exports = {
  createBill,
  confirmPayment,
  getBillDetail,
  getBillHistory,
  uploadBillImages,
};
