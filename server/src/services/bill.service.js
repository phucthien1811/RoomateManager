/**
 * @file bill.service.js
 * @description Business logic cho module Bill.
 * Chứa thuật toán chia tiền Largest Remainder Method và các logic CRUD.
 */

const mongoose = require("mongoose");
const RoomBill = require("../models/room.bill.model");
const BillDetail = require("../models/bill.detail.model");
const { BILL_STATUS, BILL_DETAIL_STATUS } = require("../constants/bill.constant");

// ============================================================
// THUẬT TOÁN: LARGEST REMAINDER METHOD
// ============================================================
/**
 * Chia tổng tiền cho nhiều người, đảm bảo:
 *  1. Mỗi phần là số nguyên (không có xu lẻ).
 *  2. Tổng các phần luôn bằng đúng totalAmount.
 *
 * Cách hoạt động:
 *  - Bước 1: Chia đều (floor) → mỗi người nhận phần nguyên.
 *  - Bước 2: Tính phần dư còn lại (totalAmount - tổng đã chia).
 *  - Bước 3: Phân bổ phần dư cho những người có phần thập phân lớn nhất.
 *    (Theo yêu cầu nhóm: cộng toàn bộ phần dư vào người đầu tiên.)
 *
 * @param {number} totalAmount  - Tổng tiền cần chia (VNĐ, số nguyên)
 * @param {number} memberCount  - Số lượng thành viên
 * @returns {number[]}          - Mảng số tiền của từng người (theo thứ tự index)
 */
const splitAmountByLargestRemainder = (totalAmount, memberCount) => {
  if (memberCount <= 0) {
    throw new Error("Số lượng thành viên phải lớn hơn 0");
  }

  // Phần chia đều (chưa làm tròn)
  const exactShare = totalAmount / memberCount;

  // Bước 1: Làm tròn xuống (floor) cho từng người
  const baseAmounts = Array(memberCount).fill(Math.floor(exactShare));

  // Bước 2: Tính tổng đã phân bổ và phần dư còn thiếu
  const totalDistributed = baseAmounts.reduce((sum, val) => sum + val, 0);
  const remainder = totalAmount - totalDistributed;

  // Bước 3 (theo quy tắc nhóm): Cộng toàn bộ phần dư vào người đầu tiên (index 0)
  // Lý do: Đơn giản, minh bạch, và vẫn đảm bảo tổng chính xác.
  // Người đầu tiên thường là trưởng phòng hoặc người đặt hóa đơn.
  if (remainder > 0) {
    baseAmounts[0] += remainder;
  }

  return baseAmounts;
};

// ============================================================
// RM-7 & RM-9: TẠO HÓA ĐƠN VÀ TỰ ĐỘNG CHIA TIỀN
// ============================================================
/**
 * Tạo hóa đơn phòng mới và tự động chia tiền cho các thành viên.
 *
 * @param {Object} billData         - Dữ liệu hóa đơn từ request body
 * @param {string} billData.room_id
 * @param {string} billData.bill_type
 * @param {number} billData.total_amount
 * @param {string} billData.billing_month  - Định dạng YYYY-MM
 * @param {string} [billData.note]
 * @param {string[]} billData.member_ids   - Mảng ObjectId của các thành viên
 * @param {string} createdBy               - ObjectId của người tạo
 *
 * @returns {{ bill: Object, details: Object[] }}
 */
