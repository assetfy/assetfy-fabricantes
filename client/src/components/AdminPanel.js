import React, { useState, useEffect } from 'react';
import api from '../api';
import UserList from './UserList';
import FabricanteList from './FabricanteList';
import UserForm from './UserForm';
import FabricanteForm from './FabricanteForm';
import UserEditForm from './UserEditForm';
import FabricanteEditForm from './FabricanteEditForm';
import Modal from './Modal';
import Sidebar from './Sidebar';
import UserHeader from './UserHeader';

const AdminPanel = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [editingUser, setEditingUser] = useState(null);
    const [editingFabricante, setEditingFabricante] = useState(null);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showCreateFabricanteModal, setShowCreateFabricanteModal] = useState(false);
    const [activeView, setActiveView] = useState('usuarios'); // 'usuarios' or 'fabricantes'

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await api.get('/admin/perfil');
                if (res && res.data) {
                    setUserData(res.data);
                } else {
                    console.error('Respuesta del servidor inválida para datos de usuario');
                }
                setLoading(false);
            } catch (err) {
                console.error('Error al obtener los datos del usuario:', err);
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleProfileUpdated = (updatedData) => {
        setUserData(updatedData);
    };

    const handleRefresh = () => {
        setRefreshKey(prevKey => prevKey + 1);
        setEditingUser(null);
        setEditingFabricante(null);
        setShowCreateUserModal(false);
        setShowCreateFabricanteModal(false);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
    };

    const handleCancelEditUser = () => {
        setEditingUser(null);
    };

    const handleEditFabricante = (fabricante) => {
        setEditingFabricante(fabricante);
    };

    const handleCancelEditFabricante = () => {
        setEditingFabricante(null);
    };

    if (loading) {
        return <p>Cargando datos del usuario...</p>;
    }

    return (
        <div className="admin-panel">
            <UserHeader 
                user={userData}
                onProfileUpdated={handleProfileUpdated}
                userType="admin"
            />
            <h2>Panel del Administrador</h2>
            <p>Bienvenido/a {userData?.nombreCompleto}.</p>
            <p>Aquí puedes gestionar los usuarios y fabricantes.</p>

            <div className="panel-with-sidebar">
                <Sidebar
                    items={[
                        {
                            label: 'Usuarios',
                            description: 'Gestión de usuarios',
                            icon: '◉',
                            active: activeView === 'usuarios',
                            onClick: () => setActiveView('usuarios')
                        },
                        {
                            label: 'Fabricantes',
                            description: 'Gestión de fabricantes',
                            icon: '◫',
                            active: activeView === 'fabricantes',
                            onClick: () => setActiveView('fabricantes')
                        }
                    ]}
                />
                
                <div className="sidebar-content">
                    {activeView === 'usuarios' && (
                        <>
                            <div className="list-container">
                                <div className="section-header">
                                    <h3>Gestión de Usuarios</h3>
                                    <button 
                                        className="create-button"
                                        onClick={() => setShowCreateUserModal(true)}
                                    >
                                        Crear Usuario
                                    </button>
                                </div>
                            </div>
                            <UserList 
                                refreshTrigger={refreshKey} 
                                onEdit={handleEditUser}
                            />
                        </>
                    )}
                    
                    {activeView === 'fabricantes' && (
                        <>
                            <div className="list-container">
                                <div className="section-header">
                                    <h3>Gestión de Fabricantes</h3>
                                    <button 
                                        className="create-button"
                                        onClick={() => setShowCreateFabricanteModal(true)}
                                    >
                                        Crear Fabricante
                                    </button>
                                </div>
                            </div>
                            <FabricanteList 
                                refreshTrigger={refreshKey} 
                                onEdit={handleEditFabricante}
                            />
                        </>
                    )}
                </div>
            </div>
                
            {/* Modals */}
            <Modal 
                    isOpen={showCreateUserModal} 
                    onClose={() => setShowCreateUserModal(false)}
                    title="Crear Nuevo Usuario"
                >
                    <UserForm onUserAdded={handleRefresh} />
                </Modal>

                <Modal 
                    isOpen={showCreateFabricanteModal} 
                    onClose={() => setShowCreateFabricanteModal(false)}
                    title="Crear Nuevo Fabricante"
                >
                    <FabricanteForm onFabricanteAdded={handleRefresh} />
                </Modal>

                <Modal 
                    isOpen={!!editingUser} 
                    onClose={handleCancelEditUser}
                    title="Editar Usuario"
                >
                    {editingUser && (
                        <UserEditForm
                            user={editingUser}
                            onEditFinished={handleRefresh}
                            onCancelEdit={handleCancelEditUser}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={!!editingFabricante} 
                    onClose={handleCancelEditFabricante}
                    title="Editar Fabricante"
                >
                    {editingFabricante && (
                        <FabricanteEditForm
                            fabricante={editingFabricante}
                            onEditFinished={handleRefresh}
                            onCancelEdit={handleCancelEditFabricante}
                        />
                    )}
                </Modal>
        </div>
    );
};

export default AdminPanel;