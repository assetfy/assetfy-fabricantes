import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const FabricanteEditForm = ({ fabricante, onEditFinished, onCancelEdit }) => {
    const [formData, setFormData] = useState({
        razonSocial: '',
        cuit: '',
        usuarioApoderado: '',
        administradores: [],
        estado: 'Habilitado'
    });
    const [usuarios, setUsuarios] = useState([]);
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        // Obtener la lista de usuarios apoderados activos para el selector
        api.get('/admin/usuarios/apoderados')
            .then(response => {
                setUsuarios(response.data);
            })
            .catch(error => {
                console.error('Error al obtener la lista de usuarios apoderados:', error);
            });
    }, []);

    useEffect(() => {
        if (fabricante) {
            setFormData({
                razonSocial: fabricante.razonSocial || '',
                cuit: fabricante.cuit || '',
                usuarioApoderado: fabricante.usuarioApoderado ? 
                    (typeof fabricante.usuarioApoderado === 'object' ? 
                        fabricante.usuarioApoderado._id : fabricante.usuarioApoderado) : '',
                administradores: fabricante.administradores ? 
                    fabricante.administradores.map(admin => 
                        typeof admin === 'object' ? admin._id : admin) : [],
                estado: fabricante.estado || 'Habilitado'
            });
        }
    }, [fabricante]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/fabricantes/${fabricante._id}`, formData);
            showSuccess('Fabricante actualizado con éxito!');
            if (onEditFinished) {
                onEditFinished();
            }
        } catch (err) {
            console.error('Error al actualizar el fabricante:', err.response ? err.response.data : err);
            showError('Error: ' + (err.response ? err.response.data : 'No se pudo actualizar el fabricante.'));
        }
    };

    return (
        <div className="form-container">
            <h3>Editar Fabricante</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Razón Social</label>
                    <input 
                        type="text" 
                        name="razonSocial" 
                        value={formData.razonSocial} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>CUIT</label>
                    <input 
                        type="text" 
                        name="cuit" 
                        value={formData.cuit} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Apoderado Principal</label>
                    <select 
                        name="usuarioApoderado" 
                        value={formData.usuarioApoderado} 
                        onChange={handleChange} 
                        required
                    >
                        <option value="">Seleccione un usuario...</option>
                        {usuarios.map(user => (
                            <option key={user._id} value={user._id}>
                                {user.nombreCompleto} ({user.correoElectronico})
                            </option>
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
                            <option key={user._id} value={user._id}>
                                {user.nombreCompleto} ({user.correoElectronico})
                            </option>
                        ))}
                    </select>
                    <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples usuarios
                    </small>
                </div>
                <div className="form-group">
                    <label>Estado</label>
                    <select 
                        name="estado" 
                        value={formData.estado} 
                        onChange={handleChange}
                        required
                    >
                        <option value="Habilitado">Habilitado</option>
                        <option value="Deshabilitado">Deshabilitado</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit">Actualizar Fabricante</button>
                    <button type="button" onClick={onCancelEdit}>Cancelar</button>
                </div>
            </form>
        </div>
    );
};

export default FabricanteEditForm;