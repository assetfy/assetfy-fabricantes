# Usuario de Bienes - System Architecture

## User Roles Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     ASSETFY SYSTEM                          │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐     ┌──────────────┐
    │  ADMIN   │      │APODERADO │     │USUARIO_BIENES│
    └──────────┘      └──────────┘     └──────────────┘
          │                 │                 │
          │                 │                 │
          ▼                 ▼                 ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ Admin Panel  │  │Fabricantes   │  │ Bienes Panel │
  │              │  │Panel         │  │              │
  │ - Users      │  │              │  │ - Create     │
  │ - Fabricantes│  │ - Products   │  │   Assets     │
  │              │  │ - Inventory  │  │ - Register   │
  │              │  │ - Warranties │  │   Assets     │
  └──────────────┘  └──────────────┘  └──────────────┘
```

## Panel Menu Navigation

```
usuario_bienes Role:
┌──────────────────────┐
│   Hamburger Menu     │
├──────────────────────┤
│ ☰ Assetfy Bienes     │
└──────────────────────┘
         │
         └──> /usuario

apoderado Role:
┌──────────────────────┐
│   Hamburger Menu     │
├──────────────────────┤
│ ☰ Assetfy Fabricantes│
└──────────────────────┘
         │
         └──> /apoderado

admin Role (without fabricante permissions):
┌──────────────────────┐
│   Hamburger Menu     │
├──────────────────────┤
│ ☰ Assetfy Admin      │
└──────────────────────┘
         │
         └──> /admin

admin Role (with fabricante permissions):
┌──────────────────────┐
│   Hamburger Menu     │
├──────────────────────┤
│ ☰ Assetfy Fabricantes│
│ ☰ Assetfy Admin      │
└──────────────────────┘
         │
         ├──> /apoderado
         └──> /admin
```

## Bien Lifecycle

### Created Asset (Creado)
```
┌─────────────┐
│   Usuario   │
│   Bienes    │
└──────┬──────┘
       │
       │ Click "Crear Bien"
       ▼
┌─────────────────┐
│  BienForm Modal │
├─────────────────┤
│ - Nombre        │
│ - Imagen        │
│ - Comentarios   │
│ - Atributos     │
└────────┬────────┘
         │
         │ Submit
         ▼
┌─────────────────┐
│  POST /bienes/  │
│      crear      │
└────────┬────────┘
         │
         │ Save to MongoDB
         ▼
┌─────────────────────────┐
│    Bien Document        │
├─────────────────────────┤
│ tipo: "creado"          │
│ nombre: "Mi Laptop"     │
│ imagen: {...}           │
│ comentarios: "..."      │
│ atributos: [...]        │
│ usuario: ObjectId       │
└─────────────────────────┘
         │
         │ Upload Image to S3
         ▼
┌─────────────────────────┐
│  S3: bienes/            │
│  {timestamp}-image.jpg  │
└─────────────────────────┘
```

### Registered Asset (Registrado)
```
┌─────────────┐
│   Usuario   │
│   Bienes    │
└──────┬──────┘
       │
       │ Click "Registrar Bien"
       ▼
┌──────────────────────┐
│ BienRegisterForm     │
│ Step 1: Verify       │
├──────────────────────┤
│ ID Assetfy: ______   │
│ [Verificar]          │
└──────┬───────────────┘
       │
       │ POST /bienes/verificar
       ▼
┌──────────────────────┐
│ Query Inventario     │
│ by idInventario      │
└──────┬───────────────┘
       │
       ├─> Not Found ──> Error: "Artículo no encontrado"
       │
       ├─> Registered by Other User ──> Error: "Ya registrado"
       │
       └─> Available
           │
           ▼
    ┌──────────────────────┐
    │ BienRegisterForm     │
    │ Step 2: Register     │
    ├──────────────────────┤
    │ Product Details:     │
    │ - Modelo             │
    │ - Serial Number      │
    │ - Fabricante         │
    │                      │
    │ Nombre Bien: ______  │
    │ [Registrar Bien]     │
    └──────┬───────────────┘
           │
           │ POST /bienes/registrar
           ▼
    ┌──────────────────────┐
    │ Create Bien          │
    │ tipo: "registrado"   │
    │                      │
    │ Copy producto data:  │
    │ - modelo             │
    │ - descripcion        │
    │ - numeroSerie        │
    │ - garantia           │
    │ - atributos          │
    │ - imagenPrincipal    │
    │ - fabricante         │
    │ - marca              │
    └──────┬───────────────┘
           │
           │ Update Inventario
           ▼
    ┌──────────────────────┐
    │ Inventario Updated   │
    ├──────────────────────┤
    │ registrado: "Si"     │
    │ fechaRegistro: Date  │
    │ comprador:           │
    │   nombreCompleto     │
    │   correoElectronico  │
    │   telefono           │
    └──────────────────────┘
