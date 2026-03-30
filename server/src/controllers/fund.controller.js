const fundService = require("../services/fund.service");

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

    const { fund, transactions } = await fundService.getFundDetail(room_id);
    return sendResponse(res, 200, true, "Lấy thông tin quỹ thành công", {
      balance: fund.balance,
      transactions,
    });
  } catch (error) {
    console.error("[FundController] getFundDetail error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi lấy thông tin quỹ");
  }
};

// POST /api/funds/deposit — RM-22: Nạp tiền vào quỹ
const deposit = async (req, res) => {
  try {
    const { room_id, amount, description } = req.body;

    if (!room_id || !amount) {
      return sendResponse(res, 400, false, "Thiếu room_id hoặc amount");
    }

    if (!Number.isInteger(amount) || amount < 1000) {
      return sendResponse(res, 400, false, "amount phải là số nguyên và tối thiểu 1,000 VNĐ");
    }

    const performedBy = req.user?._id || req.body.performed_by;
    const { fund, transaction } = await fundService.deposit({ roomId: room_id, amount, performedBy, description });

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
    const { room_id, amount, description } = req.body;

    if (!room_id || !amount) {
      return sendResponse(res, 400, false, "Thiếu room_id hoặc amount");
    }

    if (!Number.isInteger(amount) || amount < 1000) {
      return sendResponse(res, 400, false, "amount phải là số nguyên và tối thiểu 1,000 VNĐ");
    }

    const performedBy = req.user?._id || req.body.performed_by;
    const { fund, transaction } = await fundService.withdraw({ roomId: room_id, amount, performedBy, description });

    return sendResponse(res, 200, true, "Rút tiền từ quỹ thành công", {
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

module.exports = {
  getFundDetail,
  deposit,
  withdraw,
};
