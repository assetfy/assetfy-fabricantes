import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Modal from './Modal';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import QRPreviewModal from './QRPreviewModal';
import RepresentanteForm from './RepresentanteForm';
import Tabs from './Tabs';
import AttributesManager from './AttributesManager';
import WarrantyForm from './WarrantyForm';
import WarrantyInfo from './WarrantyInfo';
import WarrantyManagerForm from './WarrantyManagerForm';
import WarrantyList from './WarrantyList';
import WarrantyDetails from './WarrantyDetails';
import UserHeader from './UserHeader';
import AdministracionPanel from './AdministracionPanel';

// Mock data for demonstration with the new modelo field
const mockMarcas = [
    { _id: '1', nombre: 'Samsung', fabricante: { _id: '1', razonSocial: 'Tech Solutions S.A.' } },
    { _id: '2', nombre: 'LG', fabricante: { _id: '1', razonSocial: 'Tech Solutions S.A.' } },
    { _id: '3', nombre: 'Sony', fabricante: { _id: '2', razonSocial: 'Innovación Digital SRL' } }
];

const mockFabricantes = [
    { _id: '1', razonSocial: 'Tech Solutions S.A.', cuit: '30-12345678-9' },
    { _id: '2', razonSocial: 'Innovación Digital SRL', cuit: '30-87654321-0' }
];

const mockGarantias = [
    {
        _id: '1',
        idGarantia: 'GAR001',
        nombre: 'Garantía Estándar',
        duracionNumero: 12,
        duracionUnidad: 'meses',
        fechaInicio: 'Compra',
        costoGarantia: 'Incluido',
        tipoCobertura: ['defectos de fabricación', 'fallas eléctricas'],
        partesCubiertas: 'Producto completo',
        exclusiones: ['Daños por mal uso', 'humedad'],
        limitacionesGeograficas: 'Cobertura local',
        serviciosIncluidos: ['Reparación', 'reemplazo'],
        requiereRegistro: false,
        comprobanteObligatorio: true,
        usoAutorizado: ['doméstico', 'profesional'],
        instalacionCertificada: false,
        mantenimientoDocumentado: false,
        canalesReclamo: ['Web', 'call center'],
        tiempoRespuesta: '7 días',
        opcionesLogistica: 'envío a service center',
        maximoReclamos: 0,
        responsabilidadesCliente: ['Empaque adecuado en devoluciones'],
        pagoTraslado: 'A cargo del cliente',
        estado: 'Activa',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
    },
    {
        _id: '2',
        idGarantia: 'GAR002',
        nombre: 'Garantía Premium',
        duracionNumero: 2,
        duracionUnidad: 'años',
        fechaInicio: 'Registro',
        costoGarantia: 'Adicional',
        tipoCobertura: ['defectos de fabricación', 'fallas eléctricas', 'accidentes'],
        partesCubiertas: 'Producto completo',
        exclusiones: ['modificaciones no autorizadas'],
        limitacionesGeograficas: 'internacional',
        serviciosIncluidos: ['Reparación', 'reemplazo', 'soporte técnico'],
        requiereRegistro: true,
        comprobanteObligatorio: true,
        usoAutorizado: ['doméstico', 'profesional', 'industrial'],
        instalacionCertificada: true,
        mantenimientoDocumentado: true,
        canalesReclamo: ['Web', 'app', 'call center', 'tienda'],
        tiempoRespuesta: '48 horas',
        opcionesLogistica: 'visita técnica',
        maximoReclamos: 5,
        responsabilidadesCliente: ['Empaque adecuado en devoluciones', 'Uso de repuestos originales'],
        pagoTraslado: 'Cubierto',
        estado: 'Activa',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20')
    }
];

const mockProductos = [
    { 
        _id: '1', 
        idProducto: 'PROD001',
        modelo: 'Galaxy S23', // Changed from 'nombre' to 'modelo'
        descripcion: 'Smartphone de última generación', 
        precio: 850000, 
        fabricante: { _id: '1', razonSocial: 'Tech Solutions S.A.' }, 
        marca: { _id: '1', nombre: 'Samsung' }, 
        estado: 'Activo',
        manuales: [
            { _id: 'm1', originalName: 'manual_galaxy_s23.pdf', url: '#', uploadDate: new Date() },
            { _id: 'm2', originalName: 'guia_rapida.pdf', url: '#', uploadDate: new Date() }
        ],
        atributos: [
            { nombre: 'Color', tipo: 'lista', valores: ['Negro', 'Blanco', 'Violeta'] },
            { nombre: 'Almacenamiento', tipo: 'lista', valores: ['128GB', '256GB', '512GB'] },
            { nombre: 'Material', tipo: 'predefinido', valor: 'Aluminum y Cristal' }
        ],
        garantia: {
            tipoGarantia: 'Plazo desde fecha de venta',
            plazoNumero: 12,
            plazoUnidad: 'meses',
            permitirEdicion: true
        }
    },
    { 
        _id: '2', 
        idProducto: 'PROD002',
        modelo: 'OLED 55C3', // Changed from 'nombre' to 'modelo'
        descripcion: 'TV OLED 55 pulgadas', 
        precio: 1200000, 
        fabricante: { _id: '1', razonSocial: 'Tech Solutions S.A.' }, 
        marca: { _id: '2', nombre: 'LG' }, 
        estado: 'Activo',
        manuales: [
            { _id: 'm3', originalName: 'manual_tv_lg.pdf', url: '#', uploadDate: new Date() }
        ],
        atributos: [
            { nombre: 'Tamaño', tipo: 'predefinido', valor: '55 pulgadas' },
            { nombre: 'Resolución', tipo: 'predefinido', valor: '4K OLED' },
            { nombre: 'Número de Serie', tipo: 'input' }
        ],
        garantia: {
            tipoGarantia: 'Plazo desde fecha de venta',
            plazoNumero: 2,
            plazoUnidad: 'años',
            permitirEdicion: false
        }
    },
    { 
        _id: '3', 
        idProducto: 'PROD003',
        modelo: 'WH-1000XM5', // Changed from 'nombre' to 'modelo'
        descripcion: 'Auriculares inalámbricos con cancelación de ruido', 
        precio: 450000, 
        fabricante: { _id: '2', razonSocial: 'Innovación Digital SRL' }, 
        marca: { _id: '3', nombre: 'Sony' }, 
        estado: 'Descontinuado',
        manuales: [],
        atributos: [
            { nombre: 'Color', tipo: 'lista', valores: ['Negro', 'Plata'] },
            { nombre: 'Tipo de Conexión', tipo: 'predefinido', valor: 'Bluetooth 5.0' }
        ],
        garantia: {
            tipoGarantia: 'Sin garantia',
            permitirEdicion: false
        }
    }
];

