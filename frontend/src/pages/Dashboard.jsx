import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, UploadCloud, FolderDot, User as UserIcon, BookOpen } from 'lucide-react';
import PersonalisedFeed from '../components/PersonalisedFeed';
import BrowsePanel from '../components/BrowsePanel';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Dashboard = () => {
    useDocumentTitle('Dashboard');
    const { user, api, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('feed'); 
    const [searchParams, setSearchParams] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    }; 

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
            {/* Native Header (Shadcn Navbar Equivalent) */}
            <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="container flex h-16 max-w-7xl mx-auto items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight hidden sm:inline-block">AcademicHub</h1>
                    </div>
                    
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <div className="hidden md:flex items-center text-sm mr-2 py-1 px-3 bg-muted rounded-full text-muted-foreground font-medium">
                            <UserIcon className="w-4 h-4 mr-2 opacity-70" />
                            {user?.first_name || user?.email}
                        </div>
                        
                        <Link to="/my-uploads" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 border border-border shadow-sm bg-background">
                            <FolderDot className="w-4 h-4 mr-2 text-primary" />
                            <span className="hidden sm:inline">My Uploads</span>
                        </Link>
                        
                        <Link to="/upload" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                            <UploadCloud className="w-4 h-4 mr-2" />
                            <span>Upload</span>
                        </Link>
                        
                        <div className="w-px h-6 bg-border mx-1"></div>

                        <button onClick={handleLogout} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive/10 hover:text-destructive h-9 w-9 md:px-3 md:w-auto text-muted-foreground">
                            <LogOut className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline font-bold">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Tab Navigation */}
            <div className="md:hidden sticky top-16 z-40 bg-card/95 backdrop-blur border-b border-border/50">
                <div className="flex p-1 w-full bg-muted/30">
                    <button 
                        onClick={() => setActiveTab('feed')}
                        className={`flex-1 flex justify-center items-center py-2.5 text-xs font-semibold tracking-wide uppercase transition-all rounded-md ${activeTab === 'feed' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    >
                        My Feed
                    </button>
                    <button 
                        onClick={() => setActiveTab('browse')}
                        className={`flex-1 flex justify-center items-center py-2.5 text-xs font-semibold tracking-wide uppercase transition-all rounded-md ${activeTab === 'browse' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    >
                        Browse
                    </button>
                </div>
            </div>
            
            {/* Main Content Matrices */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 overflow-visible">
                <div className="flex gap-6 relative items-start">
                    
                    {/* Zone 1: Personalised Feed */}
                    <div className={`${activeTab !== 'feed' ? 'hidden md:block' : 'block'} flex-1 min-w-0 pb-10`}>
                        <PersonalisedFeed api={api} user={user} searchParams={searchParams} clearSearch={() => setSearchParams(null)} />
                    </div>

                    {/* Zone 2: Browse and Search Panel */}
                    <div className={`${activeTab !== 'browse' ? 'hidden md:block' : 'block'} w-full md:w-80 lg:w-96 shrink-0`}>
                        <div className="md:sticky md:top-24 pb-10">
                            <BrowsePanel 
                                api={api} 
                                onSearch={(query) => { setSearchParams({ query }); setActiveTab('feed'); }}
                                onCourseSelect={(courseId, courseName) => { setSearchParams({ courseId, courseName }); setActiveTab('feed'); }}
                            />
                        </div>
                    </div>
                    
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
