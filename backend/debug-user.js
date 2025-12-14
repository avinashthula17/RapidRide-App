require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is missing');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        const User = mongoose.connection.collection('users');

        const phones = ['9705637783', '+919705637783'];
        const users = await User.find({
            $or: [
                { phone: { $in: phones } },
                { email: /admin_9705637783/ }
            ]
        }).toArray();

        console.log(`🔍 Found ${users.length} users matching criteria:`);
        users.forEach(u => {
            console.log(JSON.stringify(u, null, 2));
        });

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
