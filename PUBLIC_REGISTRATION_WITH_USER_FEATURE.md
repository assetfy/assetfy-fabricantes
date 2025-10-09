# Public Registration with User Creation Feature

## Overview
This feature enhances the public product registration form (`/registro`) to allow users to not only register their purchased products but also create a "usuario_bienes" (asset user) account in a single step.

## User Flow

### Option 1: Simple Registration (Registrar)
1. User scans QR code or navigates to `/registro`
2. Fills in the form:
   - ID de Inventario (Inventory ID)
   - Nombre Completo (Full Name)
   - Correo Electrónico (Email)
   - CUIL (Argentine tax ID)
   - Teléfono (Phone)
3. Clicks "Registrar" button
4. Product is marked as registered in the inventory
5. User data is saved in the inventory's buyer information
6. No user account is created

### Option 2: Registration with User Account (Registrar y Crear Usuario de Bienes)
1. User scans QR code or navigates to `/registro`
2. Fills in the same form fields (all required for this option)
3. Clicks "Registrar y Crear Usuario de Bienes" button
4. System performs the following:
   - Validates that the product exists and is not already registered
   - Checks if a user already exists with the provided email or CUIL
   - **If user exists:**
     - Adds "usuario_bienes" role if they don't have it
     - Creates a "bien" (asset) for the user with the product data
     - Registers the product in inventory
   - **If user doesn't exist:**
     - Creates a new user account with "usuario_bienes" role
     - Generates a temporary password
     - Creates an activation token (valid for 7 days)
     - Creates a "bien" (asset) for the user with the product data
     - Registers the product in inventory
     - Sends an invitation email with activation link
5. User receives success message

### Post-Registration for New Users
1. User receives invitation email with:
   - Temporary password
   - Activation link (valid for 7 days)
   - Instructions to access Assetfy
2. User clicks activation link to activate their account
3. User logs in with their email and temporary password
4. User can change their password after login
5. User navigates to their "Mis Bienes" (My Assets) panel
6. User sees their registered product automatically listed
7. The asset name defaults to the product model name
8. User can edit the asset name if desired

## Technical Implementation

### Frontend Changes

#### RegistroProducto.js
- Added CUIL field to form state and UI
- Added two submission buttons:
  - "Registrar" (secondary-button style)
  - "Registrar y Crear Usuario de Bienes" (primary button style)
- Modified `handleSubmit` to accept a `createUser` parameter
- Form routes to different endpoints based on button clicked

#### App.css
- Added `secondary-button` class for styling
- Enhanced `button-group` class for better layout

### Backend Changes

#### routes/public.js

##### POST /api/public/registro
- Existing endpoint (enhanced)
- Now optionally saves CUIL if provided
- Registers product without creating user account

##### POST /api/public/registro-con-usuario (NEW)
- Validates all required fields including CUIL
- Validates CUIL format (11 digits)
- Checks for existing users
- Creates new usuario_bienes user if needed
- Creates bien (asset) automatically with product name as default
- Updates inventory with buyer data
- Sends invitation email
- Returns success/error response

#### models/inventario.model.js
- Added `cuil` field to `comprador` subdocument
- Field is optional (not required)

### Email Integration
- Uses existing `sendInvitationEmail` function
- Passes `'usuario_bienes'` as userRole parameter
- Triggers the Assetfy-specific email template
- Email includes activation link and temporary password

## Data Model

### Usuario (User)
```javascript
{
  nombreCompleto: String,
  cuil: String (unique, required),
  correoElectronico: String (unique, required),
  contraseña: String (hashed),
  telefono: String,
  roles: ['usuario_bienes'],
  activationToken: String,
  activationTokenExpires: Date,
  estado: 'Activo',
  estadoApoderado: 'Invitado'
}
```

