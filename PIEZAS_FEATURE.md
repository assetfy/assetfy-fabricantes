# Repuestos / Piezas Feature Implementation

## Overview
This document describes the implementation of the new "Repuestos / Piezas" (Parts/Pieces) feature that was added to the fabricantes application.

## Implementation Summary

### 1. Database Model (Backend)
**File**: `models/pieza.model.js`

Created a new Mongoose schema for `Pieza` with the following fields:
- `idPieza` - Alphanumeric ID (auto-generated, unique)
- `nombre` - Name of the part (required)
- `imagen` - Image file with S3 storage metadata
- `productos` - Array of product references (multiple selection)
- `atributos` - Array of attributes (same structure as products)
- `garantia` - Reference to warranty (optional)
- `usuarioApoderado` - Reference to the user who owns the part

### 2. Backend API Routes
**File**: `routes/apoderado.js`

Added the following API endpoints:
- `GET /api/apoderado/piezas` - List all piezas with search functionality
- `GET /api/apoderado/piezas/:id` - Get a specific pieza
- `POST /api/apoderado/piezas/add` - Create a new pieza
- `PUT /api/apoderado/piezas/:id` - Update a pieza
- `DELETE /api/apoderado/piezas/:id` - Delete a pieza
- `POST /api/apoderado/piezas/generate-id` - Generate a unique alphanumeric ID
- `POST /api/apoderado/piezas/:id/imagen` - Upload image for a pieza
- `DELETE /api/apoderado/piezas/:id/imagen` - Delete image from a pieza

The search functionality allows filtering by:
- ID Pieza
- Nombre (name)
- Associated products

### 3. Frontend Components

#### PiezaForm.js
Modal form for creating new piezas with:
- Three tabs: "Información Básica", "Atributos", "Garantía"
- Fields:
  - Nombre (text input)
  - ID Pieza (alphanumeric with "Generar ID" button)
  - Imagen (file upload)
  - Productos Asociados (multiple select dropdown)
  - Atributos manager (reused from ProductForm)
  - Warranty selector (reused from ProductForm)

#### PiezaList.js
List view component with:
- Search functionality (by ID, name, or product)
- Two view modes: List view and Image grid view
- Pagination support
- Actions: View, Edit, Delete

List view columns:
- ID Pieza
- Nombre
- Productos Asociados
- Imagen (thumbnail)
- Acciones (action buttons)

Image view shows:
- Image card with pieza image
- Name and ID
- Number of associated products
- Action buttons

#### PiezaEditForm.js
Edit/View form with:
- Same tab structure as PiezaForm
- Read-only mode for viewing
- Image management (upload new, delete existing)
- All CRUD operations for attributes and warranty

### 4. Integration in ApoderadoPanel

**File**: `client/src/components/ApoderadoPanel.js`

Added:
- New navigation link: "Repuestos / Piezas"
- New route: `/apoderado/piezas`
- State management for piezas (create, edit, view)
- Modals for Create, Edit, and View operations
- Integration with existing refresh mechanism

The navigation now shows:
1. Mis Productos
2. **Repuestos / Piezas** (NEW)
3. Mis Marcas
4. Inventario
5. Representantes
6. Garantías
7. Métricas
8. Administración

## Features

### Key Features Implemented:
1. ✅ Create new piezas with all required fields
2. ✅ Auto-generate alphanumeric IDs (like products)
3. ✅ Upload and manage images for piezas
4. ✅ Multiple product selection (asociar a varios productos)
5. ✅ Attributes management (same as products)
6. ✅ Warranty assignment (same as products)
7. ✅ List and Image view modes
8. ✅ Search by ID, name, or associated product
9. ✅ Edit existing piezas
10. ✅ View piezas in read-only mode
11. ✅ Delete piezas

### Technical Details:
- Uses existing reusable components: `AttributesManager`, `WarrantySelector`, `Tabs`, `Modal`
- Follows the same pattern as products for consistency
- Image upload uses S3 storage (same as products)
- Access control based on `usuarioApoderado`
- Proper error handling and user feedback

## Testing

### Build Verification:
✅ Backend model syntax verified
✅ Backend routes syntax verified
✅ Frontend components compile successfully
✅ No linting errors
✅ Build passes successfully

### Manual Testing Checklist:
To test the feature manually:
1. Start the backend server
2. Start the frontend client
3. Login as an apoderado user
4. Navigate to "Repuestos / Piezas"
5. Click "Crear Pieza" button
6. Fill in the form:
   - Enter a name
   - Click "Generar ID" to auto-generate ID
   - Upload an image
   - Select one or more products
   - Add attributes if needed
   - Select warranty if needed
7. Submit and verify pieza is created
8. Test search functionality
9. Test list/image view toggle
10. Test edit functionality
11. Test view (read-only) functionality
12. Test delete functionality

## Files Modified/Created:

### Created:
- `models/pieza.model.js`
- `client/src/components/PiezaForm.js`
- `client/src/components/PiezaList.js`
- `client/src/components/PiezaEditForm.js`

### Modified:
- `routes/apoderado.js` - Added pieza routes
- `client/src/components/ApoderadoPanel.js` - Added navigation, routes, and modals

## Notes:
- The implementation follows the same patterns as the existing Products feature
- All components are fully integrated with the notification system
- The feature is only accessible to authenticated apoderado users
- The multi-select for products uses native HTML select with Ctrl/Cmd key for multiple selection
