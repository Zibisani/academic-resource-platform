import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, ArrowLeft } from 'lucide-react';

const UploadResource = () => {
    const { api, user } = useAuth();
    const navigate = useNavigate();

    // Data lists for dropdowns
    const [programmes, setProgrammes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [modules, setModules] = useState([]); // Kept for legacy support or if you have modules

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        resource_type: '',
        file: null,
        url: '',
        programme: '',
        course: '',
        module: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        api.get('programmes/').then(res => setProgrammes(res.data.results || res.data || [])).catch(console.error);
    }, [api]);

    useEffect(() => {
        if (formData.programme) {
            api.get(`courses/?programme_id=${formData.programme}`).then(res => setCourses(res.data.results || res.data || [])).catch(console.error);
        } else { setCourses([]); }
    }, [formData.programme, api]);

    useEffect(() => {
        if (formData.course) {
            api.get(`modules/?course_id=${formData.course}`).then(res => setModules(res.data.results || res.data || [])).catch(console.error);
        } else { setModules([]); }
    }, [formData.course, api]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, file: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsUploading(true);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('resource_type', formData.resource_type);
        if (formData.programme) data.append('programme', formData.programme);
        if (formData.course) data.append('course_id', formData.course);
        
        if (formData.resource_type === 'video') {
            if (!formData.url) {
                setError("Please provide a valid YouTube/Vimeo URL.");
                setIsUploading(false); return;
            }
            data.append('video_link', formData.url);
        } else {
            if (!formData.file) {
                setError("Please select a file to upload.");
                setIsUploading(false); return;
            }
            data.append('file_url', formData.file);
        }

        try {
            await api.post('resources/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess("Resource uploaded successfully! Proceeding back to dashboard...");
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            console.error(err);
            setError("Failed to upload resource. Ensure all required fields are filled.");
        }
        setIsUploading(false);
    };

    const InputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                
                <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back to Dashboard
                </Link>

                <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl overflow-hidden">
                    <div className="border-b border-border p-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">Upload Resource</h2>
                            <p className="text-sm text-muted-foreground mt-1">Share materials to help your peers and earn trust in the academic network.</p>
                        </div>
                        <div className="hidden sm:block p-3 bg-primary/10 rounded-full">
                            <Upload className="w-6 h-6 text-primary" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && <div className="bg-destructive/15 border border-destructive/20 text-destructive text-sm p-4 rounded-md font-medium">{error}</div>}
                        {success && <div className="bg-success/15 border border-success/20 text-success text-sm p-4 rounded-md font-medium">{success}</div>}

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">General Information</h3>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Title</label>
                                <input
                                    name="title"
                                    type="text"
                                    required
                                    className={InputClass}
                                    placeholder="e.g., Intro to Machine Learning Finals 2025"
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Description (Optional)</label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="What does this resource cover?"
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">Academic Context</h3>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Programme Context</label>
                                    <select name="programme" required className={InputClass} onChange={handleChange} value={formData.programme}>
                                        <option value="" disabled>Select Programme</option>
                                        {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Course Target</label>
                                    <select name="course" required className={InputClass} onChange={handleChange} value={formData.course} disabled={!formData.programme}>
                                        <option value="" disabled>Select Course</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">File Upload</h3>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Resource Type</label>
                                    <select name="resource_type" required className={InputClass} onChange={handleChange} value={formData.resource_type}>
                                        <option value="" disabled>Select Type...</option>
                                        <option value="past_exam">Past Exam Paper</option>
                                        <option value="notes">Lecture Notes</option>
                                        <option value="textbook">Textbook / Document</option>
                                        <option value="video">Video Link</option>
                                        <option value="image">Diagram / Image</option>
                                    </select>
                                </div>

                                {formData.resource_type === 'video' ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Video URL</label>
                                        <input
                                            name="url"
                                            type="url"
                                            required
                                            className={InputClass}
                                            placeholder="https://youtube.com/watch?v=..."
                                            onChange={handleChange}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Upload File</label>
                                        <input
                                            name="file"
                                            type="file"
                                            required
                                            className={`${InputClass} file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer p-1 items-center h-11`}
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border flex justify-end">
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2 w-full sm:w-auto shadow"
                            >
                                {isUploading ? 'Uploading & Processing...' : 'Finalize & Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UploadResource;
