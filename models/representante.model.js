const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const representanteSchema = new Schema({
    razonSocial: {
        type: String,
        required: true,
        trim: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    cuit: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    cobertura: {
        provincias: [{
            type: String,
            trim: true
        }],
        localidades: [{
            type: String,
            trim: true
        }]
    },
    direccion: {
        type: String,
        required: true,
        trim: true
    },
    telefono: {
        type: String,
        required: true,
        trim: true
    },
    telefonoAdicional: {
        type: String,
        trim: true
    },
    correo: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    correoAdicional: {
        type: String,
        trim: true,
        lowercase: true
    },
    sitioWeb: {
        type: String,
        trim: true
    },
    estado: {
        type: String,
        enum: ['Activo', 'Inactivo'],
        default: 'Activo'
    },
    usuarioApoderado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    marcasRepresentadas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marca'
    }]
}, {
    timestamps: true,
});

const Representante = mongoose.model('Representante', representanteSchema);

module.exports = Representante;