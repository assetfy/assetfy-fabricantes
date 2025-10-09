// models/producto.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Función simple para generar un ID aleatorio
const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const productoSchema = new Schema({
    idProducto: { // Nuevo campo
        type: String,
        unique: true,
        default: generateRandomId
    },
    modelo: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        required: true,
        trim: true
    },
    precio: {
        type: Number,
        required: true,
    },
    fabricante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fabricante',
        required: true
    },
    marca: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marca',
        required: true
    },
    usuarioApoderado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    estado: {
        type: String,
        enum: ['Activo', 'Descontinuado'],
        default: 'Activo'
    },
    manuales: [{
        originalName: String,
        fileName: String,
        s3Key: String,
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    imagenPrincipal: {
        originalName: String,
        fileName: String,
        s3Key: String,
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    },
    imagenesAdicionales: [{
        originalName: String,
        fileName: String,
        s3Key: String,
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    videos: [{
        originalName: String,
        fileName: String,
        s3Key: String,
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    atributos: [{
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        tipo: {
            type: String,
            enum: ['lista', 'predefinido', 'input'],
            required: true
        },
        valores: [{
            type: String,
            trim: true
        }], // Para tipo 'lista', múltiples valores posibles
        valor: {
            type: String,
            trim: true
        } // Para tipo 'predefinido', valor único
    }],
    garantia: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Garantia',
        default: null
    }
}, {
    timestamps: true
});

const Producto = mongoose.model('Producto', productoSchema);

module.exports = Producto;