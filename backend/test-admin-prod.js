const fetch = require('node-fetch');

const BASE_URL = 'https://rapidride-app-production.up.railway.app/api';
const EMAIL = 'admin_9705637783@rapidride.com';
const PASSWORD = 'admin123';

async function testAuth() {
    console.log('🔄 Testing Auth against:', BASE_URL);

    // 1. Login
    console.log('\n1️⃣ Attempting Login...');
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.error('❌ Login Failed:', loginRes.status, loginData);
            return;
        }

        console.log('✅ Login Successful!');
        const token = loginData.token;
        console.log('   Token received (first 20 chars):', token.substring(0, 20) + '...');

        // 2. Fetch Profile (Auth Check)
        console.log('\n2️⃣ Attempting to fetch Profile (/auth/me)...');
        const meRes = await fetch(`${BASE_URL}/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const meData = await meRes.json();

        if (meRes.ok) {
            console.log('✅ /auth/me Successful!');
            console.log('   User Role:', meData.user.role);
        } else {
            console.error('❌ /auth/me Failed (Backend likely old version):');
            console.error('   Status:', meRes.status);
            console.error('   Response:', meData);
        }

    } catch (error) {
        console.error('💥 Network/Script Error:', error.message);
    }
}

testAuth();
