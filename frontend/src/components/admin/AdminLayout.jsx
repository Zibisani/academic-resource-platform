import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
    LayoutDashboard, Users, FileText, AlertTriangle, 
    Layers, Sliders, BarChart2, ShieldAlert, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const navItems = [
        { name: 'Dashboard', path: '/admin-portal/dashboard', icon: LayoutDashboard },
        { name: 'Users', path: '/admin-portal/users', icon: Users },
        { name: 'Resources', path: '/admin-portal/resources', icon: FileText },
        { name: 'Reports', path: '/admin-portal/reports', icon: AlertTriangle },
        { name: 'Hierarchy', path: '/admin-portal/hierarchy', icon: Layers },
        { name: 'Weights', path: '/admin-portal/weights', icon: Sliders },
        { name: 'Analytics', path: '/admin-portal/analytics', icon: BarChart2 },
        { name: 'Audit Log', path: '/admin-portal/audit-log', icon: ShieldAlert },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans">
            {/* Mobile Header */}
            <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-20">
                <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                    AcademicHub Admin
                </div>
                <button onClick={toggleSidebar} className="text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white">
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
                w-64 transform transition-transform duration-200 ease-in-out z-10 md:relative md:translate-x-0 flex flex-col
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="hidden md:flex p-6 items-center justify-center border-b border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 tracking-tight">
                        Admin Portal
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="space-y-1 px-3">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                    ${isActive 
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50'}
                                `}
                            >
                                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center mb-4 px-3">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            {user?.first_name?.charAt(0) || 'A'}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.first_name} {user?.last_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    
                    {user?.role === 'admin' && ( // "user.is_staff === true from JWT" according to plan, but user.role === 'admin' works. Let's provide python django admin link
                        <a 
                            href="http://localhost:8000/admin/" 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors mb-2"
                        >
                            <Layers className="mr-3 h-5 w-5" />
                            Django Admin ↗
                        </a>
                    )}
                    
                    <button 
                        onClick={() => {
                            logout();
                            window.location.href = '/admin-portal/login';
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
            
            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-0 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout;