```

## Data Models

### Bien Model
```
Bien {
  nombre: String (required)
  tipo: "creado" | "registrado" (required)
  usuario: ObjectId -> Usuario (required)
  
  // For tipo: "creado"
  imagen: {
    originalName, fileName, s3Key, url, uploadDate
  }
  comentarios: String
  atributos: [{
    nombre: String,
    valor: String
  }]
  
  // For tipo: "registrado"
  inventario: ObjectId -> Inventario
  datosProducto: {
    modelo, descripcion, numeroSerie,
    garantia: ObjectId -> Garantia,
    atributos: [...],
    imagenPrincipal: {...},
    fabricante: ObjectId -> Fabricante,
    marca: ObjectId -> Marca
  }
  fechaRegistro: Date
}
```

### Usuario Model (Updated)
```
Usuario {
  nombreCompleto: String
  cuil: String (unique)
  correoElectronico: String (unique)
  contraseña: String
  telefono: String
  imagenPerfil: Mixed
  permisosFabricantes: [ObjectId -> Fabricante]
  rol: "admin" | "apoderado" | "usuario_bienes"  // UPDATED
  estadoApoderado: "Invitado" | "Activo"
  estado: "Activo" | "Desactivado"
  activationToken: String
  activationTokenExpires: Date
}
```

## Component Hierarchy

```
App
├── Login
├── AdminPanel
│   ├── UserList (displays usuario_bienes)
│   ├── UserForm (creates usuario_bienes)
│   └── UserEditForm (edits usuario_bienes)
├── ApoderadoPanel
│   └── (not accessible to usuario_bienes)
└── UsuarioPanel (NEW)
    ├── UserHeader
    ├── BienList
    │   ├── List View (table)
    │   ├── Image View (grid)
    │   ├── Search & Filters
    │   └── Pagination
    └── Modals:
        ├── BienForm (create)
        ├── BienRegisterForm (register)
        ├── BienViewForm (view)
        └── BienEditForm (edit)
```

## API Endpoints

```
Authentication:
POST   /api/auth/login
GET    /api/auth/activate/:token

Usuario Bienes:
GET    /api/usuario/perfil
PUT    /api/usuario/perfil
GET    /api/usuario/bienes
POST   /api/usuario/bienes/crear
POST   /api/usuario/bienes/verificar
POST   /api/usuario/bienes/registrar
GET    /api/usuario/bienes/:id
PUT    /api/usuario/bienes/:id
DELETE /api/usuario/bienes/:id

Admin (for managing usuario_bienes users):
GET    /api/admin/usuarios
POST   /api/admin/usuarios/add
PUT    /api/admin/usuarios/:id
DELETE /api/admin/usuarios/:id
```

## Edit Permissions

```
Bien tipo: "creado"
┌────────────────────┐
│ FULL EDIT ACCESS   │
├────────────────────┤
│ ✓ nombre           │
│ ✓ imagen           │
│ ✓ comentarios      │
│ ✓ atributos        │
└────────────────────┘

Bien tipo: "registrado"
┌────────────────────┐
│ LIMITED EDIT       │
├────────────────────┤
│ ✓ nombre           │
│ ✗ producto data    │
│   (read-only)      │
└────────────────────┘
```

## Delete Behavior

```
Delete Bien (tipo: "creado")
┌─────────────────┐
│ Delete Bien     │
│ from MongoDB    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Delete Image    │
│ from S3         │
└─────────────────┘

Delete Bien (tipo: "registrado")
┌─────────────────────────┐
│ Delete Bien             │
│ from MongoDB            │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Inventario NOT CHANGED  │
│ - registrado: "Si"      │
│ - fechaRegistro: kept   │
│ - comprador: kept       │
└─────────────────────────┘
         │
         ▼
  (User can re-register
   with same fechaRegistro)
```

## Access Control Matrix

```
┌─────────────┬───────────┬────────────┬──────────────┐
│   Action    │   Admin   │ Apoderado  │Usuario_Bienes│
├─────────────┼───────────┼────────────┼──────────────┤
│ Admin Panel │    ✓      │     ✗      │      ✗       │
│ Fabricantes │  ✓ (opt)  │     ✓      │      ✗       │
│ Bienes      │    ✗      │     ✗      │      ✓       │
│ Create User │    ✓      │     ✗      │      ✗       │
│ Manage      │    ✓      │     ✗      │      ✗       │
│   Bienes    │           │            │              │
│ Profile     │    ✓      │     ✓      │      ✓       │
└─────────────┴───────────┴────────────┴──────────────┘
```

## State Management

```
UsuarioPanel State:
┌──────────────────────┐
│ userData: {          │
│   usuario: {...}     │
│ }                    │
│ bienes: [...]        │
│ loading: bool        │
│ refreshKey: number   │
│ modals: {            │
│   create: bool       │
│   register: bool     │
│   view: object?      │
│   edit: object?      │
│ }                    │
└──────────────────────┘

BienList State:
┌──────────────────────┐
│ searchTerm: string   │
│ tipoFilter: string   │
│ viewMode: string     │
│ currentPage: number  │
│ itemsPerPage: number │
│ confirmDialog: {     │
│   isOpen: bool       │
│   itemId: string?    │
│   itemName: string?  │
│ }                    │
└──────────────────────┘
```
