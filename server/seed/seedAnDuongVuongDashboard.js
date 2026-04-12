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
const Fund = require('../src/models/fund.model');
const FundTransaction = require('../src/models/fund.transaction.model');
const ChoreLog = require('../src/models/chore.log.model');
const AbsenceReport = require('../src/models/absence.report.model');

const splitAmount = (total, count) => {
  const base = Math.floor(total / count);
  const amounts = Array(count).fill(base);
  const rem = total - base * count;
  if (rem > 0) amounts[0] += rem;
  return amounts;
};

const now = new Date();
const month = String(now.getMonth() + 1).padStart(2, '0');
const currentMonth = `${now.getFullYear()}-${month}`;

const usersSeed = [
  { name: 'Hoa Tran', email: 'hoa@test.com', password: '123456', phone: '0912345678' },
  { name: 'Test User', email: 'test@test.com', password: '123456', phone: '0901234567' },
  { name: 'An Pham', email: 'an@test.com', password: '123456', phone: '0923456789' },
  { name: 'Duy Nguyen', email: 'duy@test.com', password: '123456', phone: '0934567890' },
  { name: 'Iris Tran', email: 'iris@test.com', password: '123456', phone: '0945678901' },
];

const ensureUser = async (payload) => {
  let user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user) {
    user = await User.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: payload.password,
      phone: payload.phone,
      avatar: '',
    });
  }
  return user;
};

