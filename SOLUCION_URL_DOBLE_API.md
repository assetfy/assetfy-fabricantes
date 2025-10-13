# Solución al Problema de URLs Duplicadas (/api/api/)

## 🎯 Problema Reportado

Las URLs generadas tenían un prefijo `/api/` duplicado, causando errores 404:

```
❌ URL incorrecta (ANTES):
https://fabricantes.asset-fy.com/api/api/apoderado/files/SW1hZ2VuUHJpbmNpcGFsL1N0aWhsL1JFXzkvMTc1ODgxNTg4MDAwNC1SRV85MC5qcGc=?token=...
                                  ^^^^^^^^ DOBLE /api/api/
```

## 🔍 Causa Raíz

El archivo `client/src/utils/getAuthenticatedUrl.js` tenía configurado:

```javascript
const DEFAULT_API_BASE = 'https://fabricantes.asset-fy.com/api';  // ❌ Incluía /api al final
```

Cuando el backend generaba URLs como `/api/apoderado/files/...`, la concatenación resultaba en:
```
'https://fabricantes.asset-fy.com/api' + '/api/apoderado/files/...'
= 'https://fabricantes.asset-fy.com/api/api/apoderado/files/...'  ❌
```

## ✅ Solución Implementada

Cambio realizado en `client/src/utils/getAuthenticatedUrl.js`:

```javascript
// ANTES
const DEFAULT_API_BASE = 'https://fabricantes.asset-fy.com/api';

// DESPUÉS
const DEFAULT_API_BASE = 'https://fabricantes.asset-fy.com';  // ✅ Sin /api al final
```

## 📊 Resultado

Ahora las URLs se generan correctamente:

```
✅ URL correcta (DESPUÉS):
https://fabricantes.asset-fy.com/api/apoderado/files/SW1hZ2VuUHJpbmNpcGFsL1N0aWhsL1JFXzkvMTc1ODgxNTg4MDAwNC1SRV85MC5qcGc=?token=...
                                  ^^^^ UN SOLO /api/
```

## 🧪 Validación

### Tests Automatizados
- ✅ 9/9 tests pasando en `UserHeader.utils.test.js`
- ✅ Build de producción exitoso
- ✅ Todas las rutas API probadas y funcionando

### Ejemplos de URLs Corregidas

| Tipo de URL | Resultado |
|------------|-----------|
| Archivos de apoderado | `https://fabricantes.asset-fy.com/api/apoderado/files/...` ✅ |
| Login | `https://fabricantes.asset-fy.com/api/auth/login` ✅ |
| Admin | `https://fabricantes.asset-fy.com/api/admin/fabricantes` ✅ |
| Health check | `https://fabricantes.asset-fy.com/api/health` ✅ |
| Usuario bienes | `https://fabricantes.asset-fy.com/api/usuario/bienes` ✅ |
| Public | `https://fabricantes.asset-fy.com/api/public/info` ✅ |

## 🎨 Componentes Beneficiados

El fix corrige las URLs en todos estos componentes:
- `UserHeader.js` - Imagen de perfil
- `ProfileEditModal.js` - Edición de perfil
- `PiezaEditForm.js` - Imágenes de piezas
- `MarcaEditForm.js` - Logos de marcas
- `ProductEditForm.js` - Imágenes de productos
- `BienList.js` - Lista de bienes
- `MarcaList.js` - Lista de marcas
- `MultimediaForm.js` - Imágenes, videos y manuales
- `PiezaList.js` - Lista de piezas
- `BienViewForm.js` - Vista de bienes
- `ProductList.js` - Lista de productos

## ⚙️ Variables de Entorno

Si necesitas configurar una URL diferente, usa la variable `REACT_APP_API_URL`:

```bash
# ✅ Correcto (sin /api al final)
REACT_APP_API_URL=https://fabricantes.asset-fy.com

# ❌ Incorrecto (con /api al final - causaría el error de nuevo)
REACT_APP_API_URL=https://fabricantes.asset-fy.com/api
```

### Ejemplos de Configuración

```bash
# Producción (por defecto, no necesita configurarse)
REACT_APP_API_URL=https://fabricantes.asset-fy.com

# Desarrollo local
REACT_APP_API_URL=http://localhost:5000

# Staging
REACT_APP_API_URL=https://staging.fabricantes.asset-fy.com
```

## 📦 Archivos Modificados

1. **`client/src/utils/getAuthenticatedUrl.js`**
   - Línea 1: Cambiado `DEFAULT_API_BASE` para remover `/api`
   - Actualizado comentario para mayor claridad

## 🚀 Despliegue

Para aplicar el fix en producción:

```bash
# 1. Construir el cliente
cd client
npm install
npm run build

# 2. Copiar el build al servidor
# (seguir procedimiento normal de deployment)

# 3. Reiniciar el servidor
pm2 restart fabricantes-app
```

## ✨ Impacto

- ✅ **Imágenes de productos**: Ahora se cargan correctamente
- ✅ **Logos de marcas**: Ahora se visualizan sin error
- ✅ **Archivos multimedia**: Videos y manuales accesibles
- ✅ **Imágenes de perfil**: Se muestran correctamente
- ✅ **Todas las rutas API**: Funcionan sin el error de doble prefijo

## 🔒 Compatibilidad

- ✅ Compatible con el backend actual
- ✅ Compatible con el proxy de desarrollo
- ✅ Compatible con el deployment de producción
- ✅ No requiere cambios en otros componentes
- ✅ Backward compatible con configuración existente

## 📝 Notas Técnicas

El fix es quirúrgico y mínimo:
- **1 línea de código modificada**
- **0 breaking changes**
- **9/9 tests pasando**
- **Build exitoso**
- **No se modificó ninguna otra funcionalidad**

---

**Fecha de implementación**: 2025-10-13  
**Versión**: Fix aplicado en branch `copilot/fix-double-api-url`  
**Estado**: ✅ Completado y probado
