const AbsenceReport = require("../models/absence.report.model");
const Member = require("../models/member.model");

// Tạo báo cáo vắng mặt
const createAbsenceReport = async (userId, roomId, reportData) => {
  const { startDate, endDate, reason, note } = reportData;

  // Kiểm tra ngày kết thúc phải sau ngày bắt đầu
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
  }

  // Kiểm tra xem thành viên có tồn tại trong phòng không
  const member = await Member.findOne({
    user: userId,
    room: roomId,
  });
  
  if (!member) {
    throw new Error("Thành viên không tồn tại");
  }

  // Kiểm tra xem có báo cáo trùng lặp không (cùng khoảng thời gian)
  const existingReport = await AbsenceReport.findOne({
    member: member._id,
    room: roomId,
    status: 'Chờ duyệt',
    $or: [
      {
        startDate: { $lte: end },
        endDate: { $gte: start },
      },
    ],
  });

  if (existingReport) {
    throw new Error("Đã có báo cáo vắng mặt chưa được duyệt trong khoảng thời gian này");
  }

  // Tạo báo cáo vắng mặt
  const absenceReport = new AbsenceReport({
    member: member._id,
    room: roomId,
    startDate: start,
    endDate: end,
    reason,
    note: note || '',
    status: 'Chờ duyệt',
  });

  await absenceReport.save();
  return absenceReport;
};

// Lấy danh sách báo cáo vắng mặt của một phòng
const getAbsenceReports = async (roomId, filters = {}) => {
  const query = { room: roomId };

  // Lọc theo trạng thái
  if (filters.status) {
    query.status = filters.status;
  }

  // Lọc theo thành viên
  if (filters.memberId) {
    query.member = filters.memberId;
  }

  const reports = await AbsenceReport.find(query)
    .populate({
      path: 'member',
      select: 'nickname user',
      populate: {
        path: 'user',
        select: 'name full_name email',
      },
    })
    .populate('approvedBy', 'nickname')
    .sort({ createdAt: -1 });

  return reports;
};

// Chỉnh sửa báo cáo vắng mặt (chỉ chính chủ)
const updateAbsenceReport = async (reportId, userId, updateData) => {
  const report = await AbsenceReport.findById(reportId).populate('member', 'user');

  if (!report) {
    throw new Error("Báo cáo vắng mặt không tồn tại");
  }

  const ownerUserId = report.member?.user?.toString();
  if (!ownerUserId || ownerUserId !== userId.toString()) {
    throw new Error("Bạn không có quyền chỉnh sửa báo cáo này");
  }

  const startDate = updateData.startDate ? new Date(updateData.startDate) : report.startDate;
  const endDate = updateData.endDate ? new Date(updateData.endDate) : report.endDate;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Định dạng ngày không hợp lệ");
  }

  if (endDate <= startDate) {
    throw new Error("Ngày có mặt phải sau ngày bắt đầu vắng");
  }

  report.startDate = startDate;
  report.endDate = endDate;
  report.note = updateData.note ?? report.note;
  if (updateData.reason) {
    report.reason = updateData.reason;
  }

  await report.save();
  return report;
};

// Lấy chi tiết báo cáo vắng mặt
const getAbsenceReportById = async (reportId) => {
  const report = await AbsenceReport.findById(reportId)
    .populate('member', 'nickname')
    .populate('approvedBy', 'nickname');

  if (!report) {
    throw new Error("Báo cáo vắng mặt không tồn tại");
  }

  return report;
};

// Phê duyệt báo cáo vắng mặt
const approveAbsenceReport = async (reportId, approverId) => {
  const report = await AbsenceReport.findById(reportId);

  if (!report) {
    throw new Error("Báo cáo vắng mặt không tồn tại");
  }

  if (report.status !== 'Chờ duyệt') {
    throw new Error("Báo cáo này không ở trạng thái chờ duyệt");
  }

  // Kiểm tra người phê duyệt là chủ trọ
  const approver = await Member.findById(approverId);
  if (!approver || approver.role !== 'owner') {
    throw new Error("Chỉ chủ trọ mới có thể phê duyệt báo cáo");
  }

  report.status = 'Đã duyệt';
  report.approvedBy = approverId;
  report.approvedAt = new Date();

  await report.save();
  return report;
};

// Từ chối báo cáo vắng mặt
const rejectAbsenceReport = async (reportId, approverId, rejectionReason) => {
  const report = await AbsenceReport.findById(reportId);

  if (!report) {
    throw new Error("Báo cáo vắng mặt không tồn tại");
  }

  if (report.status !== 'Chờ duyệt') {
    throw new Error("Báo cáo này không ở trạng thái chờ duyệt");
  }

  // Kiểm tra người phê duyệt là chủ trọ
  const approver = await Member.findById(approverId);
  if (!approver || approver.role !== 'owner') {
    throw new Error("Chỉ chủ trọ mới có thể từ chối báo cáo");
  }

  report.status = 'Từ chối';
  report.approvedBy = approverId;
  report.approvedAt = new Date();
  report.rejectionReason = rejectionReason || '';

  await report.save();
  return report;
};

// Xóa báo cáo vắng mặt (chỉ khi chưa duyệt)
const deleteAbsenceReport = async (reportId, memberId) => {
  const report = await AbsenceReport.findById(reportId);

  if (!report) {
    throw new Error("Báo cáo vắng mặt không tồn tại");
  }

  if (report.member.toString() !== memberId.toString()) {
    throw new Error("Bạn không có quyền xóa báo cáo này");
  }

  if (report.status !== 'Chờ duyệt') {
    throw new Error("Chỉ có thể xóa báo cáo ở trạng thái chờ duyệt");
  }

  await AbsenceReport.findByIdAndDelete(reportId);
  return { message: "Xóa báo cáo thành công" };
};

module.exports = {
  createAbsenceReport,
  getAbsenceReports,
  getAbsenceReportById,
  updateAbsenceReport,
  approveAbsenceReport,
  rejectAbsenceReport,
  deleteAbsenceReport,
};
