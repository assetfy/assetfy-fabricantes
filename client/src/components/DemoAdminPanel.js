import React, { useState } from 'react';
import Modal from './Modal';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import Tabs from './Tabs';
import UserHeader from './UserHeader';

// Mock data for demonstration
const mockUsers = [
    { _id: '1', nombreCompleto: 'Juan Pérez', correoElectronico: 'juan@example.com', cuil: '20-12345678-9', rol: 'admin', estadoApoderado: 'Activo' },
    { _id: '2', nombreCompleto: 'María García', correoElectronico: 'maria@example.com', cuil: '27-87654321-0', rol: 'apoderado', estadoApoderado: 'Activo' },
    { _id: '3', nombreCompleto: 'Carlos López', correoElectronico: 'carlos@example.com', cuil: '20-11111111-1', rol: 'apoderado', estadoApoderado: 'Invitado' }
];

const mockFabricantes = [
    { 
        _id: '1', 
        razonSocial: 'Tech Solutions S.A.', 
        cuit: '30-12345678-9', 
        usuarioApoderado: { nombreCompleto: 'Juan Pérez' }, 
        administradores: [
            { _id: 'admin1', nombreCompleto: 'Ana García' },
            { _id: 'admin2', nombreCompleto: 'Luis Fernández' }
        ],
        estado: 'Habilitado' 
    },
    { 
        _id: '2', 
        razonSocial: 'Innovación Digital SRL', 
        cuit: '30-87654321-0', 
        usuarioApoderado: { nombreCompleto: 'María García' }, 
        administradores: [
            { _id: 'admin3', nombreCompleto: 'Pedro Martínez' }
        ],
        estado: 'Habilitado' 
    },
    { 
        _id: '3', 
        razonSocial: 'Sistemas Avanzados S.A.', 
        cuit: '30-11111111-1', 
        usuarioApoderado: { nombreCompleto: 'Carlos López' }, 
        administradores: [],
        estado: 'Deshabilitado' 
    }
];

const UserList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rolFilter, setRolFilter] = useState('todos');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const { showSuccess, showInfo } = useNotification();
    
    const filteredUsers = mockUsers.filter(user => {
        const matchesSearch = searchTerm === '' || 
            user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.correoElectronico.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.cuil.includes(searchTerm);
        const matchesRole = rolFilter === 'todos' || user.rol === rolFilter;
        return matchesSearch && matchesRole;
    });

    const handleDeleteClick = (user) => {
        setConfirmDialog({ 
            isOpen: true, 
            itemId: user._id, 
            itemName: user.nombreCompleto 
        });
    };

    const handleConfirmDelete = () => {
        const itemName = confirmDialog.itemName;
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
        showSuccess(`Usuario "${itemName}" eliminado exitosamente`);
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
    };

    const handleEditClick = (user) => {
        showInfo(`Editando usuario: ${user.nombreCompleto}`);
    };

    return (
        <>
            <div className="list-container">
                <h3>Lista de Usuarios</h3>
                <div className="search-filter-container">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o CUIL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select value={rolFilter} onChange={(e) => setRolFilter(e.target.value)}>
                        <option value="todos">Todos los roles</option>
                        <option value="admin">Admin</option>
                        <option value="apoderado">Apoderado</option>
                    </select>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>CUIL</th>
                            <th>Rol</th>
                            <th>Estado Apoderado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user._id}>
                                <td>{user.nombreCompleto}</td>
                                <td>{user.correoElectronico}</td>
                                <td>{user.cuil}</td>
                                <td>{user.rol}</td>
                                <td>{user.estadoApoderado}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            className="action-btn edit-btn" 
                                            onClick={() => handleEditClick(user)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="action-btn delete-btn" 
                                            onClick={() => handleDeleteClick(user)}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirmar eliminación"
                message={`¿Estás seguro de que quieres eliminar al usuario "${confirmDialog.itemName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </>
    );
};

const FabricanteList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const { showSuccess, showInfo } = useNotification();
    
    const filteredFabricantes = mockFabricantes.filter(fabricante => {
        const matchesSearch = searchTerm === '' || 
            fabricante.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fabricante.cuit.includes(searchTerm) ||
            fabricante.usuarioApoderado.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (fabricante.administradores && fabricante.administradores.some(admin => 
                admin.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        const matchesEstado = estadoFilter === 'todos' || fabricante.estado === estadoFilter;
        return matchesSearch && matchesEstado;
    });

    const handleDeleteClick = (fabricante) => {
        setConfirmDialog({ 
            isOpen: true, 
            itemId: fabricante._id, 
            itemName: fabricante.razonSocial 
        });
    };

    const handleConfirmDelete = () => {
        const itemName = confirmDialog.itemName;
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
        showSuccess(`Fabricante "${itemName}" eliminado exitosamente`);
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
    };

    const handleEditClick = (fabricante) => {
        showInfo(`Editando fabricante: ${fabricante.razonSocial}`);
    };

    return (
        <>
            <div className="list-container">
                <h3>Lista de Fabricantes</h3>
                <div className="search-filter-container">
                    <input
                        type="text"
                        placeholder="Buscar por razón social, CUIT, apoderado o administradores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                        <option value="todos">Todos los estados</option>
                        <option value="Habilitado">Habilitado</option>
                        <option value="Deshabilitado">Deshabilitado</option>
                    </select>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Razón Social</th>
                            <th>CUIT</th>
                            <th>Usuario Apoderado</th>
                            <th>Administradores</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFabricantes.map(fabricante => (
                            <tr key={fabricante._id}>
                                <td>{fabricante.razonSocial}</td>
                                <td>{fabricante.cuit}</td>
                                <td>{fabricante.usuarioApoderado.nombreCompleto}</td>
                                <td>
                                    {fabricante.administradores && fabricante.administradores.length > 0 ? (
                                        <div style={{ maxWidth: '200px' }}>
                                            {fabricante.administradores.map((admin, index) => (
                                                <span key={admin._id} style={{ fontSize: '0.9em' }}>
                                                    {admin.nombreCompleto}
                                                    {index < fabricante.administradores.length - 1 ? ', ' : ''}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: '#999', fontStyle: 'italic' }}>Sin administradores</span>
                                    )}
                                </td>
                                <td>{fabricante.estado}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            className="action-btn edit-btn" 
                                            onClick={() => handleEditClick(fabricante)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="action-btn delete-btn" 
                                            onClick={() => handleDeleteClick(fabricante)}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirmar eliminación"
                message={`¿Estás seguro de que quieres eliminar el fabricante "${confirmDialog.itemName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </>
    );
};

