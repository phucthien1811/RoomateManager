const mongoose = require('mongoose');
require('dotenv').config();

// Load models
const User = require('../src/models/user.model');
const Room = require('../src/models/room.model');
const RoomBill = require('../src/models/room.bill.model');
const BillDetail = require('../src/models/bill.detail.model');

// Tách tiền bằng Largest Remainder Method
const splitAmountByLargestRemainder = (totalAmount, memberCount) => {
  if (memberCount <= 0) throw new Error('Số lượng thành viên phải lớn hơn 0');
  
  const baseAmounts = Array(memberCount).fill(Math.floor(totalAmount / memberCount));
  const remainder = totalAmount - baseAmounts.reduce((sum, val) => sum + val, 0);
  
  if (remainder > 0) baseAmounts[0] += remainder;
  return baseAmounts;
};

const addBills = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/roommatemanager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Lấy danh sách phòng
    const rooms = await Room.find().populate('members');
    if (rooms.length === 0) {
      console.log('❌ Không có phòng nào. Vui lòng chạy seed database trước.');
      process.exit(0);
    }

    console.log(`📊 Tìm thấy ${rooms.length} phòng`);

    // Dữ liệu hóa đơn mới để thêm
    const newBillsData = [
      // Phòng 1
      {
        roomIndex: 0,
        bills: [
          {
            bill_type: 'electricity',
            total_amount: 950000,
            billing_month: '2025-05',
            note: 'Tiền điện tháng 5/2025',
            status: 'pending',
          },
          {
            bill_type: 'water',
            total_amount: 380000,
            billing_month: '2025-05',
            note: 'Tiền nước tháng 5/2025',
            status: 'pending',
          },
          {
            bill_type: 'internet',
            total_amount: 180000,
            billing_month: '2025-05',
            note: 'Tiền internet tháng 5/2025',
            status: 'pending',
          },
        ],
      },
      // Phòng 2
      {
        roomIndex: 1,
        bills: [
          {
            bill_type: 'electricity',
            total_amount: 1050000,
            billing_month: '2025-05',
            note: 'Tiền điện tháng 5/2025',
            status: 'pending',
          },
          {
            bill_type: 'water',
            total_amount: 420000,
            billing_month: '2025-05',
            note: 'Tiền nước tháng 5/2025',
            status: 'pending',
          },
          {
            bill_type: 'rent',
            total_amount: 4500000,
            billing_month: '2025-05',
            note: 'Tiền thuê phòng tháng 5/2025',
            status: 'pending',
          },
        ],
      },
      // Phòng 3
      {
        roomIndex: 2,
        bills: [
          {
            bill_type: 'electricity',
            total_amount: 1350000,
            billing_month: '2025-05',
            note: 'Tiền điện tháng 5/2025',
            status: 'pending',
          },
          {
            bill_type: 'water',
            total_amount: 520000,
            billing_month: '2025-05',
            note: 'Tiền nước tháng 5/2025',
            status: 'pending',
          },
          {
            bill_type: 'internet',
            total_amount: 200000,
            billing_month: '2025-05',
            note: 'Tiền internet tháng 5/2025',
            status: 'pending',
          },
        ],
      },
    ];

    let totalBillsCreated = 0;

    // Tạo hóa đơn cho mỗi phòng
    for (const roomBillsData of newBillsData) {
      const room = rooms[roomBillsData.roomIndex];
      const memberIds = room.members.map(m => m._id);

      console.log(`\n🏠 Phòng: ${room.name}`);
      console.log(`👥 Thành viên: ${memberIds.length}`);

      for (const billData of roomBillsData.bills) {
        try {
          // Tạo hóa đơn
          const newBill = await RoomBill.create({
            room_id: room._id,
            bill_type: billData.bill_type,
            total_amount: billData.total_amount,
            billing_month: billData.billing_month,
            note: billData.note,
            status: billData.status,
            created_by: memberIds[0],
          });

          // Chia tiền cho các thành viên
          const splitAmounts = splitAmountByLargestRemainder(billData.total_amount, memberIds.length);
          const billDetails = memberIds.map((memberId, index) => ({
            bill_id: newBill._id,
            member_id: memberId,
            amount_due: splitAmounts[index],
            status: 'pending',
            paid_at: null,
            confirmed_by: null,
          }));

          await BillDetail.insertMany(billDetails);

          console.log(`  ✅ ${billData.bill_type.toUpperCase()}: ${billData.total_amount.toLocaleString('vi-VN')} VNĐ (${billData.billing_month})`);
          totalBillsCreated++;
        } catch (error) {
          console.log(`  ❌ Lỗi tạo hóa đơn: ${error.message}`);
        }
      }
    }

    console.log(`\n✨ Đã tạo thêm ${totalBillsCreated} hóa đơn!`);
    console.log('\n💡 Bạn có thể xem hóa đơn trong ứng dụng:');
    console.log('   1. Đăng nhập: test@test.com | 123456');
    console.log('   2. Chọn "Hóa Đơn" từ menu sidebar');
    console.log('   3. Chọn phòng để xem danh sách hóa đơn');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
};

addBills();
