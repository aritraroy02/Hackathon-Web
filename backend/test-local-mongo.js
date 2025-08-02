/**
 * Simple MongoDB connection test for local instance
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/childBooklet';

console.log('Testing local MongoDB connection...');
console.log('Connection URI:', MONGODB_URI);

const testConnection = async () => {
  try {
    console.log('Attempting to connect to local MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Local MongoDB connected successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
    // Test collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Test if we can create a simple document
    const testCollection = mongoose.connection.db.collection('test');
    const testDoc = { message: 'Hello MongoDB!', timestamp: new Date() };
    const result = await testCollection.insertOne(testDoc);
    console.log('✅ Test document inserted with ID:', result.insertedId);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Test document cleaned up');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('❌ Local MongoDB connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Make sure MongoDB is running on localhost:27017');
      console.error('   You can start MongoDB with: net start MongoDB');
    }
  }
};

testConnection();
