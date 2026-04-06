import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UploadResource = () => {
    const { api } = useAuth();
    const navigate = useNavigate();
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [resourceType, setResourceType] = useState('notes');
    const [file, setFile] = useState(null);
    const [videoLink, setVideoLink] = useState('');

    // Hierarchy state
    const [faculties, setFaculties] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [courses, setCourses] = useState([]);

    // Selections
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [selectedProgramme, setSelectedProgramme] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');

    useEffect(() => {
        // Load initial faculties
        api.get('faculties/').then(res => setFaculties(res.data.results || res.data || [])).catch(console.error);
    }, [api]);

    // Cascading dropdowns
    useEffect(() => {
        if (selectedFaculty) {
            api.get(`programmes/?faculty_id=${selectedFaculty}`).then(res => setProgrammes(res.data.results || res.data || []));
        } else {
            setProgrammes([]);
        }
    }, [selectedFaculty, api]);

    useEffect(() => {
        if (selectedProgramme) {
            api.get(`courses/?programme_id=${selectedProgramme}`).then(res => setCourses(res.data.results || res.data || []));
        } else {
            setCourses([]);
        }
    }, [selectedProgramme, api]);




    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('resource_type', resourceType);
        
        if (selectedCourse) formData.append('course_id', selectedCourse);

        if (file) {
            formData.append('file_url', file);
        }
        if (videoLink) {
            formData.append('video_link', videoLink);
        }

        try {
            await api.post('resources/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/dashboard');
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload failed. Check console.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-blue-900 border-b pb-4">Contribute a Resource</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 shadow rounded-lg border border-gray-100">
                
                <h2 className="text-xl font-semibold mb-4 text-gray-800">1. Basic Details</h2>
                <div className="space-y-4 mb-8 pl-4 border-l-2 border-blue-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"></textarea>
                    </div>
                </div>

                <h2 className="text-xl font-semibold mb-4 text-gray-800">2. Academic Categorization</h2>
                <div className="grid grid-cols-2 gap-4 mb-8 pl-4 border-l-2 border-blue-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Faculty (Required)</label>
                        <select required value={selectedFaculty} onChange={(e) => {
                            setSelectedFaculty(e.target.value);
                            setSelectedProgramme('');
                            setSelectedCourse('');
                        }} className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Select Faculty</option>
                            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Programme (Required)</label>
                        <select required value={selectedProgramme} onChange={(e) => {
                            setSelectedProgramme(e.target.value);
                            setSelectedCourse('');
                        }} disabled={!selectedFaculty} className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500 bg-gray-50 disabled:bg-gray-200">
                            <option value="">Select Programme</option>
                            {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course (Required)</label>
                        <select required value={selectedCourse} onChange={(e) => {
                            setSelectedCourse(e.target.value);
                        }} disabled={!selectedProgramme} className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500 bg-gray-50 disabled:bg-gray-200">
                            <option value="">Select Course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}
                        </select>
                    </div>
                </div>

                <h2 className="text-xl font-semibold mb-4 text-gray-800">3. Resource File/Link</h2>
                <div className="space-y-4 mb-8 pl-4 border-l-2 border-blue-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                        <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500">
                            <option value="notes">Notes (PDF)</option>
                            <option value="past_exam">Past Exam (PDF)</option>
                            <option value="textbook">Textbook (PDF)</option>
                            <option value="image">Image</option>
                            <option value="video">Video Link</option>
                        </select>
                    </div>
                    
                    {resourceType === 'video' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Video Link (URL)</label>
                            <input type="url" required value={videoLink} onChange={(e) => setVideoLink(e.target.value)} className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="https://youtube.com/..." />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">File Upload</label>
                            <input type="file" required onChange={(e) => setFile(e.target.files[0])} accept={resourceType === 'image' ? 'image/*' : '.pdf'} className="w-full border p-2 rounded" />
                        </div>
                    )}
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors text-lg shadow-sm">
                    Upload Resource
                </button>
            </form>
        </div>
    );
};

export default UploadResource;