// Mock inventory data
const mockInventario = [
    {
        _id: 'inv1',
        idInventario: 'INV001',
        numeroSerie: 'SM-S901BZKHARO-001',
        estado: 'stock',
        producto: mockProductos[0], // Galaxy S23
        atributos: [
            { nombre: 'Color', valor: 'Negro' },
            { nombre: 'Almacenamiento', valor: '256GB' },
            { nombre: 'Material', valor: 'Aluminum y Cristal' }
        ],
        comprador: {},
        garantia: {
            tipoGarantia: 'Plazo desde fecha de venta',
            plazoNumero: 12,
            plazoUnidad: 'meses',
            fechaExpiracion: null
        }
    },
    {
        _id: 'inv2',
        idInventario: 'INV002',
        numeroSerie: 'SM-S901BZKHARO-002',
        estado: 'vendido',
        producto: mockProductos[0], // Galaxy S23
        atributos: [
            { nombre: 'Color', valor: 'Violeta' },
            { nombre: 'Almacenamiento', valor: '128GB' },
            { nombre: 'Material', valor: 'Aluminum y Cristal' }
        ],
        comprador: {
            nombreCompleto: 'María García',
            correoElectronico: 'maria.garcia@email.com',
            telefono: '+54 11 1234-5678'
        },

    },
    {
        _id: 'inv3',
        idInventario: 'INV003',
        numeroSerie: 'OLED55C3PSA-001',
        estado: 'stock',
        producto: mockProductos[1], // OLED 55C3
        atributos: [
            { nombre: 'Tamaño', valor: '55 pulgadas' },
            { nombre: 'Resolución', valor: '4K OLED' },
            { nombre: 'Número de Serie', valor: 'OLED55C3PSA-001' }
        ],
        comprador: {},
        garantia: {
            tipoGarantia: 'Plazo desde fecha de venta',
            plazoNumero: 2,
            plazoUnidad: 'años',
            fechaExpiracion: null
        }
    }
];

