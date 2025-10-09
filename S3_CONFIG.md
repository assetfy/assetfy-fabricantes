# Fabricantes - S3 Configuration Guide

Este documento describe cómo configurar y solucionar problemas con la subida de archivos a AWS S3.

## Problema Identificado

La aplicación falla al subir archivos con errores del servidor porque la configuración de S3 no está correctamente establecida.

## Configuración Requerida

### 1. Variables de Entorno

Asegúrate de que tu archivo `.env` contenga todas las variables requeridas:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=tu_access_key_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_key_aqui
AWS_REGION=us-east-1
S3_BUCKET_NAME=tu_bucket_name
```

### 2. Crear Bucket S3

Si el bucket no existe, créalo en la consola de AWS:

1. Ve a AWS Console → S3
2. Haz clic en "Create bucket"
3. Nombre del bucket: `asset-fabricantes` (o el nombre que prefieras)
4. Región: `us-east-1` (o tu región preferida)
5. Mantén "Block public access" habilitado
6. Habilita "Versioning" (recomendado)

### 3. Configurar Permisos IAM

Tu usuario IAM necesita estos permisos:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::asset-fabricantes/*"
        },
        {
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::asset-fabricantes"
        }
    ]
}
```

## Probar la Configuración

### Opción 1: Script de Prueba
Ejecuta el script de prueba incluido:

```bash
node test-s3-config.js
```

Este script te mostrará exactamente qué está fallando y cómo solucionarlo.

### Opción 2: Verificar Logs del Servidor
Al iniciar el servidor, verás mensajes que indican si S3 está configurado correctamente:

```bash
npm start
```

Busca estos mensajes:
- ✅ S3 bucket connection successful (todo funciona)
- ❌ S3 bucket test failed (hay problemas)

## Errores Comunes y Soluciones

### Error: "Bucket does not exist"
**Causa**: El bucket especificado no existe.
**Solución**: 
- Crear el bucket en AWS Console
- O cambiar `S3_BUCKET_NAME` a un bucket existente

### Error: "Access denied"
**Causa**: Las credenciales no tienen permisos.
**Solución**: 
- Verificar que las credenciales sean correctas
- Asegurar que el usuario IAM tenga los permisos necesarios

### Error: "Invalid region"
**Causa**: La región especificada no es válida o no está disponible.
**Solución**: 
- Cambiar `AWS_REGION` a una región válida como `us-east-1`
- Verificar que el bucket esté en la región especificada

### Error: "Invalid credentials"
**Causa**: Las credenciales AWS son incorrectas.
**Solución**: 
- Verificar `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`
- Generar nuevas credenciales en AWS Console si es necesario

## Estructura de Archivos en S3

Los archivos se organizan en S3 con esta estructura:
```
bucket-name/
  manuales/
    marca_nombre/
      modelo_nombre/
        timestamp-filename.pdf
        timestamp-filename.jpg
        ...
```

## Funcionalidades Implementadas

- ✅ Subida de múltiples archivos (máximo 5)
- ✅ Validación de tipos de archivo (PDF, DOC, DOCX, TXT, JPG, JPEG, PNG)
- ✅ Límite de tamaño por archivo (10MB)
- ✅ Organización automática por marca y modelo
- ✅ Eliminación de archivos
- ✅ Manejo de errores mejorado
- ✅ Logs informativos para debugging

## Soporte

Si continúas teniendo problemas:

1. Ejecuta `node test-s3-config.js` para diagnosticar el problema
2. Revisa los logs del servidor para errores específicos
3. Verifica que todas las variables de entorno estén configuradas
4. Confirma que el bucket y las credenciales AWS sean válidos