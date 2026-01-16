import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileEditModal from './ProfileEditModal';
import PanelMenu from './PanelMenu';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

/**
 * UserHeader component displays the header with logo, welcome message, and profile controls
 * @param {Object} user - User data object
 * @param {Function} onProfileUpdated - Callback function when profile is updated
 * @param {string} userType - Type of user ('admin', 'apoderado', etc.)
 * @param {string} welcomeMessage - Optional welcome message to display (e.g., "Bienvenido/a John Doe")
 * @param {string} pageTitle - Title of the current page/section (e.g., "Dashboard", "Inventario")
 */
const UserHeader = ({ user, onProfileUpdated, userType = 'admin', welcomeMessage, pageTitle }) => {
    const [showProfileModal, setShowProfileModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleProfileClick = () => {
        setShowProfileModal(true);
    };

    const handleProfileUpdated = (updatedData) => {
        if (onProfileUpdated) {
            onProfileUpdated(updatedData);
        }
    };

    const handleLogout = () => {
        // Clear authentication data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        
        // Redirect to login page
        navigate('/login');
    };



    const getProfileImage = () => {
        const imageUrl = userType === 'admin' 
            ? user?.imagenPerfil 
            : user?.usuario?.imagenPerfil || user?.imagenPerfil;
        
        // Handle both string URLs and object with URL property
        if (!imageUrl) return null;
        
        const urlString = typeof imageUrl === 'object' && imageUrl.url 
            ? imageUrl.url 
            : imageUrl;
            
        return typeof urlString === 'string' ? getAuthenticatedUrl(urlString) : null;
    };

    const getUserInitials = () => {
        const userName = userType === 'admin' 
            ? user?.nombreCompleto || ''
            : user?.usuario?.nombreCompleto || user?.nombreCompleto || '';
        
        const parts = userName.trim().split(' ').filter(part => part.length > 0);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        } else if (parts.length === 1 && parts[0].length > 0) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    const getUserName = () => {
        return userType === 'admin' 
            ? user?.nombreCompleto || 'Usuario'
            : user?.usuario?.nombreCompleto || user?.nombreCompleto || 'Usuario';
    };

    const getUserRole = () => {
        if (userType === 'admin') {
            return 'Administrador';
        } else if (userType === 'apoderado') {
            return 'Apoderado';
        }
        return 'Usuario';
    };

    // Auto-detect page title from URL if not provided
    const getPageTitle = () => {
        if (pageTitle) return pageTitle;
        
        const path = location.pathname;
        if (path.includes('/metricas')) return 'Dashboard';
        if (path.includes('/productos')) return 'Inventario';
        if (path.includes('/piezas')) return 'Repuestos';
        if (path.includes('/inventario')) return 'Inventario';
        if (path.includes('/representantes')) return 'Representantes';
        if (path.includes('/garantias')) return 'Garantías';
        if (path.includes('/administracion')) return 'Parametrización';
        
        return 'Dashboard';
    };

    // Check if user has fabricante permissions (for admin users)
    const hasFabricantePermissions = () => {
        if (userType === 'admin') {
            return user?.fabricantes && user.fabricantes.length > 0;
        }
        return false;
    };

    return (
        <>
            <div className="user-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="page-title">{getPageTitle()}</h1>
                    </div>
                    <div className="header-right">
                        <div className="user-info-header">
                            <div className="user-details">
                                <div className="user-name-header">{getUserName()}</div>
                                <div className="user-role-header">{getUserRole()}</div>
                            </div>
                            <div className="user-avatar" onClick={handleProfileClick}>
                                {getProfileImage() ? (
                                    <img 
                                        src={getProfileImage()} 
                                        alt="Perfil" 
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            objectFit: 'cover',
                                            borderRadius: '50%'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.textContent = getUserInitials();
                                        }}
                                    />
                                ) : (
                                    getUserInitials()
                                )}
                            </div>
                        </div>
                        <PanelMenu 
                            userType={userType} 
                            hasFabricantePermissions={hasFabricantePermissions()} 
                        />
                        <button 
                            className="logout-button" 
                            onClick={handleLogout}
                            title="Cerrar sesión"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <ProfileEditModal
                user={userType === 'admin' ? user : user?.usuario || user}
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                onProfileUpdated={handleProfileUpdated}
                userType={userType}
            />
        </>
    );
};

export default UserHeader;