const ProductList = ({ refreshTrigger, onEdit }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const { showSuccess } = useNotification();

    const filteredProducts = mockProductos.filter(producto => {
        const matchesSearch = searchTerm === '' || 
            producto.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = estadoFilter === 'todos' || producto.estado === estadoFilter;
        return matchesSearch && matchesEstado;
    });

    const handleEditClick = (producto) => {
        if (onEdit) {
            onEdit(producto);
        }
    };

    const handleDeleteClick = async (producto) => {
        setConfirmDialog({ 
            isOpen: true, 
            itemId: producto._id, 
            itemName: producto.modelo 
        });
    };

    const handleConfirmDelete = async () => {
        const itemName = confirmDialog.itemName;
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
        showSuccess(`Producto "${itemName}" eliminado exitosamente`);
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
    };

    if (filteredProducts.length === 0 && !searchTerm) {
        return (
            <div className="list-container">
                <h3>Lista de Productos</h3>
                <p>No tienes productos registrados aún.</p>
            </div>
        );
    }

    return (
        <div className="list-container">
            <h3>Lista de Productos</h3>
            <div className="search-filter-container">
                <input
                    type="text"
                    placeholder="Buscar por ID, modelo, descripción o marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value)}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Descontinuado">Descontinuado</option>
                </select>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID Producto</th>
                        <th>Modelo</th>
                        <th>Descripción</th>
                        <th>Precio</th>
                        <th>Fabricante</th>
                        <th>Marca</th>
                        <th>Estado</th>
                        <th>Manuales</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map(producto => (
                        <tr key={producto._id}>
                            <td>{producto.idProducto || 'N/A'}</td>
                            <td>{producto.modelo}</td>
                            <td>{producto.descripcion}</td>
                            <td>${producto.precio}</td>
                            <td>{producto.fabricante ? producto.fabricante.razonSocial : 'N/A'}</td>
                            <td>{producto.marca ? producto.marca.nombre : 'N/A'}</td>
                            <td>{producto.estado || 'Activo'}</td>
                            <td>
                                {producto.manuales && producto.manuales.length > 0 ? (
                                    <div>
                                        {producto.manuales.map((manual, index) => (
                                            <div key={index}>
                                                <a href={manual.url} target="_blank" rel="noopener noreferrer">
                                                    {manual.originalName}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    'Sin manuales'
                                )}
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button 
                                        className="action-btn edit-btn" 
                                        onClick={() => handleEditClick(producto)}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        className="action-btn delete-btn" 
                                        onClick={() => handleDeleteClick(producto)}
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
            
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirmar eliminación"
                message={`¿Estás seguro de que quieres eliminar el producto "${confirmDialog.itemName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

const ProductForm = ({ onProductAdded }) => {
    const { showSuccess } = useNotification();
    const [formData, setFormData] = useState({
        modelo: '',
        descripcion: '',
        precio: '',
        fabricante: '',
        marca: '',
        estado: 'Activo'
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [atributos, setAtributos] = useState([]);
    const [garantia, setGarantia] = useState({
        tipoGarantia: 'Sin garantia',
        plazoNumero: null,
        plazoUnidad: null,
        permitirEdicion: false
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Simulate API call
        showSuccess('Producto creado con éxito!');
        
        if (selectedFiles.length > 0) {
            showSuccess(`${selectedFiles.length} archivos serían subidos a S3 en: manuales/${mockMarcas.find(m => m._id === formData.marca)?.nombre || 'marca'}/${formData.modelo}`);
        }

        if (atributos.length > 0) {
            showSuccess(`Se agregaron ${atributos.length} atributos al producto`);
        }

        setFormData({ modelo: '', descripcion: '', precio: '', fabricante: '', marca: '', estado: 'Activo' });
        setSelectedFiles([]);
        setAtributos([]);
        const fileInput = document.getElementById('manualFiles');
        if (fileInput) {
            fileInput.value = '';
        }
        
        if (onProductAdded) {
            onProductAdded();
        }
    };

    return (
        <div className="form-container">
            <h3>Crear Nuevo Producto</h3>
            <form onSubmit={handleSubmit}>
                <Tabs
                    tabs={[
                        {
                            label: "Información Básica",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>Modelo del Producto</label>
                                        <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Descripción</label>
                                        <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Precio</label>
                                        <input type="number" name="precio" value={formData.precio} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Fabricante</label>
                                        <select name="fabricante" value={formData.fabricante} onChange={handleChange} required>
                                            <option value="">Selecciona un fabricante</option>
                                            {mockFabricantes.map(fab => (
                                                <option key={fab._id} value={fab._id}>{fab.razonSocial}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Marca</label>
                                        <select name="marca" value={formData.marca} onChange={handleChange} required>
                                            <option value="">Selecciona una marca</option>
                                            {mockMarcas.filter(m => m.fabricante._id === formData.fabricante).map(m => (
                                                <option key={m._id} value={m._id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select name="estado" value={formData.estado} onChange={handleChange} required>
                                            <option value="Activo">Activo</option>
                                            <option value="Descontinuado">Descontinuado</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Manuales (PDF, DOC, DOCX, TXT, JPG, JPEG, PNG - Máximo 5 archivos, 10MB cada uno)</label>
                                        <input 
                                            type="file" 
                                            id="manualFiles"
                                            multiple 
                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                        />
                                        {selectedFiles.length > 0 && (
                                            <div className="file-list">
                                                <p>Archivos seleccionados:</p>
                                                <ul>
                                                    {selectedFiles.map((file, index) => (
                                                        <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                                                    ))}
                                                </ul>
                                                <p style={{color: '#007bff', fontSize: '0.9rem'}}>
                                                    Ruta S3 (Demo): manuales/{mockMarcas.find(m => m._id === formData.marca)?.nombre || '[marca]'}/{formData.modelo || '[modelo]'}/
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )
                        },
                        {
                            label: "Atributos",
                            content: (
                                <AttributesManager 
                                    atributos={atributos}
                                    onAtributosChange={setAtributos}
                                />
                            )
                        },
                        {
                            label: "Garantía",
                            content: (
                                <WarrantyForm 
                                    garantia={garantia}
                                    onGarantiaChange={setGarantia}
                                />
                            )
                        }
                    ]}
                />
                <button type="submit">Crear Producto</button>
            </form>
        </div>
    );
};

const ProductEditForm = ({ product, onEditFinished, onCancelEdit }) => {
    const { showSuccess } = useNotification();
    const [formData, setFormData] = useState({
        modelo: product?.modelo || '',
        descripcion: product?.descripcion || '',
        precio: product?.precio || 0,
        fabricante: product?.fabricante?._id || '',
        marca: product?.marca?._id || '',
        estado: product?.estado || 'Activo'
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState(product?.manuales || []);
    const [atributos, setAtributos] = useState(product?.atributos || []);
    const [garantia, setGarantia] = useState(product?.garantia || {
        tipoGarantia: 'Sin garantia',
        plazoNumero: null,
        plazoUnidad: null,
        permitirEdicion: false
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    const handleDeleteFile = async (manualId) => {
        setExistingFiles(existingFiles.filter(file => file._id !== manualId));
        showSuccess('Archivo eliminado con éxito!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        showSuccess('Producto actualizado con éxito!');
        
        if (selectedFiles.length > 0) {
            showSuccess(`${selectedFiles.length} archivos nuevos serían subidos a S3`);
            setSelectedFiles([]);
            const fileInput = document.getElementById('editManualFiles');
            if (fileInput) {
                fileInput.value = '';
            }
        }

        if (atributos.length > 0) {
            showSuccess(`Se actualizaron los atributos del producto`);
        }
        
        if (onEditFinished) {
            onEditFinished();
        }
    };

    return (
        <div className="form-container">
            <h3>Editar Producto</h3>
            <form onSubmit={handleSubmit}>
                <Tabs
                    tabs={[
                        {
                            label: "Información Básica",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>Modelo del Producto</label>
                                        <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Descripción</label>
                                        <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Precio</label>
                                        <input type="number" name="precio" value={formData.precio} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Fabricante</label>
                                        <select name="fabricante" value={formData.fabricante} onChange={handleChange} required>
                                            <option value="">Selecciona un fabricante</option>
                                            {mockFabricantes.map(fab => (
                                                <option key={fab._id} value={fab._id}>{fab.razonSocial}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Marca</label>
                                        <select name="marca" value={formData.marca} onChange={handleChange} required>
                                            <option value="">Selecciona una marca</option>
                                            {mockMarcas.filter(m => m.fabricante._id === formData.fabricante).map(m => (
                                                <option key={m._id} value={m._id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select name="estado" value={formData.estado} onChange={handleChange} required>
                                            <option value="Activo">Activo</option>
                                            <option value="Descontinuado">Descontinuado</option>
                                        </select>
                                    </div>

                                    {/* Existing files section */}
                                    {existingFiles.length > 0 && (
                                        <div className="form-group">
                                            <label>Manuales existentes</label>
                                            <div className="existing-files">
                                                {existingFiles.map((file) => (
                                                    <div key={file._id} className="file-item">
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                            {file.originalName}
                                                        </a>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleDeleteFile(file._id)}
                                                            className="delete-file-btn"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Agregar nuevos manuales (PDF, DOC, DOCX, TXT, JPG, JPEG, PNG - Máximo 5 archivos, 10MB cada uno)</label>
                                        <input 
                                            type="file" 
                                            id="editManualFiles"
                                            multiple 
                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                        />
                                        {selectedFiles.length > 0 && (
                                            <div className="file-list">
                                                <p>Archivos seleccionados:</p>
                                                <ul>
                                                    {selectedFiles.map((file, index) => (
                                                        <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )
                        },
                        {
                            label: "Atributos",
                            content: (
                                <AttributesManager 
                                    atributos={atributos}
                                    onAtributosChange={setAtributos}
                                />
                            )
                        },
                        {
                            label: "Garantía",
                            content: (
                                <WarrantyForm 
                                    garantia={garantia}
                                    onGarantiaChange={setGarantia}
                                />
                            )
                        }
                    ]}
                />
                <button type="submit">Actualizar Producto</button>
                <button type="button" onClick={onCancelEdit}>Cancelar</button>
            </form>
        </div>
    );
};

// Demo Inventory List Component
const DemoInventarioList = ({ onEdit, onView }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [qrPreviewModal, setQrPreviewModal] = useState({ isOpen: false, item: null });

    const handlePrintQR = (item) => {
        setQrPreviewModal({ isOpen: true, item });
    };

    const handleCloseQRPreview = () => {
        setQrPreviewModal({ isOpen: false, item: null });
    };

    const formatWarrantyExpiration = (item) => {
        if (!item.garantia || item.garantia.tipoGarantia === 'Sin garantia') {
            return 'Sin garantía';
        }
        
        if (!item.garantia.fechaExpiracion) {
            return 'No calculada';
        }
        
        const expDate = new Date(item.garantia.fechaExpiracion);
        const now = new Date();
        const isExpired = expDate < now;
        
        // Format as short date
        const formatted = expDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        
        return isExpired ? `${formatted} (Exp.)` : formatted;
    };

    const filteredInventario = mockInventario.filter(item => {
        const matchesSearch = item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             item.producto.modelo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = estadoFilter === 'todos' || item.estado === estadoFilter;
        return matchesSearch && matchesEstado;
    });

    return (
        <div className="list-container">
            <h3>Lista de Inventario</h3>
            <div className="search-filter-container">
                <input
                    type="text"
                    placeholder="Buscar por ID inventario, producto, serie o comprador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value)}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="stock">En Stock</option>
                    <option value="vendido">Vendido</option>
                    <option value="alquilado">Alquilado</option>
                </select>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID Inventario</th>
                        <th>Nro. Serie</th>
                        <th>Producto</th>
                        <th>Estado</th>
                        <th>Comprador</th>
                        <th>Expira</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredInventario.map(item => (
                        <tr key={item._id}>
                            <td>{item.idInventario}</td>
                            <td>{item.numeroSerie}</td>
                            <td>{item.producto.modelo}</td>
                            <td>{item.estado}</td>
                            <td>{item.comprador?.nombreCompleto || 'N/A'}</td>
                            <td className={item.garantia?.fechaExpiracion && new Date(item.garantia.fechaExpiracion) < new Date() ? 'warranty-expired' : ''}>
                                {formatWarrantyExpiration(item)}
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button 
                                        className="action-btn view-btn" 
                                        onClick={() => onView(item)}
                                        title="Ver detalles"
                                    >
                                        👁️
                                    </button>
                                    <button 
                                        className="action-btn edit-btn" 
                                        onClick={() => onEdit(item)}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        className="action-btn delete-btn" 
                                        onClick={() => console.log('Delete', item)}
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                    <button 
                                        className="action-btn qr-btn" 
                                        onClick={() => handlePrintQR(item)}
                                        title="Generar código QR"
                                    >
                                        📱
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <QRPreviewModal
                isOpen={qrPreviewModal.isOpen}
                onClose={handleCloseQRPreview}
                item={qrPreviewModal.item}
            />
        </div>
    );
};

// Demo Inventory Form Component
const DemoInventarioForm = ({ onInventarioAdded, editingItem, onCancelEdit }) => {
    const { showSuccess } = useNotification();
    const [formData, setFormData] = useState({
        numeroSerie: '',
        estado: 'stock',
        producto: '',
        comprador: {
            nombreCompleto: '',
            correoElectronico: '',
            telefono: '',
        },
        fechaVenta: '',
        registrado: 'No',
    });
    const [registrarDatos, setRegistrarDatos] = useState(false);
    const [atributos, setAtributos] = useState([]);
    const [garantia, setGarantia] = useState({
        tipoGarantia: 'Sin garantia',
        plazoNumero: null,
        plazoUnidad: null,
        fechaExpiracion: null
    });

    useEffect(() => {
        if (editingItem) {
            setFormData({
                numeroSerie: editingItem.numeroSerie || '',
                estado: editingItem.estado || 'stock',
                producto: editingItem.producto._id || '',
                comprador: {
                    nombreCompleto: editingItem.comprador?.nombreCompleto || '',
                    correoElectronico: editingItem.comprador?.correoElectronico || '',
                    telefono: editingItem.comprador?.telefono || '',
                },
                fechaVenta: editingItem.fechaVenta ? new Date(editingItem.fechaVenta).toISOString().split('T')[0] : '',
                registrado: editingItem.registrado || 'No',
            });
            setRegistrarDatos(editingItem.registrado === 'Si' || (editingItem.comprador?.nombreCompleto && editingItem.comprador?.nombreCompleto.trim() !== ''));
            setAtributos(editingItem.atributos || []);
            setGarantia(editingItem.garantia || {
                tipoGarantia: 'Sin garantia',
                plazoNumero: null,
                plazoUnidad: null,
                fechaExpiracion: null
            });
        }
    }, [editingItem]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('comprador.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                comprador: {
                    ...prev.comprador,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => {
                const newFormData = {
                    ...prev,
                    [name]: value
                };
                
                // Set default date when estado changes to 'vendido'
                if (name === 'estado' && value === 'vendido' && !prev.fechaVenta) {
                    newFormData.fechaVenta = new Date().toISOString().split('T')[0];
                } else if (name === 'estado' && value !== 'vendido') {
                    newFormData.fechaVenta = '';
                }
                
                return newFormData;
            });
        }
    };

    const handleProductChange = (e) => {
        const productId = e.target.value;
        setFormData(prev => ({ ...prev, producto: productId }));
        
        // Load product attributes and warranty settings
        const selectedProduct = mockProductos.find(p => p._id === productId);
        if (selectedProduct) {
            // Load attributes
            if (selectedProduct.atributos) {
                const newAtributos = selectedProduct.atributos.map(attr => ({
                    nombre: attr.nombre,
                    valor: attr.tipo === 'predefinido' ? attr.valor : ''
                }));
                setAtributos(newAtributos);
            } else {
                setAtributos([]);
            }
            
            // Load warranty settings
            if (selectedProduct.garantia) {
                setGarantia({
                    tipoGarantia: selectedProduct.garantia.tipoGarantia || 'Sin garantia',
                    plazoNumero: selectedProduct.garantia.plazoNumero || null,
                    plazoUnidad: selectedProduct.garantia.plazoUnidad || null,
                    fechaExpiracion: null // Will be calculated when fechaVenta is set
                });
            } else {
                setGarantia({
                    tipoGarantia: 'Sin garantia',
                    plazoNumero: null,
                    plazoUnidad: null,
                    fechaExpiracion: null
                });
            }
        } else {
            setAtributos([]);
            setGarantia({
                tipoGarantia: 'Sin garantia',
                plazoNumero: null,
                plazoUnidad: null,
                fechaExpiracion: null
            });
        }
    };

    const handleAtributoChange = (index, value) => {
        const newAtributos = [...atributos];
        newAtributos[index].valor = value;
        setAtributos(newAtributos);
    };

    const handleRegistrarChange = (e) => {
        const isChecked = e.target.checked;
        setRegistrarDatos(isChecked);
        
        if (isChecked) {
            // When checkbox is checked, set registrado to 'Si'
            setFormData(prev => ({ ...prev, registrado: 'Si' }));
        } else {
            // When unchecked, set registrado to 'No' and clear buyer data
            setFormData(prev => ({ 
                ...prev, 
                registrado: 'No',
                comprador: {
                    nombreCompleto: '',
                    correoElectronico: '',
                    telefono: '',
                }
            }));
        }
    };

    const handleGenerateSerial = () => {
        // Generate a demo alphanumeric serial number
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, numeroSerie: result }));
        showSuccess('Número de serie generado exitosamente!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        showSuccess(editingItem ? 'Artículo de inventario actualizado con éxito!' : 'Artículo agregado al inventario con éxito!');
        
        if (atributos.length > 0) {
            showSuccess(`Se gestionaron ${atributos.length} atributos del artículo`);
        }

        // Reset form
        setFormData({
            numeroSerie: '',
            estado: 'stock',
            producto: '',
            comprador: {
                nombreCompleto: '',
                correoElectronico: '',
                telefono: '',
            },
            fechaVenta: '',
        });
        setAtributos([]);
        
        if (onInventarioAdded) {
            onInventarioAdded();
        }
    };

    const selectedProduct = mockProductos.find(p => p._id === formData.producto);

    return (
        <div className="form-container">
            <h3>{editingItem ? 'Editar Artículo de Inventario' : 'Agregar Artículo a Inventario'}</h3>
            <form onSubmit={handleSubmit}>
                <Tabs
                    tabs={[
                        {
                            label: "Información Básica",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>Número de Serie</label>
                                        <div className="input-with-button">
                                            <input
                                                type="text"
                                                name="numeroSerie"
                                                value={formData.numeroSerie}
                                                onChange={handleChange}
                                                required
                                            />
                                            {!editingItem && (
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateSerial}
                                                    className="generate-serial-btn"
                                                    title="Autogenerar"
                                                >
                                                    +
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Producto</label>
                                        <select
                                            name="producto"
                                            value={formData.producto}
                                            onChange={handleProductChange}
                                            required
                                        >
                                            <option value="">Selecciona un producto</option>
                                            {mockProductos.map(p => (
                                                <option key={p._id} value={p._id}>{p.modelo}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select
                                            name="estado"
                                            value={formData.estado}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="stock">En Stock</option>
                                            <option value="vendido">Vendido</option>
                                            <option value="alquilado">Alquilado</option>
                                        </select>
                                    </div>

                                    {formData.estado === 'vendido' && (
                                        <div className="form-group">
                                            <label>Fecha de Venta</label>
                                            <input
                                                type="date"
                                                name="fechaVenta"
                                                value={formData.fechaVenta}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    )}

                                    {formData.estado === 'vendido' && (
                                        <div className="form-group form-group-checkbox">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={registrarDatos}
                                                    onChange={handleRegistrarChange}
                                                />
                                                Registrar
                                            </label>
                                        </div>
                                    )}

                                    {((formData.estado === 'vendido' && registrarDatos) || (formData.estado === 'alquilado')) && (
                                        <div className="comprador-fields">
                                            <h4>Información del Comprador/Inquilino</h4>
                                            <div className="form-group">
                                                <label>Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    name="comprador.nombreCompleto"
                                                    value={formData.comprador.nombreCompleto}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Correo Electrónico</label>
                                                <input
                                                    type="email"
                                                    name="comprador.correoElectronico"
                                                    value={formData.comprador.correoElectronico}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Teléfono</label>
                                                <input
                                                    type="tel"
                                                    name="comprador.telefono"
                                                    value={formData.comprador.telefono}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )
                        },
                        {
                            label: "Atributos",
                            content: (
                                <div className="inventory-attributes">
                                    {selectedProduct ? (
                                        <>
                                            <h4>Atributos del Producto: {selectedProduct.modelo}</h4>
                                            {atributos.length > 0 ? (
                                                <div className="attributes-form">
                                                    {atributos.map((attr, index) => {
                                                        const productAttr = selectedProduct.atributos.find(pa => pa.nombre === attr.nombre);
                                                        
                                                        if (productAttr?.tipo === 'lista') {
                                                            return (
                                                                <div key={index} className="form-group">
                                                                    <label>{attr.nombre}</label>
                                                                    <select
                                                                        value={attr.valor}
                                                                        onChange={(e) => handleAtributoChange(index, e.target.value)}
                                                                        required
                                                                    >
                                                                        <option value="">Selecciona {attr.nombre}</option>
                                                                        {productAttr.valores.map((valor, vIndex) => (
                                                                            <option key={vIndex} value={valor}>{valor}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            );
                                                        } else if (productAttr?.tipo === 'input') {
                                                            return (
                                                                <div key={index} className="form-group">
                                                                    <label>{attr.nombre}</label>
                                                                    <input
                                                                        type="text"
                                                                        value={attr.valor}
                                                                        onChange={(e) => handleAtributoChange(index, e.target.value)}
                                                                        placeholder={`Ingresa ${attr.nombre}`}
                                                                        required
                                                                    />
                                                                </div>
                                                            );
                                                        } else if (productAttr?.tipo === 'predefinido') {
                                                            return (
                                                                <div key={index} className="form-group">
                                                                    <label>{attr.nombre}</label>
                                                                    <input
                                                                        type="text"
                                                                        value={attr.valor}
                                                                        readOnly
                                                                        style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                                                    />
                                                                    <small style={{ color: '#6c757d' }}>Valor predefinido del producto</small>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            ) : (
                                                <p>Este producto no tiene atributos definidos.</p>
                                            )}
                                        </>
                                    ) : (
                                        <p>Selecciona un producto para ver sus atributos.</p>
                                    )}
                                </div>
                            )
                        },
                        {
                            label: "Garantía",
                            content: (
                                <WarrantyInfo 
                                    garantia={garantia}
                                    onGarantiaChange={setGarantia}
                                    allowEdit={mockProductos.find(p => p._id === formData.producto)?.garantia?.permitirEdicion || false}
                                    fechaVenta={formData.fechaVenta}
                                    onFechaVentaChange={(fecha) => setFormData(prev => ({ ...prev, fechaVenta: fecha }))}
                                />
                            )
                        }
                    ]}
                />
                <button type="submit">{editingItem ? 'Actualizar Artículo' : 'Agregar a Inventario'}</button>
                {editingItem && (
                    <button type="button" onClick={onCancelEdit}>Cancelar Edición</button>
                )}
            </form>
        </div>
    );
};

// Demo Inventory View Component  
const DemoInventarioView = ({ item, onClose }) => {
    return (
        <div className="form-container">
            <h3>Ver Artículo de Inventario</h3>
            <Tabs
                tabs={[
                    {
                        label: "Información Básica",
                        content: (
                            <div className="view-content">
                                <div className="form-group">
                                    <label>ID Inventario</label>
                                    <input type="text" value={item.idInventario} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Número de Serie</label>
                                    <input type="text" value={item.numeroSerie} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Producto</label>
                                    <input type="text" value={item.producto.modelo} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Estado</label>
                                    <input type="text" value={item.estado} readOnly />
                                </div>
                                {item.comprador?.nombreCompleto && (
                                    <>
                                        <h4>Información del Comprador/Inquilino</h4>
                                        <div className="form-group">
                                            <label>Nombre Completo</label>
                                            <input type="text" value={item.comprador.nombreCompleto} readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label>Correo Electrónico</label>
                                            <input type="text" value={item.comprador.correoElectronico} readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label>Teléfono</label>
                                            <input type="text" value={item.comprador.telefono} readOnly />
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    },
                    {
                        label: "Atributos",
                        content: (
                            <div className="view-content">
                                <h4>Atributos del Artículo</h4>
                                {item.atributos && item.atributos.length > 0 ? (
                                    <div className="attributes-display">
                                        {item.atributos.map((attr, index) => (
                                            <div key={index} className="form-group">
                                                <label>{attr.nombre}</label>
                                                <input type="text" value={attr.valor} readOnly />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>Este artículo no tiene atributos.</p>
                                )}
                            </div>
                        )
                    },
                    {
                        label: "Garantía",
                        content: (
                            <div className="view-content">
                                <h4>Información de Garantía</h4>
                                <WarrantyInfo 
                                    garantia={item.garantia}
                                    allowEdit={false}
                                    fechaVenta={item.fechaVenta}
                                />
                            </div>
                        )
                    }
                ]}
            />
            <button type="button" onClick={onClose}>Cerrar</button>
        </div>
    );
};

const DemoApoderadoPanel = () => {
    const [showCreateProductModal, setShowCreateProductModal] = useState(false);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showCreateRepresentanteModal, setShowCreateRepresentanteModal] = useState(false);
    const [showCreateInventarioModal, setShowCreateInventarioModal] = useState(false);
    const [showEditInventarioModal, setShowEditInventarioModal] = useState(false);
    const [showViewInventarioModal, setShowViewInventarioModal] = useState(false);
    const [selectedInventario, setSelectedInventario] = useState(null);
    // Warranty states
    const [showCreateGarantiaModal, setShowCreateGarantiaModal] = useState(false);
    const [showEditGarantiaModal, setShowEditGarantiaModal] = useState(false);
    const [showViewGarantiaModal, setShowViewGarantiaModal] = useState(false);
    const [selectedGarantia, setSelectedGarantia] = useState(null);
    const [garantias, setGarantias] = useState(mockGarantias);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [userData, setUserData] = useState({
        usuario: {
            nombreCompleto: 'Juan Pérez',
            imagenPerfil: '' // No profile image initially
        }
    });

    const handleProfileUpdated = (updatedData) => {
        setUserData(prevData => ({
            ...prevData,
            usuario: {
                ...prevData.usuario,
                ...updatedData
            }
        }));
    };

    const handleProductAdded = () => {
        setShowCreateProductModal(false);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleRepresentanteAdded = () => {
        setShowCreateRepresentanteModal(false);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setShowEditProductModal(true);
    };

    const handleEditFinished = () => {
        setShowEditProductModal(false);
        setSelectedProduct(null);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleCancelEdit = () => {
        setShowEditProductModal(false);
        setSelectedProduct(null);
    };

    // Inventory handlers
    const handleInventarioAdded = () => {
        setShowCreateInventarioModal(false);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleEditInventario = (item) => {
        setSelectedInventario(item);
        setShowEditInventarioModal(true);
    };

    const handleViewInventario = (item) => {
        setSelectedInventario(item);
        setShowViewInventarioModal(true);
    };

    const handleCancelEditInventario = () => {
        setShowEditInventarioModal(false);
        setSelectedInventario(null);
    };

    const handleCloseViewInventario = () => {
        setShowViewInventarioModal(false);
        setSelectedInventario(null);
    };

    return (
        <div className="apoderado-panel">
            <UserHeader 
                user={userData}
                onProfileUpdated={handleProfileUpdated}
                userType="apoderado"
            />
            <h2>Panel del Apoderado (Demo)</h2>
            <p>Bienvenido, <strong>{userData.usuario.nombreCompleto}</strong>.</p>
            <p>Aquí puedes gestionar los productos, marcas e inventario. <strong>Demo - Mostrando nuevo campo "Modelo" y subida de archivos S3</strong></p>

            <nav>
                <ul>
                    <li><Link to="/demo/apoderado/productos">Productos</Link></li>
                    <li><Link to="/demo/apoderado/marcas">Marcas</Link></li>
                    <li><Link to="/demo/apoderado/inventario">Inventario</Link></li>
                    <li><Link to="/demo/apoderado/representantes">Representantes</Link></li>
                    <li><Link to="/demo/apoderado/garantias">Garantías</Link></li>
                    <li><Link to="/demo/metricas">Métricas</Link></li>
                    <li><Link to="/demo/apoderado/administracion">Administración</Link></li>
                </ul>
            </nav>

            <div className="content">
                <Routes>
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
                                refreshTrigger={refreshTrigger}
                                onEdit={handleEditProduct}
                            />
                        </>
                    } />
                    <Route path="marcas" element={
                        <div className="list-container">
                            <h3>Gestión de Marcas</h3>
                            <p>Funcionalidad de marcas (sin cambios en esta demo)</p>
                        </div>
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
                            <DemoInventarioList
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
                            <div className="demo-message" style={{padding: '1rem', backgroundColor: '#e8f4fd', border: '1px solid #bee5eb', borderRadius: '4px', margin: '1rem 0'}}>
                                <strong>Demo:</strong> Esta sección muestra la nueva funcionalidad de Representantes agregada al panel del apoderado.
                                Incluye campos para Razón Social, Nombre, CUIT, Cobertura (provincias y localidades argentinas con búsqueda), 
                                Dirección, Teléfonos, Correos, Sitio Web y Estado.
                            </div>
                            <div className="list-container">
                                <h3>Lista de Representantes</h3>
                                <p>No hay representantes registrados aún en esta demo. Haga clic en "Crear Representante" para ver el formulario completo.</p>
                            </div>
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
                                onEdit={(garantia) => {
                                    setSelectedGarantia(garantia);
                                    setShowEditGarantiaModal(true);
                                }}
                                onDelete={(garantia) => {
                                    if (window.confirm(`¿Está seguro de que desea eliminar la garantía "${garantia.nombre}"?`)) {
                                        // Handle delete - for now just remove from state (in real app would call API)
                                        setGarantias(prev => prev.filter(g => g._id !== garantia._id));
                                    }
                                }}
                                onView={(garantia) => {
                                    setSelectedGarantia(garantia);
                                    setShowViewGarantiaModal(true);
                                }}
                            />
                        </>
                    } />
                    <Route path="administracion" element={<AdministracionPanel />} />
                </Routes>
                
                {/* Modals */}
                <Modal 
                    isOpen={showCreateProductModal} 
                    onClose={() => setShowCreateProductModal(false)}
                    title="Crear Nuevo Producto"
                >
                    <ProductForm onProductAdded={handleProductAdded} />
                </Modal>

                <Modal 
                    isOpen={showEditProductModal} 
                    onClose={handleCancelEdit}
                    title="Editar Producto"
                >
                    {selectedProduct && (
                        <ProductEditForm 
                            product={selectedProduct}
                            onEditFinished={handleEditFinished}
                            onCancelEdit={handleCancelEdit}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={showCreateRepresentanteModal} 
                    onClose={() => setShowCreateRepresentanteModal(false)}
                    title="Crear Nuevo Representante"
                >
                    <RepresentanteForm 
                        onRepresentanteAdded={handleRepresentanteAdded}
                        fabricantes={mockFabricantes}
                        marcas={mockMarcas}
                    />
                </Modal>

                {/* Inventory Modals */}
                <Modal 
                    isOpen={showCreateInventarioModal} 
                    onClose={() => setShowCreateInventarioModal(false)}
                    title="Agregar al Inventario"
                >
                    <DemoInventarioForm
                        onInventarioAdded={handleInventarioAdded}
                        editingItem={null}
                        onCancelEdit={() => setShowCreateInventarioModal(false)}
                    />
                </Modal>

                <Modal 
                    isOpen={showEditInventarioModal} 
                    onClose={handleCancelEditInventario}
                    title="Editar Inventario"
                >
                    {selectedInventario && (
                        <DemoInventarioForm
                            onInventarioAdded={handleInventarioAdded}
                            editingItem={selectedInventario}
                            onCancelEdit={handleCancelEditInventario}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={showViewInventarioModal} 
                    onClose={handleCloseViewInventario}
                    title="Ver Artículo de Inventario"
                >
                    {selectedInventario && (
                        <DemoInventarioView
                            item={selectedInventario}
                            onClose={handleCloseViewInventario}
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
                        garantia={null}
                        onSubmit={(formData) => {
                            // In a real app, this would call the API
                            const newGarantia = {
                                _id: Date.now().toString(),
                                idGarantia: `GAR${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                                ...formData,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };
                            setGarantias(prev => [...prev, newGarantia]);
                            setShowCreateGarantiaModal(false);
                        }}
                        onCancel={() => setShowCreateGarantiaModal(false)}
                        isEditing={false}
                    />
                </Modal>

                <Modal 
                    isOpen={showEditGarantiaModal} 
                    onClose={() => setShowEditGarantiaModal(false)}
                    title="Editar Garantía"
                >
                    {selectedGarantia && (
                        <WarrantyManagerForm
                            garantia={selectedGarantia}
                            onSubmit={(formData) => {
                                // In a real app, this would call the API
                                setGarantias(prev => prev.map(g => 
                                    g._id === selectedGarantia._id 
                                        ? { ...g, ...formData, updatedAt: new Date() }
                                        : g
                                ));
                                setShowEditGarantiaModal(false);
                                setSelectedGarantia(null);
                            }}
                            onCancel={() => {
                                setShowEditGarantiaModal(false);
                                setSelectedGarantia(null);
                            }}
                            isEditing={true}
                        />
                    )}
                </Modal>

                <Modal 
                    isOpen={showViewGarantiaModal} 
                    onClose={() => setShowViewGarantiaModal(false)}
                    title={selectedGarantia ? `Detalles de Garantía: ${selectedGarantia.nombre}` : "Detalles de Garantía"}
                >
                    {selectedGarantia && (
                        <WarrantyDetails
                            garantia={selectedGarantia}
                            onClose={() => {
                                setShowViewGarantiaModal(false);
                                setSelectedGarantia(null);
                            }}
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default DemoApoderadoPanel;