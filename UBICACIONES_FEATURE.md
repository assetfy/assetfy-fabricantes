# Ubicaciones / Depósitos Feature Implementation

## Overview
This document describes the implementation of the "Ubicaciones / Depósitos" (Locations/Warehouses) feature in the fabricantes application.

## Problem Statement
Add a new "Ubicaciones / Depósitos" management section to the Administration panel that allows users to:
1. Create, edit, and delete warehouse/location records
2. Each location has: name (nombre), address (dirección), and phone (teléfono)
3. Locations appear as a new tab in the Administration panel (after Import/Export tabs)
4. Inventory items can optionally reference a location/warehouse
5. The interface should be similar to the "Marcas" (Brands) management section

## Implementation Summary

### 1. Database Model (Backend)
**File**: `models/ubicacion.model.js`

Created a new Mongoose schema for `Ubicacion` with the following fields:
- `nombre` - Name of the warehouse/location (required, min 3 characters)
- `direccion` - Address (required)
- `telefono` - Phone number (required)
- `usuarioApoderado` - Reference to the user who owns the location (required)
- `timestamps` - Automatic createdAt and updatedAt fields

### 2. Backend API Routes
**File**: `routes/apoderado.js`

Added the Ubicacion model import and the following API endpoints:
- `GET /api/apoderado/ubicaciones` - List all ubicaciones for the authenticated user
- `POST /api/apoderado/ubicaciones/add` - Create a new ubicacion
- `PUT /api/apoderado/ubicaciones/:id` - Update an existing ubicacion
- `DELETE /api/apoderado/ubicaciones/:id` - Delete a ubicacion (with validation to prevent deletion if inventory items reference it)

The delete route includes a check to prevent deletion of ubicaciones that are referenced by inventory items.

### 3. Inventory Model Update
**File**: `models/inventario.model.js`

Added a new optional field:
- `ubicacion` - Reference to Ubicacion model (optional)

### 4. Inventory API Updates
**File**: `routes/apoderado.js`

Updated the following inventory routes to handle the ubicacion field:
- `GET /api/apoderado/inventario` - Now populates the ubicacion field
- `POST /api/apoderado/inventario/add` - Accepts ubicacion parameter
- `PUT /api/apoderado/inventario/:id` - Accepts ubicacion parameter

### 5. Frontend Components

#### UbicacionForm.js
**File**: `client/src/components/UbicacionForm.js`

A form component for creating new ubicaciones with fields for:
- Nombre del Depósito (Warehouse Name)
- Dirección (Address)
- Teléfono (Phone)

Features:
- Form validation (all fields required)
- Success/error notifications
- Auto-reset after successful creation
- Calls callback to refresh the list

#### UbicacionList.js
**File**: `client/src/components/UbicacionList.js`

A list component for displaying and managing ubicaciones with:
- Search functionality (searches name, address, and phone)
- Pagination support
- Edit and Delete action buttons
- Confirm dialog before deletion
- Empty state when no ubicaciones exist

#### UbicacionEditForm.js
**File**: `client/src/components/UbicacionEditForm.js`

An edit form component for updating existing ubicaciones with:
- Pre-populated form fields
- Update and Cancel buttons
- Success/error notifications
- Calls callback to refresh the list after update

### 6. Administration Panel Integration
**File**: `client/src/components/AdministracionPanel.js`

Updated to include:
- New "Ubicaciones / Depósitos" tab (third tab after Export and Import)
- Modal for creating new ubicaciones
- Modal for editing existing ubicaciones
- State management for modals and refresh triggers
- Integration with UbicacionForm, UbicacionList, and UbicacionEditForm components

### 7. Inventory Form Integration
**File**: `client/src/components/InventarioForm.js`

Updated to include:
- New ubicaciones state to store available locations
- useEffect hook to fetch ubicaciones on component mount
- New "Ubicación / Depósito (opcional)" dropdown field in the Información Básica tab
- Dropdown populated with available ubicaciones
- Option to leave location unassigned ("Sin ubicación asignada")
- Support for both creating and editing inventory items with ubicacion

