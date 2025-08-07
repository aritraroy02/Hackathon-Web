#!/bin/bash
# Deployment script for Google Cloud

set -e

# Configuration
PROJECT_ID="hackathon-466723"
SERVICE_NAME="child-health-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting deployment to Google Cloud..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with gcloud: gcloud auth login"
    exit 1
fi

# Set the project
echo "📋 Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "🏗️  Building and deploying with Cloud Build..."
gcloud builds submit \
    --config=../cloudbuild.yaml \
    --substitutions=_SERVICE_NAME=${SERVICE_NAME},_REGION=${REGION} \
    ..

# Get the service URL
echo "🌐 Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --region=${REGION} \
    --format='value(status.url)')

echo "✅ Deployment completed successfully!"
echo "🔗 Service URL: ${SERVICE_URL}"
echo "🔍 Health check: ${SERVICE_URL}/health"
echo "📊 API endpoint: ${SERVICE_URL}/api/children"

# Test the deployment
echo "🧪 Testing deployment..."
if curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed. Please check the logs:"
    echo "   gcloud logs read --service=${SERVICE_NAME} --region=${REGION}"
fi

echo ""
echo "📱 Update your frontend environment variables:"
echo "   REACT_APP_BACKEND_URL=${SERVICE_URL}"
echo ""
echo "🎉 Your Child Health Backend is now live on Google Cloud!"
