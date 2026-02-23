import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../logo.png';

const Sidebar = ({ items, basePath = '' }) => {
    const location = useLocation();
    const [expandedItems, setExpandedItems] = useState(new Set());

    // Determine which item is active based on current path
    const isActive = (path) => {
        if (!basePath) {
            // For non-routed items (like AdminPanel), use active index
            return false;
        }
        const fullPath = basePath + path;
        return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
    };

    const toggleExpand = (index) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
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
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isExpanded = expandedItems.has(index);
                    
                    return (
                        <div key={index}>
                            <div
                                className={`sidebar-item ${isItemActive ? 'active' : ''}`}
                                onClick={() => {
                                    if (hasSubItems) {
                                        toggleExpand(index);
                                    } else if (item.onClick) {
                                        item.onClick();
                                    }
                                }}
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
                                        {hasSubItems && (
                                            <span className="sidebar-chevron">{isExpanded ? '▾' : '▸'}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {hasSubItems && isExpanded && (
                                <div className="sidebar-sub-items">
                                    {item.subItems.map((subItem, subIndex) => (
                                        <div
                                            key={subIndex}
                                            className="sidebar-sub-item"
                                            onClick={subItem.onClick}
                                        >
                                            <span className="sidebar-sub-item-icon">{subItem.icon || '🔗'}</span>
                                            <span className="sidebar-sub-item-label">{subItem.label}</span>
                                        </div>
                                    ))}
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
