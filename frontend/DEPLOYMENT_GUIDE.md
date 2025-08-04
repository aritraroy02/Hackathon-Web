# Child Health PWA - Deployment Guide

## Overview
This guide will help you deploy your offline-first Child Health PWA with Google Cloud Run backend and MongoDB Atlas integration.

## Prerequisites
- Google Cloud Platform account with billing enabled
- Google Cloud CLI (`gcloud`) installed
- Docker installed (for local testing)
- MongoDB Atlas account with existing database connection

## Deployment Steps

### 1. Set Up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (replace PROJECT_ID with your desired project ID)
gcloud projects create your-child-health-project --name="Child Health PWA"

# Set the project as default
gcloud config set project your-child-health-project

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2. Deploy Backend to Google Cloud Run

```bash
# Navigate to your project directory
cd "c:\ARITRADITYA ROY\Gitweb\Hackathon-Web"

# Build and deploy using Cloud Build
gcloud builds submit backend/ --tag gcr.io/your-child-health-project/child-health-backend

# Deploy to Cloud Run
gcloud run deploy child-health-backend \
  --image gcr.io/your-child-health-project/child-health-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars MONGODB_URI="mongodb+srv://harshbontala188:8I52Oqeh3sWYTDJ7@cluster0.5lsiap2.mongodb.net/childBooklet"
```

### 3. Update Frontend Configuration

After deployment, Cloud Run will provide a service URL like:
`https://child-health-backend-xxxxx-uc.a.run.app`

Update the `.env` file:
```env
REACT_APP_BACKEND_URL=https://child-health-backend-xxxxx-uc.a.run.app
```

### 4. Build and Deploy Frontend

#### Option A: Deploy to Firebase Hosting (Recommended for PWAs)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting

# Build the React app
npm run build

# Deploy to Firebase
firebase deploy
```

#### Option B: Deploy Frontend to Google Cloud Storage + CDN

```bash
# Build the React app
npm run build

# Create a Cloud Storage bucket
gsutil mb gs://your-child-health-pwa

# Upload build files
gsutil -m cp -r build/* gs://your-child-health-pwa

# Make bucket public
gsutil web set -m index.html -e 404.html gs://your-child-health-pwa
```

### 5. Configure PWA Settings

Ensure your build includes:
- Service Worker registration
- Web App Manifest (`public/manifest.json`)
- Offline capability
- IndexedDB for local storage

### 6. Test the Complete Workflow

1. **Offline Form Filling**: Fill out child health forms without internet
2. **Authentication Check**: Verify login works with eSignet mock
3. **Internet Connectivity**: Test profile button only works when online
4. **Location Services**: Verify GPS location fetching in profile
5. **Batch Upload**: Test "Upload All" button uploads pending records
6. **MongoDB Integration**: Verify data appears in MongoDB Atlas

## Environment Variables

### Backend Environment Variables (Google Cloud Run)
```env
MONGODB_URI=mongodb+srv://harshbontala188:8I52Oqeh3sWYTDJ7@cluster0.5lsiap2.mongodb.net/childBooklet
PORT=8080
NODE_ENV=production
```

### Frontend Environment Variables (.env)
```env
REACT_APP_BACKEND_URL=https://your-deployed-backend-url.run.app
REACT_APP_PWA_NAME=Child Health Tracker
REACT_APP_ENABLE_LOCATION_SERVICES=true
REACT_APP_ENABLE_OFFLINE_MODE=true
```

## Database Schema

Your MongoDB collection `childRecords` will store documents with this structure:

```javascript
{
  childName: String,
  dateOfBirth: Date,
  gender: String,
  parentName: String,
  mobileNumber: String,
  village: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    accuracy: Number
  },
  healthMetrics: {
    height: Number,
    weight: Number,
    vaccinations: [String],
    allergies: [String],
    notes: String
  },
  submittedBy: String,
  submittedAt: Date,
  syncStatus: String // 'pending', 'uploaded', 'failed'
}
```

## Monitoring and Logs

### View Backend Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=child-health-backend" --limit 50
```

### View Cloud Run Metrics
```bash
gcloud run services describe child-health-backend --region=us-central1
```

## Security Considerations

1. **CORS Configuration**: Backend configured for your frontend domain
2. **Rate Limiting**: API includes rate limiting (100 requests per 15 minutes)
3. **Input Validation**: All endpoints validate input data
4. **Environment Variables**: Sensitive data stored in environment variables
5. **HTTPS Only**: All communications encrypted in production

## Troubleshooting

### Common Issues

1. **CORS Errors**: Update backend CORS configuration with your frontend URL
2. **Database Connection**: Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0 for Cloud Run
3. **Environment Variables**: Ensure all required env vars are set in Cloud Run
4. **Build Failures**: Check Cloud Build logs for specific error messages

### Debug Commands

```bash
# Check backend service status
gcloud run services describe child-health-backend --region=us-central1

# View recent logs
gcloud logging read "resource.type=cloud_run_revision" --limit 20

# Test backend health endpoint
curl https://your-backend-url.run.app/api/health
```

## Cost Optimization

- Cloud Run: Pay-per-request, scales to zero
- MongoDB Atlas: Free tier available for development
- Firebase Hosting: Generous free tier for static sites
- Cloud Storage: Minimal costs for static assets

## Next Steps

1. Set up monitoring and alerting
2. Configure custom domain
3. Implement user analytics
4. Add automated backups
5. Set up staging environment

## Support

For deployment issues, check:
- Google Cloud Console logs
- MongoDB Atlas connection logs
- Browser developer tools for frontend issues
- Network tab for API communication problems
