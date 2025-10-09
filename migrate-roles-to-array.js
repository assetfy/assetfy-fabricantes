// migrate-roles-to-array.js
// This script migrates the 'rol' field (single value) to 'roles' (array) for all users

require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('./models/usuario.model');

async function migrateRoles() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all users that still have the 'rol' field
        const usuarios = await Usuario.find({});
        console.log(`📊 Found ${usuarios.length} users to check`);

        let migrated = 0;
        let alreadyMigrated = 0;

        for (const usuario of usuarios) {
            // Check if user has old 'rol' field and no 'roles' field, or roles is empty
            if (usuario.rol && (!usuario.roles || usuario.roles.length === 0)) {
                console.log(`🔄 Migrating user: ${usuario.nombreCompleto} (${usuario.correoElectronico})`);
                console.log(`   Old rol: ${usuario.rol}`);
                
                // Set roles as an array containing the old role value
                usuario.roles = [usuario.rol];
                
                // Optionally remove the old 'rol' field (it will be ignored by the schema anyway)
                usuario.rol = undefined;
                
                await usuario.save();
                console.log(`   New roles: [${usuario.roles.join(', ')}]`);
                migrated++;
            } else if (usuario.roles && usuario.roles.length > 0) {
                console.log(`✓ User already migrated: ${usuario.nombreCompleto} - roles: [${usuario.roles.join(', ')}]`);
                alreadyMigrated++;
            } else {
                console.log(`⚠️ User without role: ${usuario.nombreCompleto} (${usuario.correoElectronico})`);
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`   Total users: ${usuarios.length}`);
        console.log(`   Migrated: ${migrated}`);
        console.log(`   Already migrated: ${alreadyMigrated}`);
        console.log(`   Skipped: ${usuarios.length - migrated - alreadyMigrated}`);
        console.log('\n✅ Migration completed successfully!');

        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

// Run the migration
migrateRoles();
