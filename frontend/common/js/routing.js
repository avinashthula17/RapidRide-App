// common/js/routing.js
// Shared routing logic for RapidRide
// Implements: Client-Side OSRM -> Backend Proxy -> Fallback

(function () {
    if (window.RapidRideRouting) return;

    const Routing = {
        /**
         * Calculate route between two points
         * @param {Object} start - {lat, lng} or {lat, lon}
         * @param {Object} end - {lat, lng} or {lat, lon}
         * @returns {Promise<Object>} OSRM route object (geometry, distance, duration)
         */
        getRoute: async function (start, end) {
            const startLat = start.lat;
            const startLng = start.lng || start.lon;
            const endLat = end.lat;
            const endLng = end.lng || end.lon;

            if (!startLat || !startLng || !endLat || !endLng) {
                console.error('Routing: Invalid coordinates', { start, end });
                return null;
            }

            // 1. OpenRouteService (High Quality, requires Key)
            // ----------------------------------------------------
            // 🔑 Key provided by User
            const ORS_API_KEY = '5b3ce3597851110001cf62487e7a697be3534d1b8544a0160b8c644e';
            // ----------------------------------------------------

            if (ORS_API_KEY && ORS_API_KEY !== 'YOUR_API_KEY_HERE') {
                try {
                    // Use api_key query param to avoid CORS preflight issues with custom headers
                    const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${startLng},${startLat}&end=${endLng},${endLat}`;

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);

                    const response = await fetch(orsUrl, {
                        // Remove Authorization header to simplify CORS
                        headers: {
                            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
                        },
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        // ORS returns GeoJSON FeatureCollection. Convert to OSRM format for compatibility.
                        if (data.features && data.features.length > 0) {
                            const feature = data.features[0];
                            return {
                                geometry: feature.geometry,
                                distance: feature.properties.summary.distance,
                                duration: feature.properties.summary.duration,
                                weight_name: 'ors',
                                weight: feature.properties.summary.duration
                            };
                        }
                    } else {
                        console.warn('⚠️ ORS Failed:', response.status);
                    }
                } catch (err) {
                    console.warn('⚠️ ORS Error:', err.message);
                }
            }

            // 2. OSRM Public Servers (Mirrors for robustness)
            // Prioritize openstreetmap.de (More stable) over project-osrm.org
            const mirrors = [
                'https://routing.openstreetmap.de/routed-car/route/v1/driving',
                'https://router.project-osrm.org/route/v1/driving'
            ];

            for (const baseUrl of mirrors) {
                const url = `${baseUrl}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s Timeout

                    const response = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        if (data.routes && data.routes.length > 0) {
                            return data.routes[0];
                        }
                    }
                } catch (err) {
                    console.warn(`⚠️ Routing failed on ${baseUrl}:`, err.name === 'AbortError' ? 'Timeout' : err.message);
                }
            }

            console.error('❌ All client-side routing attempts failed.');
            return null;
        }
    };

    window.RapidRideRouting = Routing;
})();
