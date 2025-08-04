// CHILD HEALTH APP - UPLOAD DEBUG TOOL
// Copy and paste this into your browser console when the app is running at http://localhost:3002

console.clear();
console.log('🏥 CHILD HEALTH APP - UPLOAD DEBUG STARTING...');

async function debugChildHealthUpload() {
  try {
    // Step 1: Check if we can access app context
    console.log('\n1️⃣ Checking app access...');
    
    // Check if app is loaded
    if (!window.React) {
      console.error('❌ React not detected. Make sure app is fully loaded.');
      return;
    }
    
    console.log('✅ React app detected');

    // Step 2: Test backend connectivity
    console.log('\n2️⃣ Testing backend connectivity...');
    
    const BACKEND_URL = 'https://child-health-backend-747316458447.us-central1.run.app';
    
    try {
      const healthResponse = await fetch(`${BACKEND_URL}/health`);
      const healthData = await healthResponse.json();
      console.log('✅ Backend health:', healthData);
    } catch (error) {
      console.error('❌ Backend connectivity failed:', error);
      return;
    }

    // Step 3: Test authentication mock user
    console.log('\n3️⃣ Testing mock user...');
    
    const mockUser = {
      uin: "1234567890",
      uinNumber: "1234567890",
      name: "Debug Test User",
      firstName: "Debug",
      lastName: "User",
      employeeId: "DEBUG_EMP_123",
      token: "demo-token"
    };
    
    console.log('Mock user:', mockUser);

    // Step 4: Create test record
    console.log('\n4️⃣ Creating test record...');
    
    const testRecord = {
      localId: `debug_${Date.now()}`,
      childName: "Debug Test Child",
      age: "5",
      gender: "Male",
      weight: "20",
      height: "110",
      guardianName: "Debug Guardian",
      relation: "Father",
      phone: "9876543210",
      parentsConsent: true,
      healthId: `DEBUG_${Date.now()}`,
      dateCollected: new Date().toISOString(),
      isOffline: false,
      uploadStatus: "pending"
    };
    
    console.log('Test record:', testRecord);

    // Step 5: Test individual upload
    console.log('\n5️⃣ Testing individual upload...');
    
    const recordWithUploadInfo = {
      ...testRecord,
      uploadedBy: mockUser.name,
      uploaderUIN: mockUser.uin,
      uploaderEmployeeId: mockUser.employeeId,
      uploadedAt: new Date().toISOString(),
      isOffline: false,
      uploadStatus: 'uploaded'
    };

    try {
      const uploadResponse = await fetch(`${BACKEND_URL}/api/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockUser.token}`
        },
        body: JSON.stringify(recordWithUploadInfo)
      });

      console.log('Individual upload status:', uploadResponse.status);

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        console.log('✅ Individual upload successful:', uploadResult);
      } else {
        const errorText = await uploadResponse.text();
        console.error('❌ Individual upload failed:', uploadResponse.status, errorText);
      }
    } catch (error) {
      console.error('❌ Individual upload error:', error);
    }

    // Step 6: Test batch upload
    console.log('\n6️⃣ Testing batch upload...');
    
    const batchTestRecord = {
      ...testRecord,
      healthId: `BATCH_DEBUG_${Date.now()}`,
      localId: `batch_debug_${Date.now()}`,
      uploadedBy: mockUser.name,
      uploaderUIN: mockUser.uin,
      uploaderEmployeeId: mockUser.employeeId,
      uploadedAt: new Date().toISOString()
    };

    try {
      const batchResponse = await fetch(`${BACKEND_URL}/api/children/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockUser.token}`
        },
        body: JSON.stringify({
          records: [batchTestRecord]
        })
      });

      console.log('Batch upload status:', batchResponse.status);

      if (batchResponse.ok) {
        const batchResult = await batchResponse.json();
        console.log('✅ Batch upload successful:', batchResult);
      } else {
        const errorText = await batchResponse.text();
        console.error('❌ Batch upload failed:', batchResponse.status, errorText);
      }
    } catch (error) {
      console.error('❌ Batch upload error:', error);
    }

    // Step 7: Check if records were saved
    console.log('\n7️⃣ Verifying records in database...');
    
    try {
      const getResponse = await fetch(`${BACKEND_URL}/api/children?uploaderUIN=${mockUser.uin}&limit=10`);
      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log('✅ Records in database:', getData.data?.length || 0);
        if (getData.data?.length > 0) {
          console.log('Latest records:', getData.data.slice(0, 3));
        }
      }
    } catch (error) {
      console.error('❌ Error checking database:', error);
    }

    console.log('\n🏁 DEBUG COMPLETE!');
    console.log('\nIf uploads are failing, check:');
    console.log('1. Network connection');
    console.log('2. User authentication in app');
    console.log('3. Record data validation');
    console.log('4. CORS settings');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug
debugChildHealthUpload();
