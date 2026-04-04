import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import Tabs from './Tabs';
import ChecklistRepresentante from './ChecklistRepresentante';

const RepresentanteForm = ({ onRepresentanteAdded, fabricantes, marcas, prefillData }) => {
    const [formData, setFormData] = useState({
        razonSocial: '',
        nombre: '',
        cuit: '',
        cobertura: {
            provincias: [],
            localidades: []
        },
        direccion: '',
        telefono: '',
        telefonoAdicional: '',
        correo: '',
        correoAdicional: '',
        sitioWeb: '',
        tipoRepresentante: '',
        estado: 'Activo',
        marcasRepresentadas: [],
        sucursales: [],
        checklistData: []
    });
    const [regions, setRegions] = useState({ provincias: [], localidades: {} });
    const [availableLocalidades, setAvailableLocalidades] = useState([]);
    const [provinciaSearchTerm, setProvinciaSearchTerm] = useState('');
    const [localidadSearchTerm, setLocalidadSearchTerm] = useState('');
    const [selectedFabricantes, setSelectedFabricantes] = useState([]);
    const [availableMarcas, setAvailableMarcas] = useState([]);
    const [editingSucursalIndex, setEditingSucursalIndex] = useState(null);
    const [sucursalForm, setSucursalForm] = useState({ nombre: '', direccion: '', telefono: '', correo: '' });
    const [checklistItems, setChecklistItems] = useState([]);
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const res = await api.get('/apoderado/regions');
                if (res && res.data) {
                    setRegions(res.data);
                } else {
                    console.error('Respuesta del servidor inválida para regiones');
                }
            } catch (err) {
                console.error('Error al obtener las regiones:', err);
            }
        };
        fetchRegions();

        const fetchChecklistConfig = async () => {
            try {
                const res = await api.get('/apoderado/checklist-config');
                if (res && res.data && res.data.fabricantes) {
                    const allItems = res.data.fabricantes.flatMap(f => f.checklistItems || []);
                    setChecklistItems(allItems);
                }
            } catch (err) {
                console.error('Error al obtener checklist config:', err);
            }
        };
        fetchChecklistConfig();
    }, []);

    // Pre-fill form data from solicitud (when accepting a representation request)
    useEffect(() => {
        if (prefillData) {
            setFormData(prev => ({
                ...prev,
                razonSocial: prefillData.razonSocial || prev.razonSocial,
                nombre: prefillData.nombre || prev.nombre,
                cuit: prefillData.cuit || prev.cuit,
                correo: prefillData.correo || prev.correo,
                telefono: prefillData.telefono || prev.telefono,
                direccion: prefillData.direccion || prev.direccion,
                cobertura: prefillData.provincia ? {
                    ...prev.cobertura,
                    provincias: [prefillData.provincia]
                } : prev.cobertura
            }));
        }
    }, [prefillData]);

    // Update available marcas based on selected fabricantes
    useEffect(() => {
        if (selectedFabricantes.length === 0) {
            setAvailableMarcas([]);
        } else {
            const marcasFromSelectedFabricantes = marcas ? marcas.filter(marca => 
                selectedFabricantes.includes(marca.fabricante._id)
            ) : [];
            setAvailableMarcas(marcasFromSelectedFabricantes);
            
            // Remove selected marcas that are no longer available
            setFormData(prev => {
                const validMarcas = prev.marcasRepresentadas.filter(marcaId =>
                    marcasFromSelectedFabricantes.some(marca => marca._id === marcaId)
                );
                if (validMarcas.length !== prev.marcasRepresentadas.length) {
                    return {
                        ...prev,
                        marcasRepresentadas: validMarcas
                    };
                }
                return prev;
            });
        }
    }, [selectedFabricantes, marcas]);

    // Update available localities based on selected provinces
    useEffect(() => {
        if (formData.cobertura.provincias.length === 0) {
            // If no provinces selected, show no localities
            setAvailableLocalidades([]);
        } else {
            // Only show localities from selected provinces
            const localidadesFromSelectedProvincias = [];
            formData.cobertura.provincias.forEach(provincia => {
                if (regions.localidades && regions.localidades[provincia]) {
                    localidadesFromSelectedProvincias.push(...regions.localidades[provincia]);
                }
            });
            setAvailableLocalidades(localidadesFromSelectedProvincias);
        }
    }, [formData.cobertura.provincias, regions.localidades]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleProvinciaToggle = (provincia) => {
        const newProvincias = formData.cobertura.provincias.includes(provincia)
            ? formData.cobertura.provincias.filter(p => p !== provincia)
            : [...formData.cobertura.provincias, provincia];
        
        // Filter out localities that don't belong to the newly selected provinces
        const validLocalidades = formData.cobertura.localidades.filter(localidad => {
            return newProvincias.some(prov => 
                regions.localidades && 
                regions.localidades[prov] && 
                regions.localidades[prov].includes(localidad)
            );
        });
        
        setFormData({
            ...formData,
            cobertura: {
                ...formData.cobertura,
                provincias: newProvincias,
                localidades: validLocalidades
            }
        });
    };

    const handleLocalidadToggle = (localidad) => {
        const newLocalidades = formData.cobertura.localidades.includes(localidad)
            ? formData.cobertura.localidades.filter(l => l !== localidad)
            : [...formData.cobertura.localidades, localidad];
        
        setFormData({
            ...formData,
            cobertura: {
                ...formData.cobertura,
                localidades: newLocalidades
            }
        });
    };

    const handleFabricanteToggle = (fabricanteId) => {
        const newFabricantes = selectedFabricantes.includes(fabricanteId)
            ? selectedFabricantes.filter(f => f !== fabricanteId)
            : [...selectedFabricantes, fabricanteId];
        
        setSelectedFabricantes(newFabricantes);
    };

    const handleMarcaToggle = (marcaId) => {
        const newMarcas = formData.marcasRepresentadas.includes(marcaId)
            ? formData.marcasRepresentadas.filter(m => m !== marcaId)
            : [...formData.marcasRepresentadas, marcaId];
        
        setFormData({
            ...formData,
            marcasRepresentadas: newMarcas
        });
    };

    const handleAddSucursal = () => {
        if (!sucursalForm.nombre || !sucursalForm.direccion) {
            showError('El nombre y la dirección de la sucursal son obligatorios.');
            return;
        }
        if (editingSucursalIndex !== null) {
            const updated = [...formData.sucursales];
            updated[editingSucursalIndex] = { ...sucursalForm };
            setFormData({ ...formData, sucursales: updated });
            setEditingSucursalIndex(null);
        } else {
            setFormData({ ...formData, sucursales: [...formData.sucursales, { ...sucursalForm }] });
        }
        setSucursalForm({ nombre: '', direccion: '', telefono: '', correo: '' });
    };

    const handleEditSucursal = (index) => {
        setSucursalForm({ ...formData.sucursales[index] });
        setEditingSucursalIndex(index);
    };

    const handleDeleteSucursal = (index) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la sucursal "${formData.sucursales[index].nombre}"?`)) {
            const updated = formData.sucursales.filter((_, i) => i !== index);
            setFormData({ ...formData, sucursales: updated });
            if (editingSucursalIndex === index) {
                setEditingSucursalIndex(null);
                setSucursalForm({ nombre: '', direccion: '', telefono: '', correo: '' });
            }
        }
    };

    const handleCancelEditSucursal = () => {
        setEditingSucursalIndex(null);
        setSucursalForm({ nombre: '', direccion: '', telefono: '', correo: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/apoderado/representantes/add', formData);
            showSuccess('Representante creado con éxito!');
            setFormData({
                razonSocial: '',
                nombre: '',
                cuit: '',
                cobertura: {
                    provincias: [],
                    localidades: []
                },
                direccion: '',
                telefono: '',
                telefonoAdicional: '',
                correo: '',
                correoAdicional: '',
                sitioWeb: '',
                tipoRepresentante: '',
                estado: 'Activo',
                marcasRepresentadas: [],
                sucursales: [],
                checklistData: []
            });
            setSelectedFabricantes([]);
            if (onRepresentanteAdded) {
                onRepresentanteAdded();
            }
        } catch (err) {
            console.error('Error al crear el representante:', err.response?.data);
            showError('Error: ' + (err.response?.data || 'Error al crear el representante.'));
        }
    };

    const filteredProvincias = regions.provincias.filter(provincia =>
        provincia.toLowerCase().includes(provinciaSearchTerm.toLowerCase())
    );

    const filteredLocalidades = availableLocalidades.filter(localidad =>
        localidad.toLowerCase().includes(localidadSearchTerm.toLowerCase())
    );

    return (
        <div className="form-container">
            <h3>Crear Nuevo Representante</h3>
            <form onSubmit={handleSubmit}>
                <Tabs
                    tabs={[
                        {
                            label: "Marcas",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>Fabricantes</label>
                                        <div className="checkbox-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                                            {fabricantes && fabricantes.map(fabricante => (
                                                <label key={fabricante._id} className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFabricantes.includes(fabricante._id)}
                                                        onChange={() => handleFabricanteToggle(fabricante._id)}
                                                    />
                                                    {fabricante.razonSocial}
                                                </label>
                                            ))}
                                        </div>
                                        <div className="selected-items">
                                            Fabricantes seleccionados: {
                                                selectedFabricantes.map(id => {
                                                    const fab = fabricantes?.find(f => f._id === id);
                                                    return fab ? fab.razonSocial : '';
                                                }).filter(Boolean).join(', ')
                                            }
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Marcas Representadas</label>
                                        <div className="checkbox-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                                            {availableMarcas.map(marca => (
                                                <label key={marca._id} className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.marcasRepresentadas.includes(marca._id)}
                                                        onChange={() => handleMarcaToggle(marca._id)}
                                                    />
                                                    {marca.nombre} ({marca.fabricante?.razonSocial})
                                                </label>
                                            ))}
                                        </div>
                                        <div className="selected-items">
                                            Marcas seleccionadas: {
                                                formData.marcasRepresentadas.map(id => {
                                                    const marca = availableMarcas.find(m => m._id === id);
                                                    return marca ? marca.nombre : '';
                                                }).filter(Boolean).join(', ')
                                            }
                                        </div>
                                    </div>
                                </>
                            )
                        },
                        {
                            label: "Información Básica",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>Razón Social</label>
                                        <input 
                                            type="text" 
                                            name="razonSocial" 
                                            value={formData.razonSocial} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Nombre</label>
                                        <input 
                                            type="text" 
                                            name="nombre" 
                                            value={formData.nombre} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>CUIT</label>
                                        <input 
                                            type="text" 
                                            name="cuit" 
                                            value={formData.cuit} 
                                            onChange={handleChange} 
                                            required 
                                            placeholder="xx-xxxxxxxx-x"
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
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input 
                                            type="text" 
                                            name="telefono" 
                                            value={formData.telefono} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Teléfono Adicional</label>
                                        <input 
                                            type="text" 
                                            name="telefonoAdicional" 
                                            value={formData.telefonoAdicional} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Correo</label>
                                        <input 
                                            type="email" 
                                            name="correo" 
                                            value={formData.correo} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Correo Adicional</label>
                                        <input 
                                            type="email" 
                                            name="correoAdicional" 
                                            value={formData.correoAdicional} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Sitio Web</label>
                                        <input 
                                            type="url" 
                                            name="sitioWeb" 
                                            value={formData.sitioWeb} 
                                            onChange={handleChange} 
                                            placeholder="https://ejemplo.com"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Tipo de Representante</label>
                                        <select name="tipoRepresentante" value={formData.tipoRepresentante} onChange={handleChange}>
                                            <option value="">Seleccione un tipo...</option>
                                            <option value="Re-Venta">Re-Venta</option>
                                            <option value="Pos-Venta">Pos-Venta</option>
                                            <option value="Re-Venta / Pos-Venta">Re-Venta / Pos-Venta</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select name="estado" value={formData.estado} onChange={handleChange} required>
                                            <option value="Activo">Activo</option>
                                            <option value="Inactivo">Inactivo</option>
                                        </select>
                                    </div>
                                </>
                            )
                        },
                        {
                            label: "Cobertura",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>Cobertura - Provincias</label>
                                        <input
                                            type="text"
                                            placeholder="Buscar provincias..."
                                            value={provinciaSearchTerm}
                                            onChange={(e) => setProvinciaSearchTerm(e.target.value)}
                                        />
                                        <div className="checkbox-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                                            {filteredProvincias.map(provincia => (
                                                <label key={provincia} className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.cobertura.provincias.includes(provincia)}
                                                        onChange={() => handleProvinciaToggle(provincia)}
                                                    />
                                                    {provincia}
                                                </label>
                                            ))}
                                        </div>
                                        <div className="selected-items">
                                            Seleccionadas: {formData.cobertura.provincias.join(', ')}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Cobertura - Localidades</label>
                                        <input
                                            type="text"
                                            placeholder="Buscar localidades..."
                                            value={localidadSearchTerm}
                                            onChange={(e) => setLocalidadSearchTerm(e.target.value)}
                                        />
                                        <div className="checkbox-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                                            {filteredLocalidades.map(localidad => (
                                                <label key={localidad} className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.cobertura.localidades.includes(localidad)}
                                                        onChange={() => handleLocalidadToggle(localidad)}
                                                    />
                                                    {localidad}
                                                </label>
                                            ))}
                                        </div>
                                        <div className="selected-items">
                                            Seleccionadas: {formData.cobertura.localidades.join(', ')}
                                        </div>
                                    </div>
                                </>
                            )
                        },
                        {
                            label: "Sucursales",
                            content: (
                                <>
                                    <div className="sucursales-form-section">
                                        <h4>{editingSucursalIndex !== null ? 'Editar Sucursal' : 'Agregar Sucursal'}</h4>
                                        <div className="form-group">
                                            <label>Nombre Sucursal *</label>
                                            <input
                                                type="text"
                                                value={sucursalForm.nombre}
                                                onChange={(e) => setSucursalForm({ ...sucursalForm, nombre: e.target.value })}
                                                placeholder="Nombre de la sucursal"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Dirección *</label>
                                            <input
                                                type="text"
                                                value={sucursalForm.direccion}
                                                onChange={(e) => setSucursalForm({ ...sucursalForm, direccion: e.target.value })}
                                                placeholder="Dirección de la sucursal"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Teléfono</label>
                                            <input
                                                type="text"
                                                value={sucursalForm.telefono}
                                                onChange={(e) => setSucursalForm({ ...sucursalForm, telefono: e.target.value })}
                                                placeholder="Teléfono de la sucursal"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Correo</label>
                                            <input
                                                type="email"
                                                value={sucursalForm.correo}
                                                onChange={(e) => setSucursalForm({ ...sucursalForm, correo: e.target.value })}
                                                placeholder="Correo de la sucursal"
                                            />
                                        </div>
                                        <div className="sucursales-form-buttons">
                                            <button type="button" onClick={handleAddSucursal} className="btn-add-sucursal">
                                                {editingSucursalIndex !== null ? 'Guardar Cambios' : 'Agregar Sucursal'}
                                            </button>
                                            {editingSucursalIndex !== null && (
                                                <button type="button" onClick={handleCancelEditSucursal} className="btn-cancel-sucursal">
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {formData.sucursales.length > 0 && (
                                        <div className="sucursales-list">
                                            <h4>Sucursales ({formData.sucursales.length})</h4>
                                            {formData.sucursales.map((suc, idx) => (
                                                <div key={idx} className="sucursal-card">
                                                    <div className="sucursal-card-info">
                                                        <strong>{suc.nombre}</strong>
                                                        <span>{suc.direccion}</span>
                                                        {suc.telefono && <span>Tel: {suc.telefono}</span>}
                                                        {suc.correo && <span>Correo: {suc.correo}</span>}
                                                    </div>
                                                    <div className="sucursal-card-actions">
                                                        <button type="button" onClick={() => handleEditSucursal(idx)} className="action-btn edit-btn" title="Editar">
                                                            ✏️
                                                        </button>
                                                        <button type="button" onClick={() => handleDeleteSucursal(idx)} className="action-btn delete-btn" title="Eliminar">
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )
                        },
                        {
                            label: "Checklist",
                            content: (
                                <ChecklistRepresentante
                                    checklistItems={checklistItems}
                                    checklistData={formData.checklistData}
                                    onChange={(data) => setFormData(prev => ({ ...prev, checklistData: data }))}
                                />
                            )
                        }
                    ]}
                />
                <button type="submit">Crear Representante</button>
            </form>
        </div>
    );
};

export default RepresentanteForm;