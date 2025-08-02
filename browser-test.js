// Test upload directly from browser console
// Paste this into the browser console to test upload functionality

async function testDirectUpload() {
    const testRecord = {
        childName: "Browser Test",
        age: 3,
        gender: "Female",
        weight: 15.5,
        height: 95,
        guardianName: "Test Guardian Console",
        relation: "parent",
        phone: "9876543210",
        parentsConsent: true,
        healthId: `BROWSER_${Date.now()}`,
        localId: `BROWSER_LOCAL_${Date.now()}`,
        dateCollected: new Date().toISOString(),
        uploadedBy: "Browser Test User",
        uploaderUIN: "BROWSER_UIN_123",
        location: {
            latitude: 28.6139,
            longitude: 77.2090,
            address: "Test Address",
            city: "New Delhi",
            state: "Delhi",
            accuracy: 50,
            timestamp: new Date()
        }
    };
    
    try {
        console.log('Testing direct upload to:', 'https://child-health-backend-747316458447.us-central1.run.app/api/children');
        
        const response = await fetch('https://child-health-backend-747316458447.us-central1.run.app/api/children', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testRecord)
        });
        
        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', result);
        
        if (response.ok) {
            console.log('✅ Direct upload successful!');
        } else {
            console.log('❌ Direct upload failed:', result);
        }
        
    } catch (error) {
        console.error('❌ Upload error:', error);
    }
}

// Test batch upload
async function testDirectBatchUpload() {
    const testRecord = {
        childName: "Batch Browser Test",
        age: 4,
        gender: "Male",
        weight: 16.5,
        height: 98,
        guardianName: "Batch Test Guardian",
        relation: "parent",
        phone: "9876543210",
        parentsConsent: true,
        healthId: `BATCH_BROWSER_${Date.now()}`,
        localId: `BATCH_BROWSER_LOCAL_${Date.now()}`,
        dateCollected: new Date().toISOString(),
        uploadedBy: "Batch Browser Test User",
        uploaderUIN: "BATCH_BROWSER_UIN_123",
        location: {
            latitude: 28.6139,
            longitude: 77.2090,
            address: "Test Address",
            city: "New Delhi",
            state: "Delhi",
            accuracy: 50,
            timestamp: new Date()
        }
    };
    
    try {
        console.log('Testing batch upload to:', 'https://child-health-backend-747316458447.us-central1.run.app/api/children/batch');
        
        const response = await fetch('https://child-health-backend-747316458447.us-central1.run.app/api/children/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                records: [testRecord]
            })
        });
        
        const result = await response.json();
        console.log('Batch Response status:', response.status);
        console.log('Batch Response data:', result);
        
        if (response.ok) {
            console.log('✅ Direct batch upload successful!');
        } else {
            console.log('❌ Direct batch upload failed:', result);
        }
        
    } catch (error) {
        console.error('❌ Batch upload error:', error);
    }
}

console.log('Test functions loaded. Run:');
console.log('testDirectUpload() - for single record upload');
console.log('testDirectBatchUpload() - for batch upload');
console.log('');
console.log('Both should work now with the fixed backend!');

// Auto-run the tests
testDirectUpload();
setTimeout(() => testDirectBatchUpload(), 1000);
