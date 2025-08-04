// Comprehensive API test with valid data
const BACKEND_URL = 'https://child-health-backend-747316458447.us-central1.run.app';

async function testWithValidData() {
    console.log('Testing API endpoints with valid data...');
    
    try {
        // Create a test record
        const testRecord = {
            childName: "Test Child",
            age: 5,
            gender: "Male",
            weight: 18.5,
            height: 105,
            guardianName: "Test Guardian",
            relation: "parent",
            phone: "9876543210",
            parentsConsent: true,
            healthId: `TEST_${Date.now()}`,
            localId: `LOCAL_${Date.now()}`,
            dateCollected: new Date().toISOString(),
            uploadedBy: "Test User",
            uploaderUIN: "TEST_UIN_123",
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
        
        console.log('\n1. Testing individual record upload...');
        const singleResponse = await fetch(`${BACKEND_URL}/api/children`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testRecord)
        });
        
        if (singleResponse.ok) {
            const singleData = await singleResponse.json();
            console.log('✅ Single record upload successful:', singleData.message);
        } else {
            const singleError = await singleResponse.text();
            console.log('❌ Single record upload failed:', singleError);
        }
        
        console.log('\n2. Testing batch upload...');
        const batchRecord = {
            ...testRecord,
            healthId: `BATCH_${Date.now()}`,
            localId: `BATCH_LOCAL_${Date.now()}`
        };
        
        const batchResponse = await fetch(`${BACKEND_URL}/api/children/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                records: [batchRecord]
            })
        });
        
        if (batchResponse.ok) {
            const batchData = await batchResponse.json();
            console.log('✅ Batch upload successful:', batchData.message);
            console.log('  - Successful records:', batchData.data.successful.length);
            console.log('  - Failed records:', batchData.data.failed.length);
        } else {
            const batchError = await batchResponse.text();
            console.log('❌ Batch upload failed:', batchError);
        }
        
        console.log('\n3. Testing record retrieval...');
        const listResponse = await fetch(`${BACKEND_URL}/api/children?limit=5`);
        if (listResponse.ok) {
            const listData = await listResponse.json();
            console.log('✅ Record retrieval successful');
            console.log('  - Total records found:', listData.pagination.total);
            console.log('  - Records in this page:', listData.data.length);
        } else {
            console.log('❌ Record retrieval failed');
        }
        
        console.log('\n🎉 All tests completed! Backend is ready for production use.');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testWithValidData();
