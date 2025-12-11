// Delete and recreate test users with passwords
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/user');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rapidride';

async function recreateTestUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Delete existing test users
        await User.deleteMany({ email: { $in: ['driver@test.com', 'rider@test.com'] } });
        console.log('🗑️ Deleted existing test users');

        // Create driver with password
        const driverPassword = await bcrypt.hash('Driver123456', 10);
        const driver = new User({
            email: 'driver@test.com',
            password: driverPassword,
            name: 'Test Driver',
            phone: '+919876543210',
            role: 'driver',
            emailVerified: true,
            phoneVerified: true,
            vehicle: {
                type: 'Sedan',
                make: 'Toyota',
                model: 'Camry',
                year: 2020,
                plate: 'DL01AB1234',
                color: 'Silver'
            }
        });
        await driver.save();
        console.log('✅ Created driver: driver@test.com / Driver123456');

        // Create rider with password
        const riderPassword = await bcrypt.hash('Rider123456', 10);
        const rider = new User({
            email: 'rider@test.com',
            password: riderPassword,
            name: 'Test Rider',
            phone: '+919876543211',
            role: 'rider',
            emailVerified: true,
            phoneVerified: true
        });
        await rider.save();
        console.log('✅ Created rider: rider@test.com / Rider123456');

        console.log('\n📋 Test Accounts Ready:');
        console.log('Driver: driver@test.com / Driver123456');
        console.log('Rider: rider@test.com / Rider123456');
        console.log('\nUse at: http://localhost:3000/common/backend-signin.html');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

recreateTestUsers();
