// Debug upload test
// Run this in the browser console on your app to test uploads

async function testUpload() {
  console.log('=== UPLOAD TEST START ===');
  
  // Test 1: Check if backend is reachable
  try {
    console.log('1. Testing backend connectivity...');
    const healthResponse = await fetch('https://child-health-backend-747316458447.us-central1.run.app/health');
    const healthData = await healthResponse.json();
    console.log('✅ Backend health check:', healthData);
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    return;
  }

  // Test 2: Check CORS with OPTIONS request
  try {
    console.log('2. Testing CORS preflight...');
    const corsResponse = await fetch('https://child-health-backend-747316458447.us-central1.run.app/api/children', {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'
      }
    });
    console.log('✅ CORS preflight response:', corsResponse.status, corsResponse.statusText);
  } catch (error) {
    console.error('❌ CORS preflight failed:', error);
  }

  // Test 3: Try actual upload
  try {
    console.log('3. Testing actual record upload...');
    const testRecord = {
      childName: "Debug Test Child",
      age: "5",
      gender: "Male",
      weight: "20",
      height: "110",
      guardianName: "Debug Test Guardian",
      relation: "Father", 
      phone: "9876543210",
      parentsConsent: true,
      healthId: "DEBUG_" + Date.now(),
      localId: "debug_local_" + Date.now(),
      dateCollected: new Date().toISOString(),
      uploadedBy: "Debug Test User",
      uploaderUIN: "DEBUG_UIN",
      uploaderEmployeeId: "DEBUG_EMP",
      uploadedAt: new Date().toISOString(),
      isOffline: false,
      uploadStatus: "uploaded"
    };

    console.log('Test record:', testRecord);

    const uploadResponse = await fetch('https://child-health-backend-747316458447.us-central1.run.app/api/children', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'
      },
      body: JSON.stringify(testRecord)
    });

    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));

    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ Upload successful:', result);
    } else {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload failed:', uploadResponse.status, errorText);
    }

  } catch (error) {
    console.error('❌ Upload test failed:', error);
  }

  console.log('=== UPLOAD TEST END ===');
}

// Run the test
testUpload();
