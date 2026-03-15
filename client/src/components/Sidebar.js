import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../logo.png';

const Sidebar = ({ items, basePath = '' }) => {
    const location = useLocation();
    const [expandedItems, setExpandedItems] = useState(new Set());

    // Determine if a path is active
    const isActive = (path) => {
        if (!basePath || !path) return false;
        const fullPath = basePath + path;
        return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
    };

    // Check if any sub-item of a group is active
    const isGroupActive = (item) => {
        if (!item.subItems) return false;
        return item.subItems.some(sub => sub.path && isActive(sub.path));
    };

    // Auto-expand groups whose sub-items match the current path
    useEffect(() => {
        const autoExpanded = new Set();
        items.forEach((item, index) => {
            if (item.subItems && isGroupActive(item)) {
                autoExpanded.add(index);
            }
        });
        if (autoExpanded.size > 0) {
            setExpandedItems(prev => new Set([...prev, ...autoExpanded]));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

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
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isExpanded = expandedItems.has(index);
                    const groupActive = hasSubItems && isGroupActive(item);
                    const isItemActive = item.path ? isActive(item.path) : (item.active || groupActive);

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
                                    {item.subItems.map((subItem, subIndex) => {
                                        const isSubActive = subItem.path ? isActive(subItem.path) : false;
                                        return subItem.path ? (
                                            <Link
                                                key={subIndex}
                                                to={basePath + subItem.path}
                                                className={`sidebar-sub-item ${isSubActive ? 'active' : ''}`}
                                            >
                                                <span className="sidebar-sub-item-icon">{subItem.icon || '·'}</span>
                                                <span className="sidebar-sub-item-label">{subItem.label}</span>
                                            </Link>
                                        ) : (
                                            <div
                                                key={subIndex}
                                                className="sidebar-sub-item"
                                                onClick={subItem.onClick}
                                            >
                                                <span className="sidebar-sub-item-icon">{subItem.icon || '🔗'}</span>
                                                <span className="sidebar-sub-item-label">{subItem.label}</span>
                                            </div>
                                        );
                                    })}
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
