// Các hằng số dùng chung cho module Bill
// Tập trung ở đây để tránh gõ tay string rải rác khắp nơi

const BILL_TYPES = {
  ELECTRICITY: "electricity",
  WATER: "water",
  RENT: "rent",
  INTERNET: "internet",
};

// Trạng thái của cả hóa đơn phòng
const BILL_STATUS = {
  PENDING: "pending",     // chưa ai trả
  PARTIAL: "partial",     // có người trả rồi, chưa đủ
  COMPLETED: "completed", // tất cả đã trả
};

// Trạng thái của từng người trong hóa đơn
const BILL_DETAIL_STATUS = {
  PENDING: "pending",
  PAID: "paid",
};

module.exports = {
  BILL_TYPES,
  BILL_STATUS,
  BILL_DETAIL_STATUS,
};
