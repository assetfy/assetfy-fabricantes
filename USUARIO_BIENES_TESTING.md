# Testing Checklist: Usuario de Bienes Feature

## Pre-requisites
- [ ] MongoDB connection is working
- [ ] S3 bucket is configured (for image uploads)
- [ ] Admin user exists to create usuario_bienes users
- [ ] At least one fabricante with products in inventory exists

## Admin Panel Tests

### Creating Usuario de Bienes
- [ ] Login as admin user
- [ ] Navigate to admin panel
- [ ] Click "Crear Usuario" button
- [ ] Fill in user details:
  - [ ] Name: "Test Usuario Bienes"
  - [ ] CUIL: Valid CUIL number
  - [ ] Email: test-bienes@example.com
  - [ ] Password: test123
  - [ ] Role: Select "Usuario de Bienes"
- [ ] Submit form
- [ ] Verify user appears in user list
- [ ] Verify role shows as "usuario_bienes" in list

### Editing Usuario de Bienes
- [ ] In admin panel, click edit on usuario_bienes user
- [ ] Verify all fields are populated correctly
- [ ] Verify "Usuario de Bienes" role is selected
- [ ] Change name and save
- [ ] Verify changes persist

### Filtering Users
- [ ] In admin panel user list, use role filter
- [ ] Select "Usuario de Bienes"
- [ ] Verify only usuario_bienes users are shown
- [ ] Select "Todos los roles"
- [ ] Verify all users are shown

## Authentication Tests

### Login as Usuario de Bienes
- [ ] Logout from admin
- [ ] Login with usuario_bienes credentials
- [ ] Verify redirect to `/usuario` panel
- [ ] Verify panel shows "Panel de Gestión de Bienes" header
- [ ] Verify hamburger menu shows only "Assetfy Bienes"

### Access Control
- [ ] While logged in as usuario_bienes, try to access `/admin`
- [ ] Verify redirect to `/login`
- [ ] Try to access `/apoderado`
- [ ] Verify redirect to `/login`

## Bienes Panel Tests

### Initial State
- [ ] Login as usuario_bienes
- [ ] Verify empty state message: "No tienes bienes registrados aún"
- [ ] Verify two buttons present: "Crear Bien" and "Registrar Bien"

### Creating a Bien

#### Basic Creation
- [ ] Click "Crear Bien" button
- [ ] Modal opens with title "Crear Nuevo Bien"
- [ ] Enter name: "Mi Laptop"
- [ ] Do not add image yet
- [ ] Click "Crear Bien" button
- [ ] Verify success notification
- [ ] Verify bien appears in list with:
  - [ ] Name: "Mi Laptop"
  - [ ] Type badge: "Creado" (blue badge)
  - [ ] "Sin imagen" shown in image column

#### Creation with Image
- [ ] Click "Crear Bien" button
- [ ] Enter name: "Mi Monitor"
- [ ] Upload an image file (JPG/PNG)
- [ ] Add comments: "Monitor 24 pulgadas"
- [ ] Click "Atributos" section
- [ ] Add attribute: "Marca" = "Samsung"
- [ ] Add attribute: "Tamaño" = "24 pulgadas"
- [ ] Submit form
- [ ] Verify bien appears with uploaded image
- [ ] Verify type is "Creado"

### Viewing a Bien

#### View Created Bien
- [ ] Click the eye icon (👁️) on a created bien
- [ ] Modal opens with title "Ver Bien"
- [ ] Verify all fields are shown as read-only:
  - [ ] Name
  - [ ] Type badge
  - [ ] Image (if uploaded)
  - [ ] Comments
  - [ ] Attributes table
- [ ] Click "Cerrar" button
- [ ] Modal closes

### Editing a Bien

#### Edit Created Bien
- [ ] Click the edit icon (✏️) on a created bien
- [ ] Modal opens with title "Editar Bien"
- [ ] Change name to "Mi Laptop Personal"
- [ ] Update comments
- [ ] Add/remove attributes
- [ ] Upload new image (optional)
- [ ] Click "Guardar Cambios"
- [ ] Verify success notification
- [ ] Verify changes appear in list

### Deleting a Bien
- [ ] Click delete icon (🗑️) on a bien
- [ ] Confirm deletion dialog appears
- [ ] Click "Confirm"
- [ ] Verify bien is removed from list
- [ ] Verify success notification

### Registering a Bien from Inventory

#### Preparation (as Admin/Apoderado)
- [ ] Login as admin or apoderado
- [ ] Navigate to inventory
- [ ] Note the ID Assetfy of an inventory item
- [ ] Note the serial number and product name
- [ ] Logout

#### Verify Non-existent Item
- [ ] Login as usuario_bienes
- [ ] Click "Registrar Bien" button
- [ ] Enter invalid ID: "INVALID123"
- [ ] Click "Verificar"
- [ ] Verify error message: "Artículo no encontrado"

#### Verify Valid Item
- [ ] Click "Registrar Bien" button
- [ ] Enter valid Assetfy ID from inventory
- [ ] Click "Verificar"
- [ ] Verify success message
- [ ] Verify product details shown:
  - [ ] Model
  - [ ] Serial number
  - [ ] Description
  - [ ] Manufacturer
  - [ ] Brand
  - [ ] Warranty (if exists)
- [ ] Form shows "Nombre del Bien" field

#### Register the Bien
- [ ] Enter custom name: "Mi Producto Registrado"
- [ ] Click "Registrar Bien"
- [ ] Verify success notification
- [ ] Verify bien appears in list with:
  - [ ] Custom name
  - [ ] Type badge: "Registrado" (green badge)
  - [ ] Product image from manufacturer
  - [ ] Model and serial number in description
  - [ ] Manufacturer name
  - [ ] Registration date

