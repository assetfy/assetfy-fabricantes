import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';

const ChecklistConfigList = ({ refreshTrigger, onEdit }) => {
    const [fabricantes, setFabricantes] = useState([]);
    const [selectedFabricanteId, setSelectedFabricanteId] = useState('');
    const [checklistItems, setChecklistItems] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        const fetchChecklistConfig = async () => {
            try {
                const res = await api.get('/apoderado/checklist-config');
                if (res && res.data && res.data.fabricantes) {
                    setFabricantes(res.data.fabricantes);
                    if (res.data.fabricantes.length > 0) {
                        const firstId = selectedFabricanteId || res.data.fabricantes[0]._id;
                        setSelectedFabricanteId(firstId);
                        const fab = res.data.fabricantes.find(f => f._id === firstId) || res.data.fabricantes[0];
                        setChecklistItems(fab.checklistItems || []);
                        if (!selectedFabricanteId) setSelectedFabricanteId(fab._id);
                    }
                }
            } catch (err) {
                console.error('Error al obtener checklist config:', err);
            }
        };
        fetchChecklistConfig();
    }, [refreshTrigger]);

    const handleFabricanteChange = (e) => {
        const fabId = e.target.value;
        setSelectedFabricanteId(fabId);
        const fab = fabricantes.find(f => f._id === fabId);
        setChecklistItems(fab ? fab.checklistItems || [] : []);
    };

    const handleDeleteClick = (item) => {
        setConfirmDialog({
            isOpen: true,
            itemId: item._id,
            itemName: item.nombre
        });
    };

    const handleConfirmDelete = async () => {
        const itemId = confirmDialog.itemId;
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
        try {
            await api.delete(`/apoderado/checklist-config/${itemId}?fabricanteId=${selectedFabricanteId}`);
            showSuccess('Item de checklist eliminado');
            setChecklistItems(prev => prev.filter(i => i._id !== itemId));
        } catch (err) {
            console.error('Error al eliminar item:', err);
            showError('Error al eliminar el item de checklist');
        }
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
    };

    return (
        <div className="list-container">
            {fabricantes.length > 1 && (
                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Fabricante</label>
                    <select value={selectedFabricanteId} onChange={handleFabricanteChange}>
                        {fabricantes.map(fab => (
                            <option key={fab._id} value={fab._id}>{fab.razonSocial}</option>
                        ))}
                    </select>
                </div>
            )}

            {checklistItems.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                    No hay items de checklist configurados. Haga clic en "+" para agregar uno.
                </p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Requiere Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {checklistItems.map(item => (
                            <tr key={item._id}>
                                <td>{item.nombre}</td>
                                <td>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        background: item.requiereFecha ? '#d4edda' : '#f8d7da',
                                        color: item.requiereFecha ? '#155724' : '#721c24'
                                    }}>
                                        {item.requiereFecha ? 'Sí' : 'No'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="action-button edit-button"
                                        onClick={() => onEdit && onEdit(item, selectedFabricanteId)}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="action-button delete-button"
                                        onClick={() => handleDeleteClick(item)}
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Confirmar eliminación"
                message={`¿Está seguro de que desea eliminar el item "${confirmDialog.itemName}"?`}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
};

export default ChecklistConfigList;
