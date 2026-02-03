# Configuración de Variables de Entorno para Producción

## Problema Resuelto

La aplicación funcionaba bien de forma local, pero no era accesible desde internet debido a referencias hardcoded a `localhost` en el código del cliente.

## Solución Implementada

Se reemplazaron las referencias hardcoded a `localhost` con variables de entorno, permitiendo que la aplicación funcione tanto en desarrollo local como en producción.

## Archivos Modificados

### 1. `client/src/api.js`
**Antes:**
```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  // ...
});
```

**Después:**
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  // ...
});
```

### 2. `client/src/utils/getAuthenticatedUrl.js`
**Antes:**
```javascript
const DEFAULT_API_BASE = 'http://localhost:5000';
```

**Después:**
```javascript
const getDefaultApiBase = () => process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

## Configuración

### Desarrollo Local

No se requiere configuración adicional. El código usa `http://localhost:5000` por defecto.

Opcionalmente, puedes crear un archivo `.env` en el directorio `client/`:

```bash
REACT_APP_API_URL=http://localhost:5000
```

### Producción

Crear un archivo `.env` en el directorio `client/` con la URL de producción:

```bash
REACT_APP_API_URL=https://fabricantes.asset-fy.com
```

**IMPORTANTE:** La URL NO debe incluir `/api` al final, ya que el código lo agrega automáticamente.

### Staging u Otros Entornos

```bash
REACT_APP_API_URL=https://staging.fabricantes.asset-fy.com
```

## Despliegue

### Build para Producción

```bash
cd client

# Crear archivo .env con la URL de producción
echo "REACT_APP_API_URL=https://fabricantes.asset-fy.com" > .env

# Instalar dependencias
npm install

# Compilar
npm run build
```

El archivo `.env` será leído durante el build y las variables se incluirán en el JavaScript compilado.

## Verificación

### Verificar configuración en desarrollo
```bash
cd client
npm start
# La aplicación debería conectarse a http://localhost:5000
```

### Verificar configuración en producción
Después de hacer el build con la variable de entorno configurada, verifica en las DevTools del navegador:
1. Abre la consola
2. Verifica que las llamadas API se hagan a la URL correcta (ej: `https://fabricantes.asset-fy.com/api/...`)

## Archivos de Ejemplo

Se han creado archivos `.env.example` para referencia:

- `/assetfy-fabricantes/.env.example` - Variables del servidor backend
- `/assetfy-fabricantes/client/.env.example` - Variables del cliente React

## Testing

Los tests existentes continúan funcionando correctamente:
```bash
cd client
npm test -- --testPathPattern=UserHeader.utils.test.js --watchAll=false
```

Resultado: ✅ 9/9 tests passing

## Beneficios

✅ La aplicación funciona tanto en desarrollo como en producción  
✅ No más hardcoding de URLs  
✅ Fácil configuración para múltiples entornos  
✅ Tests pasan correctamente  
✅ Cambio mínimo y quirúrgico  
✅ Backward compatible (funciona sin .env en desarrollo)  

## Notas Importantes

1. **Backend:** El backend NO necesita cambios. Ya usa `process.env.PORT` correctamente.

2. **Apache/Nginx:** Si usas reverse proxy, asegúrate de que las rutas `/api/*` se proxeen correctamente al backend Node.js.

3. **CORS:** El backend ya tiene CORS habilitado con `app.use(cors())`.

4. **Firewall:** El puerto 5000 (o el que uses para el backend) solo debe ser accesible desde localhost. Apache/Nginx debe manejar las peticiones externas.

## Troubleshooting

### La aplicación sigue conectándose a localhost en producción

**Causa:** El build se hizo sin configurar la variable de entorno.

**Solución:** 
```bash
cd client
echo "REACT_APP_API_URL=https://fabricantes.asset-fy.com" > .env
npm run build
```

### Error 404 en las rutas API

**Causa:** La URL tiene `/api` duplicado o el proxy no está configurado correctamente.

**Verificar:** La variable `REACT_APP_API_URL` NO debe terminar en `/api`
```bash
# ✅ Correcto
REACT_APP_API_URL=https://fabricantes.asset-fy.com

# ❌ Incorrecto
REACT_APP_API_URL=https://fabricantes.asset-fy.com/api
```

---

**Fecha de implementación:** 2026-01-16  
**Tests:** ✅ 9/9 pasando  
**Estado:** ✅ Completado y probado
