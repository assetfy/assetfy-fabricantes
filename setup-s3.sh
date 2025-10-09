#!/bin/bash

# S3 Bucket Creation Helper Script
# This script helps create an S3 bucket with a unique name

echo "🚀 S3 Bucket Setup Helper"
echo "========================"
echo ""

# Read current configuration
if [ -f ".env" ]; then
    source .env
    echo "📋 Current configuration:"
    echo "   Region: $AWS_REGION"
    echo "   Bucket: $S3_BUCKET_NAME"
    echo ""
else
    echo "❌ .env file not found!"
    exit 1
fi

# Suggest alternative bucket names
COMPANY_NAME="fabricantes"
TIMESTAMP=$(date +%Y%m%d)
RANDOM_NUM=$RANDOM

echo "💡 If the current bucket name is taken, try these alternatives:"
echo ""
echo "   Option 1: $S3_BUCKET_NAME-$TIMESTAMP"
echo "   Option 2: $COMPANY_NAME-manuales-$RANDOM_NUM"
echo "   Option 3: asset-$COMPANY_NAME-storage"
echo "   Option 4: manuales-storage-$TIMESTAMP"
echo ""

echo "🔧 To update your configuration:"
echo "   1. Choose one of the bucket names above"
echo "   2. Create the bucket in AWS Console"
echo "   3. Update S3_BUCKET_NAME in .env file"
echo "   4. Restart the server"
echo ""

echo "📝 AWS CLI commands to create bucket (if you have AWS CLI):"
echo ""
echo "   # For us-east-1 (default region)"
echo "   aws s3 mb s3://$S3_BUCKET_NAME-$TIMESTAMP"
echo ""
echo "   # For other regions"
echo "   aws s3 mb s3://$S3_BUCKET_NAME-$TIMESTAMP --region $AWS_REGION"
echo ""

echo "🧪 To test your configuration after setup:"
echo "   node test-s3-config.js"