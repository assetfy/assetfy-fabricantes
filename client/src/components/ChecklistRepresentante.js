import React from 'react';

const ChecklistRepresentante = ({ checklistItems, checklistData, onChange }) => {
    const getItemData = (itemId) => {
        return checklistData.find(d => d.checklistItemId === itemId) || {
            checklistItemId: itemId,
            completado: false,
            fecha: null
        };
    };

    const handleToggle = (itemId) => {
        const existing = checklistData.find(d => d.checklistItemId === itemId);
        let updated;
        if (existing) {
            updated = checklistData.map(d =>
                d.checklistItemId === itemId
                    ? { ...d, completado: !d.completado }
                    : d
            );
        } else {
            updated = [...checklistData, {
                checklistItemId: itemId,
                completado: true,
                fecha: null
            }];
        }
        onChange(updated);
    };

    const handleDateChange = (itemId, fecha) => {
        const existing = checklistData.find(d => d.checklistItemId === itemId);
        let updated;
        if (existing) {
            updated = checklistData.map(d =>
                d.checklistItemId === itemId
                    ? { ...d, fecha: fecha || null }
                    : d
            );
        } else {
            updated = [...checklistData, {
                checklistItemId: itemId,
                completado: false,
                fecha: fecha || null
            }];
        }
        onChange(updated);
    };

    if (!checklistItems || checklistItems.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No hay items de checklist configurados para este fabricante.
            </div>
        );
    }

    return (
        <div style={{ padding: '10px 0' }}>
            <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '13px' }}>
                Marque los items completados y agregue fechas donde corresponda.
            </p>
            {checklistItems.map(item => {
                const data = getItemData(item._id);
                const isCompleted = data.completado;

                return (
                    <div
                        key={item._id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 15px',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            border: isCompleted ? '1px solid #28a745' : '1px solid #ddd',
                            background: isCompleted ? '#d4edda' : '#fff',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div
                            onClick={() => handleToggle(item._id)}
                            style={{
                                width: '24px',
                                height: '24px',
                                minWidth: '24px',
                                borderRadius: '4px',
                                border: isCompleted ? '2px solid #28a745' : '2px solid #ccc',
                                background: isCompleted ? '#28a745' : '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {isCompleted && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </div>

                        <div style={{ flex: 1, fontWeight: '500', color: isCompleted ? '#155724' : '#333' }}>
                            {item.nombre}
                        </div>

                        {item.requiereFecha && (
                            <input
                                type="date"
                                value={data.fecha ? data.fecha.split('T')[0] : ''}
                                onChange={(e) => handleDateChange(item._id, e.target.value)}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                    fontSize: '13px',
                                    minWidth: '140px'
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ChecklistRepresentante;
