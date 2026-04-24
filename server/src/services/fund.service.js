const mongoose = require("mongoose");
const Fund = require("../models/fund.model");
const FundTransaction = require("../models/fund.transaction.model");
const { FUND_TRANSACTION_TYPES } = require("../constants/fund.constant");
const { BILL_STATUS } = require("../constants/bill.constant");

const normalizeCategory = (category) => {
  const value = String(category || "").trim();
  return value || "Chưa phân loại";
};

const normalizeAllocations = (allocations = []) => {
  const map = new Map();

  allocations.forEach((item) => {
    const name = normalizeCategory(item?.name);
    const amount = Number(item?.amount) || 0;
    map.set(name, (map.get(name) || 0) + Math.max(0, amount));
  });

  return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
};

const upsertAllocation = (allocations = [], name, delta) => {
  const index = allocations.findIndex((item) => item.name === name);
  if (index >= 0) {
    allocations[index].amount = Math.max(0, (Number(allocations[index].amount) || 0) + delta);
    return allocations;
  }
  allocations.push({ name, amount: Math.max(0, delta) });
  return allocations;
};

// Lấy quỹ của phòng, tạo mới nếu chưa có
const getOrCreateFund = async (roomId) => {
  let fund = await Fund.findOne({ room_id: roomId });
  if (!fund) {
    fund = await Fund.create({
      room_id: roomId,
      balance: 0,
      categories: ["Chưa phân loại"],
      category_allocations: [{ name: "Chưa phân loại", amount: 0 }],
    });
  }
  return fund;
};