#### View Registered Bien
- [ ] Click eye icon on registered bien
- [ ] Verify shows:
  - [ ] Custom name
  - [ ] Type: "Registrado de Fabricante"
  - [ ] Product image
  - [ ] Model, description, serial number
  - [ ] Manufacturer and brand
  - [ ] Warranty information
  - [ ] Product attributes (read-only)
  - [ ] Registration date

#### Edit Registered Bien
- [ ] Click edit icon on registered bien
- [ ] Verify info message: "Solo puedes editar el nombre"
- [ ] Change name to "Mi Nuevo Nombre"
- [ ] Click "Guardar Cambios"
- [ ] Verify only name changed
- [ ] Verify product data remains unchanged

#### Try to Register Already Registered Item
- [ ] Click "Registrar Bien" button
- [ ] Enter same Assetfy ID
- [ ] Click "Verificar"
- [ ] Verify message: "ya está registrado en tu cuenta"
- [ ] Can update the name if desired

#### Delete and Re-register
- [ ] Delete a registered bien
- [ ] Verify confirmation dialog
- [ ] Confirm deletion
- [ ] Register the same item again (same Assetfy ID)
- [ ] Verify registration date is maintained (same as before)

### List Views

#### List View
- [ ] Verify default view is "Lista"
- [ ] Table shows columns:
  - [ ] Imagen
  - [ ] Nombre
  - [ ] Tipo
  - [ ] Modelo/Descripción
  - [ ] Fabricante
  - [ ] Fecha Registro
  - [ ] Acciones (👁️ ✏️ 🗑️)
- [ ] Verify created and registered bienes show correctly

#### Image View
- [ ] Change view mode to "Imagen"
- [ ] Verify card grid layout
- [ ] Each card shows:
  - [ ] Product image or placeholder
  - [ ] Name
  - [ ] Type badge
  - [ ] Model (for registered)
  - [ ] Manufacturer (for registered)
  - [ ] Serial number (for registered)
  - [ ] Action buttons

### Filtering and Search

#### Filter by Type
- [ ] Select "Creados" filter
- [ ] Verify only created bienes shown
- [ ] Select "Registrados" filter
- [ ] Verify only registered bienes shown
- [ ] Select "Todos los tipos"
- [ ] Verify all bienes shown

#### Search
- [ ] Enter partial name in search
- [ ] Verify matching bienes shown
- [ ] For registered bienes, search by model
- [ ] Verify results
- [ ] Search by serial number
- [ ] Verify results
- [ ] Clear search
- [ ] Verify all bienes shown again

### Pagination
- [ ] Create/register more than 25 bienes
- [ ] Verify pagination controls appear
- [ ] Navigate to page 2
- [ ] Verify different items shown
- [ ] Change items per page to 10
- [ ] Verify page resets and shows 10 items

## Backend Verification Tests

### Inventory Update on Registration
- [ ] As admin/apoderado, view inventory item details
- [ ] Note the item is not registered initially
- [ ] As usuario_bienes, register this item
- [ ] As admin/apoderado, check inventory again
- [ ] Verify item shows:
  - [ ] Registrado: "Si"
  - [ ] Buyer name: usuario_bienes full name
  - [ ] Buyer email: usuario_bienes email
  - [ ] Registration date set

### Inventory Unchanged on Deletion
- [ ] Register an inventory item
- [ ] Verify inventory updated
- [ ] Delete the bien
- [ ] Check inventory again
- [ ] Verify buyer info and registration date still present
- [ ] Re-register the same item
- [ ] Verify registration date unchanged

## Profile Management
- [ ] As usuario_bienes, click profile picture/name
- [ ] Update profile name
- [ ] Upload profile picture
- [ ] Save changes
- [ ] Verify changes persist after logout/login

## Edge Cases

### Security
- [ ] Try to access another user's bienes via direct API call
- [ ] Verify 403 Forbidden response
- [ ] Try to edit another user's bien
- [ ] Verify 404 Not Found

### Invalid Operations
- [ ] Try to upload non-image file for bien image
- [ ] Verify error message
- [ ] Try to create bien with empty name
- [ ] Verify validation error
- [ ] Try to register with empty Assetfy ID
- [ ] Verify validation error

### Concurrent Registration
- [ ] Login as two different usuario_bienes users
- [ ] User A registers an inventory item
- [ ] User B tries to register same item
- [ ] Verify error: "ya está registrado por otro usuario"

## UI/UX Checks

### Responsive Design
- [ ] Resize browser window
- [ ] Verify layout adapts
- [ ] Test on mobile viewport
- [ ] Verify buttons and forms usable

### Loading States
- [ ] Verify "Creando..." shown during creation
- [ ] Verify "Verificando..." shown during verification
- [ ] Verify "Guardando..." shown during edit

### Error Handling
- [ ] Disconnect from network
- [ ] Try to create bien
- [ ] Verify error message shown
- [ ] Reconnect and retry
- [ ] Verify success

### Navigation
- [ ] Use browser back button
- [ ] Verify navigation works correctly
- [ ] Use hamburger menu
- [ ] Verify only "Assetfy Bienes" shown for usuario_bienes

## Performance Tests
- [ ] Create 100+ bienes
- [ ] Verify list loads quickly
- [ ] Verify pagination works smoothly
- [ ] Verify search is responsive
- [ ] Verify filtering is instant

## Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

## Final Verification
- [ ] All created bienes visible and editable
- [ ] All registered bienes visible with product data
- [ ] Images display correctly
- [ ] Attributes show properly
- [ ] Dates formatted correctly
- [ ] All modals open and close properly
- [ ] No console errors
- [ ] No broken images
- [ ] Logout and login works correctly
- [ ] Session persists correctly
