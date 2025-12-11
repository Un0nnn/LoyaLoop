#!/usr/bin/env node

/**
 * Clear Authentication Script
 * 
 * This script helps fix "Foreign key constraint violated" errors
 * that occur after reseeding the database.
 * 
 * Run this after seeding to force all users to log in again.
 */

console.log('\n🔑 Authentication Token Cleaner\n');
console.log('=' .repeat(50));
console.log('\n📋 After reseeding the database, users must log out');
console.log('   and log back in to get fresh authentication tokens.\n');
console.log('⚠️  INSTRUCTIONS FOR USERS:\n');
console.log('   1. Open the application in your browser');
console.log('   2. Click "Sign Out" button (top-right corner)');
console.log('   3. Log back in with your credentials');
console.log('   4. RSVP and other features will now work correctly\n');
console.log('=' .repeat(50));
console.log('\n✅ Why this is needed:');
console.log('   - Database seed recreates users with NEW IDs');
console.log('   - Old auth tokens reference OLD user IDs');
console.log('   - Logging out clears the old token');
console.log('   - Logging in creates a new token with correct ID\n');
console.log('💡 For developers: You can also:');
console.log('   - Use browser Incognito/Private mode');
console.log('   - Clear browser localStorage/sessionStorage');
console.log('   - Use different browser profile\n');
console.log('=' .repeat(50) + '\n');

