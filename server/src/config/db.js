const mongoose = require('mongoose');

const ensureRoomBillIndexes = async (db) => {
  const collectionName = 'room_bills';
  const collectionExists = await db.listCollections({ name: collectionName }).hasNext();
  if (!collectionExists) return;

  const collection = db.collection(collectionName);
  const indexes = await collection.indexes();
  const legacyIndexNames = new Set([
    'unique_bill_per_room_per_month',
    'room_id_1_bill_type_1_billing_month_1',
  ]);

  for (const index of indexes) {
    if (legacyIndexNames.has(index.name)) {
      await collection.dropIndex(index.name);
      console.log(`[MongoDB] Dropped legacy index: ${index.name}`);
    }
  }

  await collection.createIndex(
    { room_id: 1, bill_type: 1, bill_type_other: 1, billing_month: 1 },
    { unique: true, name: 'unique_bill_per_room_per_month_custom' }
  );
  console.log('[MongoDB] Ensured index: unique_bill_per_room_per_month_custom');
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await ensureRoomBillIndexes(conn.connection.db);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
