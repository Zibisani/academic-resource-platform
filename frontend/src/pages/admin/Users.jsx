import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, MoreVertical, Plus, UserX, UserCheck, Shield, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { UserViewModal, UserCreateModal } from './UserModals';

const AdminUsers = () => {
    useDocumentTitle('User Management');
    const { api } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [viewUser, setViewUser] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let query = '?';
            if (searchTerm) query += `search=${searchTerm}&`;
            if (filterRole) query += `role=${filterRole}&`;
            if (filterStatus) query += `status=${filterStatus}&`;
            
            const res = await api.get(`admin/users/${query}`);
            setUsers(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, filterRole, filterStatus, api]);

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = user.status === 'active' ? 'disabled' : 'active';
            await api.patch(`admin/users/${user.id}/`, { status: newStatus });
            fetchUsers();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleResetPassword = async (user) => {
        if (!confirm(`Are you sure you want to send a password reset link to ${user.email}?`)) return;
        try {
            await api.post(`admin/users/${user.id}/reset-password/`);
            alert('Password reset link sent to Mailhog!');
        } catch (err) {
            alert('Failed to send reset link.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage platform users, roles, and access.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                </button>
            </div>

            {/* Filters bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Roles</option>
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uploads</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                                                    {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                        {user.first_name} {user.last_name}
                                                        {user.is_verified_contributor && (
                                                            <Shield className="w-3.5 h-3.5 text-blue-500" fill="currentColor" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                                user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                                user.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                            }`}>
                                                {user.status === 'active' ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            {user.upload_count || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3 items-center">
                                                <button onClick={() => handleToggleStatus(user)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title={user.status === 'active' ? 'Disable User' : 'Enable User'}>
                                                    {user.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                                                </button>
                                                <button onClick={() => handleResetPassword(user)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Reset Password">
                                                    <Key size={18} />
                                                </button>
                                                <button onClick={() => setViewUser(user)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors">
                                                    View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Simple Pagination stub */}
                <div className="bg-white dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700 sm:px-6 flex items-center justify-between">
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        Showing results...
                    </div>
                </div>
            </div>
            
            <UserViewModal user={viewUser} onClose={() => setViewUser(null)} api={api} />
            <UserCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} api={api} onSuccess={fetchUsers} />
        </div>
    );
};

export default AdminUsers;
