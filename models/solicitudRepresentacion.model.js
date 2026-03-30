// models/solicitudRepresentacion.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mensajeSolicitudSchema = new Schema({
    autor: {
        type: String,
        enum: ['solicitante', 'fabricante'],
        required: true
    },
    autorNombre: {
        type: String,
        required: true
    },
    contenido: {
        type: String,
        required: true,
        trim: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

const solicitudRepresentacionSchema = new Schema({
    fabricante: { type: Schema.Types.ObjectId, ref: 'Fabricante', required: true },
    razonSocial: { type: String, required: true },
    nombre: { type: String, required: true },
    cuit: { type: String, required: true },
    correo: { type: String, required: true, lowercase: true },
    telefono: { type: String, required: true },
    direccion: { type: String },
    provincia: { type: String },
    mensaje: { type: String },
    estado: {
        type: String,
        enum: ['En Evaluación', 'Aceptada', 'Rechazada'],
        default: 'En Evaluación'
    },
    mensajes: [mensajeSolicitudSchema],
    comentarioRechazo: { type: String }
}, {
    timestamps: true
});

solicitudRepresentacionSchema.index({ fabricante: 1, estado: 1 });

const SolicitudRepresentacion = mongoose.model('SolicitudRepresentacion', solicitudRepresentacionSchema);
module.exports = SolicitudRepresentacion;
