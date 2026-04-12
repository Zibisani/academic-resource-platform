import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminReports = () => {
    const { api } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pending');

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get(`admin/reports/?status=${tab}`);
            setReports(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [tab, api]);

    const handleResolve = async (reportId, action) => {
        if (!confirm(`Are you sure you want to ${action === 'remove_resource' ? 'REMOVE the resource' : 'DISMISS this report'}?`)) return;
        try {
            await api.patch(`admin/reports/${reportId}/resolve/`, { action });
            fetchReports();
        } catch (err) {
            alert('Failed to resolve report');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Content Reports</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and resolve user submitted reports on resources.</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setTab('pending')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                            tab === 'pending'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
                        }`}
                    >
                        Pending Queue
                        {tab === 'pending' && reports.length > 0 && (
                            <span className="ml-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 py-0.5 px-2 rounded-full text-xs">
                                {reports.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('resolved')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                            tab === 'resolved'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
                        }`}
                    >
                        Resolved
                    </button>
                    <button
                        onClick={() => setTab('dismissed')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                            tab === 'dismissed'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
                        }`}
                    >
                        Dismissed
                    </button>
                </nav>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No reports found</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {tab === 'pending' ? "You're all caught up! There are no pending reports in the queue." : "No reports in this category."}
                        </p>
                    </div>
                ) : (
                    reports.map(report => (
                        <div key={report.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row">
                            <div className="p-6 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                                        report.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                        report.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                        {report.status}
                                    </span>
                                    <span className="text-xs text-slate-500 flex items-center">
                                        <Clock size={14} className="mr-1" />
                                        {new Date(report.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    Resource: <Link to={`/admin-portal/resources/${report.resource_id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{report.resource_title}</Link>
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 italic font-medium">"{report.reason}"</p>
                                </div>
                                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
                                    <span>Reporter: {report.reporter_name}</span>
                                    {report.resolved_by_name && (
                                        <span>Resolved by: {report.resolved_by_name} at {new Date(report.resolved_at).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                            
                            {tab === 'pending' && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 p-6 flex md:flex-col justify-center gap-3 w-full md:w-64 shrink-0">
                                    <button 
                                        onClick={() => handleResolve(report.id, 'remove_resource')}
                                        className="flex-1 md:flex-none flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition"
                                    >
                                        <Trash2 size={16} className="mr-2" />
                                        Remove Resource
                                    </button>
                                    <button 
                                        onClick={() => handleResolve(report.id, 'dismiss')}
                                        className="flex-1 md:flex-none flex items-center justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 mb-0 transition"
                                    >
                                        <CheckCircle size={16} className="mr-2" />
                                        Dismiss Report
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminReports;
