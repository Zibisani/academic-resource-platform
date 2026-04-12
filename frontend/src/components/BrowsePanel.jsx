import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Folder, FolderOpen, Book, BookOpenText } from 'lucide-react';

const BrowsePanel = ({ api, onSearch, onCourseSelect }) => {
    const [faculties, setFaculties] = useState([]);
    const [query, setQuery] = useState('');
    const [expandedFaculty, setExpandedFaculty] = useState(null);
    const [programmes, setProgrammes] = useState({}); // { facultyId: [programmes] }
    const [expandedProgramme, setExpandedProgramme] = useState(null);
    const [courses, setCourses] = useState({}); // { programmeId: [courses] }

    useEffect(() => {
        let isMounted = true;
        api.get('faculties/').then(res => {
            if (isMounted) setFaculties(res.data.results || res.data || []);
        }).catch(console.error);
        return () => { isMounted = false; };
    }, [api]);

    const toggleFaculty = async (facultyId) => {
        if (expandedFaculty === facultyId) {
            setExpandedFaculty(null);
            return;
        }
        setExpandedFaculty(facultyId);
        if (!programmes[facultyId]) {
            try {
                const res = await api.get(`programmes/?faculty_id=${facultyId}`);
                setProgrammes(prev => ({ ...prev, [facultyId]: res.data.results || res.data || [] }));
            } catch (err) {
                console.error(err);
            }
        }
    };

    const toggleProgramme = async (programmeId) => {
        if (expandedProgramme === programmeId) {
            setExpandedProgramme(null);
            return;
        }
        setExpandedProgramme(programmeId);
        if (!courses[programmeId]) {
            try {
                const res = await api.get(`courses/?programme_id=${programmeId}`);
                setCourses(prev => ({ ...prev, [programmeId]: res.data.results || res.data || [] }));
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl overflow-hidden flex flex-col h-full max-h-screen">
            <div className="p-4 border-b border-border bg-background/50">
                <h2 className="font-semibold tracking-tight text-lg mb-4">Browse & Search</h2>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (query.trim() && onSearch) onSearch(query);
                }} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search resources..." 
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <button type="submit" className="hidden">Search</button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
                <div className="space-y-[2px]">
                    {faculties.map(faculty => (
                        <div key={faculty.id} className="mb-0.5">
                            <button
                                onClick={() => toggleFaculty(faculty.id)}
                                className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors group ${expandedFaculty === faculty.id ? 'bg-accent/50' : ''}`}
                            >
                                <div className="flex items-center space-x-2.5">
                                    <div className={`p-1.5 rounded-md ${expandedFaculty === faculty.id ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground group-hover:bg-background'}`}>
                                        {expandedFaculty === faculty.id ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                                    </div>
                                    <span className="font-medium text-sm text-left line-clamp-1">{faculty.name}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedFaculty === faculty.id ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Programmes Render */}
                            {expandedFaculty === faculty.id && programmes[faculty.id] && (
                                <div className="ml-5 mt-1 border-l-2 border-border/50 pl-2 space-y-[2px]">
                                    {programmes[faculty.id].length === 0 ? (
                                        <div className="p-2 text-xs text-muted-foreground italic">No programmes found.</div>
                                    ) : (
                                        programmes[faculty.id].map(prog => (
                                            <div key={prog.id}>
                                                <button
                                                    onClick={() => toggleProgramme(prog.id)}
                                                    className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-accent/70 transition-colors text-sm ${expandedProgramme === prog.id ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <Book className="w-3 h-3 min-w-[12px] opacity-70" />
                                                        <span className="text-left leading-snug">{prog.name}</span>
                                                    </div>
                                                </button>

                                                {/* Courses Render */}
                                                {expandedProgramme === prog.id && courses[prog.id] && (
                                                    <div className="ml-4 mt-0.5 border-l border-border/30 pl-2 space-y-1 mb-2">
                                                        {courses[prog.id].length === 0 ? (
                                                            <div className="p-1.5 text-xs text-muted-foreground italic">No courses found.</div>
                                                        ) : (
                                                            courses[prog.id].map(course => (
                                                                <button 
                                                                    key={course.id} 
                                                                    onClick={() => onCourseSelect && onCourseSelect(course.id, course.code + ' ' + course.name)}
                                                                    className="w-full flex items-start text-xs p-1.5 rounded text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left group"
                                                                >
                                                                    <BookOpenText className="w-3 h-3 min-w-[12px] opacity-50 mr-2 mt-0.5 group-hover:opacity-100" />
                                                                    <span className="leading-tight"><span className="font-semibold mr-1">{course.code}</span> {course.name}</span>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BrowsePanel;
