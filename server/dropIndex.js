const mongoose = require('mongoose');

const uri = "mongodb+srv://thientiy1811:r4QBRNpqOcxBFcjO@cluster0.mjzw8.mongodb.net/RoommateManager?appName=Cluster0";

async function dropOldIndex() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    
    const db = mongoose.connection.db;
    const collectionName = "room_bills";
    const indexName = "unique_bill_per_room_per_month";

    try {
      await db.collection(collectionName).dropIndex(indexName);
      console.log(`Dropped index ${indexName} from ${collectionName}`);
    } catch (e) {
      console.log(`Index ${indexName} might not exist or failed to drop: `, e.message);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

dropOldIndex();
