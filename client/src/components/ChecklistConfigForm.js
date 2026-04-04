import React, { useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const ChecklistConfigForm = ({ onItemAdded, fabricantes }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        requiereFecha: false,
        fabricanteId: ''
    });
    const { showSuccess, showError } = useNotification();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nombre: formData.nombre,
                requiereFecha: formData.requiereFecha,
                fabricanteId: formData.fabricanteId || (fabricantes.length === 1 ? fabricantes[0]._id : '')
            };
            await api.post('/apoderado/checklist-config/add', payload);
            showSuccess('Item de checklist creado con éxito!');
            setFormData({ nombre: '', requiereFecha: false, fabricanteId: formData.fabricanteId });
            if (onItemAdded) onItemAdded();
        } catch (err) {
            console.error('Error al crear item de checklist:', err);
            showError('Error: ' + (err.response?.data?.msg || 'Error al crear el item.'));
        }
    };

    return (
        <div className="form-container">
            <h3>Crear Item de Checklist</h3>
            <form onSubmit={handleSubmit}>
                {fabricantes.length > 1 && (
                    <div className="form-group">
                        <label>Fabricante</label>
                        <select name="fabricanteId" value={formData.fabricanteId} onChange={handleChange} required>
                            <option value="">Selecciona un fabricante</option>
                            {fabricantes.map(fab => (
                                <option key={fab._id} value={fab._id}>{fab.razonSocial}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="form-group">
                    <label>Nombre del Item</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Verificación de sociedad"
                        required
                    />
                </div>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            name="requiereFecha"
                            checked={formData.requiereFecha}
                            onChange={handleChange}
                            style={{ width: 'auto' }}
                        />
                        Requiere Fecha
                    </label>
                    <small style={{ color: '#666', fontSize: '12px' }}>
                        Si se activa, se mostrará un selector de fecha junto al item en el checklist del representante.
                    </small>
                </div>
                <button type="submit">Crear Item</button>
            </form>
        </div>
    );
};

export default ChecklistConfigForm;
