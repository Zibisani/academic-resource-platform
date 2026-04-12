import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Trash2, Star, Eye, MoreVertical, FileText, Video, Image as ImageIcon, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminResources = () => {
    const { api } = useAuth();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStaffPick, setFilterStaffPick] = useState('');

    const fetchResources = async () => {
        setLoading(true);
        try {
            let query = '?';
            if (searchTerm) query += `search=${searchTerm}&`;
            if (filterStatus) query += `status=${filterStatus}&`;
            if (filterType) query += `resource_type=${filterType}&`;
            if (filterStaffPick) query += `is_staff_pick=${filterStaffPick}&`;
            
            const res = await api.get(`admin/resources/${query}`);
            setResources(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchResources();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, filterStatus, filterType, filterStaffPick, api]);

    const handleToggleStaffPick = async (resource) => {
        try {
            await api.patch(`admin/resources/${resource.id}/`, { is_staff_pick: !resource.is_staff_pick });
            fetchResources();
        } catch (err) {
            alert('Failed to update staff pick status');
        }
    };

    const handleRemoveResource = async (resource) => {
        if (!confirm(`Are you sure you want to hard delete resource: ${resource.title}?`)) return;
        try {
            await api.delete(`admin/resources/${resource.id}/`);
            fetchResources();
        } catch (err) {
            alert('Failed to delete resource');
        }
    };
    
    const handleSoftRemoveResource = async (resource) => {
        if (!confirm(`Are you sure you want to soft-remove resource: ${resource.title}?`)) return;
        try {
            const newStatus = resource.status === 'active' ? 'removed' : 'active';
            await api.patch(`admin/resources/${resource.id}/`, { status: newStatus });
            fetchResources();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'video': return <Video size={16} className="text-blue-500" />;
            case 'image': return <ImageIcon size={16} className="text-purple-500" />;
            case 'textbook': return <BookOpen size={16} className="text-amber-600" />;
            default: return <FileText size={16} className="text-slate-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resource Management</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Moderate, curate, and delete uploaded academic materials.</p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="removed">Removed</option>
                </select>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Types</option>
                    <option value="notes">Notes</option>
                    <option value="past_exam">Past Exam</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="textbook">Textbook</option>
                </select>
                <select
                    value={filterStaffPick}
                    onChange={(e) => setFilterStaffPick(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Verification</option>
                    <option value="true">Staff Picked</option>
                    <option value="false">Not Staff Picked</option>
                </select>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resource</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uploader</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stats</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Curate</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
                                    </td>
                                </tr>
                            ) : resources.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No resources found.</td>
                                </tr>
                            ) : (
                                resources.map(resource => (
                                    <tr key={resource.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                    {getTypeIcon(resource.resource_type)}
                                                </div>
                                                <div>
                                                    <div className="text-sm border-b border-transparent hover:border-indigo-500 inline-block font-medium text-slate-900 dark:text-white truncate max-w-xs">{resource.title}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{resource.module_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            <div>{resource.uploader_name || 'Anonymous'}</div>
                                            <div className="text-xs mt-0.5">{new Date(resource.upload_date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> 
                                                <span>{resource.average_rating.toFixed(1)}</span>
                                            </div>
                                            <div className="text-xs mt-1">{resource.download_count} DLs</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button 
                                                onClick={() => handleSoftRemoveResource(resource)}
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                                                resource.status === 'active' 
                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                            }`}>
                                                {resource.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button 
                                                onClick={() => handleToggleStaffPick(resource)}
                                                className={`p-1.5 rounded-full transition-colors ${
                                                    resource.is_staff_pick 
                                                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' 
                                                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                                title="Toggle Staff Pick"
                                            >
                                                <Star fill={resource.is_staff_pick ? 'currentColor' : 'none'} size={18} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3 items-center">
                                                <Link to={`/admin-portal/resources/${resource.id}`} className="text-slate-400 hover:text-indigo-600 transition-colors" title="View Detail">
                                                    <Eye size={18} />
                                                </Link>
                                                <button onClick={() => handleRemoveResource(resource)} className="text-slate-400 hover:text-red-600 transition-colors" title="Hard Delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminResources;