const createBillWithSplit = async (billData, createdBy) => {
  const { room_id, bill_type, total_amount, billing_month, note, member_ids } = billData;

  // Validate: phải có ít nhất 1 thành viên
  if (!member_ids || member_ids.length === 0) {
    throw new Error("Phải có ít nhất 1 thành viên để chia tiền");
  }

  // --------------------------------------------------------
  // Sử dụng MongoDB Session để đảm bảo ACID transaction:
  // Nếu insert bill_details thất bại, room_bill cũng bị rollback
  // --------------------------------------------------------
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // --- Bước 1: Tạo hóa đơn tổng ---
    const [newBill] = await RoomBill.create(
      [
        {
          room_id,
          bill_type,
          total_amount,
          billing_month,
          note: note || null,
          status: BILL_STATUS.PENDING,
          created_by: createdBy,
        },
      ],
      { session }
    );

    // --- Bước 2: Tính toán chia tiền bằng Largest Remainder Method ---
    const splitAmounts = splitAmountByLargestRemainder(total_amount, member_ids.length);

    // --- Bước 3: Tạo các bản ghi bill_detail cho từng thành viên ---
    const billDetailDocs = member_ids.map((memberId, index) => ({
      bill_id: newBill._id,
      member_id: memberId,
      amount_due: splitAmounts[index], // Người đầu nhận phần dư nếu có
      status: BILL_DETAIL_STATUS.PENDING,
      paid_at: null,
      confirmed_by: null,
    }));

    const details = await BillDetail.insertMany(billDetailDocs, { session });

    // --- Commit transaction nếu tất cả thành công ---
    await session.commitTransaction();

    return { bill: newBill, details };
  } catch (error) {
    // Rollback nếu có lỗi ở bất kỳ bước nào
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============================================================
// RM-11: XÁC NHẬN THANH TOÁN CỦA THÀNH VIÊN
// ============================================================
/**
 * Cập nhật trạng thái thanh toán của một thành viên từ `pending` → `paid`.
 * Sau đó kiểm tra nếu tất cả thành viên đã trả → cập nhật status bill tổng.
 *
 * @param {string} billDetailId  - ObjectId của bill_detail cần cập nhật
 * @param {string} confirmedBy   - ObjectId của người xác nhận (admin/member)
 *
 * @returns {{ detail: Object, bill: Object }}
 */
const confirmPayment = async (billDetailId, confirmedBy) => {
  // --- Bước 1: Tìm và validate bill_detail ---
  const detail = await BillDetail.findById(billDetailId);

  if (!detail) {
    throw new Error("Không tìm thấy bill_detail với ID đã cung cấp");
  }

  if (detail.status === BILL_DETAIL_STATUS.PAID) {
    throw new Error("Thành viên này đã thanh toán trước đó rồi");
  }

  // --- Bước 2: Cập nhật trạng thái thành PAID và ghi nhận thời gian ---
  detail.status = BILL_DETAIL_STATUS.PAID;
  detail.paid_at = new Date();
  detail.confirmed_by = confirmedBy;
  await detail.save();

  // --- Bước 3: Kiểm tra toàn bộ bill_details cùng bill_id ---
  // Đếm xem còn bao nhiêu thành viên chưa trả
  const pendingCount = await BillDetail.countDocuments({
    bill_id: detail.bill_id,
    status: BILL_DETAIL_STATUS.PENDING,
  });

  // --- Bước 4: Cập nhật status của hóa đơn tổng theo kết quả ---
  let newBillStatus;

  if (pendingCount === 0) {
    // Tất cả đã trả → hóa đơn hoàn thành
    newBillStatus = BILL_STATUS.COMPLETED;
  } else {
    // Vẫn còn người chưa trả → trạng thái partial (một phần)
    newBillStatus = BILL_STATUS.PARTIAL;
  }

  const updatedBill = await RoomBill.findByIdAndUpdate(
    detail.bill_id,
    { status: newBillStatus },
    { new: true } // Trả về document sau khi cập nhật
  );

  return { detail, bill: updatedBill };
};

// ============================================================
// HELPER: LẤY CHI TIẾT HÓA ĐƠN (dùng cho debug/response)
// ============================================================
/**
 * Lấy thông tin hóa đơn tổng kèm danh sách chi tiết từng thành viên.
 *
 * @param {string} billId - ObjectId của room_bill
 * @returns {{ bill: Object, details: Object[] }}
 */
const getBillWithDetails = async (billId) => {
  const bill = await RoomBill.findById(billId)
    .populate("room_id", "room_name room_number")
    .populate("created_by", "full_name email");

  if (!bill) {
    throw new Error("Không tìm thấy hóa đơn");
  }

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
  // Export thuật toán để có thể unit test độc lập
  splitAmountByLargestRemainder,
};
