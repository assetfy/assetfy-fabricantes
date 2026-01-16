import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const PanelMenu = ({ userType, hasFabricantePermissions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handlePanelClick = (panelPath) => {
        navigate(panelPath);
        setIsOpen(false);
    };

    // Get user roles
    const rolesStr = localStorage.getItem('roles');
    let userRoles = [];
    try {
        userRoles = rolesStr ? JSON.parse(rolesStr) : [];
    } catch (e) {
        userRoles = [];
    }
    
    // Fallback to single role if no roles array
    if (userRoles.length === 0 && userType) {
        userRoles = [userType];
    }

    // Determine which panels to show based on user's roles
    const panels = [];
    
    // Check each role and add corresponding panels
    if (userRoles.includes('admin')) {
        // Admin panel
        panels.push({
            name: 'Assetfy Admin',
            path: '/admin',
            description: 'Panel de administración'
        });
        
        // If admin also has apoderado role, show fabricantes panel
        if (userRoles.includes('apoderado')) {
            panels.push({
                name: 'Assetfy Fabricantes',
                path: '/apoderado',
                description: 'Panel de gestión de fabricantes'
            });
        }
    }
    
    if (userRoles.includes('apoderado')) {
        // Only add fabricantes panel if not already added by admin role
        if (!panels.find(p => p.path === '/apoderado')) {
            panels.push({
                name: 'Assetfy Fabricantes',
                path: '/apoderado',
                description: 'Panel de gestión de fabricantes'
            });
        }
    }
    
    if (userRoles.includes('usuario_bienes')) {
        panels.push({
            name: 'Assetfy Garantías',
            path: '/usuario',
            description: 'Panel de gestión de garantías'
        });
    }
    
    // Fallback to old logic if no panels determined from roles
    if (panels.length === 0) {
        if (userType === 'admin' && hasFabricantePermissions) {
            panels.push({
                name: 'Assetfy Fabricantes',
                path: '/apoderado',
                description: 'Panel de gestión de fabricantes'
            });
            panels.push({
                name: 'Assetfy Admin',
                path: '/admin',
                description: 'Panel de administración'
            });
        } else if (userType === 'admin') {
            panels.push({
                name: 'Assetfy Admin',
                path: '/admin',
                description: 'Panel de administración'
            });
        } else if (userType === 'apoderado') {
            panels.push({
                name: 'Assetfy Fabricantes',
                path: '/apoderado',
                description: 'Panel de gestión de fabricantes'
            });
        } else if (userType === 'usuario_bienes') {
            panels.push({
                name: 'Assetfy Garantías',
                path: '/usuario',
                description: 'Panel de gestión de garantías'
            });
        }
    }

    return (
        <div className="panel-menu" ref={menuRef}>
            <button className="hamburger-button" onClick={toggleMenu} title="Cambiar de panel">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </button>
            
            {isOpen && (
                <div className="panel-dropdown">
                    <div className="panel-dropdown-header">
                        <h3>Paneles Disponibles</h3>
                    </div>
                    <div className="panel-list">
                        {panels.map((panel, index) => (
                            <button
                                key={index}
                                className="panel-item"
                                onClick={() => handlePanelClick(panel.path)}
                            >
                                <div className="panel-item-name">{panel.name}</div>
                                <div className="panel-item-description">{panel.description}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelMenu;
