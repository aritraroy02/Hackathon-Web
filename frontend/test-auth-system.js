#!/usr/bin/env node

const http = require('http');
const url = require('url');

// Simple test script to verify authentication endpoints
const testEndpoints = [
  'http://localhost:5000/api/health',
  'http://localhost:5000/api/auth/login'
];

console.log('🔧 Testing Authentication System Implementation...\n');

// Test backend connectivity
async function testBackend() {
  console.log('📡 Testing Backend Server Connectivity:');
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      
      if (endpoint.includes('health')) {
        const data = await response.text();
        console.log(`   Response: ${data}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

// Test login functionality
async function testLogin() {
  console.log('\n🔐 Testing Authentication Login:');
  
  const testCredentials = [
    { employeeId: 'HW-567890', password: 'health123' },
    { email: 'aritraditya.roy@gmail.com', password: 'health123' },
    { uinNumber: '1234567890', password: 'health123' }
  ];
  
  for (const creds of testCredentials) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(creds)
      });
      
      const data = await response.json();
      const identifier = Object.keys(creds)[0];
      
      console.log(`📋 Login Test - ${identifier}: ${creds[identifier]}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        console.log(`   ✅ Success: User ${data.user?.name || 'Unknown'} authenticated`);
        console.log(`   🎫 Token: ${data.token.substring(0, 20)}...`);
      } else {
        console.log(`   ❌ Failed: ${data.error || data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

// Test representative verification
async function testVerification() {
  console.log('\n🔍 Testing Representative Verification:');
  
  const testIds = [
    { type: 'employeeId', value: 'HW-567890' },
    { type: 'email', value: 'aritraditya.roy@gmail.com' },
    { type: 'uinNumber', value: '1234567890' }
  ];
  
  for (const test of testIds) {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/verify-representative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: test.value,
          type: test.type
        })
      });
      
      const data = await response.json();
      
      console.log(`🔍 Verify ${test.type}: ${test.value}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.ok && data.success) {
        console.log(`   ✅ Verified: ${data.data.name} (${data.data.designation})`);
        console.log(`   📋 Role: ${data.data.role}, Active: ${data.data.isActive}`);
      } else {
        console.log(`   ❌ Failed: ${data.error || data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

// Main test execution
async function runTests() {
  try {
    await testBackend();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await testLogin();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await testVerification();
    
    console.log('\n✨ Authentication System Test Complete!');
    console.log('📋 Summary:');
    console.log('   - Backend Server Connectivity: Tested');
    console.log('   - JWT Authentication Login: Tested');
    console.log('   - Representative Verification: Tested');
    console.log('   - Sample Credentials Available for Frontend Testing');
    
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ with built-in fetch support');
  console.log('💡 Alternative: Start the backend server manually and test via browser');
  console.log('   Backend: cd backend && npm start');
  console.log('   Frontend: npm start (in main directory)');
  process.exit(1);
}

runTests();
