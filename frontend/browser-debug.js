// Copy and paste this into your browser console when your app is running
// This will test the upload functionality step by step

async function debugUpload() {
  console.log('🔍 Starting upload debug...');
  
  // Step 1: Check if we have authentication
  console.log('1. Checking authentication...');
  
  // Try to get user from React app context (this might not work in console)
  let user;
  try {
    // This assumes your app exposes user data somehow
    user = window.appUser || {
      uin: "1234567890",
      name: "Debug User",
      employeeId: "DEBUG_EMP",
      token: "demo-token"
    };
    console.log('✅ User data:', user);
  } catch (error) {
    console.log('⚠️ Using fallback user data');
    user = {
      uin: "1234567890",
      name: "Debug User", 
      employeeId: "DEBUG_EMP",
      token: "demo-token"
    };
  }

  // Step 2: Create a test record
  console.log('2. Creating test record...');
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
    location: {
      latitude: 28.6139,
      longitude: 77.2090,
      address: "New Delhi, India"
    }
  };
  console.log('✅ Test record created:', testRecord);

  // Step 3: Test backend connectivity
  console.log('3. Testing backend connectivity...');
  try {
    const healthResponse = await fetch('https://child-health-backend-747316458447.us-central1.run.app/health');
    const healthData = await healthResponse.json();
    console.log('✅ Backend health:', healthData);
  } catch (error) {
    console.error('❌ Backend connectivity failed:', error);
    return;
  }

  // Step 4: Test the upload
  console.log('4. Testing upload...');
  try {
    const recordWithUploadInfo = {
      ...testRecord,
      uploadedBy: user.name,
      uploaderUIN: user.uin,
      uploaderEmployeeId: user.employeeId,
      uploadedAt: new Date().toISOString(),
      isOffline: false,
      uploadStatus: 'uploaded'
    };

    console.log('Upload payload:', recordWithUploadInfo);

    const response = await fetch('https://child-health-backend-747316458447.us-central1.run.app/api/children', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token || 'demo-token'}`
      },
      body: JSON.stringify(recordWithUploadInfo)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload successful!', result);
    } else {
      const errorText = await response.text();
      console.error('❌ Upload failed:', response.status, errorText);
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
  }

  console.log('🏁 Debug complete!');
}

// Run the debug
debugUpload();
