import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ResourceCard from '../components/ResourceCard';
import { ArrowLeft, Inbox } from 'lucide-react';

const MyUploads = () => {
    const { api, user } = useAuth();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        api.get('resources/my_uploads/')
            .then(res => {
                if (isMounted) {
                    setResources(res.data.results || res.data || []);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error("Failed to fetch personal uploads", err);
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false; };
    }, [api]);

    const handleDeleteResource = async (id) => {
        if (!window.confirm("Are you sure you want to delete this resource? It will be hidden (soft delete) and cannot be restored.")) return;
        try {
            await api.delete(`resources/${id}/`);
            setResources(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error("Failed to delete resource", err);
            alert("Failed to delete resource.");
        }
    };

    return (
        <div className="bg-background min-h-screen py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                    <div>
                        <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Uploads</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Manage the materials you've contributed to the community.
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted rounded-xl border border-border shadow-sm animate-pulse"></div>)}
                    </div>
                ) : resources.length === 0 ? (
                    <div className="bg-card border border-dashed border-border rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <Inbox className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">No uploads yet</h3>
                        <p className="text-muted-foreground mb-8 max-w-sm">You haven't contributed any academic resources to the library yet. Start sharing!</p>
                        <Link to="/upload" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2 shadow">
                            Upload your first resource
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resources.map(res => (
                            <div key={res.id} className="h-full">
                                <ResourceCard resource={res} onDelete={() => handleDeleteResource(res.id)} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyUploads;
