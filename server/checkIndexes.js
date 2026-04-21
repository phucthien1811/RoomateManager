const mongoose = require('mongoose');

const uri = "mongodb+srv://thientiy1811:r4QBRNpqOcxBFcjO@cluster0.mjzw8.mongodb.net/RoommateManager?appName=Cluster0";

async function checkIndexes() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const indexes = await db.collection("room_bills").indexes();
    console.log("Current indexes: ", indexes.map(i => i.name));
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

checkIndexes();
