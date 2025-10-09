import React, { useState, useEffect } from 'react';
import { useNotification } from './NotificationProvider';

// Mock data for demo - same as the backend data
const mockRegions = {
    provincias: [
        'Buenos Aires',
        'Catamarca',
        'Chaco',
        'Chubut',
        'Ciudad Autónoma de Buenos Aires',
        'Córdoba',
        'Corrientes',
        'Entre Ríos',
        'Formosa',
        'Jujuy',
        'La Pampa',
        'La Rioja',
        'Mendoza',
        'Misiones',
        'Neuquén',
        'Río Negro',
        'Salta',
        'San Juan',
        'San Luis',
        'Santa Cruz',
        'Santa Fe',
        'Santiago del Estero',
        'Tierra del Fuego',
        'Tucumán'
    ],
    localidades: {
        'Buenos Aires': [
            'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Quilmes', 
            'Lanús', 'Merlo', 'General San Martín', 'Lomas de Zamora',
            'Almirante Brown', 'Esteban Echeverría', 'Morón', 'San Isidro',
            'Vicente López', 'Avellaneda', 'Berazategui', 'Florencio Varela'
        ],
        'Ciudad Autónoma de Buenos Aires': [
            'Retiro', 'San Nicolás', 'San Telmo', 'Montserrat', 'Puerto Madero',
            'Constitución', 'Barracas', 'La Boca', 'Palermo', 'Recoleta',
            'Belgrano', 'Núñez', 'Villa Crespo', 'Caballito', 'Flores'
        ],
        'Córdoba': [
            'Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María',
            'San Francisco', 'Alta Gracia', 'Cosquín', 'La Falda'
        ],
        'Santa Fe': [
            'Rosario', 'Santa Fe', 'Rafaela', 'Venado Tuerto', 'Reconquista',
            'Esperanza', 'Santo Tomé', 'Casilda'
        ],
        'Mendoza': [
            'Mendoza', 'San Rafael', 'Godoy Cruz', 'Luján de Cuyo',
            'Maipú', 'Las Heras', 'Rivadavia'
        ],
        'Salta': [
            'Salta', 'San Ramón de la Nueva Orán', 'Tartagal', 'Metán',
            'Güemes', 'Cafayate'
        ]
    }
};

const DemoRepresentanteForm = ({ onRepresentanteAdded }) => {
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
        estado: 'Activo'
    });
    const [regions] = useState(mockRegions);
    const [availableLocalidades, setAvailableLocalidades] = useState([]);
    const [provinciaSearchTerm, setProvinciaSearchTerm] = useState('');
    const [localidadSearchTerm, setLocalidadSearchTerm] = useState('');
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        // Update available localities based on selected provinces  
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            showSuccess('Representante creado con éxito! (Demo - no se guarda realmente)');
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
                estado: 'Activo'
            });
            if (onRepresentanteAdded) {
                onRepresentanteAdded();
            }
        } catch (err) {
            console.error('Error en demo:', err);
            showError('Error: ' + (err.message || 'Error al crear el representante.'));
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
            <h3>Crear Nuevo Representante (Demo)</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Razón Social</label>
                    <input 
                        type="text" 
                        name="razonSocial" 
                        value={formData.razonSocial} 
                        onChange={handleChange} 
                        required 
                        placeholder="Ej: Representaciones del Sur S.A."
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
                        placeholder="Ej: Carlos Martínez"
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
                        Seleccionadas: {formData.cobertura.provincias.join(', ') || 'Ninguna'}
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
                        Seleccionadas: {formData.cobertura.localidades.join(', ') || 'Ninguna'}
                    </div>
                </div>
                
                <div className="form-group">
                    <label>Dirección</label>
                    <input 
                        type="text" 
                        name="direccion" 
                        value={formData.direccion} 
                        onChange={handleChange} 
                        required 
                        placeholder="Ej: Av. Corrientes 1234, CABA"
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
                        placeholder="Ej: +54 11 1234-5678"
                    />
                </div>
                
                <div className="form-group">
                    <label>Teléfono Adicional</label>
                    <input 
                        type="text" 
                        name="telefonoAdicional" 
                        value={formData.telefonoAdicional} 
                        onChange={handleChange} 
                        placeholder="Teléfono secundario (opcional)"
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
                        placeholder="correo@ejemplo.com"
                    />
                </div>
                
                <div className="form-group">
                    <label>Correo Adicional</label>
                    <input 
                        type="email" 
                        name="correoAdicional" 
                        value={formData.correoAdicional} 
                        onChange={handleChange} 
                        placeholder="Correo secundario (opcional)"
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
                
                <button type="submit">Crear Representante</button>
            </form>
        </div>
    );
};

export default DemoRepresentanteForm;