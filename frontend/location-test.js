// Simple test to verify location service functionality
// Open browser console and run this in the console

import { getCurrentLocation, getLocationWithFallback, checkLocationPermission } from './src/utils/locationService.js';

async function testLocationService() {
  console.log('🧪 Testing Location Service...');
  
  // Test 1: Check permission
  try {
    const permission = await checkLocationPermission();
    console.log('✅ Permission check:', permission);
  } catch (error) {
    console.log('❌ Permission check failed:', error.message);
  }
  
  // Test 2: Try direct location request
  try {
    const location = await getCurrentLocation({ timeout: 10000 });
    console.log('✅ Direct location request succeeded:', location);
  } catch (error) {
    console.log('❌ Direct location request failed:', error.message);
  }
  
  // Test 3: Try fallback method
  try {
    const location = await getLocationWithFallback();
    console.log('✅ Fallback location request succeeded:', location);
  } catch (error) {
    console.log('❌ Fallback location request failed:', error.message);
  }
}

// Uncomment the line below to run the test
// testLocationService();

console.log('📋 Location Service Test Ready!');
console.log('Run testLocationService() in the console to test location functionality');
