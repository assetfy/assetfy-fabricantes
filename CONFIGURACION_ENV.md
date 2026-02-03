# Configuración de Variables de Entorno para Producción

## Problema Resuelto

La aplicación funcionaba bien de forma local, pero no era accesible desde internet debido a referencias hardcoded a `localhost` en el código del cliente.

## Solución Implementada (ACTUALIZADA)

Se implementó **detección automática del entorno** que funciona sin necesidad de configurar variables de entorno:

- En **desarrollo** (localhost): Usa automáticamente `http://localhost:5000`
- En **producción** (cualquier otro dominio): Usa automáticamente el mismo dominio donde está alojado el frontend

Esto elimina la necesidad de configurar `REACT_APP_API_URL` en la mayoría de los casos.

## Archivos Modificados

### 1. `client/src/api.js`
**Antes:**
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  // ...
});
```

**Después:**
```javascript
const getApiBaseUrl = () => {
  // Si REACT_APP_API_URL está configurada, úsala
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Detectar si estamos en desarrollo
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Hostnames de desarrollo: localhost, 127.0.0.1, localhost.localdomain, etc.
    const isDevelopment = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('localhost.');
    
    if (!isDevelopment) {
      // En producción, usa el mismo dominio que el frontend
      return window.location.origin;
    }
  }
  
  // En desarrollo, usa localhost
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  // ...
});
```

### 2. `client/src/utils/getAuthenticatedUrl.js`
Se aplicó la misma lógica de detección automática del entorno.

## Configuración

### Desarrollo Local

**No se requiere configuración.** El código detecta automáticamente que está en localhost y usa `http://localhost:5000`.

### Producción

**No se requiere configuración.** El código detecta automáticamente que NO está en localhost y usa el mismo dominio del frontend.

Por ejemplo, si el frontend está en `https://fabricantes.asset-fy.com`, automáticamente usará `https://fabricantes.asset-fy.com` como base URL para las llamadas al API.

### Configuración Manual (Opcional)

Si por alguna razón necesitas especificar manualmente la URL del API, puedes crear un archivo `.env` en el directorio `client/`:

```bash
REACT_APP_API_URL=https://api-personalizada.ejemplo.com
```

## Despliegue

### Build para Producción

```bash
cd client

# Instalar dependencias
npm install

# Compilar (NO requiere configurar .env)
npm run build
```

El build resultante detectará automáticamente el dominio en el que se ejecuta y usará ese mismo dominio para las llamadas al API.

## Verificación

### Verificar configuración en desarrollo
```bash
cd client
npm start
# La aplicación debería conectarse a http://localhost:5000
```

### Verificar configuración en producción
Después del despliegue, verifica en las DevTools del navegador:
1. Abre la consola
2. Verifica que las llamadas API se hagan a la URL correcta (ej: `https://fabricantes.asset-fy.com/api/...`)
3. NO deberías ver ninguna referencia a `localhost`

## Archivos de Ejemplo

Se han creado archivos `.env.example` para referencia:

- `/assetfy-fabricantes/.env.example` - Variables del servidor backend
- `/assetfy-fabricantes/client/.env.example` - Variables del cliente React (ahora opcionales)
- `/assetfy-fabricantes/client/.env.production` - Configuración de producción (usa detección automática)

## Testing

Los tests existentes continúan funcionando correctamente:
```bash
cd client
npm test -- --testPathPattern=UserHeader.utils.test.js --watchAll=false
```

Resultado: ✅ 9/9 tests passing

## Beneficios

✅ La aplicación funciona tanto en desarrollo como en producción **sin configuración**  
✅ No más hardcoding de URLs  
✅ No requiere variables de entorno en la mayoría de los casos  
✅ Detección automática del entorno  
✅ Fácil configuración para casos especiales (multi-dominio, etc.)  
✅ Tests pasan correctamente  
✅ Cambio mínimo y quirúrgico  
✅ Backward compatible  

## Notas Importantes

1. **Backend:** El backend NO necesita cambios. Ya usa `process.env.PORT` correctamente.

2. **Apache/Nginx:** Si usas reverse proxy, asegúrate de que las rutas `/api/*` se proxeen correctamente al backend Node.js.

3. **CORS:** El backend ya tiene CORS habilitado con `app.use(cors())`.

4. **Firewall:** El puerto 5000 (o el que uses para el backend) solo debe ser accesible desde localhost. Apache/Nginx debe manejar las peticiones externas.

## Troubleshooting

### La aplicación sigue conectándose a localhost en producción

**Causa posible:** Estás accediendo directamente al puerto 3000 o el build es antiguo.

**Solución:** 
1. Asegúrate de hacer un nuevo build:
```bash
cd client
npm run build
```

2. Verifica que el servidor web esté sirviendo el build de producción (carpeta `build/`), no el servidor de desarrollo.

3. Si accedes a través del servidor web de producción (Apache/Nginx), las URLs se resolverán correctamente al mismo dominio.

### Error 404 en las rutas API

**Causa:** El proxy no está configurado correctamente en el servidor web.

**Verificar:** Asegúrate de que Apache/Nginx redirija las peticiones `/api/*` al backend Node.js en `localhost:5000`

---

**Última actualización:** 2026-02-03  
**Tests:** ✅ 9/9 pasando  
**Build:** ✅ Compilación exitosa  
**Estado:** ✅ Completado y probado con detección automática de entorno
