# Feature: Usuario de Bienes (Assets User)

## Overview
This feature adds a new user type called "usuario_bienes" (assets user) to the Assetfy system. This user type has access to a dedicated panel for managing personal assets, separate from the fabricantes and admin panels.

## Components Added

### Backend

1. **Model: `models/bien.model.js`**
   - Defines the Bien (Asset) schema
   - Supports two types of assets:
     - `creado`: User-created assets with custom fields
     - `registrado`: Assets registered from manufacturer inventory
   - Fields include: name, image, comments, custom attributes, and product data for registered items

2. **Routes: `routes/usuario.js`**
   - `/api/usuario/perfil` - Get/update user profile
   - `/api/usuario/bienes` - List all user's assets
   - `/api/usuario/bienes/crear` - Create a new user-defined asset
   - `/api/usuario/bienes/verificar` - Verify if an inventory item exists and can be registered
   - `/api/usuario/bienes/registrar` - Register an inventory item as an asset
   - `/api/usuario/bienes/:id` - Get/update/delete specific asset

3. **Model Updates: `models/usuario.model.js`**
   - Added `usuario_bienes` to the rol enum

4. **Auth Updates: `routes/auth.js`**
   - Updated login logic to handle usuario_bienes role

### Frontend

1. **Components:**
   - `UsuarioPanel.js` - Main panel for usuario_bienes users
   - `BienList.js` - List/grid view of assets with filters
   - `BienForm.js` - Form to create new assets
   - `BienRegisterForm.js` - Two-step form to verify and register manufacturer items
   - `BienViewForm.js` - Read-only view of asset details
   - `BienEditForm.js` - Edit form (full edit for created, name-only for registered)

2. **Routing:**
   - Updated `App.js` to add `/usuario` route for usuario_bienes
   - Route protection ensures only usuario_bienes can access this panel

3. **Navigation:**
   - Updated `PanelMenu.js` to show "Assetfy Bienes" option for usuario_bienes users

4. **Form Updates:**
   - Updated `UserForm.js` to include usuario_bienes as a role option

5. **Styling:**
   - Added badge styles for asset types (creado/registrado)
   - Added styles for verification results, read-only forms, and attribute tables

## User Workflows

### Creating a Custom Asset
1. User clicks "Crear Bien" button
2. Fills in asset name, optionally uploads an image and adds comments
3. Can add custom attributes (key-value pairs)
4. Asset is saved as type "creado"

### Registering a Manufacturer Asset
1. User clicks "Registrar Bien" button
2. Enters the Assetfy ID (inventory ID from manufacturer)
3. System verifies:
   - Item exists
   - Item is not already registered by another user
4. If valid, shows product details (model, serial number, manufacturer, etc.)
5. User assigns a custom name to the asset
6. System:
   - Creates a "registrado" asset
   - Copies product data at registration time
   - Updates manufacturer's inventory with user info
   - Maintains registration date

### Viewing Assets
- List view: Tabular format with image, name, type, model, manufacturer, registration date
- Image view: Grid cards with product images
- Filter by type (created/registered)
- Search by name, model, or serial number

### Editing Assets
- **Created assets**: Can edit name, image, comments, and attributes
- **Registered assets**: Can only edit the custom name (product data is read-only)

### Deleting Assets
- User can delete any asset
- Deleting a registered asset does NOT affect the manufacturer's inventory
- User can re-register the same item later (registration date is maintained)

## Key Features

1. **Dual Asset Types**: 
   - Users can create their own assets with custom data
   - Users can register products from manufacturer inventory

2. **Smart Verification**:
   - Prevents duplicate registrations
   - Shows clear messages for non-existent or already-registered items

3. **Data Integrity**:
   - Registered assets maintain a snapshot of product data
   - Manufacturer inventory is updated but not modified on deletion
   - Registration dates are preserved

4. **Consistent UI/UX**:
   - Same look and feel as fabricantes panel
   - List and image view modes
   - Pagination and filtering

5. **Role-Based Access**:
   - usuario_bienes cannot access admin or fabricantes panels
   - Only sees "Assetfy Bienes" in the hamburger menu

## Technical Notes

- Image uploads use the existing S3 integration
- File uploads are stored in the `bienes/` folder on S3
- Validation ensures either producto or pieza reference in inventory
- Custom attributes use a flexible schema for user-defined fields
- Population of references ensures efficient data loading

## Future Enhancements (Not Implemented)
- Warranty tracking for registered assets
- Asset transfer between users
- Bulk import of assets
- Asset history/audit log
- Mobile app integration
