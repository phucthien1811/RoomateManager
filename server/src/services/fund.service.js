const mongoose = require("mongoose");
const Fund = require("../models/fund.model");
const FundTransaction = require("../models/fund.transaction.model");
const { FUND_TRANSACTION_TYPES } = require("../constants/fund.constant");

// Lấy quỹ của phòng, tạo mới nếu chưa có
const getOrCreateFund = async (roomId) => {
  let fund = await Fund.findOne({ room_id: roomId });
  if (!fund) {
    fund = await Fund.create({ room_id: roomId, balance: 0 });
  }
  return fund;
};

// RM-22: Nạp tiền vào quỹ + ghi nhận người đóng góp
const deposit = async ({ roomId, amount, performedBy, description }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fund = await Fund.findOne({ room_id: roomId }).session(session);

    if (!fund) throw new Error("Không tìm thấy quỹ của phòng này");

    // Cập nhật số dư
    fund.balance += amount;
    await fund.save({ session });

    // Ghi lại lịch sử giao dịch
    const transaction = await FundTransaction.create(
      [{ fund_id: fund._id, type: FUND_TRANSACTION_TYPES.DEPOSIT, amount, performed_by: performedBy, description }],
      { session }
    );

    await session.commitTransaction();
    return { fund, transaction: transaction[0] };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Rút tiền từ quỹ (chi tiêu chung)
const withdraw = async ({ roomId, amount, performedBy, description }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fund = await Fund.findOne({ room_id: roomId }).session(session);

    if (!fund) throw new Error("Không tìm thấy quỹ của phòng này");
    if (fund.balance < amount) throw new Error("Số dư quỹ không đủ để thực hiện giao dịch");

    fund.balance -= amount;
    await fund.save({ session });

    const transaction = await FundTransaction.create(
      [{ fund_id: fund._id, type: FUND_TRANSACTION_TYPES.WITHDRAW, amount, performed_by: performedBy, description }],
      { session }
    );

    await session.commitTransaction();
    return { fund, transaction: transaction[0] };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Lấy số dư + lịch sử giao dịch của quỹ
const getFundDetail = async (roomId) => {
  const fund = await getOrCreateFund(roomId);

  const transactions = await FundTransaction.find({ fund_id: fund._id })
    .populate("performed_by", "full_name email")
    .sort({ created_at: -1 });

  return { fund, transactions };
};

module.exports = {
  deposit,
  withdraw,
  getFundDetail,
  getOrCreateFund,
};
