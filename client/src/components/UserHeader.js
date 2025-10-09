import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../logo.png';
import ProfileEditModal from './ProfileEditModal';
import PanelMenu from './PanelMenu';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const UserHeader = ({ user, onProfileUpdated, userType = 'admin' }) => {
    const [showProfileModal, setShowProfileModal] = useState(false);
    const navigate = useNavigate();

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

    const getDisplayName = () => {
        if (userType === 'admin') {
            return user?.nombreCompleto || 'Usuario';
        } else {
            return user?.usuario?.nombreCompleto || user?.nombreCompleto || 'Usuario';
        }
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
                    <div className="logo-section">
                        <img src={logo} alt="Logo de la aplicación" className="app-logo" />
                    </div>
                    <div className="profile-section">
                        <div className="profile-info">
                            <span className="user-name">{getDisplayName()}</span>
                        </div>
                        <div className="profile-actions">
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
                            <div className="profile-image-container" onClick={handleProfileClick}>
                            {getProfileImage() ? (
                                <img 
                                    src={getProfileImage()} 
                                    alt="Perfil del usuario" 
                                    className="profile-image"
                                    style={{ display: 'block' }}
                                    onError={(e) => {
                                        console.error('Error loading profile image:', getProfileImage());
                                        e.target.style.display = 'none';
                                        const icon = e.target.nextSibling;
                                        if (icon) {
                                            icon.style.display = 'flex';
                                        }
                                    }}
                                    onLoad={(e) => {
                                        // Image loaded successfully, hide the icon
                                        e.target.style.display = 'block';
                                        const icon = e.target.nextSibling;
                                        if (icon) {
                                            icon.style.display = 'none';
                                        }
                                    }}
                                />
                            ) : null}
                            <div className="profile-icon" style={{ display: getProfileImage() ? 'none' : 'flex' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                                    <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"/>
                                </svg>
                            </div>
                            </div>
                        </div>
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