import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const FabricanteForm = ({ onFabricanteAdded }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    razonSocial: '',
    cuit: '',
    usuarioApoderado: '',
    administradores: []
  });
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    // Obtener la lista de usuarios apoderados activos para el selector
    api.get('/admin/usuarios/apoderados')
      .then(response => {
        if (response && response.data) {
          setUsuarios(response.data);
        } else {
          console.error('Respuesta del servidor inválida para usuarios apoderados');
        }
      })
      .catch(error => {
        console.error('Error al obtener la lista de usuarios apoderados:', error);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAdministradoresChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setFormData({
      ...formData,
      administradores: selectedValues
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/admin/fabricantes/add', formData)
      .then(res => {
        showSuccess('Fabricante creado con éxito!');
        setFormData({
          razonSocial: '',
          cuit: '',
          usuarioApoderado: '',
          administradores: []
        });
        if (onFabricanteAdded) {
          onFabricanteAdded();
        }
      })
      .catch(err => {
        console.error('Error al crear el fabricante:', err);
        showError('Error al crear el fabricante. Por favor, revisa la consola.');
      });
  };

  return (
    <div className="form-container">
      <h3>Crear Nuevo Fabricante</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Razón Social</label>
          <input type="text" name="razonSocial" value={formData.razonSocial} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>CUIT</label>
          <input type="text" name="cuit" value={formData.cuit} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Apoderado Principal</label>
          <select name="usuarioApoderado" value={formData.usuarioApoderado} onChange={handleChange} required>
            <option value="">Seleccione un usuario...</option>
            {usuarios.map(user => (
              <option key={user._id} value={user._id}>{user.nombreCompleto} ({user.correoElectronico})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Apoderados Adicionales (opcional)</label>
          <select 
            name="administradores" 
            multiple 
            value={formData.administradores} 
            onChange={handleAdministradoresChange}
            style={{ height: '120px' }}
          >
            {usuarios.map(user => (
              <option key={user._id} value={user._id}>{user.nombreCompleto} ({user.correoElectronico})</option>
            ))}
          </select>
          <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
            Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples usuarios
          </small>
        </div>
        <button type="submit">Crear Fabricante</button>
      </form>
    </div>
  );
};

export default FabricanteForm;