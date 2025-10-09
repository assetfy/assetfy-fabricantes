// models/fabricante.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fabricanteSchema = new Schema({
  razonSocial: { type: String, required: true, unique: true },
  cuit: { type: String, required: true, unique: true },
  // Referencia al usuario que es el apoderado de esta empresa
  usuarioApoderado: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  // Referencias a usuarios que son administradores de esta empresa
  administradores: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }],
  logo: { type: String },
  estado: { type: String, enum: ['Habilitado', 'Deshabilitado'], default: 'Habilitado' }
}, {
  timestamps: true,
});

const Fabricante = mongoose.model('Fabricante', fabricanteSchema);
module.exports = Fabricante;