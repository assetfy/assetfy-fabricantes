// models/garantiaAsignada.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const extensionSchema = new Schema({
    fechaAnterior: {
        type: Date,
        required: true
    },
    nuevaFechaExpiracion: {
        type: Date,
        required: true
    },
    comentarios: {
        type: String,
        trim: true,
        default: ''
    },
    fechaExtension: {
        type: Date,
        default: Date.now
    },
    usuarioExtension: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, { _id: true });

const garantiaAsignadaSchema = new Schema({
    idGarantia: {
        type: String,
        unique: true
    },

    // Referencia al item de inventario
    inventario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventario',
        required: true
    },

    // Referencia a la plantilla de garantía original
    garantiaOrigen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Garantia',
        required: true
    },

    // Snapshot del cliente final
    clienteFinal: {
        nombreCompleto: { type: String, trim: true, default: '' },
        correoElectronico: { type: String, trim: true, default: '' }
    },

    // Snapshot del producto/repuesto
    productoRepuesto: {
        modelo: { type: String, trim: true, default: '' },
        tipo: { type: String, enum: ['Producto', 'Pieza'], default: 'Producto' },
        sku: { type: String, trim: true, default: '' }
    },

    // Número de serie del inventario
    numeroSerie: {
        type: String,
        trim: true,
        default: ''
    },

    // Fecha en que se asignó la garantía (registro del producto)
    fechaRegistro: {
        type: Date,
        default: Date.now
    },

    // Canal de origen
    canal: {
        type: String,
        default: 'Web fabricante'
    },

    // Estado de la garantía asignada
    estado: {
        type: String,
        enum: ['Pendiente', 'Validada', 'Rechazada'],
        default: 'Pendiente'
    },

    // Fecha de expiración calculada
    fechaExpiracion: {
        type: Date,
        required: true
    },

    // Snapshot de todos los datos de la garantía original
    datosGarantia: {
        nombre: { type: String, default: '' },
        duracionNumero: { type: Number, default: 0 },
        duracionUnidad: { type: String, enum: ['dias', 'meses', 'años'], default: 'meses' },
        fechaInicio: { type: String, enum: ['Compra', 'Registro', 'Instalación'], default: 'Compra' },
        costoGarantia: { type: String, enum: ['Incluido', 'Adicional'], default: 'Incluido' },
        tipoCobertura: [{ type: String }],
        partesCubiertas: { type: String, default: 'Producto completo' },
        exclusiones: [{ type: String }],
        limitacionesGeograficas: { type: String, default: 'Cobertura local' },
        serviciosIncluidos: [{ type: String }],
        requiereRegistro: { type: Boolean, default: false },
        comprobanteObligatorio: { type: Boolean, default: true },
        usoAutorizado: [{ type: String }],
        instalacionCertificada: { type: Boolean, default: false },
        mantenimientoDocumentado: { type: Boolean, default: false },
        canalesReclamo: [{ type: String }],
        tiempoRespuesta: { type: String, default: 'NA' },
        opcionesLogistica: { type: String, default: 'envío a service center' },
        maximoReclamos: { type: Number, default: 0 },
        responsabilidadesCliente: [{ type: String }],
        pagoTraslado: { type: String, default: 'A cargo del cliente' }
    },

    // Historial de extensiones
    extensiones: [extensionSchema],

    // Campos de control
    fabricante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fabricante',
        required: false
    },
    marca: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marca',
        required: false
    },
    usuarioApoderado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }
}, {
    timestamps: true
});

// Pre-save hook para generar idGarantia formato GAR-YYYY-NNN
garantiaAsignadaSchema.pre('save', async function(next) {
    if (this.idGarantia) {
        return next();
    }

    const year = new Date().getFullYear();
    const prefix = `GAR-${year}-`;

    try {
        // Buscar la última garantía asignada del año actual
        const last = await mongoose.model('GarantiaAsignada')
            .findOne({ idGarantia: { $regex: `^${prefix}` } })
            .sort({ idGarantia: -1 })
            .select('idGarantia')
            .lean();

        let nextNum = 1;
        if (last && last.idGarantia) {
            const parts = last.idGarantia.split('-');
            const lastNum = parseInt(parts[2], 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }

        this.idGarantia = `${prefix}${String(nextNum).padStart(3, '0')}`;
        next();
    } catch (err) {
        next(err);
    }
});

// Index para búsquedas frecuentes
garantiaAsignadaSchema.index({ fabricante: 1, estado: 1 });
garantiaAsignadaSchema.index({ inventario: 1 }, { unique: true });

const GarantiaAsignada = mongoose.model('GarantiaAsignada', garantiaAsignadaSchema);

module.exports = GarantiaAsignada;
