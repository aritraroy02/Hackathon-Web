/**
 * Simple test script to check backend connectivity
 */

const checkBackend = async () => {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    console.log('Health endpoint status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health response:', healthData);
    }
    
    // Test children endpoint
    const childrenResponse = await fetch('http://localhost:5000/api/children');
    console.log('Children endpoint status:', childrenResponse.status);
    
    if (childrenResponse.ok) {
      const childrenData = await childrenResponse.json();
      console.log('Children response:', childrenData);
    }
    
  } catch (error) {
    console.error('Backend test failed:', error.message);
  }
};

checkBackend();