### Bien (Asset)
```javascript
{
  nombre: String (defaults to product model),
  tipo: 'registrado',
  usuario: ObjectId (ref to Usuario),
  inventario: ObjectId (ref to Inventario),
  datosProducto: {
    modelo: String,
    descripcion: String,
    numeroSerie: String,
    garantia: ObjectId,
    atributos: Array,
    imagenPrincipal: Object,
    fabricante: ObjectId,
    marca: ObjectId
  },
  fechaRegistro: Date
}
```

### Inventario (Inventory)
```javascript
{
  comprador: {
    nombreCompleto: String,
    correoElectronico: String,
    cuil: String (new field),
    telefono: String
  },
  registrado: 'Si',
  estado: 'vendido',
  fechaRegistro: Date
}
```

## Validation Rules

### CUIL Validation
- Required only for "Registrar y Crear Usuario de Bienes" option
- Must be 11 digits
- Hyphens and spaces are removed before validation
- Format: XXXXXXXXXX (11 numeric digits)

### Duplicate Handling
- If email already exists: Error message
- If CUIL already exists: Error message
- If user exists but lacks usuario_bienes role: Role is added automatically

## Error Handling

### Common Errors
1. **Product not found**: "El producto no existe. Por favor, revise el número de inventario o contacte al fabricante."
2. **Product already registered**: "Este producto ya está registrado a otro usuario."
3. **Invalid email format**: "El formato del correo electrónico no es válido."
4. **Invalid CUIL format**: "El CUIL debe contener 11 dígitos."
5. **Duplicate email**: "El correo electrónico ya está registrado en el sistema."
6. **Duplicate CUIL**: "El CUIL ya está registrado en el sistema."
7. **Email sending failure**: "Producto registrado exitosamente. Se ha creado su usuario de bienes, pero hubo un problema al enviar el correo..."

### Success Messages
1. **Simple registration**: "Producto registrado exitosamente. ¡Gracias por registrar su producto!"
2. **Registration with new user**: "Producto registrado exitosamente. Se ha creado su usuario de bienes y le hemos enviado un correo con las instrucciones de activación."
3. **Registration with existing user**: "Producto registrado exitosamente. El usuario ya existe y el bien ha sido agregado a su cuenta."

## Security Considerations

1. **Password Generation**: Uses crypto.randomBytes(8) for temporary passwords
2. **Password Hashing**: Uses bcrypt with salt rounds of 10
3. **Activation Token**: 32-byte random hex string, expires in 7 days
4. **CUIL Privacy**: CUIL is stored but only accessible by authorized users
5. **Email Validation**: Server-side regex validation
6. **Input Sanitization**: All inputs are trimmed and validated

## Testing Checklist

### Manual Testing
- [ ] Simple registration (Registrar button) works correctly
- [ ] Registration with new user (Registrar y Crear Usuario) creates account
- [ ] Email is sent with activation link
- [ ] User can activate account via email link
- [ ] User sees their asset after login
- [ ] Asset name defaults to product model
- [ ] User can edit asset name
- [ ] Duplicate email/CUIL is rejected
- [ ] Existing user gets asset added without creating duplicate account
- [ ] Invalid CUIL format is rejected
- [ ] Product already registered error works correctly

### Edge Cases
- [ ] CUIL with hyphens (should be stripped)
- [ ] CUIL with spaces (should be stripped)
- [ ] Very long product names
- [ ] Missing product data (fabricante, marca, etc.)
- [ ] Email service failure (user still created, warning shown)

## Future Enhancements

1. **CUIL Auto-formatting**: Add automatic CUIL formatting (XX-XXXXXXXX-X)
2. **Email Verification**: Require email verification before account activation
3. **SMS Notification**: Send SMS in addition to email
4. **Multi-language Support**: Support for English and Portuguese
5. **QR Code Integration**: Direct link from QR code scan to pre-filled form
6. **Warranty Activation**: Automatically activate warranty upon registration
7. **Product History**: Show purchase date and registration date in asset details

## Support

For issues or questions about this feature, please contact the development team or open an issue in the repository.
