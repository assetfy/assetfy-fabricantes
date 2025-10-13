const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

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

// Rutas de API
app.use('/api/auth', authRouter);
app.use('/api/apoderado', apoderadoRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);
app.use('/api/usuario', usuarioRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    upload_system: process.env.S3_BUCKET_NAME ? 'configured' : 'not_configured'
  });
});

// Servir frontend (React build)
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Catch-all universal: SOLO sirve index.html si la ruta NO es de API
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));