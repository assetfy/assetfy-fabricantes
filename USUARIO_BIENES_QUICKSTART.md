# Usuario de Bienes Feature - Quick Start Guide

## Overview

The **Usuario de Bienes** (Assets User) feature adds a new user type to the Assetfy system, allowing users to manage their personal assets. Assets can be either user-created with custom fields or registered from manufacturer inventory.

## Quick Access

- **Panel URL**: `/usuario`
- **Role Name**: `usuario_bienes`
- **Menu Label**: "Assetfy Bienes"

## Creating a Usuario de Bienes

### As Admin:
1. Navigate to Admin Panel
2. Click "Crear Usuario"
3. Fill in user details
4. Select "Usuario de Bienes" from the Role dropdown
5. Submit

The user will receive login credentials and can access the Bienes panel.

## Using the Bienes Panel

### Login
```
Email: your-email@example.com
Password: your-password
```
After login, you'll be automatically redirected to `/usuario`

### Two Ways to Add Assets

#### 1. Create Custom Asset
```
Click "Crear Bien" →
  Fill name (required)
  Upload image (optional)
  Add comments (optional)
  Add custom attributes (optional)
→ Submit
```

**Result**: Asset created with type "Creado" (blue badge)

#### 2. Register Manufacturer Product
```
Click "Registrar Bien" →
  Enter Assetfy ID from manufacturer inventory
  Click "Verificar" →
  System shows product details →
  Enter custom name for the asset
→ Click "Registrar Bien"
```

**Result**: Asset created with type "Registrado" (green badge)

## Managing Assets

### View Asset
- Click the eye icon (👁️) to see all details in read-only mode

### Edit Asset
- **Created Assets**: Click edit (✏️) to change name, image, comments, and attributes
- **Registered Assets**: Click edit (✏️) to change only the custom name

### Delete Asset
- Click delete (🗑️) to remove the asset
- **Note**: Deleting registered assets does NOT affect manufacturer inventory
- You can re-register the same item later

## Views and Filters

### List View (default)
Table format showing:
- Image thumbnail
- Asset name
- Type (Created/Registered)
- Model/Description
- Manufacturer
- Registration date
- Actions

### Image View
Card-based grid showing asset images and key info

### Filters
- **By Type**: All / Created / Registered
- **Search**: By name, model, or serial number

## Key Features

✅ Create unlimited custom assets
✅ Register products from manufacturer inventory
✅ Upload images (up to 5MB)
✅ Add custom attributes
✅ View product details from manufacturer
✅ List and grid views
✅ Search and filter
✅ Pagination
✅ Role-based access control

## What You CAN Do

- ✓ Access Bienes panel only
- ✓ Create custom assets
- ✓ Register manufacturer products
- ✓ View all your assets
- ✓ Edit your assets (with restrictions)
- ✓ Delete your assets
- ✓ Update your profile

## What You CANNOT Do

- ✗ Access Admin panel
- ✗ Access Fabricantes panel
- ✗ View other users' assets
- ✗ Modify manufacturer product data
- ✗ Create users
- ✗ Manage fabricantes

## API Reference

For developers, see the complete API documentation:

```javascript
// Profile
GET    /api/usuario/perfil
PUT    /api/usuario/perfil

// Assets
GET    /api/usuario/bienes
POST   /api/usuario/bienes/crear
POST   /api/usuario/bienes/verificar
POST   /api/usuario/bienes/registrar
GET    /api/usuario/bienes/:id
PUT    /api/usuario/bienes/:id
DELETE /api/usuario/bienes/:id
```

## Technical Documentation

- **Feature Overview**: See `USUARIO_BIENES_FEATURE.md`
- **Testing Guide**: See `USUARIO_BIENES_TESTING.md`
- **Architecture**: See `USUARIO_BIENES_ARCHITECTURE.md`

## Troubleshooting

### Cannot See "Registrar Bien" Button
- Ensure you're logged in as usuario_bienes
- Check that you have at least one manufacturer with inventory

### Verification Fails
- Verify the Assetfy ID is correct (check with manufacturer)
- Ensure the product exists in manufacturer's inventory
- Check if already registered by another user

### Image Upload Fails
- Ensure file is JPG, PNG, or GIF
- File size must be under 5MB
- Check S3 configuration (admin only)

### Cannot Edit Product Data
- This is expected for registered assets
- Product data comes from manufacturer and is read-only
- You can only edit the custom asset name

## Support

For issues or questions:
1. Check the testing guide: `USUARIO_BIENES_TESTING.md`
2. Review the architecture: `USUARIO_BIENES_ARCHITECTURE.md`
3. Contact system administrator

---

**Version**: 1.0
**Last Updated**: 2025
**Status**: ✅ Production Ready
