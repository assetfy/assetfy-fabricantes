import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const UserForm = ({ onUserAdded }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    cuil: '',
    correoElectronico: '',
    contraseña: '',
    telefono: '',
    roles: ['apoderado'], // Changed from single 'rol' to array 'roles'
    enviarInvitacion: false,
    permisosFabricantes: []
  });
  const [error, setError] = useState('');
  const [fabricantes, setFabricantes] = useState([]);

  useEffect(() => {
    // Load fabricantes for the selector
    api.get('/admin/fabricantes')
      .then(res => {
        setFabricantes(res.data);
      })
      .catch(err => {
        console.error('Error loading fabricantes:', err);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFabricantesChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData({
      ...formData,
      permisosFabricantes: selected
    });
  };

  const handleRolesChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData({
      ...formData,
      roles: selected.length > 0 ? selected : ['apoderado'] // Ensure at least one role
    });
  };

const handleSubmit = (e) => {
  e.preventDefault();
  setError(''); // Clear any previous errors

  api.post('/admin/usuarios/add', formData)
    .then(res => {
      if (res.data.emailSent === false) {
        showSuccess('Usuario creado, pero no se pudo enviar el correo de invitación.');
      } else if (res.data.msg) {
        showSuccess(res.data.msg);
      } else {
        showSuccess('Usuario creado con éxito!');
      }
      setFormData({
        nombreCompleto: '',
        cuil: '',
        correoElectronico: '',
        contraseña: '',
        telefono: '',
        roles: ['apoderado'],
        enviarInvitacion: false,
        permisosFabricantes: []
      });
      if (onUserAdded) {
        onUserAdded();
      }
    })
    .catch(err => {
      if (err.response && err.response.data && err.response.data.msg) {
        // Correctly access the message string from the object
        setError(err.response.data.msg); 
        showError(err.response.data.msg);
      } else {
        // Fallback for other types of errors
        const errorMsg = 'Ocurrió un error inesperado. Por favor, revisa la consola.';
        setError(errorMsg);
        showError(errorMsg);
      }
      console.error('Error al crear el usuario:', err);
    });
};

  return (
    <div className="form-container">
      <h3>Crear Nuevo Usuario</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre Completo</label>
          <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>CUIL</label>
          <input type="text" name="cuil" value={formData.cuil} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input type="email" name="correoElectronico" value={formData.correoElectronico} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" name="contraseña" value={formData.contraseña} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Teléfono</label>
          <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Roles</label>
          <select 
            name="roles" 
            multiple 
            value={formData.roles} 
            onChange={handleRolesChange}
            style={{ height: '90px' }}
            required
          >
            <option value="admin">Admin</option>
            <option value="apoderado">Apoderado</option>
            <option value="usuario_bienes">Usuario de Bienes</option>
          </select>
          <small className="form-help">
            Mantén presionado Ctrl (o Cmd en Mac) para seleccionar múltiples roles. Un usuario puede tener más de un rol.
          </small>
        </div>
        {formData.roles.includes('apoderado') && (
          <div className="form-group">
            <label>Fabricantes Permitidos</label>
            <select 
              name="permisosFabricantes" 
              multiple 
              value={formData.permisosFabricantes} 
              onChange={handleFabricantesChange}
              style={{ height: '120px' }}
            >
              {fabricantes.map(fab => (
                <option key={fab._id} value={fab._id}>
                  {fab.razonSocial}
                </option>
              ))}
            </select>
            <small className="form-help">
              Mantén presionado Ctrl (o Cmd en Mac) para seleccionar múltiples fabricantes
            </small>
          </div>
        )}
        <div className="form-group form-group-checkbox">
          <label>
            <input 
              type="checkbox" 
              name="enviarInvitacion" 
              checked={formData.enviarInvitacion} 
              onChange={handleChange}
            />
            Enviar invitación por correo electrónico
          </label>
          <small className="form-help">
            Si se activa, el usuario recibirá un correo con sus credenciales y un link de activación
          </small>
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit">Crear Usuario</button>
      </form>
    </div>
  );
};

export default UserForm;