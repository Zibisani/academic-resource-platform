import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ResourceCard from '../components/ResourceCard';

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

    return (
        <div className="bg-gray-50 min-h-screen py-10 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                    <div>
                        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline mb-2 inline-block">&larr; Back to Dashboard</Link>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Uploads</h1>
                        <p className="text-gray-500 mt-1 flex items-center">
                            Manage the materials you've contributed to the community.
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>)}
                    </div>
                ) : resources.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500 shadow-sm">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No uploads yet</h3>
                        <p className="mb-6">You haven't contributed any academic resources yet.</p>
                        <Link to="/upload" className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition font-medium">
                            Upload your first resource
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resources.map(res => (
                            <div key={res.id} className="flex">
                                <div className="w-full">
                                    <ResourceCard resource={res} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyUploads;
