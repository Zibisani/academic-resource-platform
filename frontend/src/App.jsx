import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import ResourceDetail from './pages/ResourceDetail';
import UploadResource from './pages/UploadResource';
import MyUploads from './pages/MyUploads';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Admin imports
import AdminLayout from './components/admin/AdminLayout';
import AdminRoute from './components/admin/AdminRoute';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminResources from './pages/admin/Resources';
import AdminReports from './pages/admin/Reports';
import AdminHierarchy from './pages/admin/Hierarchy';
import AdminWeights from './pages/admin/Weights';
import AdminAnalytics from './pages/admin/Analytics';
import AdminAuditLog from './pages/admin/AuditLog';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user?.isAuthenticated) return <Navigate to="/" />;
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin-portal/login" element={<AdminLogin />} />
            
            {/* Admin Routes */}
            <Route path="/admin-portal" element={
                <AdminRoute>
                    <AdminLayout />
                </AdminRoute>
            }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="resources" element={<AdminResources />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="hierarchy" element={<AdminHierarchy />} />
                <Route path="weights" element={<AdminWeights />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="audit-log" element={<AdminAuditLog />} />
            </Route>

            {/* Protected Routes */}
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />
            <Route path="/resource/:id" element={
                <ProtectedRoute>
                    <ResourceDetail />
                </ProtectedRoute>
            } />
            <Route path="/upload" element={
                <ProtectedRoute>
                    <UploadResource />
                </ProtectedRoute>
            } />
            <Route path="/my-uploads" element={
                <ProtectedRoute>
                    <MyUploads />
                </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
};

export default App;
