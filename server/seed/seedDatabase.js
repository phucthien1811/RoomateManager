const mongoose = require('mongoose');

require('dotenv').config();
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: '.env' });
}
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: '../.env' });
}

const User = require('../src/models/user.model');
const Room = require('../src/models/room.model');
const Member = require('../src/models/member.model');
const RoomBill = require('../src/models/room.bill.model');
const BillDetail = require('../src/models/bill.detail.model');
const AbsenceReport = require('../src/models/absence.report.model');
const ChoreLog = require('../src/models/chore.log.model');
const DutySchedule = require('../src/models/duty.schedule.model');
const Fund = require('../src/models/fund.model');
const FundTransaction = require('../src/models/fund.transaction.model');
const Notification = require('../src/models/notification.model');
const Post = require('../src/models/post.model');

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getWeekStartMonday = (input = new Date()) => {
  const value = new Date(input);
  const day = value.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diffToMonday);
  value.setHours(0, 0, 0, 0);
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
};

const dutyDayOffsetMap = {
  'Thứ 2': 0,
  'Thứ 3': 1,
  'Thứ 4': 2,
  'Thứ 5': 3,
  'Thứ 6': 4,
  'Thứ 7': 5,
  'Chủ nhật': 6,
};

const getDutyDateFromWeekStart = (weekStart, dayLabel, hour = 9, minute = 0) => {
  const date = new Date(weekStart);
  date.setUTCDate(date.getUTCDate() + (dutyDayOffsetMap[dayLabel] || 0));
  date.setUTCHours(hour, minute, 0, 0);
  return date;
};

const createDateInCurrentMonth = (year, monthIndex, day, hour = 9, minute = 0) => {
  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(Math.max(1, day), lastDate);
  return new Date(year, monthIndex, safeDay, hour, minute, 0, 0);
};

