// models/inventario.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Función simple para generar un ID aleatorio
const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const inventarioSchema = new Schema({
    idInventario: { // Nuevo campo
        type: String,
        unique: true,
        default: generateRandomId
    },
    numeroSerie: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    estado: {
        type: String,
        required: true,
        enum: ['stock', 'vendido', 'alquilado'],
        default: 'stock'
    },
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: function() {
            // Either producto or pieza is required, but not both
            return !this.pieza;
        }
    },
    pieza: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pieza',
        required: function() {
            // Either producto or pieza is required, but not both
            return !this.producto;
        }
    },
    comprador: {
        nombreCompleto: {
            type: String,
            required: function() { 
                // Only required if estado is 'vendido' and registrado is 'Si', or if estado is 'alquilado'
                return (this.estado === 'vendido' && this.registrado === 'Si') || this.estado === 'alquilado'; 
            },
            default: ''
        },
        correoElectronico: {
            type: String,
            required: function() { 
                // Only required if estado is 'vendido' and registrado is 'Si', or if estado is 'alquilado'
                return (this.estado === 'vendido' && this.registrado === 'Si') || this.estado === 'alquilado'; 
            },
            default: ''
        },
        cuil: {
            type: String,
            required: false,
            default: ''
        },
        telefono: {
            type: String,
            required: function() { 
                // Only required if estado is 'vendido' and registrado is 'Si', or if estado is 'alquilado'
                return (this.estado === 'vendido' && this.registrado === 'Si') || this.estado === 'alquilado'; 
            },
            default: ''
        }
    },
    fechaVenta: {
        type: Date,
        required: false, // Made optional, will be set automatically when needed
        default: function() { return this.estado === 'vendido' ? new Date() : undefined; }
    },
    fechaInicioAlquiler: {
        type: Date,
        required: false, // Optional rental start date
        default: null
    },
    fechaFinAlquiler: {
        type: Date,
        required: false, // Optional rental end date
        default: null
    },
    fechaRegistro: {
        type: Date,
        required: false,
        default: null // Will be set when product is registered via public form
    },
    registrado: {
        type: String,
        enum: ['Si', 'No'],
        default: 'No'
    },
    usuarioApoderado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    ubicacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ubicacion',
        required: false
    },
    atributos: [{
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        valor: {
            type: String,
            trim: true,
            default: ''
        }
    }]
}, {
    timestamps: true,
});

// Pre-save middleware to handle fechaVenta and rental dates logic
inventarioSchema.pre('save', function(next) {
    // Validate that either producto or pieza is set, but not both
    if (this.producto && this.pieza) {
        return next(new Error('Un artículo de inventario debe tener un producto o una pieza, no ambos'));
    }
    if (!this.producto && !this.pieza) {
        return next(new Error('Un artículo de inventario debe tener un producto o una pieza'));
    }
    
    // If estado is 'vendido' and fechaVenta is not set, set it to current date
    if (this.estado === 'vendido' && !this.fechaVenta) {
        this.fechaVenta = new Date();
    }
    
    // If estado is not 'vendido', clear fechaVenta
    if (this.estado !== 'vendido') {
        this.fechaVenta = undefined;
    }
    
    // If estado is not 'alquilado', clear rental dates
    if (this.estado !== 'alquilado') {
        this.fechaInicioAlquiler = null;
        this.fechaFinAlquiler = null;
    }
    
    next();
});

const Inventario = mongoose.model('Inventario', inventarioSchema);

module.exports = Inventario;