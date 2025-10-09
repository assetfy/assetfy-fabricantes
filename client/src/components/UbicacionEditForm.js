import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const UbicacionEditForm = ({ ubicacion, fabricantes, onUbicacionUpdated, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        fabricante: ''
    });
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        if (ubicacion) {
            setFormData({
                nombre: ubicacion.nombre || '',
                direccion: ubicacion.direccion || '',
                telefono: ubicacion.telefono || '',
                fabricante: ubicacion.fabricante?._id || ''
            });
        }
    }, [ubicacion]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await api.put(`/apoderado/ubicaciones/${ubicacion._id}`, formData);
            showSuccess('Ubicación actualizada con éxito!');
            
            if (onUbicacionUpdated) {
                onUbicacionUpdated();
            }
        } catch (err) {
            console.error('Error al actualizar la ubicación:', err.response?.data);
            showError('Error: ' + (err.response?.data || 'Error al actualizar la ubicación.'));
        }
    };

    return (
        <div className="form-container">
            <h3>Editar Ubicación / Depósito</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nombre del Depósito</label>
                    <input 
                        type="text" 
                        name="nombre" 
                        value={formData.nombre} 
                        onChange={handleChange} 
                        required 
                        placeholder="Ej: Depósito Central"
                    />
                </div>
                <div className="form-group">
                    <label>Dirección</label>
                    <input 
                        type="text" 
                        name="direccion" 
                        value={formData.direccion} 
                        onChange={handleChange} 
                        required 
                        placeholder="Ej: Av. Principal 123, CABA"
                    />
                </div>
                <div className="form-group">
                    <label>Fabricante (opcional)</label>
                    <select 
                        name="fabricante" 
                        value={formData.fabricante} 
                        onChange={handleChange}
                    >
                        <option value="">Sin fabricante asignado</option>
                        {fabricantes && fabricantes.map(fab => (
                            <option key={fab._id} value={fab._id}>{fab.razonSocial}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Teléfono</label>
                    <input 
                        type="text" 
                        name="telefono" 
                        value={formData.telefono} 
                        onChange={handleChange} 
                        required 
                        placeholder="Ej: +54 11 1234-5678"
                    />
                </div>
                <button type="submit">Actualizar Ubicación</button>
                <button type="button" onClick={onCancel}>Cancelar</button>
            </form>
        </div>
    );
};

export default UbicacionEditForm;
