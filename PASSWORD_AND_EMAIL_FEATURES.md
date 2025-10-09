# Password Change and Email Invitation Features - Implementation Guide

## Overview

This document describes the implementation of two major features:
1. **Password Change Functionality** - Users can change their password from their profile
2. **Email Invitation System** - Admins can send invitation emails when creating users

## Features Implemented

### 1. Password Change

#### Backend Changes

**Admin Route (`routes/admin.js`)**
- Added `POST /api/admin/perfil/cambiar-contrasena` endpoint
- Validates password fields (required, matching, minimum length)
- Hashes new password with bcrypt
- Returns success/error messages

**Apoderado Route (`routes/apoderado.js`)**
- Added `POST /api/apoderado/perfil/cambiar-contrasena` endpoint
- Same validation and security as admin route

#### Frontend Changes

**ProfileEditModal Component (`client/src/components/ProfileEditModal.js`)**
- Added "Cambiar Contraseña" button
- Added password change form with two fields:
  - Nueva Contraseña (New Password)
  - Confirmar Nueva Contraseña (Confirm New Password)
- Form validation (passwords must match, minimum 6 characters)
- Shows/hides password fields when button is clicked
- Works in both demo and real mode

### 2. Email Invitation System

#### Backend Changes

**Email Service (`utils/emailService.js`)**
- Created nodemailer-based email service
- Modern HTML email template with:
  - App logo embedded as base64
  - Gradient header design
  - User credentials (email and provisional password)
  - List of assigned fabricantes
  - Activation button with unique link
  - Professional footer
- `sendInvitationEmail()` function to send invitation emails

**Usuario Model (`models/usuario.model.js`)**
- Added `activationToken` field (String)
- Added `activationTokenExpires` field (Date)

**Admin Route Updates (`routes/admin.js`)**
- Updated `POST /api/admin/usuarios/add` to accept:
  - `enviarInvitacion` (boolean) - whether to send invitation email
  - `permisosFabricantes` (array) - list of fabricante IDs user has access to
- Generates activation token (32-byte hex string, valid for 7 days)
- Sends email with user credentials and fabricante list
- Returns success/error status for email sending

**Auth Route Updates (`routes/auth.js`)**
- Updated `POST /api/auth/login` to:
  - Check for activation token on first login
  - Automatically activate user (change status from 'Invitado' to 'Activo')
  - Clear activation token after use
- Added `GET /api/auth/activate/:token` endpoint
  - Validates activation token
  - Returns user email for pre-filling login form

#### Frontend Changes

**UserForm Component (`client/src/components/UserForm.js`)**
- Added multi-select dropdown for "Fabricantes Permitidos"
- Added "Enviar invitación por correo electrónico" checkbox
- Loads fabricantes list on component mount
- Sends `enviarInvitacion` and `permisosFabricantes` to backend
- Shows appropriate success/error messages

**ActivateAccount Component (`client/src/components/ActivateAccount.js`)**
- New component for handling activation links
- Validates activation token on load
- Pre-fills email address in login form
- Automatically logs in user after successful authentication
- Redirects to appropriate dashboard based on role

**App.js Updates**
- Added route `/activate/:token` for activation page
- Imported ActivateAccount component

### 3. Environment Configuration

**.env File**
- Added SMTP configuration variables:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  EMAIL_FROM=noreply@fabricantes.com
  APP_URL=http://localhost:3000
  ```

**package.json**
- Added `nodemailer` dependency

## User Flow

### Password Change Flow

1. User clicks on their profile icon
2. Profile edit modal opens
3. User clicks "Cambiar Contraseña" button
4. Two password fields appear:
   - Nueva Contraseña
   - Confirmar Nueva Contraseña
5. User enters new password twice
6. User clicks "Actualizar Contraseña"
7. Backend validates and updates password
8. Success notification shown

### Invitation Flow

1. Admin creates a new user
2. Admin selects fabricantes from multi-select dropdown
3. Admin checks "Enviar invitación por correo electrónico"
4. Admin submits form
5. Backend:
   - Creates user with activation token
   - Generates activation link
   - Sends HTML email with:
     - User credentials
     - List of assigned fabricantes
     - Activation link
6. User receives email
7. User clicks activation link
8. Activation page opens with pre-filled email
9. User enters provisional password
10. Upon login:
    - User status changes from 'Invitado' to 'Activo'
    - Activation token is cleared
    - User redirected to dashboard

## Security Features

1. **Password Hashing**: All passwords hashed with bcrypt (salt rounds: 10)
2. **Token Expiration**: Activation tokens expire after 7 days
3. **One-time Use**: Tokens cleared after first successful login
4. **Password Validation**: Minimum 6 characters, must match confirmation
5. **Authenticated Endpoints**: All password change endpoints require authentication

## Email Template Features

- **Modern Design**: Gradient header, clean layout
- **Embedded Logo**: Base64-encoded logo (no external dependencies)
- **Responsive**: Works on mobile and desktop email clients
- **Branded**: Professional appearance with company colors
- **Informative**: Includes all necessary information for activation
- **Secure**: Unique activation link per user

## Configuration Required

To use the email feature, update `.env` with:

1. **SMTP_HOST**: Your SMTP server (e.g., smtp.gmail.com)
2. **SMTP_PORT**: Usually 587 for TLS
3. **SMTP_SECURE**: Set to 'false' for TLS, 'true' for SSL
4. **SMTP_USER**: Your email address
5. **SMTP_PASS**: App-specific password (for Gmail, create in Google Account settings)
6. **EMAIL_FROM**: Sender email address
7. **APP_URL**: Your application URL (for activation links)

## Screenshots

### Admin Panel - User Management
![Admin Panel Users View](https://github.com/user-attachments/assets/4fe16807-cf2d-4324-a729-db34d30506ec)

### Profile Edit with Change Password Button
![Profile Edit Modal](https://github.com/user-attachments/assets/456522b7-e58d-43cc-ac08-f593bfe9a485)

### Password Change Fields
![Password Change Fields](https://github.com/user-attachments/assets/cd0dff05-daaf-4fd2-8000-8c18a8a424c7)

## Testing Notes

- Backend server starts successfully
- Client builds without errors
- All syntax checks pass
- Password change UI integrates seamlessly with existing profile modal
- Email service is ready for configuration

## Next Steps for Deployment

1. Configure SMTP credentials in production `.env`
2. Test email delivery with real SMTP server
3. Verify activation links work in production environment
4. Test complete user invitation flow
5. Monitor email delivery logs
