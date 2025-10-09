# ID Pieza Autogeneration Fix

## Problem
When creating a pieza (piece/part), even if the user manually entered an `idPieza` value in the form, the application was auto-generating a new value and saving that auto-generated value instead. The user's manual input was being ignored.

## Root Cause
1. The `idPieza` field in the Mongoose schema had `default: generateRandomId`, which meant MongoDB would auto-generate an ID whenever the field was not explicitly provided during document creation
2. The backend API route (`POST /api/apoderado/piezas/add`) was **not accepting** the `idPieza` parameter from the request body
3. The frontend was sending the `idPieza` value, but it was being ignored by the backend

## Solution

### Changes Made

#### 1. Model Update (`models/pieza.model.js`)
**Before:**
```javascript
idPieza: {
    type: String,
    unique: true,
    default: generateRandomId
}
```

**After:**
```javascript
idPieza: {
    type: String,
    unique: true,
    required: true
}
```

- Removed the `default: generateRandomId` to prevent automatic generation
- Made the field `required` so it must be explicitly provided

#### 2. Backend API Update (`routes/apoderado.js`)
**Before:**
```javascript
router.post('/piezas/add', auth, async (req, res) => {
    const { nombre, productos, atributos, garantia } = req.body;
    // ...
    const nuevaPieza = new Pieza({
        nombre,
        productos: productos || [],
        usuarioApoderado,
        atributos: atributos || [],
        garantia: garantia || null
    });
    // ...
});
```

**After:**
```javascript
router.post('/piezas/add', auth, async (req, res) => {
    const { nombre, productos, atributos, garantia, idPieza } = req.body;
    // ...
    
    // Handle idPieza: use provided value or generate a new one
    let finalIdPieza = idPieza;
    
    if (!finalIdPieza || finalIdPieza.trim() === '') {
        // Generate a unique ID if not provided
        // ... (generation logic with uniqueness check)
    } else {
        // Validate that manual ID is unique
        const existingPieza = await Pieza.findOne({ idPieza: finalIdPieza });
        if (existingPieza) {
            return res.status(400).json('El ID de pieza ya existe. Por favor, ingrese un ID único.');
        }
    }
    
    const nuevaPieza = new Pieza({
        idPieza: finalIdPieza,
        nombre,
        productos: productos || [],
        usuarioApoderado,
        atributos: atributos || [],
        garantia: garantia || null
    });
    // ...
});
```

#### 3. Frontend Update (`client/src/components/PiezaForm.js`)
**Before:**
```javascript
const dataToSend = {
    nombre: formData.nombre,
    productos: formData.productosSeleccionados,
    atributos: atributos,
    garantia: garantia?._id || null
};
```

**After:**
```javascript
const dataToSend = {
    nombre: formData.nombre,
    idPieza: formData.idPieza,  // Now included
    productos: formData.productosSeleccionados,
    atributos: atributos,
    garantia: garantia?._id || null
};
```

## Expected Behavior After Fix

### Scenario 1: User leaves ID field empty
1. User creates a new pieza
2. User does NOT enter an `idPieza` value (field is empty)
3. User clicks "Crear Pieza"
4. **Result:** System auto-generates a unique 8-character alphanumeric ID and saves it

### Scenario 2: User clicks "Generar ID" button
1. User creates a new pieza
2. User clicks "Generar ID" button
3. A unique ID is generated and populated in the field
4. User clicks "Crear Pieza"
5. **Result:** The generated ID is saved

### Scenario 3: User manually enters an ID
1. User creates a new pieza
2. User manually types an ID (e.g., "CUSTOM01")
3. User clicks "Crear Pieza"
4. **Result:** The manually entered ID "CUSTOM01" is saved

### Scenario 4: User enters a duplicate ID
1. User creates a new pieza
2. User manually types an ID that already exists (e.g., "ABC12345")
3. User clicks "Crear Pieza"
4. **Result:** Error message: "El ID de pieza ya existe. Por favor, ingrese un ID único."

## Validation

### Uniqueness Validation
- The ID must be unique **globally** across all piezas (not just per manufacturer)
- This is enforced at both the database level (unique index) and application level (explicit check)

### Empty/Whitespace Validation
- If the user submits an empty string or only whitespace, the system treats it as "no ID provided" and generates one automatically

## Testing Recommendations

To manually test this fix:

1. **Test auto-generation (empty field):**
   - Navigate to Piezas section
   - Click "Crear Pieza"
   - Fill in nombre and other fields
   - Leave idPieza field empty
   - Submit form
   - Verify a random ID was generated and saved

2. **Test "Generar ID" button:**
   - Click "Crear Pieza"
   - Click "Generar ID" button
   - Verify an ID appears in the field
   - Submit form
   - Verify that exact ID was saved

3. **Test manual ID entry:**
   - Click "Crear Pieza"
   - Manually type "MANUAL01" in idPieza field
   - Submit form
   - Verify "MANUAL01" was saved (not replaced with auto-generated ID)

4. **Test duplicate ID validation:**
   - Create a pieza with ID "TEST123"
   - Try to create another pieza with the same ID "TEST123"
   - Verify error message appears
   - Verify pieza was NOT created

5. **Test whitespace handling:**
   - Click "Crear Pieza"
   - Enter only spaces in idPieza field
   - Submit form
   - Verify an auto-generated ID was used (whitespace treated as empty)
