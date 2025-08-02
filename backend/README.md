# Child Health PWA Backend

Backend API server for the Child Health Progressive Web Application.

## Features

- RESTful API for child health data management
- MongoDB integration with Mongoose ODM
- Authentication with OTP verification
- Data validation and error handling
- CORS enabled for frontend integration
- Rate limiting and security middleware
- Offline data synchronization support

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - Logging middleware

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your MongoDB connection string and other configuration.

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/request-otp` - Request OTP for authentication
- `POST /api/auth/verify-otp` - Verify OTP and authenticate
- `POST /api/auth/create-demo-user` - Create demo user for testing

### Children Records
- `POST /api/children` - Create new child record
- `GET /api/children` - Get all child records (paginated)
- `GET /api/children/:id` - Get child record by ID
- `GET /api/children/health-id/:healthId` - Get child record by Health ID
- `GET /api/children/submitter/:submitterId` - Get records by submitter
- `PUT /api/children/:id` - Update child record
- `DELETE /api/children/:id` - Delete child record
- `POST /api/children/sync` - Sync offline records
- `GET /api/children/stats` - Get statistics

### Health Check
- `GET /health` - Server health check

## Data Models

### Child Record
```javascript
{
  healthId: String,        // Unique health ID
  childName: String,       // Child's name
  age: Number,            // Age in years
  weight: Number,         // Weight in kg
  height: Number,         // Height in cm
  guardianName: String,   // Guardian's name
  malnutritionSigns: [String], // Array of malnutrition signs
  recentIllnesses: String, // Recent illnesses description
  parentalConsent: Boolean, // Parental consent flag
  photo: String,          // Base64 encoded photo
  location: {             // GPS coordinates
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  submittedBy: String,    // Submitter's national ID
  submitterName: String,  // Submitter's name
  syncStatus: String,     // 'pending', 'synced', 'failed'
  isOfflineRecord: Boolean // Whether record was created offline
}
```

### User Record
```javascript
{
  nationalId: String,     // Unique national ID
  name: String,          // User's name
  email: String,         // Email address
  phone: String,         // Phone number
  role: String,          // 'health_worker', 'supervisor', 'admin'
  isActive: Boolean,     // Account status
  lastLogin: Date,       // Last login timestamp
  currentOtp: String,    // Current OTP (temporary)
  otpExpiresAt: Date,    // OTP expiration time
  otpAttempts: Number    // Failed OTP attempts
}
```

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/childhealth
FRONTEND_URL=http://localhost:3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

## Error Handling

The API returns consistent error responses:

```javascript
{
  success: false,
  message: "Error description",
  errors: [] // Array of detailed errors (for validation)
}
```

## Security Features

- Helmet for security headers
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- Error handling without information leakage

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Deployment

1. Set `NODE_ENV=production` in environment
2. Configure production MongoDB URI
3. Set appropriate CORS origins
4. Deploy to your preferred platform (Heroku, AWS, etc.)

## API Documentation

Once the server is running, visit `http://localhost:5000` for basic API information.

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Submit pull requests for review