const splitAmounts = (total, userIds) => {
  const base = Math.floor(total / userIds.length);
  const remainder = total - base * userIds.length;
  return userIds.map((userId, index) => ({
    userId,
    amount: base + (index === 0 ? remainder : 0),
  }));
};

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/roommatemanager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const currentMonthKey = getMonthKey(now);
    const currentWeekStart = getWeekStartMonday(now);

    await FundTransaction.deleteMany({});
    await Fund.deleteMany({});
    await BillDetail.deleteMany({});
    await RoomBill.deleteMany({});
    await AbsenceReport.deleteMany({});
    await ChoreLog.deleteMany({});
    await DutySchedule.deleteMany({});
    await Notification.deleteMany({});
    await Post.deleteMany({});
    await Member.deleteMany({});
    await Room.deleteMany({});
    await User.deleteMany({});

    await ChoreLog.syncIndexes();
    await RoomBill.syncIndexes();
    await BillDetail.syncIndexes();
    await Member.syncIndexes();
    console.log('🗑️  Cleared old data and synced indexes');

    const users = await User.create([
      { name: 'Test User', email: 'test@test.com', password: '123456', phone: '0901234567', avatar: '' },
      { name: 'Hoa Trần', email: 'hoa@test.com', password: '123456', phone: '0912345678', avatar: '' },
      { name: 'An Phạm', email: 'an@test.com', password: '123456', phone: '0923456789', avatar: '' },
      { name: 'Iris Trần', email: 'iris@test.com', password: '123456', phone: '0934567890', avatar: '' },
      { name: 'Duy Nguyễn', email: 'duy@test.com', password: '123456', phone: '0945678901', avatar: '' },
    ]);

    const [testUser, hoaUser, anUser, irisUser, duyUser] = users;
    const roomUsers = [hoaUser, testUser, anUser, irisUser, duyUser];

    const mainRoom = await Room.create({
      name: 'An Dương Vương',
      address: '456 An Dương Vương, Q5, TP.HCM',
      location: '456 An Dương Vương, Q5, TP.HCM',
      monthlyRent: 4500000,
      owner: hoaUser._id,
      members: roomUsers.map((u) => u._id),
      maxMembers: 6,
      status: 'active',
    });

    const roomMembers = await Member.create([
      { room: mainRoom._id, user: hoaUser._id, role: 'owner', nickname: 'Hoa' },
      { room: mainRoom._id, user: testUser._id, role: 'member', nickname: 'Test' },
      { room: mainRoom._id, user: anUser._id, role: 'member', nickname: 'An' },
      { room: mainRoom._id, user: irisUser._id, role: 'member', nickname: 'Iris' },
      { room: mainRoom._id, user: duyUser._id, role: 'member', nickname: 'Duy' },
    ]);

    const memberByUserId = new Map(roomMembers.map((item) => [String(item.user), item]));
    const roomUserIds = roomUsers.map((u) => u._id);
    console.log('✅ Created users, one main room, and linked members');

    const createBillWithDetails = async ({
      billType,
      billTypeOther = null,
      totalAmount,
      day,
      note,
      paidUserIds = [],
    }) => {
      const billDate = createDateInCurrentMonth(currentYear, currentMonthIndex, day, 10, 0);
      const bill = await RoomBill.create({
        room_id: mainRoom._id,
        bill_type: billType,
        bill_type_other: billType === 'other' ? billTypeOther : null,
        total_amount: totalAmount,
        billing_month: currentMonthKey,
        bill_date: billDate,
        note,
        status: 'pending',
        created_by: hoaUser._id,
        payer_id: hoaUser._id,
      });

      const allocations = splitAmounts(totalAmount, roomUserIds);
      const details = await BillDetail.insertMany(
        allocations.map((item) => {
          const isPaid = paidUserIds.some((id) => String(id) === String(item.userId));
          return {
            bill_id: bill._id,
            member_id: item.userId,
            member: memberByUserId.get(String(item.userId))._id,
            amount_due: item.amount,
            original_amount: item.amount,
            actual_amount: item.amount,
            cost_ratio: Number((item.amount / totalAmount).toFixed(6)),
            status: isPaid ? 'paid' : 'pending',
            paid_at: isPaid ? createDateInCurrentMonth(currentYear, currentMonthIndex, day, 19, 0) : null,
            confirmed_by: isPaid ? hoaUser._id : null,
          };
        })
      );

      const paidCount = details.filter((item) => item.status === 'paid').length;
      if (paidCount === details.length) {
        bill.status = 'completed';
      } else if (paidCount > 0) {
        bill.status = 'partial';
      } else {
        bill.status = 'pending';
      }
      await bill.save();
    };

    await createBillWithDetails({
      billType: 'rent',
      totalAmount: 6500000,
      day: 3,
      note: `Tiền thuê nhà tháng ${currentMonthKey}`,
      paidUserIds: [hoaUser._id, testUser._id],
    });

    await createBillWithDetails({
      billType: 'electricity',
      totalAmount: 1450000,
      day: 12,
      note: `Tiền điện tháng ${currentMonthKey}`,
      paidUserIds: [hoaUser._id],
    });

    await createBillWithDetails({
      billType: 'water',
      totalAmount: 520000,
      day: 12,
      note: `Tiền nước tháng ${currentMonthKey}`,
      paidUserIds: [hoaUser._id],
    });

    await createBillWithDetails({
      billType: 'internet',
      totalAmount: 250000,
      day: 12,
      note: `Tiền internet tháng ${currentMonthKey}`,
      paidUserIds: roomUserIds,
    });

    await createBillWithDetails({
      billType: 'other',
      billTypeOther: 'Tiền ăn',
      totalAmount: 900000,
      day: 15,
      note: 'Chi phí ăn uống và đồ dùng chung',
      paidUserIds: [],
    });
    console.log('✅ Created linked room bills and bill details');

    const fund = await Fund.create({
      room_id: mainRoom._id,
      balance: 3650000,
      categories: ['Đóng góp', 'Sửa chữa', 'Sinh hoạt chung', 'Chưa phân loại'],
      category_allocations: [
        { name: 'Đóng góp', amount: 4500000 },
        { name: 'Sửa chữa', amount: 250000 },
        { name: 'Sinh hoạt chung', amount: 600000 },
        { name: 'Chưa phân loại', amount: 2800000 },
      ],
    });

    await FundTransaction.insertMany([
      {
        fund_id: fund._id,
        type: 'deposit',
        amount: 2500000,
        performed_by: hoaUser._id,
        description: 'Đóng quỹ',
        category: 'Đóng góp',
        created_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 9, 0),
        updated_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 9, 0),
      },
      {
        fund_id: fund._id,
        type: 'deposit',
        amount: 1000000,
        performed_by: hoaUser._id,
        description: 'Đóng thêm tiền',
        category: 'Đóng góp',
        created_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 21, 8, 20),
        updated_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 21, 8, 20),
      },
      {
        fund_id: fund._id,
        type: 'deposit',
        amount: 500000,
        performed_by: irisUser._id,
        description: 'Đóng quỹ đầu tháng',
        category: 'Đóng góp',
        created_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 9, 20),
        updated_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 9, 20),
      },
      {
        fund_id: fund._id,
        type: 'deposit',
        amount: 500000,
        performed_by: duyUser._id,
        description: 'Đóng quỹ đầu tháng',
        category: 'Đóng góp',
        created_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 9, 40),
        updated_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 9, 40),
      },
      {
        fund_id: fund._id,
        type: 'deposit',
        amount: 500000,
        performed_by: anUser._id,
        description: 'Đóng quỹ đầu tháng',
        category: 'Đóng góp',
        created_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 10, 0),
        updated_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 10, 0),
      },
      {
        fund_id: fund._id,
        type: 'withdraw',
        amount: 600000,
        performed_by: hoaUser._id,
        description: 'Mua đồ vệ sinh và dụng cụ bếp',
        category: 'Sinh hoạt chung',
        created_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 16, 30),
        updated_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 16, 30),
      },
      {
        fund_id: fund._id,
        type: 'withdraw',
        amount: 250000,
        performed_by: hoaUser._id,
        description: 'Sửa quạt và bóng đèn',
        category: 'Sửa chữa',
        created_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 19, 45),
        updated_at: createDateInCurrentMonth(currentYear, currentMonthIndex, 12, 19, 45),
      },
    ]);
    console.log('✅ Created linked fund and transactions');

    await AbsenceReport.insertMany([
      {
        member: memberByUserId.get(String(testUser._id))._id,
        room: mainRoom._id,
        startDate: createDateInCurrentMonth(currentYear, currentMonthIndex, 5),
        endDate: createDateInCurrentMonth(currentYear, currentMonthIndex, 8),
        reason: 'Về quê',
        note: 'Về quê chơi lễ 30/4',
        status: 'Đã duyệt',
        approvedBy: memberByUserId.get(String(hoaUser._id))._id,
      },
      {
        member: memberByUserId.get(String(hoaUser._id))._id,
        room: mainRoom._id,
        startDate: createDateInCurrentMonth(currentYear, currentMonthIndex, 15),
        endDate: createDateInCurrentMonth(currentYear, currentMonthIndex, 17),
        reason: 'Công tác',
        note: 'Đi công tác tại Hà Nội',
        status: 'Từ chối',
        approvedBy: memberByUserId.get(String(hoaUser._id))._id,
        rejectionReason: 'Không phù hợp lịch sinh hoạt tuần này',
      },
    ]);
    console.log('✅ Created linked absence reports');

    const dutySchedules = await DutySchedule.insertMany([
      {
        room_id: mainRoom._id,
        week_start: currentWeekStart,
        day_label: 'Thứ 3',
        title: 'Dọn khu bếp',
        start_hour: 19,
        end_hour: 20,
        members: ['Test User', 'Hoa Trần'],
        note: 'Đổ rác và lau bếp',
        created_by: hoaUser._id,
      },
      {
        room_id: mainRoom._id,
        week_start: currentWeekStart,
        day_label: 'Thứ 4',
        title: 'Kiểm tra tủ lạnh và thực phẩm',
        start_hour: 20,
        end_hour: 21,
        members: ['Test User', 'An Phạm'],
        note: 'Bỏ đồ quá hạn và vệ sinh ngăn mát',
        created_by: hoaUser._id,
      },
      {
        room_id: mainRoom._id,
        week_start: currentWeekStart,
        day_label: 'Thứ 5',
        title: 'Vệ sinh nhà tắm',
        start_hour: 20,
        end_hour: 21,
        members: ['Iris Trần', 'Duy Nguyễn'],
        note: 'Lau gương và cọ sàn',
        created_by: hoaUser._id,
      },
      {
        room_id: mainRoom._id,
        week_start: currentWeekStart,
        day_label: 'Thứ 7',
        title: 'Tổng vệ sinh phòng khách',
        start_hour: 9,
        end_hour: 11,
        members: ['An Phạm', 'Test User'],
        note: 'Hút bụi và lau kệ',
        created_by: hoaUser._id,
      },
      {
        room_id: mainRoom._id,
        week_start: currentWeekStart,
        day_label: 'Chủ nhật',
        title: 'Phân loại rác cuối tuần',
        start_hour: 8,
        end_hour: 9,
        members: ['Hoa Trần', 'Duy Nguyễn'],
        note: 'Chuẩn bị rác tái chế trước giờ xe thu gom',
        created_by: hoaUser._id,
      },
    ]);

    await ChoreLog.insertMany([
      {
        room_id: mainRoom._id,
        source_type: 'duty',
        duty_id: dutySchedules[0]._id,
        assigned_to: testUser._id,
        assigned_members: [testUser._id],
        created_by: hoaUser._id,
        title: dutySchedules[0].title,
        note: dutySchedules[0].note,
        chore_date: getDutyDateFromWeekStart(currentWeekStart, dutySchedules[0].day_label, dutySchedules[0].start_hour),
        week_start: currentWeekStart,
        duty_day_label: dutySchedules[0].day_label,
        start_hour: dutySchedules[0].start_hour,
        end_hour: dutySchedules[0].end_hour,
        status: 'completed',
        completed_at: getDutyDateFromWeekStart(currentWeekStart, dutySchedules[0].day_label, 21, 0),
      },
      {
        room_id: mainRoom._id,
        source_type: 'duty',
        duty_id: dutySchedules[1]._id,
        assigned_to: testUser._id,
        assigned_members: [testUser._id],
        created_by: hoaUser._id,
        title: dutySchedules[1].title,
        note: dutySchedules[1].note,
        chore_date: getDutyDateFromWeekStart(currentWeekStart, dutySchedules[1].day_label, dutySchedules[1].start_hour),
        week_start: currentWeekStart,
        duty_day_label: dutySchedules[1].day_label,
        start_hour: dutySchedules[1].start_hour,
        end_hour: dutySchedules[1].end_hour,
        status: 'pending',
      },
      {
        room_id: mainRoom._id,
        source_type: 'manual',
        assigned_to: hoaUser._id,
        assigned_members: [hoaUser._id, testUser._id],
        created_by: hoaUser._id,
        title: 'Mua đồ vệ sinh',
        note: 'Bổ sung nước rửa chén và túi rác',
        chore_date: createDateInCurrentMonth(currentYear, currentMonthIndex, 22),
        start_hour: 18,
        end_hour: 19,
        status: 'pending',
      },
      {
        room_id: mainRoom._id,
        source_type: 'manual',
        assigned_to: testUser._id,
        assigned_members: [testUser._id],
        created_by: hoaUser._id,
        title: 'Kiểm tra công tơ điện',
        note: 'Ghi chỉ số điện cuối ngày',
        chore_date: createDateInCurrentMonth(currentYear, currentMonthIndex, 23),
        start_hour: 20,
        end_hour: 21,
        status: 'pending',
      },
      {
        room_id: mainRoom._id,
        source_type: 'manual',
        assigned_to: testUser._id,
        assigned_members: [testUser._id, irisUser._id],
        created_by: hoaUser._id,
        title: 'Tổng hợp danh sách đồ mua tuần mới',
        note: 'Chốt danh sách trước tối Chủ nhật',
        chore_date: getDutyDateFromWeekStart(currentWeekStart, 'Chủ nhật', 19, 0),
        start_hour: 19,
        end_hour: 20,
        status: 'pending',
      },
    ]);
    console.log('✅ Created linked duty schedules and chores');

    const totalBills = await RoomBill.countDocuments({ room_id: mainRoom._id });
    const totalBillDetails = await BillDetail.countDocuments({});
    const totalAbsence = await AbsenceReport.countDocuments({ room: mainRoom._id });
    const totalDuties = await DutySchedule.countDocuments({ room_id: mainRoom._id });
    const totalChores = await ChoreLog.countDocuments({ room_id: mainRoom._id });
    const totalTransactions = await FundTransaction.countDocuments({ fund_id: fund._id });

    console.log('\n📊 Database Seed Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Users: ${users.length}`);
    console.log('✅ Rooms: 1 (An Dương Vương)');
    console.log(`✅ Members linked to room: ${roomMembers.length}`);
    console.log(`✅ Bills (current month ${currentMonthKey}): ${totalBills}`);
    console.log(`✅ Bill details linked: ${totalBillDetails}`);
    console.log(`✅ Fund transactions linked: ${totalTransactions}`);
    console.log(`✅ Absence reports linked: ${totalAbsence}`);
    console.log(`✅ Duty schedules linked: ${totalDuties}`);
    console.log(`✅ Chore logs linked: ${totalChores}`);

    console.log('\n📧 Test Accounts');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. test@test.com / 123456');
    console.log('2. hoa@test.com / 123456');
    console.log('3. an@test.com / 123456');
    console.log('4. iris@test.com / 123456');
    console.log('5. duy@test.com / 123456');

    console.log('\n🔗 Consistency checks');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• Tất cả dữ liệu đều thuộc 1 phòng duy nhất.');
    console.log('• BillDetail tham chiếu đúng RoomBill + User + Member cùng phòng.');
    console.log('• Absence report tham chiếu Member cùng room_id.');
    console.log('• Duty/Chore/Fund đều nối đúng vào room chính.');
    console.log('• Dữ liệu dùng tháng hiện tại để các báo cáo không bị rỗng.');

    console.log('\n✨ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

seedDatabase();
