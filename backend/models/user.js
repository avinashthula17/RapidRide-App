const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String }, // For backend auth
  passwordHash: { type: String }, // Optional for Firebase users
  firebaseUid: { type: String, unique: true, sparse: true }, // Firebase UID
  role: { type: String, enum: ['rider', 'driver', 'captain', 'admin'], default: 'rider' },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  avatar: { type: String }, // URL or base64 or emoji
  vehicle: {
    type: { type: String },
    model: { type: String },
    number: { type: String },
    color: { type: String }
  },
  license: { type: String },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    lastUpdated: { type: Date }
  },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailOTP: { type: String },
  emailOTPExpiry: { type: Date },
  phoneOTP: { type: String },
  phoneOTPExpiry: { type: Date },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
  savedPlaces: [{
    name: { type: String, required: true },
    address: { type: String },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    savedAt: { type: Date, default: Date.now }
  }],
  // Payment integration
  razorpayAccountId: { type: String }, // For drivers to receive payments
  // Ride statistics
  stats: {
    totalRides: { type: Number, default: 0 },
    completedRides: { type: Number, default: 0 },
    cancelledRides: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 }, // in meters
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
userSchema.index({ phone: 1 }); // Phone lookup
userSchema.index({ firebaseUid: 1 }); // Firebase auth
userSchema.index({ email: 1 }); // Email lookup
userSchema.index({ role: 1, 'currentLocation.lastUpdated': -1 }); // Active drivers
userSchema.index({ 'stats.rating': -1, 'stats.totalRides': -1 }); // Top drivers

module.exports = mongoose.model('User', userSchema);
