# Guía de Despliegue en Producción - Apache + Node.js

## Problema Resuelto

Cuando se desplegaba la aplicación en producción con Apache httpd, las rutas de API (como `/api/auth/login`) devolvían HTML en lugar de respuestas JSON. Esto causaba errores de autenticación y otras funcionalidades.

## Solución Implementada

### 1. Cambios en el Backend (server.js)

Se reorganizó el orden de los middlewares y se configuró `express.static()` para que **nunca** maneje rutas API:

```javascript
// ✅ CORRECTO: Middleware que protege las rutas /api/* antes del static
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next(); // Pasar a las rutas API o al 404 JSON
  }
  next(); // Continuar al middleware estático
});

// ✅ CORRECTO: Static con index: false
app.use(express.static(buildPath, {
  index: false,      // No servir index.html automáticamente
  fallthrough: true  // Continuar si el archivo no existe
}));

// ✅ CORRECTO: Catch-all con doble verificación
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});
```

### 2. Cambios en el Frontend (client/src/api.js)

Se cambió de URL absoluta a URL relativa:

```javascript
// ❌ ANTES: Hardcoded para producción
const api = axios.create({
  baseURL: 'https://fabricantes.asset-fy.com/api',
  // ...
});

// ✅ AHORA: Relativa, funciona en todos los entornos
const api = axios.create({
  baseURL: '/api',
  // ...
});
```

### 3. Configuración de Proxy para Desarrollo (client/package.json)

Se agregó proxy para que funcione en modo desarrollo:

```json
{
  "proxy": "http://localhost:5000"
}
```

## Configuración de Apache

### Arquitectura Recomendada

```
Internet → Apache (Puerto 80/443) → Node.js Backend (Puerto 5000)
                   ↓
            Static files (build/)
```

### Opción A: Apache como Reverse Proxy (RECOMENDADO)

Esta es la configuración más robusta y recomendada:

**Archivo: `/etc/apache2/sites-available/fabricantes.asset-fy.com.conf`**

```apache
<VirtualHost *:80>
    ServerName fabricantes.asset-fy.com
    ServerAdmin admin@asset-fy.com

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/fabricantes-error.log
    CustomLog ${APACHE_LOG_DIR}/fabricantes-access.log combined

    # Módulos requeridos: proxy proxy_http
    # Habilitar con: a2enmod proxy proxy_http

    # Proxy para rutas API - IMPORTANTE: debe ir PRIMERO
    ProxyPreserveHost On
    ProxyPass /api http://localhost:5000/api
    ProxyPassReverse /api http://localhost:5000/api

    # Servir archivos estáticos del build
    DocumentRoot /ruta/a/assetfy-fabricantes/build
    
    <Directory /ruta/a/assetfy-fabricantes/build>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
        
        # React Router: redirigir todas las rutas no-API al index.html
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/api
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### Opción B: Apache solo como Reverse Proxy

Si prefieres que Node.js maneje todo (API + static):

```apache
<VirtualHost *:80>
    ServerName fabricantes.asset-fy.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
</VirtualHost>
```

### Habilitar configuración Apache

```bash
# Habilitar módulos necesarios
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite

# Habilitar el sitio
sudo a2ensite fabricantes.asset-fy.com.conf

# Verificar configuración
sudo apache2ctl configtest

# Reiniciar Apache
sudo systemctl restart apache2
```

## Configuración de SSL con Let's Encrypt

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-apache

# Obtener certificado
sudo certbot --apache -d fabricantes.asset-fy.com

# Certbot configurará automáticamente el redirect de HTTP a HTTPS
```

## Despliegue del Backend Node.js

### 1. Instalar Dependencias

```bash
cd /ruta/a/assetfy-fabricantes
npm install --production
```

### 2. Configurar Variables de Entorno

**Archivo: `.env`**

```bash
# Base de datos
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database

# JWT
JWT_SECRET=tu_secret_key_muy_seguro

# Puerto
PORT=5000

# AWS S3 (si aplica)
S3_BUCKET_NAME=tu-bucket
AWS_ACCESS_KEY_ID=tu-key
AWS_SECRET_ACCESS_KEY=tu-secret
AWS_REGION=us-east-1

# Email (si aplica)
EMAIL_USER=tu-email@dominio.com
EMAIL_PASS=tu-password
```

### 3. Usar PM2 para mantener el servidor activo

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar la aplicación
pm2 start server.js --name fabricantes-api

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup

