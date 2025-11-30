// createAdmin.js
import User from '../models/User.js';
import connectDB from '../config/db.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const createAdminUser = async () => {
  try {
    const email = 'shivamrakhonde@gmail.com';
    const username = 'shivamrakhonde';
    const plainPassword = 'Shivam@2003';
    const role = 'superadmin';

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create or update super admin
    const result = await User.updateOne(
      { $or: [{ email }, { role }] }, // find by email OR role
      {
        $set: {
          username,
          email,
          password: hashedPassword,
          role,
          isActive: true,
        },
      },
      { upsert: true } // create if not exists
    );

    if (result.upsertedCount > 0) {
      console.log('✅ Super admin user created successfully!');
    } else {
      console.log('✅ Super admin already existed, updated details.');
    }

    console.log('👤 Username:', username);
    console.log('📧 Email:', email);
    console.log('🔑 Password:', plainPassword);
    console.log('⚠️ Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    process.exit();
  }
};

// Run the script
createAdminUser();
