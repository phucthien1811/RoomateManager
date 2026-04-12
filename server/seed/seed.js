const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    phone: String,
    avatar: String,
  },
  { collection: 'users' }
);

const User = mongoose.model('User', userSchema);

const seedTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user exists
    const existingUser = await User.findOne({ email: 'test@test.com' });
    if (existingUser) {
      console.log('Test user already exists');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // Create test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: hashedPassword,
      phone: '0901234567',
      avatar: '',
    });

    console.log('✅ Test user created successfully!');
    console.log('Email: test@test.com');
    console.log('Password: 123456');
    console.log('User ID:', testUser._id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedTestUser();
