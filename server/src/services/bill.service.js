const mongoose = require("mongoose");
const RoomBill = require("../models/room.bill.model");
const BillDetail = require("../models/bill.detail.model");
const { BILL_STATUS, BILL_DETAIL_STATUS } = require("../constants/bill.constant");

const splitAmountByLargestRemainder = (totalAmount, memberCount) => {
  if (memberCount <= 0) throw new Error("Số lượng thành viên phải lớn hơn 0");
  const baseAmounts = Array(memberCount).fill(Math.floor(totalAmount / memberCount));
  const remainder = totalAmount - baseAmounts.reduce((sum, val) => sum + val, 0);
  if (remainder > 0) baseAmounts[0] += remainder;
  return baseAmounts;
};

const normalizeCustomSplits = (customSplits = [], totalAmount, memberIds = []) => {
  if (!Array.isArray(customSplits) || customSplits.length === 0) return null;

  const normalizedIds = memberIds.map((id) => id.toString());
  const allocations = [];
  let usedAmount = 0;
  let pendingPercent = 0;

  for (const split of customSplits) {
    const id = split?.member_id?.toString();
    if (!id || !normalizedIds.includes(id)) continue;

    if (split.mode === "amount") {
      const amount = Number(split.value);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error("Số tiền chia cho thành viên không hợp lệ");
      }
      const amountRounded = Math.round(amount);
      usedAmount += amountRounded;
      allocations.push({ member_id: id, amount_due: amountRounded, mode: "amount", value: amountRounded });
    } else if (split.mode === "percent") {
      const percent = Number(split.value);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        throw new Error("Tỷ lệ chia bill phải trong khoảng 0-100%");
      }
      pendingPercent += percent;
      allocations.push({ member_id: id, amount_due: null, mode: "percent", value: percent });
    }
  }

  if (allocations.length !== normalizedIds.length) {
    throw new Error("Thiếu cấu hình chia bill cho một số thành viên");
  }

  if (usedAmount > totalAmount) {
    throw new Error("Tổng tiền đã phân bổ vượt quá tổng hóa đơn");
  }

  if (pendingPercent > 100) {
    throw new Error("Tổng tỷ lệ chia bill vượt quá 100%");
  }

  let remainForPercent = totalAmount - usedAmount;
  const percentItems = allocations.filter((item) => item.mode === "percent");
  if (percentItems.length === 0) {
    const diff = totalAmount - usedAmount;
    if (diff !== 0 && allocations.length > 0) {
      allocations[allocations.length - 1].amount_due += diff;
    }
  } else {
    const percentTotal = percentItems.reduce((sum, item) => sum + item.value, 0);
    const divisor = percentTotal === 0 ? percentItems.length : percentTotal;
    let allocated = 0;
    percentItems.forEach((item, index) => {
      let value = 0;
      if (percentTotal === 0) {
        value = Math.floor(remainForPercent / percentItems.length);
      } else {
        value = Math.floor((remainForPercent * item.value) / divisor);
      }
      item.amount_due = value;
      allocated += value;
      if (index === percentItems.length - 1) {
        item.amount_due += remainForPercent - allocated;
      }
    });
  }

  const byMember = new Map(allocations.map((a) => [a.member_id, a]));
  return normalizedIds.map((id) => byMember.get(id).amount_due);
};

// RM-7 & RM-9: Tạo hóa đơn + chia tiền cho các thành viên
const createBillWithSplit = async (billData, createdBy) => {
  const {
    room_id,
    bill_type,
    bill_type_other,
    total_amount,
    billing_month,
    bill_date,
    note,
    payer_id,
    member_ids,
    custom_splits,
  } = billData;

  if (!member_ids || member_ids.length === 0) {
    throw new Error("Phải có ít nhất 1 thành viên để chia tiền");
  }

  try {
    // Tạo hóa đơn
    const newBill = await RoomBill.create({
      room_id,
      bill_type,
      bill_type_other: bill_type === "other" ? (bill_type_other || "").trim() : null,
      total_amount,
      billing_month,
      bill_date: bill_date ? new Date(bill_date) : new Date(),
      note: note || null,
      status: BILL_STATUS.PENDING,
      created_by: createdBy,
      payer_id: payer_id || createdBy,
    });

    const splitAmounts =
      normalizeCustomSplits(custom_splits, total_amount, member_ids) ||
      splitAmountByLargestRemainder(total_amount, member_ids.length);

    // Tạo chi tiết hóa đơn cho từng thành viên
    const billDetailDocs = member_ids.map((memberId, index) => {
      const due = splitAmounts[index];
      const costRatio = total_amount > 0 ? due / total_amount : 0;
      return {
        bill_id: newBill._id,
        member_id: memberId,
        amount_due: due,
        original_amount: due,
        actual_amount: due,
        cost_ratio: Number(costRatio.toFixed(6)),
        status: BILL_DETAIL_STATUS.PENDING,
        paid_at: null,
        confirmed_by: null,
      };
    });

    const details = await BillDetail.insertMany(billDetailDocs);

    return { bill: newBill, details };
  } catch (error) {
    throw error;
  }
};

