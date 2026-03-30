// models/notificacion.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificacionSchema = new Schema({
    fabricante: { type: Schema.Types.ObjectId, ref: 'Fabricante', required: true },
    tipo: {
        type: String,
        enum: ['producto_registrado', 'garantia_por_vencer', 'pedido_garantia', 'solicitud_representacion'],
        required: true
    },
    titulo: { type: String, required: true },
    mensaje: { type: String, required: true },
    datos: { type: Schema.Types.Mixed, default: {} },
    leida: { type: Boolean, default: false },
    referencia: {
        modelo: { type: String },
        id: { type: Schema.Types.ObjectId }
    }
}, {
    timestamps: true
});

// Index for efficient querying by fabricante and read status
notificacionSchema.index({ fabricante: 1, createdAt: -1 });
notificacionSchema.index({ fabricante: 1, leida: 1 });

const Notificacion = mongoose.model('Notificacion', notificacionSchema);
module.exports = Notificacion;