## User Interface Flow

### Creating a Ubicación:
1. Navigate to Administración panel
2. Click on "Ubicaciones / Depósitos" tab
3. Click "Crear Ubicación / Depósito" button
4. Fill in the form (nombre, dirección, teléfono)
5. Click "Crear Ubicación"
6. Success notification appears
7. List refreshes to show the new ubicación

### Editing a Ubicación:
1. In the Ubicaciones list, click "Editar" button on a ubicación
2. Modal opens with pre-filled form
3. Modify the desired fields
4. Click "Actualizar Ubicación"
5. Success notification appears
6. List refreshes to show updated data

### Deleting a Ubicación:
1. In the Ubicaciones list, click "Eliminar" button
2. Confirmation dialog appears
3. Confirm deletion
4. If no inventory items reference this ubicación, it's deleted successfully
5. If inventory items reference it, error message appears preventing deletion

### Assigning Ubicación to Inventory:
1. When creating or editing an inventory item
2. In the "Información Básica" tab, find the "Ubicación / Depósito (opcional)" dropdown
3. Select a ubicación from the list or leave as "Sin ubicación asignada"
4. Save the inventory item
5. The ubicación is now associated with that inventory item

## Testing

### Build Verification:
✅ Backend model syntax verified (ubicacion.model.js)
✅ Backend routes syntax verified (apoderado.js)
✅ Inventory model syntax verified (inventario.model.js)
✅ Frontend components compile successfully
✅ Build passes successfully with no errors

### Features Implemented:
✅ Ubicacion database model with required fields
✅ Complete CRUD API endpoints for ubicaciones
✅ Frontend components for create, list, edit, and delete
✅ Integration in AdministracionPanel as third tab
✅ Optional ubicacion field in inventory items
✅ Inventory form includes ubicacion selector
✅ Proper validation and error handling
✅ Referential integrity (prevent deletion if referenced)

### Manual Testing Checklist:
To test the feature manually:
1. Start the backend server
2. Start the frontend client
3. Login as an apoderado user
4. Navigate to "Administración" → "Ubicaciones / Depósitos"
5. Click "Crear Ubicación / Depósito" button
6. Fill in the form:
   - Nombre: "Depósito Central"
   - Dirección: "Av. Corrientes 1234, CABA"
   - Teléfono: "+54 11 1234-5678"
7. Submit and verify ubicación is created
8. Test search functionality (search by name, address, or phone)
9. Test pagination controls
10. Test edit functionality
11. Test delete functionality
12. Navigate to Inventario section
13. Create or edit an inventory item
14. Verify "Ubicación / Depósito" field appears in form
15. Select a ubicación and save
16. Verify the ubicación is saved with the inventory item
17. Try to delete a ubicación that's referenced by inventory (should fail with error)

## Code Quality
- Follows existing code patterns (similar to Marcas management)
- Proper error handling on both frontend and backend
- Consistent naming conventions in Spanish
- All required fields properly validated
- Mongoose schema with appropriate constraints
- React hooks used correctly (useState, useEffect)
- Proper component composition and separation of concerns

## Files Modified/Created

### Created:
- `models/ubicacion.model.js`
- `client/src/components/UbicacionForm.js`
- `client/src/components/UbicacionList.js`
- `client/src/components/UbicacionEditForm.js`

### Modified:
- `routes/apoderado.js` - Added ubicacion routes and updated inventory routes
- `models/inventario.model.js` - Added ubicacion field
- `client/src/components/AdministracionPanel.js` - Added Ubicaciones tab
- `client/src/components/InventarioForm.js` - Added ubicacion selector

## Summary
The Ubicaciones / Depósitos feature has been successfully implemented following the existing patterns in the codebase. The implementation provides a complete CRUD interface for managing warehouse locations and allows inventory items to optionally reference these locations. The feature is fully integrated into the Administration panel and follows the same design patterns as the Marcas (Brands) management section.
