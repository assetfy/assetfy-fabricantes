const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Usuario = require('./models/usuario.model');

/**
 * Script para asegurar que el usuario elpineda@gmail.com tenga los 3 roles necesarios.
 * 
 * Este script:
 * 1. Busca el usuario con email elpineda@gmail.com
 * 2. Si no existe, lo crea con los 3 roles: admin, apoderado, usuario_bienes
 * 3. Si existe, actualiza sus roles para asegurar que tenga los 3 roles
 * 
 * Uso:
 *   node update-elpineda-roles.js
 * 
 * Nota: Requiere que MONGODB_URI esté configurado en .env
 */

async function updateUserRoles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');

        // Find the user by email
        let user = await Usuario.findOne({ correoElectronico: 'elpineda@gmail.com' });
        
        if (!user) {
            console.log('Usuario elpineda@gmail.com no encontrado. Creando usuario...');
            
            // Create the user if it doesn't exist
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Admin123!', salt);
            
            user = new Usuario({
                nombreCompleto: 'Eduardo Pineda',
                cuil: '20-99999999-9',
                correoElectronico: 'elpineda@gmail.com',
                contraseña: hashedPassword,
                telefono: '555-9999',
                roles: ['admin', 'apoderado', 'usuario_bienes'],
                estadoApoderado: 'Activo',
                estado: 'Activo'
            });
            
            await user.save();
            console.log('Usuario creado exitosamente con los 3 roles!');
            console.log('Email: elpineda@gmail.com');
            console.log('Password: Admin123!');
            console.log('Roles:', user.roles);
        } else {
            console.log('Usuario encontrado:', user.correoElectronico);
            console.log('Roles actuales:', user.roles);
            
            // Update roles to include all three
            user.roles = ['admin', 'apoderado', 'usuario_bienes'];
            user.estado = 'Activo';
            user.estadoApoderado = 'Activo';
            
            await user.save();
            console.log('Roles actualizados exitosamente!');
            console.log('Nuevos roles:', user.roles);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        process.exit(1);
    }
}

updateUserRoles();
