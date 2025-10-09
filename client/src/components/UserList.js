// src/components/UserList.js
import React, { useState, useEffect } from 'react';
import api from '../api'; 
import { useNotification } from './NotificationProvider';
import Pagination from './Pagination';

const UserList = ({ refreshTrigger, onEdit }) => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFilter, setRolFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    api.get('/admin/usuarios')
      .then(response => {
        setAllUsers(response.data);
        setUsers(response.data);
      })
      .catch(error => {
        console.error('Hubo un error al obtener los usuarios:', error);
      });
  }, [refreshTrigger]);

  useEffect(() => {
    let filteredUsers = allUsers;

    // Filter by search term
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user =>
        user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.correoElectronico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cuil.includes(searchTerm)
      );
    }

    // Filter by role - check if user has the role in their roles array
    if (rolFilter !== 'todos') {
      filteredUsers = filteredUsers.filter(user => {
        // Support both old 'rol' (single) and new 'roles' (array)
        if (user.roles && Array.isArray(user.roles)) {
          return user.roles.includes(rolFilter);
        } else if (user.rol) {
          return user.rol === rolFilter;
        }
        return false;
      });
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setUsers(filteredUsers.slice(startIndex, endIndex));
  }, [allUsers, searchTerm, rolFilter, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rolFilter]);

  const handleEditClick = (user) => {
    if (onEdit) {
      onEdit(user);
    }
  };

  const handleDeleteClick = async (userId) => {
    const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar este usuario?');
    if (confirmDelete) {
      try {
        await api.delete(`/admin/usuarios/${userId}`);
        const updatedUsers = allUsers.filter(user => user._id !== userId);
        setAllUsers(updatedUsers);
        showSuccess('Usuario eliminado con éxito!');
        
        // Adjust current page if needed
        const totalPages = Math.ceil(updatedUsers.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      } catch (err) {
        console.error('Error al eliminar el usuario:', err);
        showError('No se pudo eliminar el usuario.');
      }
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Get filtered users count for pagination
  const getFilteredUsersCount = () => {
    let filteredUsers = allUsers;

    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user =>
        user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.correoElectronico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cuil.includes(searchTerm)
      );
    }

    if (rolFilter !== 'todos') {
      filteredUsers = filteredUsers.filter(user => {
        // Support both old 'rol' (single) and new 'roles' (array)
        if (user.roles && Array.isArray(user.roles)) {
          return user.roles.includes(rolFilter);
        } else if (user.rol) {
          return user.rol === rolFilter;
        }
        return false;
      });
    }

    return filteredUsers.length;
  };

  if (allUsers.length === 0) {
    return (
      <div className="list-container">
        <h3>Lista de Usuarios</h3>
        <p>No hay usuarios registrados aún.</p>
      </div>
    );
  }

  return (
    <div className="list-container">
      <h3>Lista de Usuarios</h3>
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Buscar por nombre, email o CUIL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={rolFilter}
          onChange={(e) => setRolFilter(e.target.value)}
        >
          <option value="todos">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="apoderado">Apoderado</option>
          <option value="usuario_bienes">Usuario de Bienes</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>CUIL</th>
            <th>Roles</th>
            <th>Estado Apoderado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.nombreCompleto}</td>
              <td>{user.correoElectronico}</td>
              <td>{user.cuil}</td>
              <td>{user.roles && Array.isArray(user.roles) ? user.roles.join(', ') : (user.rol || '')}</td>
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
                    onClick={() => handleDeleteClick(user._id)}
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
        totalItems={getFilteredUsersCount()}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};

export default UserList;