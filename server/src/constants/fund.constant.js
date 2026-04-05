// Các hằng số dùng chung cho module Fund (quỹ tiền chung)

// Loại giao dịch quỹ
const FUND_TRANSACTION_TYPES = {
  DEPOSIT: "deposit",   // nạp tiền vào quỹ
  WITHDRAW: "withdraw", // rút tiền từ quỹ (chi tiêu chung)
};

module.exports = {
  FUND_TRANSACTION_TYPES,
};
