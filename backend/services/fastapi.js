const axios = require('axios');

const FASTAPI_BASE_URL = process.env.FASTAPI_URL || 'http://localhost:8001';

/**
 * FastAPI Service Client
 * Handles all communication with FastAPI microservices
 */
class FastAPIService {
  constructor() {
    this.baseURL = process.env.FASTAPI_URL || 'http://localhost:8001';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('⚠️ ML Service Health Check Failed:', error.message);
      return false;
    }
  }

  /**
   * Calculate fare for a ride
   * @param {Object} params - { origin: {lat, lng}, destination: {lat, lng}, traffic_level? }
   * @returns {Promise<Object>} { fare, distance_km, currency }
   */
  async calculateFare(params) {
    try {
      const { origin, destination, traffic_level = 1.0 } = params;

      const response = await this.client.post('/fare/calc', {
        origin,
        destination,
        timestamp: new Date().toISOString(),
        traffic_level
      });

      return response.data;
    } catch (error) {
      console.error('FastAPI fare calculation error:', error.message);

      // Fallback to simple calculation if FastAPI is down
      const distance = this.calculateDistance(params.origin, params.destination);
      return {
        fare: 20 + (distance * 8),
        distance_km: distance,
        currency: 'INR',
        fallback: true
      };
    }
  }

  /**
   * Predict ETA for a ride
   * @param {Object} params - { origin: {lat, lng}, destination: {lat, lng}, traffic_level? }
   * @returns {Promise<Object>} { eta_seconds, confidence }
   */
  async predictETA(params) {
    try {
      const { origin, destination, traffic_level = 1.0 } = params;

      const response = await this.client.post('/predict/eta', {
        origin,
        destination,
        timestamp: new Date().toISOString(),
        traffic_level
      });

      return response.data;
    } catch (error) {
      console.error('FastAPI ETA prediction error:', error.message);

      // Fallback to simple calculation
      const distance = this.calculateDistance(params.origin, params.destination);
      const eta_seconds = Math.round((distance / 30) * 3600); // 30 km/h average

      return {
        eta_seconds,
        confidence: 0.5,
        fallback: true
      };
    }
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Address details
   */
  async reverseGeocode(lat, lon) {
    try {
      const response = await this.client.get('/geo/reverse', {
        params: { lat, lon }
      });

      return response.data;
    } catch (error) {
      console.error('FastAPI geocoding error:', error.message);

      return {
        formatted_address: `Location: ${lat}, ${lon}`,
        fallback: true
      };
    }
  }

  /**
   * Check FastAPI health status
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      return {
        status: 'unavailable',
        error: error.message
      };
    }
  }

  /**
   * Helper: Calculate distance using Haversine formula (fallback)
   * @private
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const lat1 = coord1.lat * Math.PI / 180;
    const lat2 = coord2.lat * Math.PI / 180;
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 1000) / 1000; // Round to 3 decimals
  }
}

// Export singleton instance
module.exports = new FastAPIService();
