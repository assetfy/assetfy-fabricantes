import React, { useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const UbicacionForm = ({ onUbicacionAdded, fabricantes }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        fabricante: ''
    });
    const { showSuccess, showError } = useNotification();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await api.post('/apoderado/ubicaciones/add', formData);
            showSuccess('Ubicación creada con éxito!');
            
            // Reset form
            setFormData({ nombre: '', direccion: '', telefono: '', fabricante: '' });
            
            if (onUbicacionAdded) {
                onUbicacionAdded();
            }
        } catch (err) {
            console.error('Error al crear la ubicación:', err.response?.data);
            showError('Error: ' + (err.response?.data || 'Error al crear la ubicación.'));
        }
    };

    return (
        <div className="form-container">
            <h3>Crear Nueva Ubicación / Depósito</h3>
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
                <button type="submit">Crear Ubicación</button>
            </form>
        </div>
    );
};

export default UbicacionForm;
