const fundService = require("../services/fund.service");
const Room = require("../models/room.model");

const sendResponse = (res, status, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

// GET /api/funds?room_id=... — RM-22: Xem số dư + lịch sử giao dịch
const getFundDetail = async (req, res) => {
  try {
    const { room_id } = req.query;

    if (!room_id) return sendResponse(res, 400, false, "Thiếu room_id");

    const { fund, transactions, categories, category_allocations } = await fundService.getFundDetail(room_id);
    return sendResponse(res, 200, true, "Lấy thông tin quỹ thành công", {
      balance: fund.balance,
      transactions,
      categories,
      category_allocations,
    });
  } catch (error) {
    console.error("[FundController] getFundDetail error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi lấy thông tin quỹ");
  }
};

// POST /api/funds/deposit — RM-22: Nạp tiền vào quỹ
const deposit = async (req, res) => {
  try {
    const { room_id, amount, description, category, proof_images } = req.body;

    if (!room_id || !amount) {
      return sendResponse(res, 400, false, "Thiếu room_id hoặc amount");
    }

    if (!Number.isInteger(amount) || amount < 1000) {
      return sendResponse(res, 400, false, "amount phải là số nguyên và tối thiểu 1,000 VNĐ");
    }

    const performedBy = req.user?._id || req.body.performed_by;
    const { fund, transaction } = await fundService.deposit({
      roomId: room_id,
      amount,
      performedBy,
      description,
      category,
      proofImages: proof_images,
    });

    return sendResponse(res, 200, true, "Nạp tiền vào quỹ thành công", {
      new_balance: fund.balance,
      transaction,
    });
  } catch (error) {
    console.error("[FundController] deposit error:", error.message);
    return sendResponse(res, 500, false, error.message || "Lỗi server khi nạp tiền");
  }
};

// POST /api/funds/withdraw — Rút tiền từ quỹ
const withdraw = async (req, res) => {
  try {
    const { room_id, amount, description, category, proof_images, related_bill } = req.body;

    if (!room_id || !amount) {
      return sendResponse(res, 400, false, "Thiếu room_id hoặc amount");
    }

    if (!Number.isInteger(amount) || amount < 1000) {
      return sendResponse(res, 400, false, "amount phải là số nguyên và tối thiểu 1,000 VNĐ");
    }

    const performedBy = req.user?._id || req.body.performed_by;

    // Kiểm tra xem người thực hiện có phải chủ phòng không
    const room = await Room.findById(room_id);
    if (!room) return sendResponse(res, 404, false, "Không tìm thấy phòng");

    const isOwner = room.owner.toString() === performedBy.toString();
    // Nếu là chủ phòng thì completed luôn, nếu là thành viên thì pending
    const status = isOwner ? "completed" : "pending";

    const { fund, transaction } = await fundService.withdraw({
      roomId: room_id,
      amount,
      performedBy,
      description,
      category,
      proofImages: proof_images,
      status,
      related_bill,
    });

    const message = isOwner ? "Rút tiền từ quỹ thành công" : "Yêu cầu rút quỹ đã được gửi, vui lòng chờ chủ phòng xác nhận";

    return sendResponse(res, 200, true, message, {
      new_balance: fund.balance,
      transaction,
    });
  } catch (error) {
    const knownErrors = ["Số dư quỹ không đủ", "Không tìm thấy quỹ"];
    if (knownErrors.some((msg) => error.message.includes(msg))) {
      return sendResponse(res, 400, false, error.message);
    }
    console.error("[FundController] withdraw error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi rút tiền");
  }
};

// PATCH /api/funds/transactions/:transactionId/approve
const approveTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const approverId = req.user?._id;

    if (!transactionId) return sendResponse(res, 400, false, "Thiếu transactionId");

    const { fund, transaction } = await fundService.approveTransaction(transactionId, approverId);

    return sendResponse(res, 200, true, "Xác nhận giao dịch thành công", {
      new_balance: fund.balance,
      transaction,
    });
  } catch (error) {
    console.error("[FundController] approveTransaction error:", error.message);
    return sendResponse(res, 400, false, error.message);
  }
};

// PATCH /api/funds/transactions/:transactionId/reject
const rejectTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) return sendResponse(res, 400, false, "Thiếu transactionId");

    const transaction = await fundService.rejectTransaction(transactionId);

    return sendResponse(res, 200, true, "Từ chối giao dịch thành công", { transaction });
  } catch (error) {
    console.error("[FundController] rejectTransaction error:", error.message);
    return sendResponse(res, 400, false, error.message);
  }
};

const createCategory = async (req, res) => {
  try {
    const { room_id, name, amount } = req.body;

    if (!room_id || !name) {
      return sendResponse(res, 400, false, "Thiếu room_id hoặc tên danh mục");
    }

    const allocation = Number(amount) || 0;
    if (!Number.isFinite(allocation) || allocation < 0) {
      return sendResponse(res, 400, false, "amount phải là số không âm");
    }

    const fund = await fundService.createCategory({ roomId: room_id, name, amount: allocation });
    return sendResponse(res, 200, true, "Tạo danh mục quỹ thành công", {
      categories: fund.categories || [],
      category_allocations: fund.category_allocations || [],
      balance: fund.balance,
    });
  } catch (error) {
    if (error.message.includes("vượt quá số dư quỹ")) {
      return sendResponse(res, 400, false, error.message);
    }
    console.error("[FundController] createCategory error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi tạo danh mục quỹ");
  }
};

module.exports = {
  getFundDetail,
  deposit,
  withdraw,
  approveTransaction,
  rejectTransaction,
  createCategory,
};
