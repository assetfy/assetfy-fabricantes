# File Display Fix - S3 Proxy Implementation

## Problem
Files were being uploaded to S3 successfully, but the application failed to display them because the client could not directly access S3 URLs due to network connectivity restrictions.

## Solution
Implemented a backend proxy route that serves files from S3 through the Express server, eliminating the need for direct client-to-S3 connectivity.

## Changes Made

### 1. Updated URL Generation (routes/apoderado.js)
Changed all file upload handlers to generate proxy URLs instead of direct S3 URLs:

**Before:**
```javascript
url: req.file.location  // Direct S3 URL
```

**After:**
```javascript
url: `/api/apoderado/files/${Buffer.from(req.file.key).toString('base64')}`  // Backend proxy URL
```

### 2. Added File Proxy Route (routes/apoderado.js)
New `GET /api/apoderado/files/:s3Key` endpoint that:
- Decodes base64-encoded S3 keys
- Validates authentication and key format
- Fetches files from S3 using backend credentials
- Streams files to client with proper headers
- Handles errors gracefully (404, 403, connectivity issues)

### 3. Base64 Encoding for S3 Keys
S3 keys contain forward slashes (e.g., `manuales/MARCA/MODEL/file.pdf`), which are problematic in URL parameters. Using base64 encoding ensures safe URL transmission:

```javascript
// Encoding
const encodedKey = Buffer.from(s3Key).toString('base64');

// Decoding  
const s3Key = Buffer.from(encodedKey, 'base64').toString('utf8');
```

## Files Affected
- `routes/apoderado.js`: All upload routes and new proxy route

## Benefits
1. **Fixes display issue**: Files now load through the backend regardless of client S3 connectivity
2. **Maintains security**: All file access still requires authentication
3. **Preserves existing data**: S3 keys and metadata remain unchanged
4. **Minimal changes**: Only URL generation logic modified
5. **Better error handling**: Clear error messages for different failure scenarios

## Testing
- Server starts successfully with new routes
- URL encoding/decoding works correctly for all S3 key formats
- Route properly validates authentication
- Graceful error handling for S3 connectivity issues

## Future Considerations
- Consider implementing file caching for frequently accessed files
- Monitor S3 bandwidth usage with the proxy approach
- Could add file compression for images if needed