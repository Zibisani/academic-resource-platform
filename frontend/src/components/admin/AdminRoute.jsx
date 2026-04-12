import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );
    
    if (!user || !user.isAuthenticated) {
        return <Navigate to="/admin-portal/login" replace />;
    }
    
    if (user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

export default AdminRoute;
