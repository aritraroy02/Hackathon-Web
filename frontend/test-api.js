// Quick test script to verify API functionality
const BACKEND_URL = 'https://child-health-backend-747316458447.us-central1.run.app';

async function testAPI() {
    console.log('Testing API endpoints...');
    
    try {
        // Test health endpoint
        console.log('\n1. Testing health endpoint...');
        const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
        const healthData = await healthResponse.json();
        console.log('Health check:', healthData);
        
        // Test batch upload endpoint (should require authentication)
        console.log('\n2. Testing batch upload endpoint...');
        const uploadResponse = await fetch(`${BACKEND_URL}/api/children/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                records: []
            })
        });
        
        console.log('Upload endpoint status:', uploadResponse.status);
        if (uploadResponse.status === 401) {
            console.log('✅ Upload endpoint correctly requires authentication');
        } else {
            const uploadData = await uploadResponse.text();
            console.log('Upload response:', uploadData);
        }
        
        // Test rate limiting
        console.log('\n3. Testing rate limiting...');
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(fetch(`${BACKEND_URL}/api/health`));
        }
        
        const responses = await Promise.all(promises);
        const statuses = responses.map(r => r.status);
        console.log('Rate limit test statuses:', statuses);
        
        if (statuses.every(status => status === 200)) {
            console.log('✅ API is working correctly with trust proxy fix');
        } else {
            console.log('❌ Some requests failed, proxy issue may persist');
        }
        
    } catch (error) {
        console.error('API test failed:', error);
    }
}

testAPI();
