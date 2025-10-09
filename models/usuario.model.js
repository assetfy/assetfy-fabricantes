// models/usuario.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usuarioSchema = new Schema({
  nombreCompleto: { type: String, required: true },
  cuil: { type: String, required: true, unique: true },
  correoElectronico: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  telefono: { type: String },
  imagenPerfil: { type: mongoose.Schema.Types.Mixed }, // URL de la imagen de perfil o objeto con detalles del archivo
  permisosFabricantes: [{ type: Schema.Types.ObjectId, ref: 'Fabricante' }],
  roles: [{ type: String, enum: ['admin', 'apoderado', 'usuario_bienes'] }],
  estadoApoderado: { type: String, enum: ['Invitado', 'Activo'], default: 'Invitado' },
  estado: { type: String, enum: ['Activo', 'Desactivado'], default: 'Activo' },
  activationToken: { type: String },
  activationTokenExpires: { type: Date }
}, {
  timestamps: true,
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
module.exports = Usuario;