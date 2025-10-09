// models/bien.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bienSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    tipo: {
        type: String,
        enum: ['creado', 'registrado'], // 'creado' = created by user, 'registrado' = registered from inventory
        required: true
    },
    // User who owns this asset
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    // Image for user-created assets
    imagen: {
        originalName: String,
        fileName: String,
        s3Key: String,
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    },
    // Comments field for user-created assets
    comentarios: {
        type: String,
        trim: true,
        default: ''
    },
    // Custom attributes for user-created assets
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
    }],
    // For registered assets - reference to inventory item
    inventario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventario',
        required: function() {
            return this.tipo === 'registrado';
        }
    },
    // For registered assets - copy of product data at time of registration
    datosProducto: {
        modelo: String,
        descripcion: String,
        numeroSerie: String,
        garantia: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Garantia'
        },
        atributos: [{
            nombre: String,
            valor: String
        }],
        imagenPrincipal: {
            originalName: String,
            fileName: String,
            s3Key: String,
            url: String
        },
        fabricante: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Fabricante'
        },
        marca: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Marca'
        }
    },
    // Date when asset was registered (for registered assets)
    fechaRegistro: {
        type: Date,
        required: function() {
            return this.tipo === 'registrado';
        }
    }
}, {
    timestamps: true
});

// Validate that creado bienes have required fields
bienSchema.pre('save', function(next) {
    if (this.tipo === 'creado') {
        // Creado bienes don't need inventario or datosProducto
        this.inventario = undefined;
        this.datosProducto = undefined;
        this.fechaRegistro = undefined;
    } else if (this.tipo === 'registrado') {
        // Registrado bienes must have inventario reference
        if (!this.inventario) {
            return next(new Error('Bienes registrados deben tener una referencia de inventario'));
        }
        // Set fechaRegistro if not already set
        if (!this.fechaRegistro) {
            this.fechaRegistro = new Date();
        }
    }
    next();
});

const Bien = mongoose.model('Bien', bienSchema);

module.exports = Bien;
