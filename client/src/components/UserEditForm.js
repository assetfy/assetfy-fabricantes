import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const UserEditForm = ({ user, onEditFinished, onCancelEdit }) => {
    const [formData, setFormData] = useState({
        nombreCompleto: '',
        cuil: '',
        correoElectronico: '',
        telefono: '',
        estadoApoderado: 'Invitado',
        roles: ['apoderado'], // Changed from single 'rol' to array 'roles'
        estado: 'Activo',
        permisosFabricantes: []
    });
    const [fabricantes, setFabricantes] = useState([]);
    const { showSuccess, showError } = useNotification();

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

    useEffect(() => {
        if (user) {
            setFormData({
                nombreCompleto: user.nombreCompleto || '',
                cuil: user.cuil || '',
                correoElectronico: user.correoElectronico || '',
                telefono: user.telefono || '',
                estadoApoderado: user.estadoApoderado || 'Invitado',
                // Support both old 'rol' (single) and new 'roles' (array)
                roles: user.roles && Array.isArray(user.roles) ? user.roles : (user.rol ? [user.rol] : ['apoderado']),
                estado: user.estado || 'Activo',
                permisosFabricantes: user.permisosFabricantes ? 
                    user.permisosFabricantes.map(fab => typeof fab === 'object' ? fab._id : fab) : []
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/usuarios/${user._id}`, formData);
            showSuccess('Usuario actualizado con éxito!');
            if (onEditFinished) {
                onEditFinished();
            }
        } catch (err) {
            console.error('Error al actualizar el usuario:', err.response ? err.response.data : err);
            showError('Error: ' + (err.response ? err.response.data : 'No se pudo actualizar el usuario.'));
        }
    };

    return (
        <div className="form-container">
            <h3>Editar Usuario</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nombre Completo</label>
                    <input 
                        type="text" 
                        name="nombreCompleto" 
                        value={formData.nombreCompleto} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>CUIL</label>
                    <input 
                        type="text" 
                        name="cuil" 
                        value={formData.cuil} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input 
                        type="email" 
                        name="correoElectronico" 
                        value={formData.correoElectronico} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Teléfono</label>
                    <input 
                        type="text" 
                        name="telefono" 
                        value={formData.telefono} 
                        onChange={handleChange} 
                    />
                </div>
                <div className="form-group">
                    <label>Estado Apoderado</label>
                    <select 
                        name="estadoApoderado" 
                        value={formData.estadoApoderado} 
                        onChange={handleChange}
                        required
                    >
                        <option value="Invitado">Invitado</option>
                        <option value="Activo">Activo</option>
                    </select>
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
                <div className="form-group">
                    <label>Estado</label>
                    <select 
                        name="estado" 
                        value={formData.estado} 
                        onChange={handleChange}
                        required
                    >
                        <option value="Activo">Activo</option>
                        <option value="Desactivado">Desactivado</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit">Actualizar Usuario</button>
                    <button type="button" onClick={onCancelEdit}>Cancelar</button>
                </div>
            </form>
        </div>
    );
};

export default UserEditForm;