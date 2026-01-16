import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import api from '../api';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import ProductEditForm from './ProductEditForm';
import PiezaList from './PiezaList';
import PiezaForm from './PiezaForm';
import PiezaEditForm from './PiezaEditForm';
import InventarioList from './InventarioList';
import InventarioForm from './InventarioForm';
import RepresentanteList from './RepresentanteList';
import RepresentanteForm from './RepresentanteForm';
import RepresentanteEditForm from './RepresentanteEditForm';
import WarrantyList from './WarrantyList';
import WarrantyManagerForm from './WarrantyManagerForm';
import WarrantyDetails from './WarrantyDetails';
import Modal from './Modal';
import UserHeader from './UserHeader';
import AdministracionPanel from './AdministracionPanel';
import MetricasPanel from './MetricasPanel';
import Sidebar from './Sidebar';
import { useNotification } from './NotificationProvider';

const ApoderadoPanel = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [fabricantes, setFabricantes] = useState([]);
    // const [marcas, setMarcas] = useState([]);
    const [allMarcas, setAllMarcas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [piezas, setPiezas] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [editingPieza, setEditingPieza] = useState(null);
    const [viewingPieza, setViewingPieza] = useState(null);
    const [editingInventario, setEditingInventario] = useState(null);
    const [viewingInventario, setViewingInventario] = useState(null);
    const [editingRepresentante, setEditingRepresentante] = useState(null);
    const [showCreateProductModal, setShowCreateProductModal] = useState(false);
    const [showCreatePiezaModal, setShowCreatePiezaModal] = useState(false);
    const [showCreateInventarioModal, setShowCreateInventarioModal] = useState(false);
    const [showCreateRepresentanteModal, setShowCreateRepresentanteModal] = useState(false);
    // Warranty states
    const [showCreateGarantiaModal, setShowCreateGarantiaModal] = useState(false);
    const [showEditGarantiaModal, setShowEditGarantiaModal] = useState(false);
    const [showViewGarantiaModal, setShowViewGarantiaModal] = useState(false);
    const [selectedGarantia, setSelectedGarantia] = useState(null);
    const [garantias, setGarantias] = useState([]);
    
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    
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
    
    // Check if user is authenticated and has apoderado or admin role
    const isAuthenticated = token && (hasAnyRole(['apoderado', 'admin']) || rol === 'apoderado' || rol === 'admin');

    // Handle clicks when not authenticated
    const handleUnauthenticatedClick = (e) => {
        e.preventDefault();
        navigate('/login');
    };

    useEffect(() => {
        const fetchUserData = async () => {
            // If not authenticated, show empty panel
            if (!isAuthenticated) {
                setUserData({ 
                    usuario: { 
                        nombreCompleto: 'Usuario no autenticado' 
                    } 
                });
                setLoading(false);
                return;
            }

            try {
                const perfilRes = await api.get('/apoderado/perfil');
                // const marcasRes = await api.get('/apoderado/marcas?activas_solo=true');
                const allMarcasRes = await api.get('/apoderado/marcas');
                const productosRes = await api.get('/apoderado/productos');
                const piezasRes = await api.get('/apoderado/piezas');
                const garantiasRes = await api.get('/apoderado/garantias');
    
                setUserData(perfilRes.data);
                setFabricantes(perfilRes.data.fabricantes);
                // setMarcas(marcasRes.data);
                setAllMarcas(allMarcasRes.data);
                setProductos(productosRes.data);
                setPiezas(piezasRes.data);
                setGarantias(garantiasRes.data);
                setLoading(false);
            } catch (err) {
                console.error('Error al obtener los datos:', err);
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isAuthenticated]);

    const handleProfileUpdated = (updatedData) => {
        setUserData(updatedData);
    };

    const handleRefresh = async () => {
        setRefreshKey(prevKey => prevKey + 1);
        setEditingProduct(null);
        setEditingPieza(null);
        setEditingInventario(null);
        setEditingRepresentante(null);
        setShowCreateProductModal(false);
        setShowCreatePiezaModal(false);
        setShowCreateInventarioModal(false);
        setShowCreateRepresentanteModal(false);
        // Reset warranty modals
        setShowCreateGarantiaModal(false);
        setShowEditGarantiaModal(false);
        setShowViewGarantiaModal(false);
        setSelectedGarantia(null);
        
        // Refetch data to ensure forms have updated lists
        try {
            // const marcasRes = await api.get('/apoderado/marcas?activas_solo=true');
            const allMarcasRes = await api.get('/apoderado/marcas');
            const productosRes = await api.get('/apoderado/productos');
            const garantiasRes = await api.get('/apoderado/garantias');
            
            // setMarcas(marcasRes.data);
            setAllMarcas(allMarcasRes.data);
            setProductos(productosRes.data);
            setGarantias(garantiasRes.data);
        } catch (err) {
            console.error('Error al refrescar datos:', err);
        }
    };

    const handleCopyRegistrationLink = async () => {
        const registrationUrl = `${window.location.origin}/registro`;
        try {
            await navigator.clipboard.writeText(registrationUrl);
            showSuccess('Link a portal público de registro copiado');
        } catch (err) {
            console.error('Error al copiar al portapapeles:', err);
            showError('Error al copiar el link. URL: ' + registrationUrl);
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
    };
    
    const handleViewProduct = (product) => {
        setViewingProduct(product);
    };
    
    const handleCancelEditProduct = () => {
        setEditingProduct(null);
    };

    const handleCancelViewProduct = () => {
        setViewingProduct(null);
    };

    const handleEditPieza = (pieza) => {
        setEditingPieza(pieza);
    };
    
    const handleViewPieza = (pieza) => {
        setViewingPieza(pieza);
    };
    
    const handleCancelEditPieza = () => {
        setEditingPieza(null);
    };

    const handleCancelViewPieza = () => {
        setViewingPieza(null);
    };

    const handleEditInventario = (item) => {
        setEditingInventario(item);
    };

    const handleViewInventario = (item) => {
        setViewingInventario(item);
    };

    const handleCancelEditInventario = () => {
        setEditingInventario(null);
    };

    const handleCancelViewInventario = () => {
        setViewingInventario(null);
    };

    const handleEditRepresentante = (representante) => {
        setEditingRepresentante(representante);
    };

    const handleCancelEditRepresentante = () => {
        setEditingRepresentante(null);
    };

    // Warranty handlers
    const handleEditGarantia = (garantia) => {
        setSelectedGarantia(garantia);
        setShowEditGarantiaModal(true);
    };

    const handleViewGarantia = (garantia) => {
        setSelectedGarantia(garantia);
        setShowViewGarantiaModal(true);
    };

    const handleDeleteGarantia = async (garantia) => {
        if (window.confirm(`¿Está seguro de que desea eliminar la garantía "${garantia.nombre}"?`)) {
            try {
                await api.delete(`/apoderado/garantias/${garantia._id}`);
                handleRefresh();
            } catch (err) {
                console.error('Error al eliminar garantía:', err);
                alert('Error al eliminar la garantía');
            }
        }
    };

    const handleCancelEditGarantia = () => {
        setShowEditGarantiaModal(false);
        setSelectedGarantia(null);
    };

    const handleCancelViewGarantia = () => {
        setShowViewGarantiaModal(false);
        setSelectedGarantia(null);
    };

    if (loading) {
        return <p>Cargando datos del usuario...</p>;
    }

    // Determine userType based on roles array (admin takes priority)
    const getUserType = () => {
        if (hasAnyRole(['admin'])) return 'admin';
        if (hasAnyRole(['apoderado'])) return 'apoderado';
        return rol || "apoderado";
    };

    return (
        <div className="apoderado-panel apoderado-panel-with-sidebar">
            <UserHeader 
                user={userData}
                onProfileUpdated={handleProfileUpdated}
                userType={getUserType()}
                welcomeMessage={`Bienvenido/a ${userData?.usuario?.nombreCompleto || ''}`}
            />
            
            <div className="panel-with-sidebar">
                {isAuthenticated && (
                    <Sidebar
                        basePath="/apoderado"
                        items={[
                            {
                                label: 'Dashboard',
                                description: 'Métricas del sistema',
                                path: '/metricas',
                                icon: '▣'
                            },
                            {
                                label: 'Mis Productos',
                                description: 'Gestión de productos',
                                path: '/productos',
                                icon: '◫'
                            },
                            {
                                label: 'Repuestos / Piezas',
                                description: 'Gestión de piezas',
                                path: '/piezas',
                                icon: '⚙'
                            },
                            {
                                label: 'Inventario',
                                description: 'Control de stock',
                                path: '/inventario',
                                icon: '≡'
                            },
                            {
                                label: 'Representantes',
                                description: 'Gestión de representantes',
                                path: '/representantes',
                                icon: '◉'
                            },
                            {
                                label: 'Garantías',
                                description: 'Gestión de garantías',
                                path: '/garantias',
                                icon: '◈'
                            },
                            {
                                label: 'Portal de Registro',
                                description: 'Copiar link de registro',
                                icon: '🔗',
                                onClick: handleCopyRegistrationLink
                            },
                            {
                                label: 'Administración',
                                description: 'Configuración y datos',
                                path: '/administracion',
                                icon: '⚑'
                            }
                        ]}
                    />
                )}

                <div className="sidebar-content">
                    {!isAuthenticated ? (
                        <div className="unauthenticated-message">
                            <h3>Acceso Restringido</h3>
                            <p>Para ver el contenido y gestionar datos, debe iniciar sesión.</p>
                            <button onClick={handleUnauthenticatedClick} className="login-redirect-button">
                                Iniciar Sesión
                            </button>
                        </div>
                    ) : (
                    <Routes>
                        <Route index element={<Navigate to="metricas" replace />} />
                        <Route path="metricas" element={<MetricasPanel />} />
                        <Route path="productos" element={
                        <>
                            <div className="list-container">
                                <div className="section-header">
                                    <h3>Gestión de Productos</h3>
                                    <button 
                                        className="create-button"
                                        onClick={() => setShowCreateProductModal(true)}
                                    >
                                        Crear Producto
                                    </button>
                                </div>
                            </div>
                            <ProductList 
                                refreshTrigger={refreshKey} 
                                onEdit={handleEditProduct}
                                onView={handleViewProduct}
                            />
                        </>
                    } />
                    <Route path="piezas" element={
                        <>
                            <div className="list-container">
                                <div className="section-header">
                                    <h3>Gestión de Repuestos / Piezas</h3>
                                    <button 
                                        className="create-button"
                                        onClick={() => setShowCreatePiezaModal(true)}
                                    >
                                        Crear Pieza
                                    </button>
                                </div>
                            </div>
                            <PiezaList 
                                refreshTrigger={refreshKey} 
                                onEdit={handleEditPieza}
                                onView={handleViewPieza}
                            />
                        </>
                    } />
                    <Route path="inventario" element={
                        <>
                            <div className="list-container">
                                <div className="section-header">
                                    <h3>Gestión de Inventario</h3>
                                    <button 
                                        className="create-button"
                                        onClick={() => setShowCreateInventarioModal(true)}
                                    >
                                        Agregar al Inventario
                                    </button>
                                </div>
                            </div>
                            <InventarioList
                                refreshTrigger={refreshKey}
                                onEdit={handleEditInventario}
                                onView={handleViewInventario}
                            />
                        </>
                    } />
                    <Route path="representantes" element={
                        <>
                            <div className="list-container">
                                <div className="section-header">
                                    <h3>Gestión de Representantes</h3>
                                    <button 
                                        className="create-button"
                                        onClick={() => setShowCreateRepresentanteModal(true)}
                                    >
                                        Crear Representante
                                    </button>
                                </div>
                            </div>
                            <RepresentanteList
                                refreshTrigger={refreshKey}
                                onEdit={handleEditRepresentante}
                            />
                        </>
                    } />
                    <Route path="garantias" element={
                        <>
                            <div className="list-container">
                                <div className="section-header">
                                    <h3>Gestión de Garantías</h3>
                                    <button 
                                        className="create-button"
                                        onClick={() => setShowCreateGarantiaModal(true)}
                                    >
                                        Crear Garantía
                                    </button>
                                </div>
                            </div>
                            <WarrantyList 
                                garantias={garantias}
                                onEdit={handleEditGarantia}
                                onDelete={handleDeleteGarantia}
                                onView={handleViewGarantia}
                            />
                        </>
                    } />
                    <Route path="administracion" element={<AdministracionPanel fabricantes={fabricantes} allMarcas={allMarcas} onRefresh={handleRefresh} />} />
                </Routes>
                )}
                </div>
            </div>
                
            {/* Modals */}
            <Modal 
                    isOpen={showCreateProductModal} 
                    onClose={() => setShowCreateProductModal(false)}
                    title="Crear Nuevo Producto"
                >
                    <ProductForm 
                        onProductAdded={handleRefresh} 
                        fabricantes={fabricantes} 
                        marcas={allMarcas} 
                    />
                </Modal>

                <Modal 
                    isOpen={showCreatePiezaModal} 
                    onClose={() => setShowCreatePiezaModal(false)}
                    title="Crear Nueva Pieza"
                >
                    <PiezaForm 
                        onPiezaAdded={handleRefresh} 
                        productos={productos}
                        fabricantes={fabricantes}
                        marcas={allMarcas}
                    />
                </Modal>

                <Modal 
                    isOpen={showCreateInventarioModal} 
                    onClose={() => setShowCreateInventarioModal(false)}
                    title="Agregar al Inventario"
                >
                    <InventarioForm
                        onInventarioAdded={handleRefresh}
                        productos={productos}
                        piezas={piezas}
                        editingItem={null}
                        onCancelEdit={() => setShowCreateInventarioModal(false)}
                    />
                </Modal>

                <Modal 
                    isOpen={!!editingProduct} 
                    onClose={handleCancelEditProduct}
                    title="Editar Producto"
                >
                    {editingProduct && (
                        <ProductEditForm 
                            product={editingProduct} 
                            fabricantes={fabricantes} 
                            marcas={allMarcas} 
                            onEditFinished={handleRefresh}
                            onCancelEdit={handleCancelEditProduct}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={!!viewingProduct} 
                    onClose={handleCancelViewProduct}
                    title="Ver Producto"
                >
                    {viewingProduct && (
                        <ProductEditForm 
                            product={viewingProduct} 
                            fabricantes={fabricantes} 
                            marcas={allMarcas} 
                            onEditFinished={handleRefresh}
                            onCancelEdit={handleCancelViewProduct}
                            readOnly={true}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={!!editingPieza} 
                    onClose={handleCancelEditPieza}
                    title="Editar Pieza"
                >
                    {editingPieza && (
                        <PiezaEditForm 
                            pieza={editingPieza} 
                            productos={productos}
                            fabricantes={fabricantes}
                            marcas={allMarcas}
                            onEditFinished={handleRefresh}
                            onCancelEdit={handleCancelEditPieza}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={!!viewingPieza} 
                    onClose={handleCancelViewPieza}
                    title="Ver Pieza"
                >
                    {viewingPieza && (
                        <PiezaEditForm 
                            pieza={viewingPieza} 
                            productos={productos}
                            fabricantes={fabricantes}
                            marcas={allMarcas}
                            onEditFinished={handleRefresh}
                            onCancelEdit={handleCancelViewPieza}
                            readOnly={true}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={!!editingInventario} 
                    onClose={handleCancelEditInventario}
                    title="Editar Inventario"
                >
                    {editingInventario && (
                        <InventarioForm
                            onInventarioAdded={handleRefresh}
                            productos={productos}
                            piezas={piezas}
                            editingItem={editingInventario}
                            onCancelEdit={handleCancelEditInventario}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={!!viewingInventario} 
                    onClose={handleCancelViewInventario}
                    title="Ver Inventario"
                >
                    {viewingInventario && (
                        <InventarioForm
                            onInventarioAdded={handleRefresh}
                            productos={productos}
                            piezas={piezas}
                            editingItem={viewingInventario}
                            onCancelEdit={handleCancelViewInventario}
                            readOnly={true}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={showCreateRepresentanteModal} 
                    onClose={() => setShowCreateRepresentanteModal(false)}
                    title="Crear Nuevo Representante"
                >
                    <RepresentanteForm 
                        onRepresentanteAdded={handleRefresh} 
                        fabricantes={fabricantes}
                        marcas={allMarcas}
                    />
                </Modal>

                <Modal 
                    isOpen={!!editingRepresentante} 
                    onClose={handleCancelEditRepresentante}
                    title="Editar Representante"
                >
                    {editingRepresentante && (
                        <RepresentanteEditForm
                            representante={editingRepresentante}
                            onEditFinished={handleRefresh}
                            onCancelEdit={handleCancelEditRepresentante}
                            fabricantes={fabricantes}
                            marcas={allMarcas}
                        />
                    )}
                </Modal>

                {/* Warranty Modals */}
                <Modal 
                    isOpen={showCreateGarantiaModal} 
                    onClose={() => setShowCreateGarantiaModal(false)}
                    title="Crear Nueva Garantía"
                >
                    <WarrantyManagerForm
                        fabricantes={fabricantes}
                        marcas={allMarcas}
                        onSubmit={async (formData) => {
                            try {
                                await api.post('/apoderado/garantias/add', formData);
                                setShowCreateGarantiaModal(false);
                                handleRefresh();
                            } catch (err) {
                                console.error('Error al crear garantía:', err);
                                alert('Error al crear la garantía');
                            }
                        }}
                        onCancel={() => setShowCreateGarantiaModal(false)}
                        isEditing={false}
                    />
                </Modal>

                <Modal 
                    isOpen={showEditGarantiaModal} 
                    onClose={handleCancelEditGarantia}
                    title="Editar Garantía"
                >
                    {selectedGarantia && (
                        <WarrantyManagerForm
                            garantia={selectedGarantia}
                            fabricantes={fabricantes}
                            marcas={allMarcas}
                            onSubmit={async (formData) => {
                                try {
                                    await api.put(`/apoderado/garantias/${selectedGarantia._id}`, formData);
                                    setShowEditGarantiaModal(false);
                                    setSelectedGarantia(null);
                                    handleRefresh();
                                } catch (err) {
                                    console.error('Error al actualizar garantía:', err);
                                    alert('Error al actualizar la garantía');
                                }
                            }}
                            onCancel={handleCancelEditGarantia}
                            isEditing={true}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={showViewGarantiaModal} 
                    onClose={handleCancelViewGarantia}
                    title={selectedGarantia ? `Detalles de Garantía: ${selectedGarantia.nombre}` : "Ver Garantía"}
                    size="large"
                >
                    {selectedGarantia && (
                        <WarrantyDetails
                            garantia={selectedGarantia}
                            onClose={handleCancelViewGarantia}
                        />
                    )}
                </Modal>
        </div>
    );
};

export default ApoderadoPanel;