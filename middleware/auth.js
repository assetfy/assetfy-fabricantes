// middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Obtener el token del encabezado de la solicitud
  const token = req.header('x-auth-token');

  // Si no hay token, el acceso es denegado
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }

  // Verificar el token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded.usuario;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'El token no es válido' });
  }
};