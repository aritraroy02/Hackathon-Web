// SIMPLE UPLOAD TEST - No React dependency
// Copy and paste this into browser console at http://localhost:3002

console.clear();
console.log('🧪 SIMPLE UPLOAD TEST STARTING...');

async function simpleUploadTest() {
  const BACKEND_URL = 'https://child-health-backend-747316458447.us-central1.run.app';
  
  console.log('1️⃣ Testing backend connectivity...');
  
  try {
    // Test 1: Health check
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend health:', healthData);
    
    // Test 2: Simple upload
    console.log('2️⃣ Testing simple upload...');
    
    const testRecord = {
      childName: "Simple Test Child",
      age: "5", 
      gender: "Male",
      weight: "20",
      height: "110",
      guardianName: "Test Guardian",
      relation: "Father",
      phone: "9876543210",
      parentsConsent: true,
      healthId: `SIMPLE_${Date.now()}`,
      localId: `simple_${Date.now()}`,
      dateCollected: new Date().toISOString(),
      uploadedBy: "Simple Test User",
      uploaderUIN: "SIMPLE_UIN_123",
      uploaderEmployeeId: "SIMPLE_EMP",
      uploadedAt: new Date().toISOString(),
      isOffline: false,
      uploadStatus: "uploaded"
    };

    console.log('📤 Uploading record:', testRecord.healthId);

    const uploadResponse = await fetch(`${BACKEND_URL}/api/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'
      },
      body: JSON.stringify(testRecord)
    });

    console.log('📊 Upload response status:', uploadResponse.status);

    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ SUCCESS! Upload result:', result);
      
      // Test 3: Verify it was saved
      console.log('3️⃣ Verifying record was saved...');
      
      const verifyResponse = await fetch(`${BACKEND_URL}/api/children?uploaderUIN=SIMPLE_UIN_123&limit=5`);
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('✅ Records in database:', verifyData.data?.length || 0);
        if (verifyData.data?.length > 0) {
          console.log('Latest record:', verifyData.data[0]);
        }
      }
      
    } else {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload failed:', uploadResponse.status, errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('🏁 Simple test complete!');
}

// Run the test
simpleUploadTest();
