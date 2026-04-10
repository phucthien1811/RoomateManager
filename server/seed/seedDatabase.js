const mongoose = require('mongoose');

// Try to load .env from multiple locations
require('dotenv').config();
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: '.env' });
}
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: '../.env' });
}

// Load models
const User = require('../src/models/user.model');
const Room = require('../src/models/room.model');
const Member = require('../src/models/member.model');
const RoomBill = require('../src/models/room.bill.model');
const AbsenceReport = require('../src/models/absence.report.model');
const ChoreLog = require('../src/models/chore.log.model');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/roommatemanager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Room.deleteMany({});
    await Member.deleteMany({});
    console.log('🗑️  Cleared old data');

    // Create test user (DO NOT hash password - let User model's pre-save hook handle it)
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: '123456',
      phone: '0901234567',
      avatar: '',
    });
    console.log('✅ Created test user: test@test.com');

    // Create sample rooms
    const room1 = await Room.create({
      name: 'Trần Hùng Đạo',
      address: '123 Trần Hùng Đạo, Q1, TP.HCM',
      location: '123 Trần Hùng Đạo, Q1, TP.HCM',
      monthlyRent: 3400000,
      owner: testUser._id,
      members: [testUser._id],
      maxMembers: 4,
      status: 'active',
    });
    console.log('✅ Created room 1: Trần Hùng Đạo');

    const user2 = await User.create({
      name: 'Hoa Trần',
      email: 'hoa@test.com',
      password: '123456',
      phone: '0912345678',
      avatar: '',
    });

    const room2 = await Room.create({
      name: 'An Dương Vương',
      address: '456 An Dương Vương, Q5, TP.HCM',
      location: '456 An Dương Vương, Q5, TP.HCM',
      monthlyRent: 4500000,
      owner: user2._id,
      members: [user2._id, testUser._id],
      maxMembers: 3,
      status: 'active',
    });
    console.log('✅ Created room 2: An Dương Vương');

    const user3 = await User.create({
      name: 'An Phạm',
      email: 'an@test.com',
      password: '123456',
      phone: '0923456789',
      avatar: '',
    });

    const room3 = await Room.create({
      name: 'Lạc Long Quân',
      address: '789 Lạc Long Quân, Q7, TP.HCM',
      location: '789 Lạc Long Quân, Q7, TP.HCM',
      monthlyRent: 5200000,
      owner: user3._id,
      members: [user3._id, testUser._id, user2._id],
      maxMembers: 5,
      status: 'active',
    });
    console.log('✅ Created room 3: Lạc Long Quân');

    // Create member records for room 1
    await Member.create([
      { room: room1._id, user: testUser._id, role: 'owner', nickname: 'Owner 1' },
    ]);

    // Create member records for room 2
    await Member.create([
      { room: room2._id, user: user2._id, role: 'owner', nickname: 'Owner 2' },
      { room: room2._id, user: testUser._id, role: 'member', nickname: 'Member 1' },
    ]);

    // Create member records for room 3
    await Member.create([
      { room: room3._id, user: user3._id, role: 'owner', nickname: 'Owner 3' },
      { room: room3._id, user: testUser._id, role: 'member', nickname: 'Member 2' },
      { room: room3._id, user: user2._id, role: 'member', nickname: 'Member 3' },
    ]);
    console.log('✅ Created member records for all rooms');

    // Clear old bills and absence reports
    await RoomBill.deleteMany({});
    await AbsenceReport.deleteMany({});
    await ChoreLog.deleteMany({});
    console.log('🗑️  Cleared old bills, absence reports, and chores');

    // Create sample bills for room 1
    const bill1 = await RoomBill.create({
      room_id: room1._id,
      bill_type: 'electricity',
      total_amount: 850000,
      billing_month: '2025-04',
      note: 'Tiền điện tháng 4/2025',
      status: 'pending',
      created_by: testUser._id,
    });

    const bill2 = await RoomBill.create({
      room_id: room1._id,
      bill_type: 'water',
      total_amount: 320000,
      billing_month: '2025-04',
      note: 'Tiền nước tháng 4/2025',
      status: 'pending',
      created_by: testUser._id,
    });

    const bill3 = await RoomBill.create({
      room_id: room1._id,
      bill_type: 'internet',
      total_amount: 150000,
      billing_month: '2025-04',
      note: 'Tiền internet tháng 4/2025',
      status: 'completed',
      created_by: testUser._id,
    });
    console.log('✅ Created 3 sample bills for room 1');

    // Create sample bills for room 2
    const bill4 = await RoomBill.create({
      room_id: room2._id,
      bill_type: 'electricity',
      total_amount: 920000,
      billing_month: '2025-04',
      note: 'Tiền điện tháng 4/2025',
      status: 'completed',
      created_by: user2._id,
    });

    const bill5 = await RoomBill.create({
      room_id: room2._id,
      bill_type: 'water',
      total_amount: 380000,
      billing_month: '2025-04',
      note: 'Tiền nước tháng 4/2025',
      status: 'pending',
      created_by: user2._id,
    });
    console.log('✅ Created 2 sample bills for room 2');

    // Create sample bills for room 3
    const bill6 = await RoomBill.create({
      room_id: room3._id,
      bill_type: 'electricity',
      total_amount: 1200000,
      billing_month: '2025-04',
      note: 'Tiền điện tháng 4/2025',
      status: 'pending',
      created_by: user3._id,
    });

    const bill7 = await RoomBill.create({
      room_id: room3._id,
      bill_type: 'internet',
      total_amount: 180000,
      billing_month: '2025-04',
      note: 'Tiền internet tháng 4/2025',
      status: 'completed',
      created_by: user3._id,
    });
    console.log('✅ Created 2 sample bills for room 3');

    // Get created members for reference
    const memberRoom1 = await Member.findOne({ room: room1._id, user: testUser._id });
    const memberRoom2_Owner = await Member.findOne({ room: room2._id, user: user2._id });
    const memberRoom2_User = await Member.findOne({ room: room2._id, user: testUser._id });
    const memberRoom3_Owner = await Member.findOne({ room: room3._id, user: user3._id });
    const memberRoom3_User1 = await Member.findOne({ room: room3._id, user: testUser._id });
    const memberRoom3_User2 = await Member.findOne({ room: room3._id, user: user2._id });

    // Create sample absence reports for room 1
    const report1 = await AbsenceReport.create({
      member: memberRoom1._id,
      room: room1._id,
      startDate: new Date('2025-04-05'),
      endDate: new Date('2025-04-08'),
      reason: 'Về quê',
      note: 'Về quê chơi lễ 30/4',
      status: 'Đã duyệt',
      approvedBy: memberRoom1._id,
    });

    const report2 = await AbsenceReport.create({
      member: memberRoom2_Owner._id,
      room: room1._id,
      startDate: new Date('2025-04-15'),
      endDate: new Date('2025-04-17'),
      reason: 'Công tác',
      note: 'Đi công tác tại Hà Nội',
      status: 'Chờ duyệt',
      approvedBy: null,
    });
    console.log('✅ Created 2 sample absence reports for room 1');

    // Create sample absence reports for room 2
    const report3 = await AbsenceReport.create({
      member: memberRoom2_Owner._id,
      room: room2._id,
      startDate: new Date('2025-04-10'),
      endDate: new Date('2025-04-12'),
      reason: 'Khác',
      note: 'Được phép vắng mặt của chủ trọ',
      status: 'Đã duyệt',
      approvedBy: memberRoom2_Owner._id,
    });

    const report4 = await AbsenceReport.create({
      member: memberRoom2_User._id,
      room: room2._id,
      startDate: new Date('2025-04-20'),
      endDate: new Date('2025-04-25'),
      reason: 'Về quê',
      note: 'Về quê xin phép',
      status: 'Từ chối',
      approvedBy: memberRoom2_Owner._id,
      rejectionReason: 'Không hợp lệ do vừa vắng mặt tháng trước',
    });
    console.log('✅ Created 2 sample absence reports for room 2');

    // Create sample absence reports for room 3
    const report5 = await AbsenceReport.create({
      member: memberRoom3_Owner._id,
      room: room3._id,
      startDate: new Date('2025-04-11'),
      endDate: new Date('2025-04-13'),
      reason: 'Công tác',
      note: 'Công tác tại Đà Nẵng',
      status: 'Chờ duyệt',
      approvedBy: null,
    });
    console.log('✅ Created 1 sample absence report for room 3');

    // Create sample chores for room 1
    const chore1 = await ChoreLog.create({
      room_id: room1._id,
      chore_date: '2025-04-10',
      note: 'Dọn phòng khách',
      assigned_to: testUser._id,
      status: 'pending',
      created_by: testUser._id,
    });

    const chore2 = await ChoreLog.create({
      room_id: room1._id,
      chore_date: '2025-04-11',
      note: 'Rửa bát và dọn bếp',
      assigned_to: user2._id,
      status: 'pending',
      created_by: testUser._id,
    });

    const chore3 = await ChoreLog.create({
      room_id: room1._id,
      chore_date: '2025-04-12',
      note: 'Vệ sinh nhà vệ sinh',
      assigned_to: testUser._id,
      status: 'completed',
      created_by: testUser._id,
    });
    console.log('✅ Created 3 sample chores for room 1');

    // Create sample chores for room 2
    const chore4 = await ChoreLog.create({
      room_id: room2._id,
      chore_date: '2025-04-09',
      note: 'Lau nhà',
      assigned_to: user2._id,
      status: 'completed',
      created_by: user2._id,
    });

    const chore5 = await ChoreLog.create({
      room_id: room2._id,
      chore_date: '2025-04-13',
      note: 'Sắp xếp chung',
      assigned_to: testUser._id,
      status: 'pending',
      created_by: user2._id,
    });
    console.log('✅ Created 2 sample chores for room 2');

    // Create sample chores for room 3
    const chore6 = await ChoreLog.create({
      room_id: room3._id,
      chore_date: '2025-04-14',
      note: 'Dọn sạch sân ngoài',
      assigned_to: user3._id,
      status: 'pending',
      created_by: user3._id,
    });
    console.log('✅ Created 1 sample chore for room 3');

    console.log('\n📊 Database Seed Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Users created: 3`);
    console.log(`✅ Rooms created: 3`);
    console.log(`✅ Bills created: 7`);
    console.log(`✅ Absence Reports created: 5`);
    console.log(`✅ Chores/Tasks created: 6`);
    console.log('\n📧 Test Accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Email: test@test.com | Pass: 123456 | Rooms: 3');
    console.log('2. Email: hoa@test.com | Pass: 123456 | Rooms: 1 (owner)');
    console.log('3. Email: an@test.com | Pass: 123456 | Rooms: 1 (owner)');
    console.log('\n🏠 Rooms:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`1. Trần Hùng Đạo (Owner: Test User) - 3.4M VND`);
    console.log(`2. An Dương Vương (Owner: Hoa Trần) - 4.5M VND`);
    console.log(`3. Lạc Long Quân (Owner: An Phạm) - 5.2M VND`);
    
    console.log('\n💵 Sample Bills:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Room 1 (3 bills):');
    console.log('  - Electricity: 850K (Pending)');
    console.log('  - Water: 320K (Pending)');
    console.log('  - Internet: 150K (Completed)');
    console.log('Room 2 (2 bills):');
    console.log('  - Electricity: 920K (Completed)');
    console.log('  - Water: 380K (Pending)');
    console.log('Room 3 (2 bills):');
    console.log('  - Electricity: 1.2M (Pending)');
    console.log('  - Internet: 180K (Completed)');
    
    console.log('\n📋 Sample Absence Reports:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Room 1 (2 reports):');
    console.log('  - Test User: 05-08/04 (Về quê) - Approved');
    console.log('  - Hoa Trần: 15-17/04 (Công tác) - Pending');
    console.log('Room 2 (2 reports):');
    console.log('  - Hoa Trần: 10-12/04 (Khác) - Approved');
    console.log('  - Test User: 20-25/04 (Về quê) - Rejected');
    console.log('Room 3 (1 report):');
    console.log('  - An Phạm: 11-13/04 (Công tác) - Pending');

    console.log('\n📝 Sample Chores/Tasks:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Room 1 (3 chores):');
    console.log('  - Dọn phòng khách (10/04) - Pending');
    console.log('  - Rửa bát và dọn bếp (11/04) - Pending');
    console.log('  - Vệ sinh nhà vệ sinh (12/04) - Completed');
    console.log('Room 2 (2 chores):');
    console.log('  - Lau nhà (09/04) - Completed');
    console.log('  - Sắp xếp chung (13/04) - Pending');
    console.log('Room 3 (1 chore):');
    console.log('  - Dọn sạch sân ngoài (14/04) - Pending');

    console.log('\n✨ Seed completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

seedDatabase();
