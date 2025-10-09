# ID Pieza Logic Flow

## Before the Fix

```
User Input (Frontend)
    ↓
    idPieza = "MANUAL01"
    ↓
Request Sent to Backend
    ↓
Backend POST /piezas/add
    ↓
    IGNORES idPieza from request ❌
    ↓
new Pieza({
    nombre: "Bateria",
    productos: [...],
    // idPieza NOT provided
})
    ↓
MongoDB Schema Default
    ↓
    default: generateRandomId()
    ↓
Result: "AB12CD34" (auto-generated) ❌
```

## After the Fix

```
User Input (Frontend)
    ↓
    Case 1: idPieza = ""          Case 2: idPieza = "MANUAL01"
         ↓                                  ↓
Request Sent to Backend              Request Sent to Backend
         ↓                                  ↓
Backend POST /piezas/add             Backend POST /piezas/add
         ↓                                  ↓
Extract idPieza from body            Extract idPieza from body
         ↓                                  ↓
Check: empty or whitespace?          Check: empty or whitespace?
         ↓ YES                              ↓ NO
Generate unique ID                   Validate uniqueness
         ↓                                  ↓
finalIdPieza = "AB12CD34"           Check if "MANUAL01" exists
         ↓                                  ↓
new Pieza({                         If exists: ERROR ❌
    idPieza: "AB12CD34",            If not exists: ✓
    nombre: "Bateria",                      ↓
    productos: [...]                new Pieza({
})                                      idPieza: "MANUAL01",
         ↓                                  nombre: "Bateria",
Result: "AB12CD34" ✓                        productos: [...]
                                        })
                                            ↓
                                    Result: "MANUAL01" ✓
```

## Key Changes Summary

| Component | What Changed | Why |
|-----------|--------------|-----|
| **Model** | Removed `default: generateRandomId` | Prevents automatic generation at DB level |
| **Backend Route** | Added `idPieza` parameter extraction | Now accepts manual IDs from frontend |
| **Backend Route** | Added conditional logic | Generates ID only when empty/whitespace |
| **Backend Route** | Added uniqueness validation | Prevents duplicate manual IDs |
| **Frontend** | Included `idPieza` in request | Ensures user input is sent to backend |

## Testing Scenarios

### ✅ Scenario 1: Empty ID Field
- **Input:** User leaves idPieza field empty
- **Expected:** Auto-generated ID (e.g., "AB12CD34")
- **Actual:** Auto-generated ID ✓

### ✅ Scenario 2: Use "Generar ID" Button
- **Input:** User clicks "Generar ID", sees "XY98ZW76"
- **Expected:** Saves "XY98ZW76"
- **Actual:** Saves "XY98ZW76" ✓

### ✅ Scenario 3: Manual ID Entry
- **Input:** User types "CUSTOM01"
- **Expected:** Saves "CUSTOM01"
- **Actual:** Saves "CUSTOM01" ✓

### ✅ Scenario 4: Duplicate Manual ID
- **Input:** User types "ABC123" (already exists)
- **Expected:** Error message, no save
- **Actual:** "El ID de pieza ya existe. Por favor, ingrese un ID único." ✓

### ✅ Scenario 5: Whitespace Only
- **Input:** User types "   " (only spaces)
- **Expected:** Treated as empty, auto-generates ID
- **Actual:** Auto-generated ID ✓
