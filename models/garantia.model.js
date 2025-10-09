// models/garantia.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Función simple para generar un ID aleatorio
const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const garantiaSchema = new Schema({
    idGarantia: {
        type: String,
        unique: true,
        default: generateRandomId
    },
    
    // Fabricante y Marca (campos principales para permisos)
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
    
    // TAB 1: Datos generales de la garantía
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    duracionNumero: {
        type: Number,
        required: true,
        min: 1
    },
    duracionUnidad: {
        type: String,
        required: true,
        enum: ['dias', 'meses', 'años']
    },
    fechaInicio: {
        type: String,
        required: true,
        enum: ['Compra', 'Registro', 'Instalación'],
        default: 'Compra'
    },
    costoGarantia: {
        type: String,
        required: true,
        enum: ['Incluido', 'Adicional'],
        default: 'Incluido'
    },
    
    // TAB 2: Alcance de la cobertura
    tipoCobertura: [{
        type: String,
        enum: ['defectos de fabricación', 'fallas eléctricas', 'desgaste normal', 'accidentes', 'robo']
    }],
    partesCubiertas: {
        type: String,
        enum: ['Producto completo', 'solo componentes electrónicos', 'batería', 'motor', 'accesorios'],
        default: 'Producto completo'
    },
    exclusiones: [{
        type: String,
        enum: ['Daños por mal uso', 'humedad', 'modificaciones no autorizadas', 'consumibles (ej. tóner, lámparas)']
    }],
    limitacionesGeograficas: {
        type: String,
        enum: ['Cobertura local', 'regional', 'internacional'],
        default: 'Cobertura local'
    },
    serviciosIncluidos: [{
        type: String,
        enum: ['Reparación', 'reemplazo', 'reembolso', 'soporte técnico']
    }],
    
    // TAB 3: Condiciones de validez
    requiereRegistro: {
        type: Boolean,
        default: false
    },
    comprobanteObligatorio: {
        type: Boolean,
        default: true
    },
    usoAutorizado: [{
        type: String,
        enum: ['doméstico', 'profesional', 'industrial']
    }],
    instalacionCertificada: {
        type: Boolean,
        default: false
    },
    mantenimientoDocumentado: {
        type: Boolean,
        default: false
    },
    
    // TAB 4: Procesos de reclamo
    canalesReclamo: [{
        type: String,
        enum: ['Web', 'app', 'call center', 'tienda']
    }],
    tiempoRespuesta: {
        type: String,
        enum: ['NA', '48 horas', '7 días', '15 dias', '1 mes'],
        default: 'NA'
    },
    opcionesLogistica: {
        type: String,
        enum: ['Retiro en domicilio', 'envío a service center', 'visita técnica'],
        default: 'envío a service center'
    },
    maximoReclamos: {
        type: Number,
        default: 0, // 0 = ilimitado
        min: 0
    },
    
    // TAB 4: Responsabilidades del cliente
    responsabilidadesCliente: [{
        type: String,
        enum: ['Empaque adecuado en devoluciones', 'Uso de repuestos originales']
    }],
    pagoTraslado: {
        type: String,
        enum: ['A cargo del cliente', 'Cubierto'],
        default: 'A cargo del cliente'
    },
    
    // Campos de control
    usuarioApoderado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    estado: {
        type: String,
        enum: ['Activa', 'Inactiva'],
        default: 'Activa'
    }
}, {
    timestamps: true
});

const Garantia = mongoose.model('Garantia', garantiaSchema);

module.exports = Garantia;