// RM-22: Nạp tiền vào quỹ + ghi nhận người đóng góp
const deposit = async ({ roomId, amount, performedBy, description, category, proofImages }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fund = await Fund.findOne({ room_id: roomId }).session(session);

    if (!fund) throw new Error("Không tìm thấy quỹ của phòng này");
    if (!Array.isArray(fund.categories)) fund.categories = ["Chưa phân loại"];
    if (!Array.isArray(fund.category_allocations)) fund.category_allocations = [];

    // Cập nhật số dư
    fund.balance += amount;
    await fund.save({ session });

    // Ghi lại lịch sử giao dịch
    const categoryName = normalizeCategory(category);
    if (!fund.categories.includes(categoryName)) fund.categories.push(categoryName);
    fund.category_allocations = upsertAllocation(fund.category_allocations, categoryName, amount);
    await fund.save({ session });

    const transaction = await FundTransaction.create(
      [
        {
          fund_id: fund._id,
          type: FUND_TRANSACTION_TYPES.DEPOSIT,
          amount,
          performed_by: performedBy,
          description,
          category: categoryName,
          proof_images: Array.isArray(proofImages) ? proofImages.slice(0, 5) : [],
        },
      ],
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
const withdraw = async ({ roomId, amount, performedBy, description, category, proofImages, status = "completed", related_bill = null }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fund = await Fund.findOne({ room_id: roomId }).session(session);

    if (!fund) throw new Error("Không tìm thấy quỹ của phòng này");
    if (fund.balance < amount) throw new Error("Số dư quỹ không đủ để thực hiện giao dịch");
    if (!Array.isArray(fund.categories)) fund.categories = ["Chưa phân loại"];
    if (!Array.isArray(fund.category_allocations)) fund.category_allocations = [];

    const categoryName = normalizeCategory(category);
    if (!fund.categories.includes(categoryName)) fund.categories.push(categoryName);

    // Chỉ trừ tiền nếu trạng thái là completed (chủ phòng rút trực tiếp)
    if (status === "completed") {
      fund.balance -= amount;
      fund.category_allocations = upsertAllocation(fund.category_allocations, categoryName, -amount);
      await fund.save({ session });
    }

    const transaction = await FundTransaction.create(
      [
        {
          fund_id: fund._id,
          type: FUND_TRANSACTION_TYPES.WITHDRAW,
          amount,
          performed_by: performedBy,
          description,
          category: categoryName,
          proof_images: Array.isArray(proofImages) ? proofImages.slice(0, 5) : [],
          status,
          related_bill: related_bill,
        },
      ],
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

const approveTransaction = async (transactionId, approverId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await FundTransaction.findById(transactionId).session(session);
    if (!transaction) throw new Error("Không tìm thấy giao dịch");
    if (transaction.status !== "pending") throw new Error("Giao dịch này không ở trạng thái chờ duyệt");

    const fund = await Fund.findById(transaction.fund_id).session(session);
    if (!fund) throw new Error("Không tìm thấy quỹ");

    // Kiểm tra số dư một lần nữa trước khi rút thật
    if (fund.balance < transaction.amount) throw new Error("Số dư quỹ hiện tại không đủ để thực hiện giao dịch này");

    // Thực hiện rút tiền thật sự
    fund.balance -= transaction.amount;
    fund.category_allocations = upsertAllocation(fund.category_allocations, transaction.category, -transaction.amount);
    await fund.save({ session });

    // Cập nhật trạng thái giao dịch
    transaction.status = "completed";
    await transaction.save({ session });

    // Nếu có bill liên quan, đánh dấu bill là đã thanh toán bằng quỹ
    if (transaction.related_bill) {
      const RoomBill = require("../models/room.bill.model");
      const BillDetail = require("../models/bill.detail.model");
      
      await RoomBill.findByIdAndUpdate(transaction.related_bill, { 
        status: "completed",
        is_paid_by_fund: true 
      }).session(session);

      await BillDetail.updateMany(
        { bill_id: transaction.related_bill },
        { status: "paid", confirmed_by: approverId, paid_at: new Date() }
      ).session(session);
    }

    await session.commitTransaction();
    return { fund, transaction };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const rejectTransaction = async (transactionId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await FundTransaction.findById(transactionId).session(session);
    if (!transaction) throw new Error("Không tìm thấy giao dịch");
    if (transaction.status !== "pending") throw new Error("Giao dịch này không ở trạng thái chờ duyệt");

    transaction.status = "rejected";
    await transaction.save({ session });

    // Nếu yêu cầu rút quỹ này gắn với hóa đơn, đánh dấu hóa đơn bị từ chối.
    if (transaction.related_bill) {
      const RoomBill = require("../models/room.bill.model");
      await RoomBill.findByIdAndUpdate(
        transaction.related_bill,
        { status: BILL_STATUS.REJECTED, is_paid_by_fund: false },
        { session }
      );
    }

    await session.commitTransaction();
    return transaction;
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
  if (!Array.isArray(fund.categories)) {
    fund.categories = ["Chưa phân loại"];
  }
  if (!Array.isArray(fund.category_allocations)) {
    fund.category_allocations = [];
  }
  let validAllocations = normalizeAllocations(fund.category_allocations).filter((item) => item.name !== "Chưa phân loại");
  const allocatedWithoutUncategorized = validAllocations.reduce((sum, item) => sum + item.amount, 0);
  const uncategorizedAmount = Math.max(0, (Number(fund.balance) || 0) - allocatedWithoutUncategorized);
  validAllocations.push({ name: "Chưa phân loại", amount: uncategorizedAmount });

  fund.categories = Array.from(new Set([...(fund.categories || []), ...validAllocations.map((item) => item.name)]));
  fund.category_allocations = validAllocations;
  await fund.save();

  const transactions = await FundTransaction.find({ fund_id: fund._id })
    .populate("performed_by", "full_name email")
    .sort({ created_at: -1 });

  return {
    fund,
    transactions,
    categories: fund.categories || ["Chưa phân loại"],
    category_allocations: fund.category_allocations || [],
  };
};

const createCategory = async ({ roomId, name, amount = 0 }) => {
  const fund = await getOrCreateFund(roomId);
  if (!Array.isArray(fund.categories)) fund.categories = ["Chưa phân loại"];
  if (!Array.isArray(fund.category_allocations)) fund.category_allocations = [];

  const categoryName = normalizeCategory(name);
  const allocationAmount = Math.max(0, Number(amount) || 0);
  const currentTotal = fund.category_allocations
    .filter((item) => item.name !== "Chưa phân loại")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  if (currentTotal + allocationAmount > fund.balance) {
    throw new Error("Số tiền phân bổ vượt quá số dư quỹ");
  }

  if (!fund.categories.includes(categoryName)) {
    fund.categories.push(categoryName);
  }
  fund.category_allocations = upsertAllocation(
    fund.category_allocations.filter((item) => item.name !== "Chưa phân loại"),
    categoryName,
    allocationAmount
  );
  const allocated = fund.category_allocations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  fund.category_allocations.push({ name: "Chưa phân loại", amount: Math.max(0, fund.balance - allocated) });

  await fund.save();
  return fund;
};

module.exports = {
  deposit,
  withdraw,
  approveTransaction,
  rejectTransaction,
  createCategory,
  getFundDetail,
  getOrCreateFund,
};