# Monitorear
pm2 logs fabricantes-api
pm2 status
```

### 4. Configurar Firewall

```bash
# Permitir solo Apache (puertos 80/443)
sudo ufw allow 'Apache Full'

# Bloquear acceso directo al puerto 5000 desde internet
sudo ufw deny 5000

# El puerto 5000 solo debe ser accesible desde localhost
```

## Build del Frontend

### 1. Instalar dependencias del cliente

```bash
cd client
npm install
```

### 2. Compilar para producción

```bash
npm run build
```

Esto creará el directorio `build/` con la aplicación optimizada.

### 3. Copiar build al directorio raíz (si no está allí)

```bash
cd ..
# El build debe estar en /ruta/a/assetfy-fabricantes/build
# Si está en client/build, copiarlo:
# cp -r client/build .
```

## Verificación del Despliegue

### 1. Verificar que Node.js esté corriendo

```bash
pm2 status
curl http://localhost:5000/api/health
# Debe devolver: {"status":"ok","timestamp":"...","upload_system":"..."}
```

### 2. Verificar rutas API desde Apache

```bash
curl -X GET https://fabricantes.asset-fy.com/api/health
# Debe devolver JSON, NO HTML
```

### 3. Verificar login

```bash
curl -X POST https://fabricantes.asset-fy.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correoElectronico":"test@test.com","contrasena":"password"}'
# Debe devolver JSON con token o error, NO HTML
```

### 4. Verificar frontend

Abrir en navegador: https://fabricantes.asset-fy.com
- Debe cargar la aplicación React
- Debe poder hacer login
- La consola del navegador NO debe mostrar errores

## Troubleshooting

### Problema: "API route not found" en producción

**Causa**: Apache no está proxying las rutas API correctamente

**Solución**: 
1. Verificar que los módulos proxy estén habilitados: `sudo a2enmod proxy proxy_http`
2. Verificar la configuración: `sudo apache2ctl configtest`
3. Reiniciar Apache: `sudo systemctl restart apache2`

### Problema: APIs devuelven HTML

**Causa**: Apache está sirviendo index.html para todas las rutas

**Solución**:
1. Asegurarse de que la directiva `ProxyPass /api` esté ANTES de `DocumentRoot`
2. Verificar que el RewriteCond excluya `/api`: `RewriteCond %{REQUEST_URI} !^/api`

### Problema: CORS errors

**Causa**: Node.js backend no está configurado correctamente para CORS

**Solución**: El backend ya tiene `app.use(cors())`, pero si persiste:
```javascript
app.use(cors({
  origin: 'https://fabricantes.asset-fy.com',
  credentials: true
}));
```

### Problema: "502 Bad Gateway"

**Causa**: Apache no puede conectarse al backend Node.js

**Solución**:
1. Verificar que Node.js esté corriendo: `pm2 status`
2. Verificar puerto: `sudo netstat -tlnp | grep 5000`
3. Verificar logs: `pm2 logs fabricantes-api`

### Problema: Cambios no se reflejan

**Solución**:
1. Recompilar frontend: `cd client && npm run build`
2. Reiniciar backend: `pm2 restart fabricantes-api`
3. Limpiar caché del navegador: Ctrl+Shift+R

## Checklist de Despliegue

- [ ] Backend Node.js instalado y corriendo con PM2
- [ ] Variables de entorno configuradas en `.env`
- [ ] Frontend compilado (`npm run build`)
- [ ] Apache configurado con proxy para `/api`
- [ ] Módulos Apache habilitados (proxy, proxy_http, rewrite)
- [ ] SSL/HTTPS configurado con Let's Encrypt
- [ ] Firewall configurado (puerto 5000 bloqueado desde internet)
- [ ] Pruebas de API funcionando (devuelven JSON)
- [ ] Frontend carga correctamente
- [ ] Login funciona

## Mantenimiento

### Actualizar código

```bash
# En el servidor
cd /ruta/a/assetfy-fabricantes
git pull origin main

# Reinstalar dependencias si cambió package.json
npm install --production

# Recompilar frontend
cd client
npm install
npm run build
cd ..

# Reiniciar backend
pm2 restart fabricantes-api
```

### Ver logs

```bash
# Logs del backend
pm2 logs fabricantes-api

# Logs de Apache
sudo tail -f /var/log/apache2/fabricantes-error.log
sudo tail -f /var/log/apache2/fabricantes-access.log
```

### Monitoreo

```bash
# Estado del backend
pm2 status
pm2 monit

# Estado de Apache
sudo systemctl status apache2
```