// RM-11: Xác nhận thanh toán — đổi pending → paid, rồi cập nhật trạng thái bill tổng
const confirmPayment = async (billDetailId, confirmedBy) => {
  const detail = await BillDetail.findById(billDetailId);

  if (!detail) throw new Error("Không tìm thấy bill_detail với ID đã cung cấp");
  if (detail.status === BILL_DETAIL_STATUS.PAID) throw new Error("Thành viên này đã thanh toán trước đó rồi");

  const bill = await RoomBill.findById(detail.bill_id).select("payer_id created_by");
  if (!bill) throw new Error("Không tìm thấy hóa đơn");

  const responsibleId = (bill.payer_id || bill.created_by)?.toString();
  if (!responsibleId || responsibleId !== confirmedBy.toString()) {
    throw new Error("Bạn không có quyền xác nhận thanh toán hóa đơn này");
  }

  detail.status = BILL_DETAIL_STATUS.PAID;
  detail.paid_at = new Date();
  detail.confirmed_by = confirmedBy;
  await detail.save();

  // Kiểm tra còn ai chưa trả không để cập nhật trạng thái bill tổng
  const pendingCount = await BillDetail.countDocuments({
    bill_id: detail.bill_id,
    status: BILL_DETAIL_STATUS.PENDING,
  });

  const newBillStatus = pendingCount === 0 ? BILL_STATUS.COMPLETED : BILL_STATUS.PARTIAL;

  const updatedBill = await RoomBill.findByIdAndUpdate(
    detail.bill_id,
    { status: newBillStatus },
    { new: true }
  );

  return { detail, bill: updatedBill };
};

// Lấy hóa đơn kèm danh sách chi tiết từng thành viên
const getBillWithDetails = async (billId) => {
  const bill = await RoomBill.findById(billId)
    .populate("room_id", "name address")
    .populate("created_by", "name email")
    .populate("payer_id", "name email");

  if (!bill) throw new Error("Không tìm thấy hóa đơn");

  const details = await BillDetail.find({ bill_id: billId })
    .populate("member_id", "name email")
    .populate("confirmed_by", "name email")
    .sort({ created_at: 1 });

  return { bill, details };
};

// RM-6: Lấy lịch sử hóa đơn của một phòng trong khoảng tháng
const getBillHistory = async (roomId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    billType = null,
    fromMonth = null,
    toMonth = null,
    sortBy = "billing_month",
    sortOrder = "desc",
  } = options;

  // Validate pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Build filter query
  const filter = { room_id: roomId };
  if (billType) {
    filter.bill_type = billType;
  }
  if (fromMonth || toMonth) {
    filter.billing_month = {};
    if (fromMonth) {
      filter.billing_month.$gte = fromMonth;
    }
    if (toMonth) {
      filter.billing_month.$lte = toMonth;
    }
  }

  // Build sort object
  const sortObj = {};
  const validSortFields = ["billing_month", "total_amount", "created_at", "status"];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "billing_month";
  const sortValue = sortOrder.toLowerCase() === "asc" ? 1 : -1;
  sortObj[sortField] = sortValue;

  try {
    // Get total count
    const total = await RoomBill.countDocuments(filter);

    // Get bills with pagination and sorting
    const bills = await RoomBill.find(filter)
      .populate("room_id", "name address")
      .populate("created_by", "name email")
      .populate("payer_id", "name email")
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get bill details for each bill
    const billsWithDetails = await Promise.all(
      bills.map(async (bill) => {
        const details = await BillDetail.find({ bill_id: bill._id })
          .populate("member_id", "name email")
          .populate("confirmed_by", "name email")
          .lean();

        // Calculate summary stats
        const paidCount = details.filter((d) => d.status === BILL_DETAIL_STATUS.PAID).length;
        const pendingCount = details.length - paidCount;

        return {
          ...bill,
          details,
          summary: {
            total_members: details.length,
            paid_members: paidCount,
            pending_members: pendingCount,
          },
        };
      })
    );

    return {
      bills: billsWithDetails,
      pagination: {
        current_page: pageNum,
        per_page: limitNum,
        total: total,
        total_pages: Math.ceil(total / limitNum),
      },
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createBillWithSplit,
  confirmPayment,
  getBillWithDetails,
  getBillHistory,
  splitAmountByLargestRemainder, // export riêng để tiện viết unit test
};