const main = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/roommatemanager';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const users = [];
    for (const u of usersSeed) {
      users.push(await ensureUser(u));
    }

    const owner = users[0];
    const roomMemberIds = users.map((u) => u._id);

    let room = await Room.findOne({ name: 'An Dương Vương' });
    if (!room) {
      room = await Room.create({
        name: 'An Dương Vương',
        address: '456 An Dương Vương, Q5, TP.HCM',
        location: '456 An Dương Vương, Q5, TP.HCM',
        monthlyRent: 6500000,
        owner: owner._id,
        members: roomMemberIds,
        maxMembers: 6,
        status: 'active',
      });
      console.log('Created room An Dương Vương');
    } else {
      room.owner = owner._id;
      room.members = roomMemberIds;
      room.maxMembers = 6;
      room.status = 'active';
      room.address = room.address || '456 An Dương Vương, Q5, TP.HCM';
      room.location = room.location || room.address;
      room.monthlyRent = room.monthlyRent || 6500000;
      await room.save();
      console.log('Updated room An Dương Vương');
    }

    for (const u of users) {
      const role = String(u._id) === String(owner._id) ? 'owner' : 'member';
      await Member.findOneAndUpdate(
        { room: room._id, user: u._id },
        { room: room._id, user: u._id, role, nickname: u.name, status: 'active' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    await Member.deleteMany({ room: room._id, user: { $nin: roomMemberIds } });
    console.log('Synced room members (5)');

    const currentMonthBills = await RoomBill.find({ room_id: room._id, billing_month: currentMonth }).select('_id');
    const currentMonthBillIds = currentMonthBills.map((bill) => bill._id);
    if (currentMonthBillIds.length > 0) {
      await BillDetail.deleteMany({ bill_id: { $in: currentMonthBillIds } });
      await RoomBill.deleteMany({ _id: { $in: currentMonthBillIds } });
    }

    const billSeeds = [
      { bill_type: 'rent', total_amount: 6500000, note: `Tiền thuê tháng ${currentMonth}` },
      { bill_type: 'electricity', total_amount: 1450000, note: `Tiền điện tháng ${currentMonth}` },
      { bill_type: 'water', total_amount: 520000, note: `Tiền nước tháng ${currentMonth}` },
      { bill_type: 'internet', total_amount: 250000, note: `Tiền mạng tháng ${currentMonth}` },
    ];

    for (const billSeed of billSeeds) {
      const bill = await RoomBill.create({
        room_id: room._id,
        bill_type: billSeed.bill_type,
        total_amount: billSeed.total_amount,
        billing_month: currentMonth,
        note: billSeed.note,
        status: 'partial',
        created_by: owner._id,
      });

      const amounts = splitAmount(billSeed.total_amount, roomMemberIds.length);
      const details = roomMemberIds.map((memberId, idx) => ({
        bill_id: bill._id,
        member_id: memberId,
        amount_due: amounts[idx],
        status: idx < 2 ? 'paid' : 'pending',
        paid_at: idx < 2 ? new Date() : null,
        confirmed_by: idx < 2 ? owner._id : null,
      }));
      await BillDetail.insertMany(details);
    }
    console.log('Seeded monthly bills + bill details');

    let fund = await Fund.findOne({ room_id: room._id });
    if (!fund) {
      fund = await Fund.create({ room_id: room._id, balance: 0 });
    }

    await FundTransaction.deleteMany({ fund_id: fund._id });

    const fundTx = [
      { type: 'deposit', amount: 500000, performed_by: users[1]._id, description: 'Dong quy dau thang' },
      { type: 'deposit', amount: 500000, performed_by: users[2]._id, description: 'Dong quy dau thang' },
      { type: 'deposit', amount: 500000, performed_by: users[3]._id, description: 'Dong quy dau thang' },
      { type: 'deposit', amount: 500000, performed_by: users[4]._id, description: 'Dong quy dau thang' },
      { type: 'deposit', amount: 500000, performed_by: owner._id, description: 'Dong quy dau thang' },
      { type: 'withdraw', amount: 600000, performed_by: owner._id, description: 'Mua do ve sinh va dung cu bep' },
      { type: 'withdraw', amount: 250000, performed_by: owner._id, description: 'Sua quat va bong den' },
    ];

    for (const tx of fundTx) {
      await FundTransaction.create({ fund_id: fund._id, ...tx });
    }

    const totalDeposit = fundTx.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const totalWithdraw = fundTx.filter((t) => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0);
    fund.balance = totalDeposit - totalWithdraw;
    await fund.save();
    console.log('Seeded fund transactions');

    await ChoreLog.deleteMany({ room_id: room._id });
    const today = new Date();
    const d = (offset) => {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      return date;
    };

    const chores = [
      { assigned_to: users[1]._id, chore_date: d(-2), note: 'Lau bep va don rac', status: 'completed' },
      { assigned_to: users[2]._id, chore_date: d(-1), note: 'Ve sinh nha tam', status: 'completed' },
      { assigned_to: users[3]._id, chore_date: d(0), note: 'Don phong khach', status: 'pending' },
      { assigned_to: users[4]._id, chore_date: d(1), note: 'Rua chen va bep', status: 'pending' },
      { assigned_to: owner._id, chore_date: d(2), note: 'Kiem tra do dung chung', status: 'pending' },
      { assigned_to: users[1]._id, chore_date: d(3), note: 'Lau cau thang', status: 'pending' },
    ];
    await ChoreLog.insertMany(
      chores.map((c) => ({
        room_id: room._id,
        assigned_to: c.assigned_to,
        chore_date: c.chore_date,
        note: c.note,
        status: c.status,
        completed_at: c.status === 'completed' ? new Date() : null,
        proof_images: [],
      }))
    );
    console.log('Seeded chores');

    await AbsenceReport.deleteMany({ room: room._id });
    const members = await Member.find({ room: room._id });
    const memberByUser = new Map(members.map((m) => [String(m.user), m]));
    const ownerMember = memberByUser.get(String(owner._id));
    const pendingMember = memberByUser.get(String(users[3]._id));

    if (ownerMember && pendingMember) {
      await AbsenceReport.create({
        member: pendingMember._id,
        room: room._id,
        startDate: d(4),
        endDate: d(6),
        reason: 'Về quê',
        note: 'Ve que 3 ngay',
        status: 'Chờ duyệt',
        approvedBy: null,
      });
    }

    console.log('\nDone seeding An Dương Vương dashboard data');
    console.log('Login: test@test.com | 123456');
    console.log(`Room: An Dương Vương | Month: ${currentMonth} | Members: 5`);

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

main();
