import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FolderTree, Trash2, Plus, GripVertical, AlertCircle, X } from 'lucide-react';

const AdminHierarchy = () => {
    const { api } = useAuth();
    const [tab, setTab] = useState('faculty');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', parent_id: '' });
    const [parents, setParents] = useState([]);
    const [modalError, setModalError] = useState('');

    const endpoints = {
        'faculty': 'admin/faculty/',
        'programme': 'admin/programme/',
        'course': 'admin/course/',
        'module': 'admin/module/'
    };

    const fetchHierarchy = async () => {
        setLoading(true);
        try {
            const res = await api.get(endpoints[tab]);
            setItems(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHierarchy();
    }, [tab, api]);

    const handleDelete = async (item) => {
        try {
            // First attempt to delete without confirm flag to intercept cascade count block
            await api.delete(`${endpoints[tab]}${item.id}/`);
            fetchHierarchy(); // Shouldn't reach here unless cascade is 0 and no confirm required
        } catch (err) {
            if (err.response && err.response.status === 428) {
                const count = err.response.data.cascade_count;
                const msg = count > 0 
                    ? `WARNING: Deleting this ${tab} will also delete ${count} dependent items (and all their associated resources).\n\nAre you absolutely sure?`
                    : `Are you sure you want to delete this ${tab}?`;
                    
                if (window.confirm(msg)) {
                    try {
                        await api.delete(`${endpoints[tab]}${item.id}/?confirm=true`);
                        fetchHierarchy();
                    } catch (e) {
                        alert(`Failed to delete ${tab}`);
                    }
                }
            } else {
                alert(`Failed to delete ${tab}`);
            }
        }
    };

    const handleOpenAddModal = async () => {
        setFormData({ name: '', code: '', parent_id: '' });
        setModalError('');
        setParents([]);
        
        // Fetch parents if needed
        try {
            if (tab === 'programme') {
                const res = await api.get('admin/faculty/');
                setParents(res.data.results || res.data);
            } else if (tab === 'course') {
                const res = await api.get('admin/programme/');
                setParents(res.data.results || res.data);
            } else if (tab === 'module') {
                const res = await api.get('admin/course/');
                setParents(res.data.results || res.data);
            }
            setIsAddModalOpen(true);
        } catch (err) {
            alert('Failed to load parent data for dropdowns.');
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setModalError('');
        
        try {
            const payload = { ...formData };
            // Map parent_id to the correct API field
            if (tab === 'programme') payload.faculty = payload.parent_id;
            if (tab === 'course') payload.programme = payload.parent_id;
            if (tab === 'module') payload.course = payload.parent_id;
            delete payload.parent_id;

            await api.post(endpoints[tab], payload);
            setIsAddModalOpen(false);
            fetchHierarchy();
        } catch (err) {
            console.error(err);
            setModalError('Failed to add item. Check required fields or name uniqueness.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Hierarchy</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage faculties, programmes, courses, and modules.</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8">
                    {['faculty', 'programme', 'course', 'module'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center capitalize ${
                                tab === t
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
                            }`}
                        >
                            {t}s
                        </button>
                    ))}
                </nav>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-3 w-10"></th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            {(tab === 'course' || tab === 'module') && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                            )}
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center p-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="4" className="text-center p-8 text-slate-500">No {tab}s found.</td></tr>
                        ) : (
                            items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                        <GripVertical size={16} className="cursor-grab hover:text-slate-600" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                                        <div className="flex items-center">
                                            <FolderTree size={16} className="text-indigo-500 mr-2" />
                                            {item.name}
                                        </div>
                                    </td>
                                    {(tab === 'course' || tab === 'module') && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">{item.code}</span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-2">
                                            <button 
                                                onClick={() => handleDelete(item)}
                                                className="text-slate-400 hover:text-red-600 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:border-red-200 p-1.5 rounded-md"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <button 
                onClick={handleOpenAddModal}
                className="flex items-center justify-center w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
                <Plus size={20} className="mr-2" />
                Add New {tab}
            </button>

            {/* Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">Add New {tab}</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                            {modalError && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">{modalError}</div>}
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-md p-2.5 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder={`E.g. ${tab === 'faculty' ? 'Faculty of Science' : 'Software Engineering'}`}
                                />
                            </div>

                            {(tab === 'course' || tab === 'module') && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Code <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                                        className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-md p-2.5 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="E.g. CSI101"
                                    />
                                </div>
                            )}

                            {tab !== 'faculty' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Parent Assignment <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        value={formData.parent_id}
                                        onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                                        className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-md p-2.5 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="" disabled>Select {tab === 'programme' ? 'Faculty' : tab === 'course' ? 'Programme' : 'Course'}</option>
                                        {parents.map(p => (
                                            <option key={p.id} value={p.id}>{p.code ? `[${p.code}] ` : ''}{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="pt-2">
                                <button type="submit" className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-md transition-colors flex items-center">
                                    <Plus size={18} className="mr-2" />
                                    Confirm Addition
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHierarchy;
