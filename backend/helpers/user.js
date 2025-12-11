const User = require('../models/user');

/**
 * Find user by Firebase authentication data
 * Checks firebaseUid first, then falls back to email
 * @param {Object} firebaseUser - Decoded Firebase token with uid and email
 * @returns {Promise<Object|null>} User document or null
 */
async function findUserByFirebaseAuth(firebaseUser) {
    if (!firebaseUser || !firebaseUser.uid) {
        return null;
    }

    // 1. Try finding by Firebase UID (Gold Standard)
    let user = await User.findOne({ firebaseUid: firebaseUser.uid });
    if (user) return user;

    // 2. If not found, fallback to Email (Legacy/Migration support)
    // Only if email is provided and confirmed
    if (firebaseUser.email) {
        // Find user by email who DOES NOT have a conflicting UID
        user = await User.findOne({ email: firebaseUser.email });

        // Safety check: If we found a user by email, strictly ensure we aren't 
        // taking over an account that already has a DIFFERENT firebaseUid
        if (user && user.firebaseUid && user.firebaseUid !== firebaseUser.uid) {
            console.warn(`[Identity] Prevented match: Email ${firebaseUser.email} matches user ${user._id}, but UID differs (${user.firebaseUid} vs ${firebaseUser.uid})`);
            return null; // Treat as no match - force new account creation or handling
        }

        return user;
    }

    return null;
}

module.exports = {
    findUserByFirebaseAuth
};
