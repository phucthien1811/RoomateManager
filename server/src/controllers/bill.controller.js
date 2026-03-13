/**
 * @file bill.controller.js
 * @description Controller xử lý HTTP request/response cho module Bill.
 * Tầng này chỉ lo: validate input → gọi service → format response.
 * Không chứa business logic.
 */

const billService = require("../services/bill.service");

// ============================================================
// FORMAT RESPONSE CHUẨN
// Tất cả API đều trả về cùng cấu trúc để frontend dễ xử lý
// ============================================================
/**
 * @param {Object} res      - Express response object
 * @param {number} status   - HTTP status code
 * @param {boolean} success - Kết quả thành công hay thất bại
 * @param {string} message  - Thông điệp mô tả
 * @param {*} [data]        - Dữ liệu trả về (tùy chọn)
 */
const sendResponse = (res, status, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

// ============================================================
// RM-7 & RM-9: TẠO HÓA ĐƠN VÀ TỰ ĐỘNG CHIA TIỀN
// POST /api/bills
// ============================================================
/**
 * @route   POST /api/bills
 * @desc    Tạo hóa đơn mới cho phòng và tự động chia tiền cho thành viên
 * @access  Private (Admin/Room Leader)
 *
 * @body {string}   room_id        - ID phòng
 * @body {string}   bill_type      - electricity | water | rent | internet
 * @body {number}   total_amount   - Tổng tiền (VNĐ)
 * @body {string}   billing_month  - Tháng áp dụng (YYYY-MM)
 * @body {string[]} member_ids     - Danh sách ID thành viên cần chia
 * @body {string}   [note]         - Ghi chú (tùy chọn)
 */
const createBill = async (req, res) => {
  try {
    const { room_id, bill_type, total_amount, billing_month, member_ids, note } = req.body;

    // --- Validate các trường bắt buộc ---
    const missingFields = [];
    if (!room_id) missingFields.push("room_id");
    if (!bill_type) missingFields.push("bill_type");
    if (total_amount === undefined || total_amount === null) missingFields.push("total_amount");
    if (!billing_month) missingFields.push("billing_month");
    if (!member_ids || !Array.isArray(member_ids)) missingFields.push("member_ids (array)");

    if (missingFields.length > 0) {
      return sendResponse(res, 400, false, `Thiếu các trường bắt buộc: ${missingFields.join(", ")}`);
    }

    // --- Validate total_amount phải là số nguyên dương ---
    if (!Number.isInteger(total_amount) || total_amount < 1000) {
      return sendResponse(res, 400, false, "total_amount phải là số nguyên và tối thiểu 1,000 VNĐ");
    }

    // --- Validate member_ids không được rỗng ---
    if (member_ids.length === 0) {
      return sendResponse(res, 400, false, "member_ids phải có ít nhất 1 thành viên");
    }

    // Lấy ID người tạo từ middleware xác thực (giả định đã gắn vào req.user)
    const createdBy = req.user?._id || req.body.created_by;

    // Gọi service thực hiện toàn bộ logic
    const { bill, details } = await billService.createBillWithSplit(
      { room_id, bill_type, total_amount, billing_month, member_ids, note },
      createdBy
    );

    return sendResponse(res, 201, true, "Tạo hóa đơn và chia tiền thành công", {
      bill,
      details,
      // Thêm summary để frontend hiển thị nhanh
      summary: {
        total_members: details.length,
        total_amount: bill.total_amount,
        billing_month: bill.billing_month,
      },
    });
  } catch (error) {
    // Xử lý lỗi duplicate (trùng hóa đơn cùng loại trong cùng tháng)
    if (error.code === 11000) {
      return sendResponse(
        res,
        409,
        false,
        "Hóa đơn cùng loại cho phòng này trong tháng đã tồn tại"
      );
    }

    console.error("[BillController] createBill error:", error.message);
    return sendResponse(res, 500, false, error.message || "Lỗi server khi tạo hóa đơn");
  }
};

// ============================================================
// RM-11: XÁC NHẬN THANH TOÁN
// PATCH /api/bills/details/:detailId/confirm
// ============================================================
/**
 * @route   PATCH /api/bills/details/:detailId/confirm
 * @desc    Xác nhận thanh toán của một thành viên (pending → paid)
 * @access  Private (Admin hoặc chính thành viên đó)
 *
 * @param {string} detailId - ID của bill_detail cần xác nhận
 */
const confirmPayment = async (req, res) => {
  try {
    const { detailId } = req.params;

    // Validate detailId có đúng định dạng ObjectId không
    if (!detailId || !/^[a-fA-F0-9]{24}$/.test(detailId)) {
      return sendResponse(res, 400, false, "detailId không hợp lệ");
    }

    // Lấy ID người xác nhận từ middleware xác thực
    const confirmedBy = req.user?._id || req.body.confirmed_by;

    const { detail, bill } = await billService.confirmPayment(detailId, confirmedBy);

    return sendResponse(res, 200, true, "Xác nhận thanh toán thành công", {
      detail,
      bill_status: bill.status, // Trạng thái mới của hóa đơn tổng
      bill_id: bill._id,
    });
  } catch (error) {
    // Lỗi business logic (đã trả rồi, không tìm thấy...)
    const knownErrors = [
      "Không tìm thấy bill_detail",
      "Thành viên này đã thanh toán",
    ];

    const isKnownError = knownErrors.some((msg) => error.message.includes(msg));

    if (isKnownError) {
      return sendResponse(res, 400, false, error.message);
    }

    console.error("[BillController] confirmPayment error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi xác nhận thanh toán");
  }
};

// ============================================================
// GET HÓA ĐƠN KÈM CHI TIẾT (Bonus - hữu ích cho frontend)
// GET /api/bills/:billId
// ============================================================
/**
 * @route   GET /api/bills/:billId
 * @desc    Lấy thông tin chi tiết một hóa đơn kèm danh sách từng thành viên
 * @access  Private
 */
const getBillDetail = async (req, res) => {
  try {
    const { billId } = req.params;

    if (!billId || !/^[a-fA-F0-9]{24}$/.test(billId)) {
      return sendResponse(res, 400, false, "billId không hợp lệ");
    }

    const { bill, details } = await billService.getBillWithDetails(billId);

    return sendResponse(res, 200, true, "Lấy thông tin hóa đơn thành công", {
      bill,
      details,
    });
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
