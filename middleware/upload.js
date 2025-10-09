const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Validate required environment variables
const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'S3_BUCKET_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required AWS environment variables:', missingVars.join(', '));
    throw new Error(`Missing AWS configuration: ${missingVars.join(', ')}`);
}

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Test S3 connection on module load
const testS3Connection = async () => {
    try {
        await s3.headBucket({ Bucket: process.env.S3_BUCKET_NAME }).promise();
        console.log('✅ S3 bucket connection successful');
        return true;
    } catch (error) {
        console.error('❌ S3 bucket test failed:', error.message);
        console.error('');
        
        if (error.code === 'NotFound') {
            console.error(`💡 Bucket "${process.env.S3_BUCKET_NAME}" does not exist`);
            console.error('   Solution: Create the bucket in AWS Console or update S3_BUCKET_NAME in .env');
        } else if (error.code === 'Forbidden') {
            console.error('💡 Access denied to bucket. Check your AWS credentials and IAM permissions');
        } else if (error.code === 'InvalidAccessKeyId') {
            console.error('💡 AWS Access Key ID is invalid. Check AWS_ACCESS_KEY_ID in .env');
        } else if (error.code === 'SignatureDoesNotMatch') {
            console.error('💡 AWS Secret Access Key is invalid. Check AWS_SECRET_ACCESS_KEY in .env');
        } else if (error.code === 'UnknownEndpoint') {
            console.error('💡 Invalid AWS region or network issue. Check AWS_REGION in .env');
            console.error(`   Current region: ${process.env.AWS_REGION}`);
            console.error('   Try: us-east-1, us-west-2, eu-west-1, etc.');
        }
        
        console.error('');
        console.error('🔧 To fix S3 issues, run: node test-s3-config.js');
        console.error('📚 Check the S3 setup instructions for detailed help');
        console.error('');
        
        return false;
    }
};

// Track S3 connection status
let s3ConnectionStatus = false;

// Test connection but don't block startup
testS3Connection().then(success => {
    s3ConnectionStatus = success;
    if (!success) {
        console.warn('⚠️  File uploads will not work until S3 is properly configured.');
        console.warn('   The rest of the application will work normally.');
    }
}).catch(() => {
    s3ConnectionStatus = false;
    console.warn('⚠️  S3 connection test failed. File uploads will not work until this is resolved.');
});

// Create a middleware to check S3 connection before upload
const checkS3Connection = (req, res, next) => {
    if (!s3ConnectionStatus) {
        console.error('❌ Upload attempted but S3 is not available');
        return res.status(503).json({
            error: 'Servicio de almacenamiento temporalmente no disponible',
            message: 'El sistema de archivos no está configurado o no está disponible. Contacte al administrador.',
            code: 'S3_NOT_AVAILABLE'
        });
    }
    next();
};

// Create upload middleware factory
const createUpload = (mediaType, allowedTypes, fileTypeError, fileLimit = 10) => {
    return multer({
        storage: multerS3({
            s3: s3,
            bucket: process.env.S3_BUCKET_NAME,
            key: function (req, file, cb) {
                try {
                    // Validate that s3Path is set
                    if (!req.s3Path || req.s3Path.trim() === '') {
                        const error = new Error(`S3 path not set for ${mediaType} upload. Check route configuration.`);
                        console.error('❌ Missing s3Path:', error.message);
                        return cb(error);
                    }

                    // Generate the S3 key based on media type, marca and modelo
                    // This will be set dynamically in the route
                    const extension = path.extname(file.originalname);
                    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const s3Key = `${mediaType}/${req.s3Path}/${fileName}`;
                    
                    console.log(`📁 Uploading ${mediaType} file to S3: ${s3Key}`);
                    cb(null, s3Key);
                } catch (error) {
                    console.error('❌ Error generating S3 key:', error);
                    cb(error);
                }
            },
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            contentType: multerS3.AUTO_CONTENT_TYPE
        }),
        fileFilter: function (req, file, cb) {
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);
            
            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error(fileTypeError));
            }
        },
        limits: {
            fileSize: fileLimit * 1024 * 1024 // Size limit in MB
        }
    });
};

// Configure different upload types
const upload = createUpload(
    'manuales',
    /pdf|doc|docx|txt|jpg|jpeg|png/,
    'Solo se permiten archivos PDF, DOC, DOCX, TXT, JPG, JPEG y PNG para manuales',
    10
);

const uploadImagenPrincipal = createUpload(
    'ImagenPrincipal',
    /jpg|jpeg|png|gif/,
    'Solo se permiten archivos JPG, JPEG, PNG y GIF para imagen principal',
    5
);

const uploadImagenesAdicionales = createUpload(
    'ImagenesExtra',
    /jpg|jpeg|png|gif/,
    'Solo se permiten archivos JPG, JPEG, PNG y GIF para imágenes adicionales',
    5
);

const uploadVideos = createUpload(
    'Videos',
    /mp4|avi|mov|wmv/,
    'Solo se permiten archivos MP4, AVI, MOV y WMV para videos',
    50
);

const uploadFotoPerfil = createUpload(
    'FotoPerfil',
    /jpg|jpeg|png|gif/,
    'Solo se permiten archivos JPG, JPEG, PNG y GIF para foto de perfil',
    5
);

const uploadLogoMarca = createUpload(
    'logoMarca',
    /jpg|jpeg|png|gif/,
    'Solo se permiten archivos JPG, JPEG, PNG y GIF para logo de marca',
    2
);

// Function to delete file from S3
const deleteFromS3 = (s3Key) => {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key
        };
        
        console.log(`🗑️  Deleting file from S3: ${s3Key}`);
        
        s3.deleteObject(params, (err, data) => {
            if (err) {
                console.error('❌ Error deleting from S3:', err);
                reject(err);
            } else {
                console.log('✅ File deleted from S3 successfully');
                resolve(data);
            }
        });
    });
};

module.exports = { 
    upload, 
    uploadImagenPrincipal, 
    uploadImagenesAdicionales, 
    uploadVideos, 
    uploadFotoPerfil,
    uploadLogoMarca,
    deleteFromS3, 
    checkS3Connection,
    s3 
};