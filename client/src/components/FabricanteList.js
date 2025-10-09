import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import Pagination from './Pagination';

const FabricanteList = ({ refreshTrigger, onEdit }) => {
  const [fabricantes, setFabricantes] = useState([]);
  const [allFabricantes, setAllFabricantes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    api.get('/admin/fabricantes')
      .then(response => {
        setAllFabricantes(response.data);
        setFabricantes(response.data);
      })
      .catch(error => {
        console.error('Hubo un error al obtener los fabricantes:', error);
      });
  }, [refreshTrigger]);

  useEffect(() => {
    let filteredFabricantes = allFabricantes;

    // Filter by search term
    if (searchTerm) {
      filteredFabricantes = filteredFabricantes.filter(fabricante => {
        const searchLower = searchTerm.toLowerCase();
        
        // Search in basic fields
        const basicMatch = fabricante.razonSocial.toLowerCase().includes(searchLower) ||
          fabricante.cuit.includes(searchTerm) ||
          fabricante.usuarioApoderado.nombreCompleto.toLowerCase().includes(searchLower);
        
        // Search in administradores
        const adminMatch = fabricante.administradores && fabricante.administradores.some(admin => 
          admin.nombreCompleto.toLowerCase().includes(searchLower)
        );
        
        return basicMatch || adminMatch;
      });
    }

    // Filter by estado
    if (estadoFilter !== 'todos') {
      filteredFabricantes = filteredFabricantes.filter(fabricante => fabricante.estado === estadoFilter);
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setFabricantes(filteredFabricantes.slice(startIndex, endIndex));
  }, [allFabricantes, searchTerm, estadoFilter, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter]);

  const handleEditClick = (fabricante) => {
    if (onEdit) {
      onEdit(fabricante);
    }
  };

  const handleDeleteClick = async (fabricante) => {
    setConfirmDialog({ 
      isOpen: true, 
      itemId: fabricante._id, 
      itemName: fabricante.razonSocial 
    });
  };

  const handleConfirmDelete = async () => {
    const itemId = confirmDialog.itemId;
    const itemName = confirmDialog.itemName;
    setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
    
    try {
      await api.delete(`/admin/fabricantes/${itemId}`);
      const updatedFabricantes = allFabricantes.filter(fabricante => fabricante._id !== itemId);
      setAllFabricantes(updatedFabricantes);
      showSuccess(`Fabricante "${itemName}" eliminado exitosamente`);
      
      // Adjust current page if needed
      const totalPages = Math.ceil(updatedFabricantes.length / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (err) {
      console.error('Error al eliminar el fabricante:', err);
      if (err.response && err.response.status === 400) {
        showError('No se puede eliminar por referencias');
      } else {
        showError('No se pudo eliminar el fabricante');
      }
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Get filtered fabricantes count for pagination
  const getFilteredFabricantesCount = () => {
    let filteredFabricantes = allFabricantes;

    if (searchTerm) {
      filteredFabricantes = filteredFabricantes.filter(fabricante => {
        const searchLower = searchTerm.toLowerCase();
        
        // Search in basic fields
        const basicMatch = fabricante.razonSocial.toLowerCase().includes(searchLower) ||
          fabricante.cuit.includes(searchTerm) ||
          fabricante.usuarioApoderado.nombreCompleto.toLowerCase().includes(searchLower);
        
        // Search in administradores
        const adminMatch = fabricante.administradores && fabricante.administradores.some(admin => 
          admin.nombreCompleto.toLowerCase().includes(searchLower)
        );
        
        return basicMatch || adminMatch;
      });
    }

    if (estadoFilter !== 'todos') {
      filteredFabricantes = filteredFabricantes.filter(fabricante => fabricante.estado === estadoFilter);
    }

    return filteredFabricantes.length;
  };

  if (allFabricantes.length === 0) {
    return (
      <div className="list-container">
        <h3>Lista de Fabricantes</h3>
        <p>No hay fabricantes registrados aún.</p>
      </div>
    );
  }

  return (
    <div className="list-container">
      <h3>Lista de Fabricantes</h3>
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Buscar por razón social, CUIT, apoderado o administradores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
        >
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
          {fabricantes.map(fabricante => (
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
      
      <Pagination
        currentPage={currentPage}
        totalItems={getFilteredFabricantesCount()}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres eliminar el fabricante "${confirmDialog.itemName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default FabricanteList;