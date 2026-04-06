import React, { useState, useEffect } from 'react';
import ResourceCard from './ResourceCard';

const BrowsePanel = ({ api }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    
    // Heirarchy states
    const [faculties, setFaculties] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [courses, setCourses] = useState([]);
    
    // Selections
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [selectedProgramme, setSelectedProgramme] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    
    // Results
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initial load
    useEffect(() => {
        api.get('faculties/').then(res => setFaculties(res.data.results || res.data || []));
    }, [api]);

    // Cascades
    useEffect(() => {
        if (selectedFaculty) {
            api.get(`programmes/?faculty_id=${selectedFaculty.id}`).then(res => setProgrammes(res.data.results || res.data || []));
        }
    }, [selectedFaculty, api]);

    useEffect(() => {
        if (selectedProgramme) {
            api.get(`courses/?programme_id=${selectedProgramme.id}`).then(res => setCourses(res.data.results || res.data || []));
        }
    }, [selectedProgramme, api]);

    // Fetch resources based on Search OR Course filter
    useEffect(() => {
        // If we have a search query OR a selected course, fetch matching resources
        if (submittedSearch || selectedCourse) {
            setLoading(true);
            let url = 'resources/?';
            if (selectedCourse) url += `course_id=${selectedCourse.id}&`;
            if (submittedSearch) url += `search=${encodeURIComponent(submittedSearch)}&`;
            
            api.get(url).then(res => {
                setResources(res.data.results || res.data || []);
                setLoading(false);
            }).catch(() => setLoading(false));
        } else {
            setResources([]);
        }
    }, [selectedCourse, submittedSearch, api]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSubmittedSearch(searchQuery);
    };

    return (
        <div className="bg-gray-50 border-l border-gray-200 h-full max-h-screen overflow-y-auto p-6 flex flex-col relative" style={{ scrollbarWidth: 'none' }}>
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="mb-8 sticky top-0 bg-gray-50 z-10 pt-2 pb-4 border-b border-gray-100">
                <div className="relative">
                    <input 
                        type="search" 
                        placeholder="Search resources, tags, topics..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-24 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-sm"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 text-white px-4 rounded hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm">Search</button>
                </div>
            </form>

            {/* Drilldown Area */}
            {(!selectedCourse && !submittedSearch) && (
                <div className="flex-1 pb-10">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Browse Directory</h3>
                    
                    {!selectedFaculty ? (
                        <div className="space-y-3">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 mb-2 block">Step 1: Select Faculty</span>
                            {faculties.map(f => (
                                <button key={f.id} onClick={() => setSelectedFaculty(f)} className="w-full text-left bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow transition font-medium text-gray-800 flex justify-between items-center group">
                                    {f.name}
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                            ))}
                        </div>
                    ) : !selectedProgramme ? (
                        <div>
                            <button onClick={() => setSelectedFaculty(null)} className="text-sm text-blue-600 mb-6 hover:underline flex items-center font-medium"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Back to Faculties</button>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 mb-2 block">Step 2: Exploring</span>
                            <h4 className="font-bold text-gray-900 text-lg mb-4">{selectedFaculty.name}</h4>
                            <div className="space-y-3">
                                {programmes.map(p => (
                                    <button key={p.id} onClick={() => setSelectedProgramme(p)} className="w-full text-left bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 transition text-sm font-medium text-gray-800 flex justify-between items-center group">
                                        {p.name}
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <button onClick={() => setSelectedProgramme(null)} className="text-sm text-blue-600 mb-6 hover:underline flex items-center font-medium"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Back to Programmes</button>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 mb-2 block">Step 3: Select Course inside</span>
                            <h4 className="font-bold text-gray-900 text-lg leading-tight mb-4">{selectedProgramme.name}</h4>
                            <div className="space-y-3">
                                {courses.map(c => (
                                    <button key={c.id} onClick={() => setSelectedCourse(c)} className="w-full text-left bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 transition flex items-start group">
                                        <span className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-0.5 rounded mr-3 mt-0.5 whitespace-nowrap">{c.code}</span>
                                        <span className="text-sm font-medium text-gray-800 leading-tight block">{c.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Results Area */}
            {(selectedCourse || submittedSearch) && (
                <div className="flex-1 flex flex-col overflow-visible pb-12">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-tight mb-1">
                                {submittedSearch ? `Search Results` : `${selectedCourse?.code}`}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {submittedSearch ? `Showing matches for "${submittedSearch}"` : `Active resources mapped to this course`}
                            </p>
                        </div>
                        <button onClick={() => {
                            if (submittedSearch) setSubmittedSearch('');
                            else setSelectedCourse(null);
                        }} className="text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded transition shadow-sm font-medium">
                            Clear
                        </button>
                    </div>

                    <div className="pr-2 space-y-4">
                        {loading ? (
                             <div className="text-center py-10">
                                 <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                             </div>
                        ) : resources.length > 0 ? (
                            resources.map(res => (
                                <ResourceCard key={res.id} resource={res} />
                            ))
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm h-64">
                                <span className="bg-gray-50 p-4 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                </span>
                                <h4 className="text-gray-900 font-bold text-lg mb-1">No resources found</h4>
                                <p className="text-gray-500 text-sm max-w-[250px]">We couldn't find anything matching your criteria. Try adjusting your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default BrowsePanel;
