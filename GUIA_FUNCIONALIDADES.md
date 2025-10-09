# Guía de Funcionalidades: Cambio de Contraseña e Invitaciones por Email

## Resumen

Se han implementado dos funcionalidades principales:

### 1. Cambio de Contraseña desde el Perfil

**Ubicación**: Perfil de Usuario (icono de usuario en la esquina superior derecha)

**Cómo usar**:
1. Hacer clic en el icono de perfil
2. Hacer clic en el botón "Cambiar Contraseña"
3. Ingresar la nueva contraseña dos veces
4. Hacer clic en "Actualizar Contraseña"

**Validaciones**:
- Las contraseñas deben coincidir
- Mínimo 6 caracteres
- Campos obligatorios

### 2. Sistema de Invitaciones por Email

**Ubicación**: Panel de Administrador > Usuarios > Crear Usuario

**Cómo crear un usuario con invitación**:
1. Completar el formulario de usuario (nombre, CUIL, email, contraseña, etc.)
2. Seleccionar los fabricantes a los que tendrá acceso (mantener Ctrl/Cmd para seleccionar múltiples)
3. Marcar el checkbox "Enviar invitación por correo electrónico"
4. Hacer clic en "Crear Usuario"

**Qué sucede**:
- Se crea el usuario con estado "Invitado"
- Se genera un token de activación válido por 7 días
- Se envía un email al usuario con:
  - Su correo electrónico (usuario)
  - Su contraseña provisional
  - Lista de fabricantes asignados
  - Link de activación
  - Logo de la aplicación
  - Diseño moderno y profesional

**Proceso de activación para el usuario**:
1. El usuario recibe el email
2. Hace clic en el botón "Activar Cuenta"
3. Se abre la página de activación con el email pre-cargado
4. Ingresa su contraseña provisional
5. Al iniciar sesión:
   - Su cuenta se activa automáticamente (estado cambia de "Invitado" a "Activo")
   - Se elimina el token de activación
   - Es redirigido a su panel correspondiente

## Configuración Necesaria

### Variables de Entorno (.env)

Para que el sistema de emails funcione, debes actualizar el archivo `.env` con tus credenciales SMTP:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicación
EMAIL_FROM=noreply@fabricantes.com
APP_URL=http://localhost:3000
```

### Configuración para Gmail

Si usas Gmail:

1. Ve a tu cuenta de Google
2. Seguridad > Verificación en dos pasos (debe estar activada)
3. Busca "Contraseñas de aplicaciones"
4. Genera una nueva contraseña de aplicación
5. Usa esa contraseña en `SMTP_PASS`

**Nota**: NO uses tu contraseña real de Gmail, usa una contraseña de aplicación.

### Configuración para Google Workspace

Si usas Google Workspace (correos corporativos):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario@tudominio.com
SMTP_PASS=contraseña-de-aplicación-generada
EMAIL_FROM=noreply@tudominio.com
APP_URL=https://tu-dominio.com
```

## Diseño del Email

El email de invitación incluye:

✅ Logo de la aplicación (embebido en el email)
✅ Cabecera con gradiente moderno
✅ Datos de acceso del usuario
✅ Lista de fabricantes asignados con diseño claro
✅ Botón de activación destacado
✅ Nota de seguridad recomendando cambiar la contraseña
✅ Footer profesional con copyright

## Seguridad

- ✅ Todas las contraseñas se encriptan con bcrypt
- ✅ Los tokens de activación expiran en 7 días
- ✅ Los tokens se usan una sola vez (se eliminan al activar)
- ✅ Validación de contraseñas (mínimo 6 caracteres, deben coincidir)
- ✅ Endpoints protegidos con autenticación

## Dependencias Instaladas

- `nodemailer` - Para envío de emails

## Archivos Modificados/Creados

### Backend
- `utils/emailService.js` - Servicio de emails (NUEVO)
- `models/usuario.model.js` - Agregados campos de activación
- `routes/admin.js` - Endpoints de cambio de contraseña y creación con invitación
- `routes/apoderado.js` - Endpoint de cambio de contraseña
- `routes/auth.js` - Endpoint de activación y login actualizado
- `.env` - Variables de configuración SMTP

### Frontend
- `client/src/components/ProfileEditModal.js` - UI de cambio de contraseña
- `client/src/components/UserForm.js` - Checkbox de invitación y selector de fabricantes
- `client/src/components/ActivateAccount.js` - Página de activación (NUEVO)
- `client/src/App.js` - Ruta de activación

### Documentación
- `PASSWORD_AND_EMAIL_FEATURES.md` - Documentación técnica completa

## Pruebas Realizadas

✅ Backend compila sin errores
✅ Frontend compila sin errores
✅ Todos los archivos pasan validación de sintaxis
✅ UI integrada correctamente en el modal de perfil
✅ Servicio de email configurado y listo para usar

## Próximos Pasos

1. Actualizar las credenciales SMTP en `.env` con tus datos reales
2. Probar el envío de emails con un servidor SMTP real
3. Verificar que los links de activación funcionen en tu entorno
4. Probar el flujo completo de invitación de usuarios
