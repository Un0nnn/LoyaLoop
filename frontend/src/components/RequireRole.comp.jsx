import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth";
import { getHomeRouteForRole } from "../roleAccess";

const RequireRole = ({ allowedRoles, children }) => {
    const { currentUser, activeInterface } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Check against actual role for permissions (user must have the role)
    // But also respect the activeInterface for UX consistency
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = currentUser?.role;
        const effectiveInterface = activeInterface || userRole;

        // User must have permission based on their actual role
        if (!allowedRoles.includes(userRole)) {
            const fallback = getHomeRouteForRole(effectiveInterface);
            return <Navigate to={fallback} replace />;
        }
    }

    return children;
};

export default RequireRole;
