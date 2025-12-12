
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

// Use the environment variable from Railway
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing. Are you running this in Railway?');
    process.exit(1);
}

const TARGET_PHONE = '9705637783';
const DEFAULT_PASS = 'admin123'; // Temporary password

async function promoteAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        console.log(`🔍 Looking for user with phone: ${TARGET_PHONE}`);
        const user = await User.findOne({ phone: TARGET_PHONE });

        if (!user) {
            console.error('❌ User not found! Please ensure they have signed up first.');
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.name || 'Unnamed'} (${user._id})`);

        // Hash password
        const hashedPassword = await bcrypt.hash(DEFAULT_PASS, 10);

        // Update fields
        user.role = 'admin';
        user.password = hashedPassword;
        user.emailVerified = true;

        // If they don't have an email, give them a placeholder so they can login via email/pass if needed
        if (!user.email) {
            user.email = `admin_${TARGET_PHONE}@rapidride.com`;
            console.log(`ℹ️  User verify email missing, set placeholder: ${user.email}`);
        }

        await user.save();

        console.log('🎉 SUCCESS! User promoted to ADMIN.');
        console.log('-----------------------------------');
        console.log(`👤 Name: ${user.name}`);
        console.log(`hello: ${user.email}`);
        console.log(`🔑 Password: ${DEFAULT_PASS}`);
        console.log('-----------------------------------');
        console.log('⚠️  Please change this password immediately after logging in.');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

promoteAdmin();
