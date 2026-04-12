import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Users, Download, Star, FileText } from 'lucide-react';

const AdminAnalytics = () => {
    const { api } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('admin/analytics/');
                setAnalytics(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [api]);

    if (loading) return <div className="text-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div>;
    if (!analytics) return <div className="text-center p-12">Failed to load analytics</div>;

    const resourcesChart = analytics.chart_resources || [];
    const maxResourceCount = Math.max(...resourcesChart.map(r => r.count), 1);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Analytics</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Deep dive into usage and engagement metrics.</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox title="Total Users" value={analytics.users_total} icon={Users} color="text-blue-500" />
                <StatBox title="Total Resources" value={analytics.resources_total} icon={FileText} color="text-indigo-500" />
                <StatBox title="Pending Reports" value={analytics.pending_reports} icon={TrendingUp} color="text-red-500" />
                <StatBox title="30d Downloads" value={analytics.downloads_30d} icon={Download} color="text-emerald-500" />
            </div>

            {/* CSS Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Uploads (Last 30 Days)</h3>
                    <div className="h-48 flex items-end justify-between gap-1">
                        {resourcesChart.length === 0 ? (
                            <div className="w-full text-center text-slate-400 text-sm italic py-10">No upload data in last 30 days</div>
                        ) : (
                            resourcesChart.map((point, i) => (
                                <div key={i} className="w-full bg-indigo-100 dark:bg-indigo-900/40 rounded-t-sm relative group transition-all" style={{ height: `${(point.count / maxResourceCount) * 100}%`, minHeight: '4px' }}>
                                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                                        {point.date}: {point.count}
                                    </div>
                                    <div className="w-full h-full bg-indigo-500 rounded-t-sm opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Top Uploaders</h3>
                    <div className="space-y-4">
                        {(analytics.top_uploaders || []).slice(0, 5).map((u, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs">
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</p>
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                    {u.upload_count} uploads
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tables Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <SimpleDataTable 
                    title="Top 10 Downloaded" 
                    icon={Download} 
                    headers={['Title', 'Downloads']} 
                    data={(analytics.top_downloaded || []).map(r => [r.title, r.download_count])} 
                />
                <SimpleDataTable 
                    title="Highest Rated" 
                    icon={Star} 
                    headers={['Title', 'Rating']} 
                    data={(analytics.top_rated || []).map(r => [r.title, `${r.average_rating.toFixed(1)} (${r.rating_count} rets)`])} 
                />
            </div>
        </div>
    );
};

const StatBox = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
        <Icon size={24} className={`mb-3 ${color}`} />
        <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">{title}</p>
    </div>
);

const SimpleDataTable = ({ title, icon: Icon, headers, data }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Icon size={18} className="text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                        {headers.map(h => <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {data.length === 0 ? (
                        <tr><td colSpan={headers.length} className="px-5 py-6 text-center text-slate-500">No data available</td></tr>
                    ) : (
                        data.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                {row.map((cell, j) => (
                                    <td key={j} className={`px-5 py-3 text-sm ${j === 0 ? 'text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]' : 'text-slate-500 text-right font-mono'}`}>{cell}</td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

export default AdminAnalytics;
