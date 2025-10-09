// S3 Configuration Test Script
// Run this with: node test-s3-config.js

const dotenv = require('dotenv');
dotenv.config();

const AWS = require('aws-sdk');

console.log('🔧 Testing S3 Configuration...\n');

// Check environment variables
const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'S3_BUCKET_NAME'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('💡 Make sure your .env file contains all required AWS configuration');
    process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 4)}...`);
console.log(`   AWS_REGION: ${process.env.AWS_REGION}`);
console.log(`   S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME}\n`);

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

async function testS3() {
    try {
        // Test 1: List buckets to verify credentials
        console.log('🔑 Testing AWS credentials...');
        const listResult = await s3.listBuckets().promise();
        console.log('✅ AWS credentials are valid');
        console.log(`📦 Found ${listResult.Buckets.length} buckets in your account\n`);

        // Test 2: Check if target bucket exists
        console.log('🎯 Testing target bucket...');
        try {
            await s3.headBucket({ Bucket: process.env.S3_BUCKET_NAME }).promise();
            console.log('✅ Target bucket exists and is accessible');

            // Test 3: Try to list objects in bucket
            console.log('📁 Testing bucket permissions...');
            const objects = await s3.listObjectsV2({ 
                Bucket: process.env.S3_BUCKET_NAME,
                MaxKeys: 1
            }).promise();
            console.log('✅ Can read from bucket');

            // Test 4: Try to put a test object
            console.log('📤 Testing write permissions...');
            const testKey = 'test/connection-test.txt';
            await s3.putObject({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: testKey,
                Body: 'Test upload from fabricantes app',
                ContentType: 'text/plain'
            }).promise();
            console.log('✅ Can write to bucket');

            // Test 5: Delete the test object
            console.log('🗑️  Testing delete permissions...');
            await s3.deleteObject({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: testKey
            }).promise();
            console.log('✅ Can delete from bucket\n');

            console.log('🎉 All tests passed! S3 configuration is working correctly.');

        } catch (bucketError) {
            if (bucketError.code === 'NotFound') {
                console.log('❌ Target bucket does not exist');
                console.log('💡 Available buckets in your account:');
                listResult.Buckets.forEach(bucket => {
                    console.log(`   - ${bucket.Name}`);
                });
                console.log('\n💡 Options:');
                console.log('   1. Use one of the existing buckets above');
                console.log('   2. Create a new bucket in AWS Console');
                console.log('   3. Update S3_BUCKET_NAME in .env file');
            } else if (bucketError.code === 'Forbidden') {
                console.log('❌ Access denied to target bucket');
                console.log('💡 The bucket exists but your credentials don\'t have access');
                console.log('   Check your IAM permissions for this bucket');
            } else {
                console.log('❌ Error accessing bucket:', bucketError.message);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'InvalidAccessKeyId') {
            console.log('💡 The AWS Access Key ID is invalid');
        } else if (error.code === 'SignatureDoesNotMatch') {
            console.log('💡 The AWS Secret Access Key is invalid');
        } else if (error.code === 'UnknownEndpoint') {
            console.log('💡 Invalid AWS region or network connectivity issue');
        } else {
            console.log('💡 Check your AWS credentials and network connectivity');
        }
    }
}

testS3();