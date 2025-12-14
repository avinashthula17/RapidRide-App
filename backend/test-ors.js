require('dotenv').config();
const axios = require('axios');

const ORS_API_KEY = process.env.ORS_API_KEY;

if (!ORS_API_KEY) {
    console.error('❌ ORS_API_KEY is missing in .env');
    process.exit(1);
}

console.log('🔑 Testing ORS Key:', ORS_API_KEY.substring(0, 10) + '...');

async function testRouting() {
    // Coordinates: Pickup (Charminar), Drop (Cyber Towers) - roughly
    const start = '78.4747,17.3616';
    const end = '78.3725,17.4435';

    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start}&end=${end}`;

    try {
        console.log('📡 Sending request to OpenRouteService (Query Param Method)...');
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
            }
        });

        if (response.status === 200) {
            console.log('✅ Success! API Key is valid.');
            const data = response.data;
            if (data.features && data.features.length > 0) {
                const summary = data.features[0].properties.summary;
                console.log(`🛣️  Route Found:`);
                console.log(`   - Distance: ${(summary.distance / 1000).toFixed(2)} km`);
                console.log(`   - Duration: ${(summary.duration / 60).toFixed(1)} mins`);
            } else {
                console.warn('⚠️  Response ok but no features found.');
            }
        }
    } catch (error) {
        console.error('❌ Request Failed!');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Reason: ${JSON.stringify(error.response.data)}`);
        } else {
            console.error('   Error:', error.message);
        }
    }
}

testRouting();
