const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Usuario = require('./models/usuario.model');

async function createAdminUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');

        // Check if admin user already exists
        const existingAdmin = await Usuario.findOne({ rol: 'admin' });
        if (existingAdmin) {
            console.log('Usuario admin ya existe:', existingAdmin.correoElectronico);
            process.exit(0);
        }

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const adminUser = new Usuario({
            nombreCompleto: 'Administrador del Sistema',
            cuil: '20-12345678-9',
            correoElectronico: 'admin@fabricantes.com',
            contraseña: hashedPassword,
            telefono: '555-0000',
            rol: 'admin',
            estadoApoderado: 'Activo'
        });

        await adminUser.save();
        console.log('Usuario admin creado exitosamente!');
        console.log('Email: admin@fabricantes.com');
        console.log('Password: admin123');

        // Create a test apoderado user as well
        const apoderadoHashedPassword = await bcrypt.hash('apoderado123', salt);
        const apoderadoUser = new Usuario({
            nombreCompleto: 'Juan Pérez',
            cuil: '20-87654321-0',
            correoElectronico: 'apoderado@fabricantes.com',
            contraseña: apoderadoHashedPassword,
            telefono: '555-0001',
            rol: 'apoderado',
            estadoApoderado: 'Activo'
        });

        await apoderadoUser.save();
        console.log('Usuario apoderado de prueba creado exitosamente!');
        console.log('Email: apoderado@fabricantes.com');
        console.log('Password: apoderado123');

        process.exit(0);
    } catch (error) {
        console.error('Error al crear usuarios:', error);
        process.exit(1);
    }
}

createAdminUser();