import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Users, AlertTriangle, Download, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const AdminDashboard = () => {
    useDocumentTitle('Admin Dashboard');
    const { api } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentResources, setRecentResources] = useState([]);
    const [recentReports, setRecentReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // We'll use the analytics endpoint for top stats, and standard endpoints limiting to 5 for recent
                const analyticsRes = await api.get('admin/analytics/');
                setStats(analyticsRes.data);

                const resRes = await api.get('admin/resources/?limit=5');
                setRecentResources(resRes.data.results || resRes.data);

                const repRes = await api.get('admin/reports/?limit=5');
                setRecentReports(repRes.data.results || repRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [api]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Metrics and recent activities across the platform.</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    title="Total Resources" 
                    value={stats?.resources_total || 0} 
                    icon={FileText} 
                    color="indigo" 
                />
                <MetricCard 
                    title="Total Students" 
                    value={stats?.users_total || 0} 
                    icon={Users} 
                    color="blue" 
                />
                <MetricCard 
                    title="Pending Reports" 
                    value={stats?.pending_reports || 0} 
                    icon={AlertTriangle} 
                    color="red"
                    alert={stats?.pending_reports > 0}
                />
                <MetricCard 
                    title="Downloads (30d)" 
                    value={stats?.downloads_30d || 0} 
                    icon={Download} 
                    color="emerald" 
                />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Uploads */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Uploads</h2>
                        <Link to="/admin-portal/resources" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center font-medium">
                            View all <ArrowRight size={16} className="ml-1" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {recentResources.slice(0,5).map(res => (
                            <Link key={res.id} to={`/admin-portal/resources/${res.id}`} className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-4">{res.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {res.uploader_name} • {res.module_name || 'No module'}
                                        </p>
                                    </div>
                                    <StatusBadge status={res.status} />
                                </div>
                            </Link>
                        ))}
                        {recentResources.length === 0 && (
                            <div className="p-6 text-center text-sm text-slate-500">No recent uploads</div>
                        )}
                    </div>
                </div>

                {/* Pending Reports */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Pending Reports</h2>
                        <Link to="/admin-portal/reports" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center font-medium">
                            View all <ArrowRight size={16} className="ml-1" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {recentReports.filter(r => r.status === 'pending').slice(0,5).map(report => (
                            <div key={report.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                                <div>
                                    <Link to={`/admin-portal/resources/${report.resource_id}`} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                        {report.resource_title}
                                    </Link>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Reported by {report.reporter_name}</p>
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                        {recentReports.filter(r => r.status === 'pending').length === 0 && (
                            <div className="p-6 text-center text-sm text-slate-500 flex flex-col items-center">
                                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full mb-2">
                                    <AlertTriangle size={20} />
                                </div>
                                No pending reports. All clear!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon: Icon, color, alert }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
        red: alert ? 'bg-red-500 text-white animate-pulse' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
            <div className={`p-3 rounded-lg ${colorClasses[color]} mr-4`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const isRemoved = status === 'removed';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            isRemoved ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
        }`}>
            {status}
        </span>
    );
};

export default AdminDashboard;
