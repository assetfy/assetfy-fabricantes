# Migration Instructions for Multi-Role Feature

## Important: Database Migration Required

After deploying the multi-role feature, you **MUST** run the migration script to convert existing users from the old single `rol` field to the new `roles` array field.

## Pre-Migration Checklist

Before running the migration:

1. ✅ Backup your database
2. ✅ Ensure you have database connection credentials in `.env`
3. ✅ Ensure the server is stopped (to avoid conflicts)
4. ✅ Test the migration script with `node -c migrate-roles-to-array.js`

## Running the Migration

### Step 1: Backup Database

**MongoDB Atlas:**
```bash
# Recommended: Take a snapshot through Atlas UI
# Or use mongodump:
mongodump --uri="YOUR_MONGODB_URI" --out=./backup-$(date +%Y%m%d)
```

### Step 2: Run Migration Script

```bash
# From the project root directory
node migrate-roles-to-array.js
```

### Expected Output

```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB
📊 Found 15 users to check
🔄 Migrating user: Juan Pérez (juan@example.com)
   Old rol: admin
   New roles: [admin]
🔄 Migrating user: María García (maria@example.com)
   Old rol: apoderado
   New roles: [apoderado]
...
📈 Migration Summary:
   Total users: 15
   Migrated: 15
   Already migrated: 0
   Skipped: 0

✅ Migration completed successfully!
🔌 Database connection closed
```

### Step 3: Verify Migration

After migration, verify that users can log in and see the correct panels:

1. Log in as an admin user
2. Check that they can see their panels in the hamburger menu
3. Log in as an apoderado user
4. Check that they can see the Fabricantes panel
5. Log in as a usuario_bienes user
6. Check that they can see the Bienes panel

## Post-Migration

### Creating Multi-Role Users

After migration, you can create users with multiple roles:

**Via Admin Panel:**
1. Go to Admin Panel → Usuarios
2. Click "Crear Nuevo Usuario"
3. Hold Ctrl (or Cmd on Mac) and select multiple roles
4. Click "Crear Usuario"

**Via API:**
```bash
curl -X POST http://localhost:5000/api/admin/usuarios/add \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_TOKEN" \
  -d '{
    "nombreCompleto": "Multi Role User",
    "cuil": "20-99999999-9",
    "correoElectronico": "multirol@example.com",
    "contraseña": "password123",
    "roles": ["admin", "usuario_bienes"]
  }'
```

### Editing Existing Users

You can edit existing users to add or remove roles:

1. Go to Admin Panel → Usuarios
2. Click "Editar" on the user
3. Select/deselect roles using Ctrl/Cmd + Click
4. Click "Actualizar Usuario"

## Troubleshooting

### Migration Script Fails

**Error: Cannot connect to database**
- Verify `.env` file has correct `MONGODB_URI`
- Check network connectivity
- Ensure MongoDB Atlas IP whitelist includes your IP

**Error: Some users not migrated**
- Check the script output for details
- Verify users have a valid `rol` field
- Run the script again (it's safe to run multiple times)

### Users Cannot Log In After Migration

**Check localStorage:**
- Clear browser localStorage
- Have users log out and log back in
- This will refresh their tokens with new roles array

**Check Database:**
```javascript
// Connect to MongoDB and check a user
db.usuarios.findOne({ correoElectronico: "user@example.com" })
// Should have: roles: ['admin'] or similar
```

### Users Don't See Multiple Panels

**Check User Roles:**
1. Go to Admin Panel → Usuarios
2. Find the user
3. Verify they have multiple roles assigned
4. Edit the user if needed

**Check Browser:**
1. Clear browser cache and localStorage
2. Log out and log back in
3. Check developer console for errors

## Rollback (Emergency Only)

If you need to rollback the migration:

1. Restore database from backup
2. Revert code to previous commit
3. Restart server

**Note:** New users created with multiple roles after migration cannot be rolled back easily.

## Safe Migration Tips

1. **Test First:** Run migration on a test/staging environment first
2. **Backup:** Always backup before migrating
3. **Off-Hours:** Run migration during low-traffic hours
4. **Monitor:** Watch for errors during migration
5. **Verify:** Test thoroughly after migration

## Support

If you encounter issues during migration:

1. Check the error message in the script output
2. Review the migration script logs
3. Check database connection settings
4. Verify all environment variables are set
5. Contact support with the error details

## Migration is Idempotent

The migration script is safe to run multiple times:
- Already migrated users are skipped
- No data loss if run multiple times
- Can be run incrementally if needed
