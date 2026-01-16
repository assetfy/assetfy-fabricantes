import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../logo.png';

const Sidebar = ({ items, basePath = '' }) => {
    const location = useLocation();

    // Determine which item is active based on current path
    const isActive = (path) => {
        if (!basePath) {
            // For non-routed items (like AdminPanel), use active index
            return false;
        }
        const fullPath = basePath + path;
        return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <img 
                    src={logoImg} 
                    alt="Logo" 
                />
            </div>
            <nav className="sidebar-nav">
                {items.map((item, index) => {
                    const isItemActive = item.path ? isActive(item.path) : item.active;
                    
                    return (
                        <div
                            key={index}
                            className={`sidebar-item ${isItemActive ? 'active' : ''}`}
                            onClick={item.onClick}
                        >
                            {item.path ? (
                                <Link to={basePath + item.path} className="sidebar-link">
                                    {item.icon && <span className="sidebar-icon">{item.icon}</span>}
                                    <div className="sidebar-item-content">
                                        <span className="sidebar-item-label">{item.label}</span>
                                        {item.description && (
                                            <span className="sidebar-item-description">{item.description}</span>
                                        )}
                                    </div>
                                    {item.badge && (
                                        <span className="sidebar-badge">{item.badge}</span>
                                    )}
                                </Link>
                            ) : (
                                <div className="sidebar-link">
                                    {item.icon && <span className="sidebar-icon">{item.icon}</span>}
                                    <div className="sidebar-item-content">
                                        <span className="sidebar-item-label">{item.label}</span>
                                        {item.description && (
                                            <span className="sidebar-item-description">{item.description}</span>
                                        )}
                                    </div>
                                    {item.badge && (
                                        <span className="sidebar-badge">{item.badge}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
