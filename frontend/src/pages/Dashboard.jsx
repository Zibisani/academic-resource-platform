import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import PersonalisedFeed from '../components/PersonalisedFeed';
import BrowsePanel from '../components/BrowsePanel';

const Dashboard = () => {
    const { user, api, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('feed'); 

    const handleLogout = () => {
        logout();
        navigate('/login');
    }; 

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
            {/* Native Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-30 relative shrink-0">
                <div className="flex items-center">
                    <h1 className="text-xl font-extrabold text-blue-700 tracking-tight tracking-wider uppercase">Hub</h1>
                </div>
                <div className="flex items-center space-x-5">
                    <span className="text-sm text-gray-600 hidden md:inline-block">Welcome, <span className="font-semibold text-gray-800">{user?.first_name || user?.email}</span></span>
                    
                    <Link to="/my-uploads" className="text-[11px] font-bold text-gray-500 hover:text-blue-600 transition tracking-widest uppercase">
                        My Uploads
                    </Link>
                    
                    <Link to="/upload" className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition font-medium text-sm shadow-sm flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Upload
                    </Link>
                    <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 font-bold transition cursor-pointer uppercase tracking-wider text-xs">
                        Logout
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden mt-0">
                {/* Mobile Tab Navigation */}
                <div className="md:hidden flex border-b border-gray-200 bg-white shadow-sm z-20 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('feed')}
                        className={`flex-1 py-3 text-sm font-extrabold tracking-wide text-center uppercase transition-colors ${activeTab === 'feed' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/70' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        My Feed
                    </button>
                    <button 
                        onClick={() => setActiveTab('browse')}
                        className={`flex-1 py-3 text-sm font-extrabold tracking-wide text-center uppercase transition-colors ${activeTab === 'browse' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/70' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Browse & Search
                    </button>
                </div>

                {/* Zone 1: Personalised Feed */}
                <div className={`${activeTab !== 'feed' ? 'hidden md:block' : 'block'} flex-grow md:w-2/3 lg:w-3/4 h-full relative bg-white`}>
                    <PersonalisedFeed api={api} user={user} />
                </div>

                {/* Zone 2: Browse and Search Panel */}
                <div className={`${activeTab !== 'browse' ? 'hidden md:block' : 'block'} w-full md:w-1/3 lg:w-1/4 h-full bg-gray-50 shadow-inner md:shadow-none z-10 md:border-l border-gray-200 flex-shrink-0`}>
                    <BrowsePanel api={api} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
