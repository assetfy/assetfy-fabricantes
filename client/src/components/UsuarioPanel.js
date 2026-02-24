import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import BienList from './BienList';
import BienRegisterForm from './BienRegisterForm';
import BienViewForm from './BienViewForm';
import BienEditForm from './BienEditForm';
import PedidoGarantiaList from './PedidoGarantiaList';
import Modal from './Modal';
import UserHeader from './UserHeader';

const UsuarioPanel = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [bienes, setBienes] = useState([]);
    const [showRegisterBienModal, setShowRegisterBienModal] = useState(false);
    const [viewingBien, setViewingBien] = useState(null);
    const [editingBien, setEditingBien] = useState(null);
    const [activeView, setActiveView] = useState('bienes'); // 'bienes' or 'garantias'
    
    const navigate = useNavigate();
    
    // Check authentication status
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const rolesStr = localStorage.getItem('roles');
    
    // Parse roles array if available
    let roles = [];
    try {
        roles = rolesStr ? JSON.parse(rolesStr) : [];
    } catch (e) {
        roles = [];
    }
    
    // If no roles array, fallback to single rol
    if (roles.length === 0 && rol) {
        roles = [rol];
    }
    
    // Helper to check if user has any of the specified roles
    const hasAnyRole = (requiredRoles) => {
        return requiredRoles.some(r => roles.includes(r));
    };
    
    // Check if user is authenticated and has usuario_bienes role
    const isAuthenticated = token && (hasAnyRole(['usuario_bienes']) || rol === 'usuario_bienes');

    useEffect(() => {
        const fetchUserData = async () => {
            if (!isAuthenticated) {
                navigate('/login');
                return;
            }

            try {
                const perfilRes = await api.get('/usuario/perfil');
                const bienesRes = await api.get('/usuario/bienes');
    
                setUserData(perfilRes.data);
                setBienes(bienesRes.data);
                setLoading(false);
            } catch (err) {
                console.error('Error al obtener los datos:', err);
                if (err.response && err.response.status === 403) {
                    navigate('/login');
                }
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isAuthenticated, navigate, refreshKey]);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleProfileUpdated = (updatedProfile) => {
        setUserData({
            ...userData,
            usuario: {
                ...userData.usuario,
                ...updatedProfile
            }
        });
    };

    const handleViewBien = (bien) => {
        setViewingBien(bien);
    };

    const handleEditBien = (bien) => {
        setEditingBien(bien);
    };

    const handleDeleteBien = async (bien) => {
        if (window.confirm(`¿Está seguro de que desea eliminar el bien "${bien.nombre}"?`)) {
            try {
                await api.delete(`/usuario/bienes/${bien._id}`);
                handleRefresh();
            } catch (err) {
                console.error('Error al eliminar bien:', err);
                alert('Error al eliminar el bien');
            }
        }
    };

    const handleCancelView = () => {
        setViewingBien(null);
    };

    const handleCancelEdit = () => {
        setEditingBien(null);
    };

    if (loading) {
        return <p>Cargando datos del usuario...</p>;
    }

    // Determine userType based on roles array (admin takes priority)
    const getUserType = () => {
        if (hasAnyRole(['admin'])) return 'admin';
        if (hasAnyRole(['apoderado'])) return 'apoderado';
        if (hasAnyRole(['usuario_bienes'])) return 'usuario_bienes';
        return rol || "usuario_bienes";
    };

    return (
        <div className="apoderado-panel">
            <UserHeader 
                user={userData}
                onProfileUpdated={handleProfileUpdated}
                userType={getUserType()}
            />
            <h2>Panel de Usuario</h2>
            <p>Bienvenido/a {userData?.usuario?.nombreCompleto}.</p>

            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', paddingBottom: '0' }}>
                <button
                    onClick={() => setActiveView('bienes')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: activeView === 'bienes' ? 700 : 400,
                        borderBottom: activeView === 'bienes' ? '3px solid #007bff' : '3px solid transparent',
                        color: activeView === 'bienes' ? '#007bff' : '#333',
                        fontSize: '15px'
                    }}
                >
                    📦 Mis Bienes
                </button>
                <button
                    onClick={() => setActiveView('garantias')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: activeView === 'garantias' ? 700 : 400,
                        borderBottom: activeView === 'garantias' ? '3px solid #007bff' : '3px solid transparent',
                        color: activeView === 'garantias' ? '#007bff' : '#333',
                        fontSize: '15px'
                    }}
                >
                    🛡️ Mis Garantías
                </button>
            </div>

            <div className="content">
                {activeView === 'bienes' && (
                    <>
                        <div className="list-container">
                            <div className="section-header">
                                <h3>Mis bienes registrados</h3>
                                <div className="button-group">
                                    <button 
                                        className="create-button register-button"
                                        onClick={() => setShowRegisterBienModal(true)}
                                    >
                                        Registrar Bien
                                    </button>
                                </div>
                            </div>
                        </div>
                        <BienList 
                            bienes={bienes}
                            refreshTrigger={refreshKey}
                            onView={handleViewBien}
                            onEdit={handleEditBien}
                            onDelete={handleDeleteBien}
                        />
                    </>
                )}

                {activeView === 'garantias' && (
                    <>
                        <div className="list-container">
                            <div className="section-header">
                                <h3>Mis Pedidos de Garantía</h3>
                                <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '13px' }}>
                                    Para gestionar una garantía, regrese a "Mis Bienes" y haz clic en el botón 🛡️ del bien correspondiente.
                                </p>
                            </div>
                        </div>
                        <PedidoGarantiaList isFabricante={false} />
                    </>
                )}

                {/* Register Bien Modal */}
                <Modal 
                    isOpen={showRegisterBienModal} 
                    onClose={() => setShowRegisterBienModal(false)}
                    title="Registrar Bien"
                >
                    <BienRegisterForm 
                        onBienRegistered={() => {
                            setShowRegisterBienModal(false);
                            handleRefresh();
                        }}
                    />
                </Modal>

                {/* View Bien Modal */}
                <Modal 
                    isOpen={!!viewingBien} 
                    onClose={handleCancelView}
                    title="Ver Bien"
                >
                    {viewingBien && (
                        <BienViewForm
                            bien={viewingBien}
                            onClose={handleCancelView}
                        />
                    )}
                </Modal>

                {/* Edit Bien Modal */}
                <Modal 
                    isOpen={!!editingBien} 
                    onClose={handleCancelEdit}
                    title="Editar Bien"
                >
                    {editingBien && (
                        <BienEditForm
                            bien={editingBien}
                            onEditFinished={() => {
                                setEditingBien(null);
                                handleRefresh();
                            }}
                            onCancelEdit={handleCancelEdit}
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default UsuarioPanel;
