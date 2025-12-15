require('dotenv').config();
const fetch = require('node-fetch'); // Ensure we use the same fetch as backend

const ORS_API_KEY = process.env.ORS_API_KEY; // "5b3ce3597851110001cf62487e7a697be3534d1b8544a0160b8c644e"
const pickup = '78.4747,17.3616';
const drop = '78.3725,17.4435';

async function testBackendLogic() {
    console.log('🧪 Testing Backend Logic with User API Key...');
    console.log('🔑 Key:', ORS_API_KEY);

    // 1. Try OpenRouteService
    if (ORS_API_KEY) {
        try {
            const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${pickup}&end=${drop}`;
            console.log(`\n1️⃣ Calling ORS: ${orsUrl}`);

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const orsResponse = await fetch(orsUrl, {
                headers: {
                    'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
                },
                signal: controller.signal
            });
            clearTimeout(timeout);

            console.log(`   Status: ${orsResponse.status}`);
            if (orsResponse.ok) {
                const data = await orsResponse.json();
                if (data.features && data.features.length > 0) {
                    console.log('   ✅ ORS Success! Route found.');
                    console.log('   Geometry:', JSON.stringify(data.features[0].geometry).substring(0, 50) + '...');
                    return;
                } else {
                    console.log('   ⚠️ ORS OK but no features?');
                }
            } else {
                const txt = await orsResponse.text();
                console.warn(`   ⚠️ ORS Failed: ${txt}`);
            }
        } catch (orsErr) {
            console.warn('   ⚠️ ORS Error:', orsErr.message);
        }
    }

    // 2. Fallback to Stable OSRM
    console.log('\n2️⃣ Falling back to OSRM...');
    const osrmUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${pickup};${drop}?overview=full&geometries=geojson`;
    console.log(`   URL: ${osrmUrl}`);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(osrmUrl, { signal: controller.signal });
        clearTimeout(timeout);

        console.log(`   Status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`OSRM responded with ${response.status}`);
        }

        const data = await response.json();
        console.log('   ✅ OSRM Success!');
        if (data.routes && data.routes.length > 0) {
            console.log('   Geometry:', JSON.stringify(data.routes[0].geometry).substring(0, 50) + '...');
        }
    } catch (err) {
        console.error('   ❌ OSRM Error:', err.message);
        console.log('\n3️⃣ Triggering Straight-Line Fallback...');
    }
}

testBackendLogic();
