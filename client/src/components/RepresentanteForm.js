import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import Tabs from './Tabs';

const RepresentanteForm = ({ onRepresentanteAdded, fabricantes, marcas }) => {
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
        estado: 'Activo',
        marcasRepresentadas: []
    });
    const [regions, setRegions] = useState({ provincias: [], localidades: {} });
    const [availableLocalidades, setAvailableLocalidades] = useState([]);
    const [provinciaSearchTerm, setProvinciaSearchTerm] = useState('');
    const [localidadSearchTerm, setLocalidadSearchTerm] = useState('');
    const [selectedFabricantes, setSelectedFabricantes] = useState([]);
    const [availableMarcas, setAvailableMarcas] = useState([]);
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
    }, []);

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
                estado: 'Activo',
                marcasRepresentadas: []
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
                        }
                    ]}
                />
                <button type="submit">Crear Representante</button>
            </form>
        </div>
    );
};

export default RepresentanteForm;