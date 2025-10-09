# Usuario Bienes Image Display Fix

## Issue
In the user bienes panel (panel de usuario de bienes), images for registered products (productos registrados) displayed correctly, but manually uploaded images for user-created items (bienes creados a mano) did not display.

## Root Cause
- **Registrado bienes** used proxy URLs (`/api/apoderado/files/...`) which support JWT token authentication
- **Creado bienes** stored direct S3 URLs which don't support JWT token authentication
- No file serving proxy endpoint existed in the usuario routes

## Solution
Added a file serving proxy infrastructure to the usuario routes, matching the pattern used for apoderado routes:

### 1. File Authentication Middleware
Added `fileAuth` middleware that accepts JWT tokens from either:
- HTTP header: `x-auth-token`
- Query parameter: `token` (for img src tags)

### 2. File Serving Endpoint
Added `GET /api/usuario/files/:s3Key` endpoint that:
- Accepts base64-encoded S3 keys
- Validates token authentication
- Prevents path traversal attacks
- Streams files from S3 to client
- Sets appropriate content-type and caching headers

### 3. Updated Image URL Storage
Modified both create and update routes to store proxy URLs instead of direct S3 URLs:
- `POST /api/usuario/bienes/crear`
- `PUT /api/usuario/bienes/:id`

## Files Changed
- `routes/usuario.js`: Added fileAuth, file serving endpoint, updated URL generation

## How It Works

### Upload Flow
```
User uploads image → Multer-S3 → S3 bucket
                              ↓
Backend stores proxy URL: /api/usuario/files/{base64-s3-key}
```

### Display Flow
```
Frontend fetches bien → getAuthenticatedUrl() adds token
                                ↓
/api/usuario/files/{base64}?token={jwt}
                                ↓
Backend validates token → Fetches from S3 → Streams to client
```

## Security Features
- JWT authentication required for all file access
- Base64-encoded S3 keys prevent direct path manipulation
- Path traversal attack prevention
- Supports private S3 buckets

## Testing
To verify the fix works:

1. **Create a new creado bien with an image**
   ```
   POST /api/usuario/bienes/crear
   - Upload image file
   - Verify imagen.url uses proxy format: /api/usuario/files/...
   ```

2. **View the bien in the UI**
   ```
   - Image should display correctly in list view
   - Image should display correctly in detail view
   ```

3. **Update an existing creado bien's image**
   ```
   PUT /api/usuario/bienes/:id
   - Upload new image
   - Verify new imagen.url uses proxy format
   - Verify new image displays correctly
   ```

## Migration Notes

### New Bienes
All newly created bienes will automatically use the proxy URL format and work correctly.

### Existing Bienes
Bienes created before this fix will have direct S3 URLs and will NOT work until:
1. The user re-uploads the image (via edit), OR
2. A database migration script converts the URLs

### Optional Migration Script
```javascript
const Bien = require('./models/bien.model');

async function migrateImageUrls() {
    const bienes = await Bien.find({
        tipo: 'creado',
        'imagen.url': /^https:\/\//  // Direct S3 URLs
    });

    for (const bien of bienes) {
        if (bien.imagen && bien.imagen.s3Key) {
            bien.imagen.url = `/api/usuario/files/${Buffer.from(bien.imagen.s3Key).toString('base64')}`;
            await bien.save();
            console.log(`✅ Migrated ${bien.nombre}`);
        }
    }
    
    console.log(`✅ Migrated ${bienes.length} bienes`);
}
```

## Compatibility
- ✅ Backwards compatible with registrado bienes
- ✅ No changes required to frontend code
- ✅ Works with existing `getAuthenticatedUrl()` utility
- ⚠️ Existing creado bienes need image re-upload or migration

## Related Code
- Frontend: `client/src/components/BienList.js` (uses `getImageUrl()`)
- Frontend: `client/src/components/BienViewForm.js` (uses `getImageUrl()`)
- Frontend: `client/src/utils/getAuthenticatedUrl.js` (adds token parameter)
- Backend: `routes/usuario.js` (file serving and URL generation)
- Model: `models/bien.model.js` (bien schema with imagen field)
