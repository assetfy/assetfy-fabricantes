const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombreUsuario: { type: String, required: true },
    fabricante: { type: Schema.Types.ObjectId, ref: 'Fabricante', required: true },
    accion: { type: String, enum: ['creacion', 'actualizacion', 'eliminacion'], required: true },
    tipoEntidad: {
        type: String,
        enum: [
            'producto', 'inventario', 'representante', 'garantia',
            'marca', 'ubicacion', 'pieza', 'configuracion', 'checklist', 'portal'
        ],
        required: true
    },
    entidadId: { type: Schema.Types.ObjectId },
    descripcionEntidad: { type: String },
    detalles: { type: Schema.Types.Mixed },
    valorAnterior: { type: Schema.Types.Mixed },
    valorNuevo: { type: Schema.Types.Mixed },
}, { timestamps: true });

auditLogSchema.index({ fabricante: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
