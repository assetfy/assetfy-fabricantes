const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Conexión a la base de datos
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Atlas conectado'))
.catch(err => console.error('Error al conectar a la base de datos:', err));

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Importar rutas
const authRouter = require('./routes/auth');
const apoderadoRouter = require('./routes/apoderado');
const adminRouter = require('./routes/admin');
const publicRouter = require('./routes/public');
const usuarioRouter = require('./routes/usuario');

// Usar rutas
app.use('/api/auth', authRouter);
app.use('/api/apoderado', apoderadoRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);
app.use('/api/usuario', usuarioRouter);

// Simple health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        upload_system: process.env.S3_BUCKET_NAME ? 'configured' : 'not_configured'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));