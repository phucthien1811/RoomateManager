const mongoose = require("mongoose");
const RoomBill = require("../models/room.bill.model");
const BillDetail = require("../models/bill.detail.model");
const { BILL_STATUS, BILL_DETAIL_STATUS } = require("../constants/bill.constant");

// Largest Remainder Method — chia tiền thành số nguyên, đảm bảo tổng luôn khớp
// Cách làm: floor hết rồi cộng phần dư vào người đầu tiên
const splitAmountByLargestRemainder = (totalAmount, memberCount) => {
  if (memberCount <= 0) throw new Error("Số lượng thành viên phải lớn hơn 0");

  const baseAmounts = Array(memberCount).fill(Math.floor(totalAmount / memberCount));
  const remainder = totalAmount - baseAmounts.reduce((sum, val) => sum + val, 0);

  // Phần dư cộng vào người đầu (thường là trưởng phòng / người tạo bill)
  if (remainder > 0) baseAmounts[0] += remainder;

  return baseAmounts;
};

// RM-7 & RM-9: Tạo hóa đơn + chia tiền cho các thành viên
const createBillWithSplit = async (billData, createdBy) => {
  const { room_id, bill_type, total_amount, billing_month, note, member_ids } = billData;

  if (!member_ids || member_ids.length === 0) {
    throw new Error("Phải có ít nhất 1 thành viên để chia tiền");
  }

  // Dùng transaction để đảm bảo: nếu insert bill_details lỗi thì room_bill cũng rollback
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [newBill] = await RoomBill.create(
      [{ room_id, bill_type, total_amount, billing_month, note: note || null, status: BILL_STATUS.PENDING, created_by: createdBy }],
      { session }
    );

    const splitAmounts = splitAmountByLargestRemainder(total_amount, member_ids.length);

    const billDetailDocs = member_ids.map((memberId, index) => ({
      bill_id: newBill._id,
      member_id: memberId,
      amount_due: splitAmounts[index], // người đầu nhận phần dư nếu có
      status: BILL_DETAIL_STATUS.PENDING,
      paid_at: null,
      confirmed_by: null,
    }));

    const details = await BillDetail.insertMany(billDetailDocs, { session });

    await session.commitTransaction();
    return { bill: newBill, details };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// RM-11: Xác nhận thanh toán — đổi pending → paid, rồi cập nhật trạng thái bill tổng
const confirmPayment = async (billDetailId, confirmedBy) => {
  const detail = await BillDetail.findById(billDetailId);

  if (!detail) throw new Error("Không tìm thấy bill_detail với ID đã cung cấp");
  if (detail.status === BILL_DETAIL_STATUS.PAID) throw new Error("Thành viên này đã thanh toán trước đó rồi");

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
    .populate("room_id", "room_name room_number")
    .populate("created_by", "full_name email");

  if (!bill) throw new Error("Không tìm thấy hóa đơn");

  const details = await BillDetail.find({ bill_id: billId })
    .populate("member_id", "full_name email")
    .populate("confirmed_by", "full_name email")
    .sort({ created_at: 1 });

  return { bill, details };
};

module.exports = {
  createBillWithSplit,
  confirmPayment,
  getBillWithDetails,
  splitAmountByLargestRemainder, // export riêng để tiện viết unit test
};
feat: refactor comments bill.service
