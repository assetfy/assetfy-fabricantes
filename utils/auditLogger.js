const AuditLog = require('../models/auditLog.model');
const Usuario = require('../models/usuario.model');

const ENTITY_LABELS = {
    producto: 'el producto',
    inventario: 'el item de inventario',
    representante: 'el representante',
    garantia: 'la garantía',
    marca: 'la marca',
    ubicacion: 'la ubicación/depósito',
    pieza: 'la pieza',
    configuracion: 'la configuración',
    checklist: 'el checklist',
    portal: 'el portal de registro'
};

const ACCION_LABELS = {
    creacion: 'creó',
    actualizacion: 'actualizó',
    eliminacion: 'eliminó'
};

async function logAuditEvent({ usuarioId, fabricanteId, accion, tipoEntidad, entidadId, descripcionEntidad, detalles, valorAnterior, valorNuevo }) {
    try {
        const usuario = await Usuario.findById(usuarioId).select('nombre correoElectronico').lean();
        const nombreUsuario = usuario
            ? (usuario.nombre || usuario.correoElectronico || 'Usuario desconocido')
            : 'Usuario desconocido';

        await AuditLog.create({
            usuario: usuarioId,
            nombreUsuario,
            fabricante: fabricanteId,
            accion,
            tipoEntidad,
            entidadId: entidadId || undefined,
            descripcionEntidad: descripcionEntidad || '',
            detalles: detalles || undefined,
            valorAnterior: valorAnterior || undefined,
            valorNuevo: valorNuevo || undefined,
        });
    } catch (err) {
        console.error('Error al registrar evento de auditoría:', err.message);
    }
}

function sanitizeForAudit(obj) {
    if (!obj) return {};
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === '__v' || key === '_id' || key === 'contrasena' || key === 'password') continue;
        if (value instanceof Date) {
            clean[key] = value.toISOString();
        } else if (typeof value === 'object' && value !== null && value._id) {
            clean[key] = value._id.toString();
        } else if (value !== undefined) {
            clean[key] = value;
        }
    }
    return clean;
}

function getChangedFields(anterior, nuevo) {
    const changes = { valorAnterior: {}, valorNuevo: {} };
    const allKeys = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);
    for (const key of allKeys) {
        if (key === '__v' || key === '_id' || key === 'updatedAt' || key === 'createdAt') continue;
        const oldVal = JSON.stringify(anterior[key]);
        const newVal = JSON.stringify(nuevo[key]);
        if (oldVal !== newVal) {
            changes.valorAnterior[key] = anterior[key];
            changes.valorNuevo[key] = nuevo[key];
        }
    }
    return changes;
}

module.exports = { logAuditEvent, sanitizeForAudit, getChangedFields, ENTITY_LABELS, ACCION_LABELS };
