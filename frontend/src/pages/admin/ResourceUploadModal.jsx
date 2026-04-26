import React, { useState, useEffect } from 'react';
import { X, UploadCloud } from 'lucide-react';

export const ResourceUploadModal = ({ isOpen, onClose, api, onSuccess }) => {
    const [programmes, setProgrammes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        title: '', description: '', resource_type: '',
        programme: '', course: '', url: ''
    });
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            api.get('programmes/').then(r => setProgrammes(r.data.results || r.data || [])).catch(console.error);
        }
    }, [isOpen, api]);

    useEffect(() => {
        if (formData.programme) {
            api.get(`courses/?programme_id=${formData.programme}`)
                .then(r => setCourses(r.data.results || r.data || []))
                .catch(console.error);
        } else {
            setCourses([]);
            setFormData(f => ({ ...f, course: '' }));
        }
    }, [formData.programme]);

    if (!isOpen) return null;

    const handle = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsUploading(true);
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('resource_type', formData.resource_type);
        if (formData.programme) data.append('programme', formData.programme);
        if (formData.course) data.append('course_id', formData.course);

        if (formData.resource_type === 'video') {
            if (!formData.url) { setError('Please provide a video URL.'); setIsUploading(false); return; }
            data.append('video_link', formData.url);
        } else {
            if (!file) { setError('Please select a file.'); setIsUploading(false); return; }
            data.append('file_url', file);
        }

        try {
            await api.post('resources/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            onSuccess();
            onClose();
            setFormData({ title: '', description: '', resource_type: '', programme: '', course: '', url: '' });
            setFile(null);
        } catch (err) {
            console.error(err);
            const errData = err.response?.data;
            setError(errData ? JSON.stringify(errData) : 'Upload failed. Check all fields.');
        } finally {
            setIsUploading(false);
        }
    };

    const inp = "w-full mt-1 p-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <UploadCloud size={18} className="text-primary" /> Upload Resource
                    </h2>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Title *</label>
                        <input name="title" required className={inp} placeholder="e.g., Data Structures Finals 2024" onChange={handle} value={formData.title} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Description</label>
                        <textarea name="description" rows={2} className={inp} placeholder="Brief description..." onChange={handle} value={formData.description} />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Resource Type *</label>
                        <select name="resource_type" required className={inp} onChange={handle} value={formData.resource_type}>
                            <option value="" disabled>Select type...</option>
                            <option value="notes">Lecture Notes</option>
                            <option value="past_exam">Past Exam Paper</option>
                            <option value="textbook">Textbook / Document</option>
                            <option value="video">Video Link</option>
                            <option value="image">Diagram / Image</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Programme *</label>
                            <select name="programme" required className={inp} onChange={handle} value={formData.programme}>
                                <option value="" disabled>Select...</option>
                                {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Course *</label>
                            <select name="course" required className={inp} onChange={handle} value={formData.course} disabled={!formData.programme}>
                                <option value="" disabled>Select...</option>
                                {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {formData.resource_type === 'video' ? (
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Video URL *</label>
                            <input name="url" type="url" required className={inp} placeholder="https://youtube.com/..." onChange={handle} value={formData.url} />
                        </div>
                    ) : (
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">File *</label>
                            <input type="file" className={`${inp} file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:cursor-pointer`}
                                onChange={e => setFile(e.target.files[0])} />
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md hover:bg-muted">Cancel</button>
                        <button type="submit" disabled={isUploading}
                            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                            <UploadCloud size={15} />
                            {isUploading ? 'Uploading...' : 'Upload Resource'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
