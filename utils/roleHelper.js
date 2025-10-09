// utils/roleHelper.js
// Helper functions for multi-role support

/**
 * Check if a user has a specific role
 * @param {Object|Array} userRoles - The user's roles (can be array or object with roles property)
 * @param {String} requiredRole - The role to check for
 * @returns {Boolean} - True if user has the role
 */
function hasRole(userRoles, requiredRole) {
    // Handle both array and object with roles property
    const roles = Array.isArray(userRoles) ? userRoles : (userRoles?.roles || []);
    return roles.includes(requiredRole);
}

/**
 * Check if a user has any of the specified roles
 * @param {Object|Array} userRoles - The user's roles
 * @param {Array<String>} requiredRoles - Array of roles to check
 * @returns {Boolean} - True if user has at least one of the roles
 */
function hasAnyRole(userRoles, requiredRoles) {
    const roles = Array.isArray(userRoles) ? userRoles : (userRoles?.roles || []);
    return requiredRoles.some(role => roles.includes(role));
}

/**
 * Check if a user has all of the specified roles
 * @param {Object|Array} userRoles - The user's roles
 * @param {Array<String>} requiredRoles - Array of roles to check
 * @returns {Boolean} - True if user has all the roles
 */
function hasAllRoles(userRoles, requiredRoles) {
    const roles = Array.isArray(userRoles) ? userRoles : (userRoles?.roles || []);
    return requiredRoles.every(role => roles.includes(role));
}

/**
 * Get primary role for backward compatibility
 * Priority: admin > apoderado > usuario_bienes
 * @param {Object|Array} userRoles - The user's roles
 * @returns {String} - The primary role
 */
function getPrimaryRole(userRoles) {
    const roles = Array.isArray(userRoles) ? userRoles : (userRoles?.roles || []);
    
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('apoderado')) return 'apoderado';
    if (roles.includes('usuario_bienes')) return 'usuario_bienes';
    
    // Default for backward compatibility
    return roles.length > 0 ? roles[0] : 'apoderado';
}

module.exports = {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getPrimaryRole
};
