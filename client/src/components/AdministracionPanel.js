import React, { useState } from 'react';
import ExportacionDatos from './ExportacionDatos';
import ImportacionDatos from './ImportacionDatos';
import UbicacionList from './UbicacionList';
import UbicacionForm from './UbicacionForm';
import UbicacionEditForm from './UbicacionEditForm';
import MarcaList from './MarcaList';
import MarcaForm from './MarcaForm';
import MarcaEditForm from './MarcaEditForm';
import Modal from './Modal';
import Tabs from './Tabs';

const AdministracionPanel = ({ fabricantes = [], allMarcas = [], onRefresh }) => {
    const [showCreateUbicacionModal, setShowCreateUbicacionModal] = useState(false);
    const [editingUbicacion, setEditingUbicacion] = useState(null);
    const [showCreateMarcaModal, setShowCreateMarcaModal] = useState(false);
    const [editingMarca, setEditingMarca] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleEditUbicacion = (ubicacion) => {
        setEditingUbicacion(ubicacion);
    };

    const handleCancelEditUbicacion = () => {
        setEditingUbicacion(null);
    };

    const handleUbicacionAdded = () => {
        setShowCreateUbicacionModal(false);
        handleRefresh();
    };

    const handleUbicacionUpdated = () => {
        setEditingUbicacion(null);
        handleRefresh();
    };

    const handleEditMarca = (marca) => {
        setEditingMarca(marca);
    };

    const handleCancelEditMarca = () => {
        setEditingMarca(null);
    };

    const handleMarcaAdded = () => {
        setShowCreateMarcaModal(false);
        handleRefresh();
    };

    const handleMarcaUpdated = () => {
        setEditingMarca(null);
        handleRefresh();
    };

    return (
        <div className="administracion-panel">
            <h3>Administración</h3>
            <p>Gestiona la importación y exportación de datos de tu sistema.</p>
            
            <Tabs
                defaultTab={0}
                tabs={[
                    {
                        label: "Exportación de Datos",
                        content: <ExportacionDatos />
                    },
                    {
                        label: "Importación de Datos", 
                        content: <ImportacionDatos />
                    },
                    {
                        label: "Ubicaciones / Depósitos",
                        content: (
                            <>
                                <div className="list-container">
                                    <div className="section-header">
                                        <h3>Gestión de Ubicaciones / Depósitos</h3>
                                        <button 
                                            className="create-button"
                                            onClick={() => setShowCreateUbicacionModal(true)}
                                        >
                                            Crear Ubicación / Depósito
                                        </button>
                                    </div>
                                </div>
                                <UbicacionList 
                                    refreshTrigger={refreshKey} 
                                    onEdit={handleEditUbicacion} 
                                />
                            </>
                        )
                    },
                    {
                        label: "Marcas",
                        content: (
                            <>
                                <div className="list-container">
                                    <div className="section-header">
                                        <h3>Gestión de Marcas</h3>
                                        <button 
                                            className="create-button"
                                            onClick={() => setShowCreateMarcaModal(true)}
                                        >
                                            Crear Marca
                                        </button>
                                    </div>
                                </div>
                                <MarcaList 
                                    refreshTrigger={refreshKey} 
                                    onEdit={handleEditMarca} 
                                />
                            </>
                        )
                    }
                ]}
            />

            {/* Modals */}
            <Modal 
                isOpen={showCreateUbicacionModal} 
                onClose={() => setShowCreateUbicacionModal(false)}
                title="Crear Nueva Ubicación / Depósito"
            >
                <UbicacionForm 
                    onUbicacionAdded={handleUbicacionAdded}
                    fabricantes={fabricantes}
                />
            </Modal>

            <Modal 
                isOpen={!!editingUbicacion} 
                onClose={handleCancelEditUbicacion}
                title="Editar Ubicación / Depósito"
            >
                {editingUbicacion && (
                    <UbicacionEditForm 
                        ubicacion={editingUbicacion}
                        fabricantes={fabricantes}
                        onUbicacionUpdated={handleUbicacionUpdated}
                        onCancel={handleCancelEditUbicacion}
                    />
                )}
            </Modal>

            <Modal 
                isOpen={showCreateMarcaModal} 
                onClose={() => setShowCreateMarcaModal(false)}
                title="Crear Nueva Marca"
            >
                <MarcaForm 
                    onMarcaAdded={handleMarcaAdded}
                    fabricantes={fabricantes}
                />
            </Modal>

            <Modal 
                isOpen={!!editingMarca} 
                onClose={handleCancelEditMarca}
                title="Editar Marca"
            >
                {editingMarca && (
                    <MarcaEditForm
                        marca={editingMarca}
                        fabricantes={fabricantes}
                        onEditFinished={handleMarcaUpdated}
                        onCancelEdit={handleCancelEditMarca}
                    />
                )}
            </Modal>
        </div>
    );
};

export default AdministracionPanel;