const UserForm = () => {
    const { showSuccess } = useNotification();
    
    const handleSubmit = (e) => {
        e.preventDefault();
        showSuccess('Usuario creado exitosamente');
    };

    return (
        <div className="form-container">
            <h3>Crear Nuevo Usuario</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" placeholder="Nombre completo del usuario" />
                </div>
                <div className="form-group">
                    <label>CUIL</label>
                    <input type="text" placeholder="XX-XXXXXXXX-X" />
                </div>
                <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input type="email" placeholder="usuario@dominio.com" />
                </div>
                <div className="form-group">
                    <label>Contraseña</label>
                    <input type="password" placeholder="Contraseña" />
                </div>
                <div className="form-group">
                    <label>Teléfono</label>
                    <input type="text" placeholder="Número de teléfono" />
                </div>
                <button type="submit">Crear Usuario</button>
            </form>
        </div>
    );
};

const FabricanteForm = () => {
    const { showSuccess } = useNotification();
    
    const handleSubmit = (e) => {
        e.preventDefault();
        showSuccess('Fabricante creado exitosamente');
    };

    return (
        <div className="form-container">
            <h3>Crear Nuevo Fabricante</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Razón Social</label>
                    <input type="text" placeholder="Nombre de la empresa" />
                </div>
                <div className="form-group">
                    <label>CUIT</label>
                    <input type="text" placeholder="XX-XXXXXXXX-X" />
                </div>
                <div className="form-group">
                    <label>Usuario Apoderado</label>
                    <select>
                        <option value="">Seleccione un usuario...</option>
                        <option value="1">Juan Pérez (juan@example.com)</option>
                        <option value="2">María García (maria@example.com)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Administradores (opcional)</label>
                    <select 
                        multiple 
                        style={{ height: '120px' }}
                    >
                        <option value="1">Juan Pérez (juan@example.com)</option>
                        <option value="2">María García (maria@example.com)</option>
                        <option value="3">Carlos López (carlos@example.com)</option>
                    </select>
                    <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples usuarios
                    </small>
                </div>
                <div className="form-group">
                    <label>Logo (URL)</label>
                    <input type="text" placeholder="https://..." />
                </div>
                <button type="submit">Crear Fabricante</button>
            </form>
        </div>
    );
};

const DemoAdminPanel = () => {
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showCreateFabricanteModal, setShowCreateFabricanteModal] = useState(false);
    const [userData, setUserData] = useState({
        nombreCompleto: 'Administrador del Sistema',
        imagenPerfil: '' // No profile image initially
    });

    const handleProfileUpdated = (updatedData) => {
        setUserData(updatedData);
    };

    return (
        <div className="admin-panel">
            <UserHeader 
                user={userData}
                onProfileUpdated={handleProfileUpdated}
                userType="admin"
            />
            <h2>Panel del Administrador</h2>
            <p>Bienvenido, <strong>{userData.nombreCompleto}</strong>.</p>
            <p>Aquí puedes gestionar los usuarios y fabricantes.</p>

            <div className="content">
                <Tabs
                    defaultTab={0}
                    tabs={[
                        {
                            label: "Usuarios",
                            content: (
                                <>
                                    <div className="list-container">
                                        <div className="section-header">
                                            <h3>Gestión de Usuarios</h3>
                                            <button 
                                                className="create-button"
                                                onClick={() => setShowCreateUserModal(true)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <UserList />
                                </>
                            )
                        },
                        {
                            label: "Fabricantes",
                            content: (
                                <>
                                    <div className="list-container">
                                        <div className="section-header">
                                            <h3>Gestión de Fabricantes</h3>
                                            <button 
                                                className="create-button"
                                                onClick={() => setShowCreateFabricanteModal(true)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <FabricanteList />
                                </>
                            )
                        }
                    ]}
                />
                
                {/* Modals */}
                <Modal 
                    isOpen={showCreateUserModal} 
                    onClose={() => setShowCreateUserModal(false)}
                    title="Crear Nuevo Usuario"
                >
                    <UserForm />
                </Modal>

                <Modal 
                    isOpen={showCreateFabricanteModal} 
                    onClose={() => setShowCreateFabricanteModal(false)}
                    title="Crear Nuevo Fabricante"
                >
                    <FabricanteForm />
                </Modal>
            </div>
        </div>
    );
};

export default DemoAdminPanel;