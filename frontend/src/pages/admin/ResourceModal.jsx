import React, { useState, useEffect } from 'react';
import { X, Download, Star, ExternalLink, FileText, Video } from 'lucide-react';

/**
 * Resolves a file URL so it loads through the Vite dev proxy on the same origin.
 *
 * DRF serializes FileField as: http://localhost:8000/media/resources/file.pdf
 * We must strip the origin so the path routes through Vite's /media proxy,
 * which avoids X-Frame-Options cross-origin blocks and "refused to connect".
 */
const resolveMediaUrl = (fileUrl) => {
    if (!fileUrl) return null;
    // If it's an absolute URL, extract just the pathname (e.g. /media/resources/file.pdf)
    // This always routes it via the Vite proxy on the same origin
    try {
        const url = new URL(fileUrl);
        return url.pathname; // e.g. "/media/resources/file.pdf"
    } catch {
        // Already a relative path
        if (fileUrl.startsWith('/')) return fileUrl;
        return `/media/${fileUrl}`; // bare path like "resources/file.pdf"
    }
};

const FilePreview = ({ details }) => {
    const fileUrl = resolveMediaUrl(details.file_url);
    const videoUrl = details.video_link;

    // Video resource — just show a link, no embed
    if (details.resource_type === 'video' || videoUrl) {
        return (
            <a href={videoUrl || fileUrl} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                <Video size={16} /> Open Video Link
            </a>
        );
    }

    if (!fileUrl) {
        return <p className="text-sm text-muted-foreground italic">No file attached to this resource.</p>;
    }

    // Image — display inline
    if (details.resource_type === 'image') {
        return (
            <img src={fileUrl} alt={details.title}
                 className="w-full rounded-md border border-border object-contain max-h-64"
                 onError={e => { e.target.replaceWith(Object.assign(document.createElement('p'), { textContent: 'Could not load image.', className: 'text-sm text-muted-foreground italic' })); }} />
        );
    }

    // PDF / document — embed via iframe using same-origin Vite proxy path
    return (
        <div className="w-full rounded-md border border-border overflow-hidden bg-muted/30" style={{ height: '340px' }}>
            <iframe
                src={fileUrl}
                title={details.title}
                className="w-full h-full"
                frameBorder="0"
            />
        </div>
    );
};

export const ResourceViewModal = ({ resource, onClose, api }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!resource) return;
        setLoading(true);
        setDetails(null);
        setError(false);
        api.get(`admin/resources/${resource.id}/`)
            .then(res => setDetails(res.data))
            .catch(err => { console.error(err); setError(true); })
            .finally(() => setLoading(false));
    }, [resource, api]);

    if (!resource) return null;

    const fileUrl = details ? resolveMediaUrl(details.file_url) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <FileText size={18} className="text-primary" /> Resource Details
                    </h2>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <p className="text-red-500 text-center py-8">Failed to load resource data.</p>
                    ) : details ? (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-xl font-bold">{details.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{details.description || 'No description provided.'}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                                    <p className="font-semibold capitalize text-sm">{(details.resource_type || '').replace('_', ' ')}</p>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                                    <p className={`font-semibold capitalize text-sm ${details.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>{details.status}</p>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1">Downloads</p>
                                    <p className="font-semibold text-sm">{details.download_count ?? 0}</p>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1">Rating</p>
                                    <p className="font-semibold text-sm flex items-center gap-1">
                                        <Star size={13} className="text-amber-500 fill-amber-500" />
                                        {(details.average_rating ?? 0).toFixed(1)}
                                    </p>
                                </div>
                            </div>

                            {/* File Preview */}
                            <div>
                                <p className="text-xs uppercase font-semibold text-muted-foreground mb-2 tracking-wider">File Preview</p>
                                <FilePreview details={details} />
                            </div>

                            {/* Action buttons */}
                            {fileUrl && details.resource_type !== 'video' && (
                                <div className="pt-2 flex justify-end gap-3">
                                    <a href={fileUrl} download
                                       className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                                        <Download size={14} /> Download
                                    </a>
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                       className="inline-flex items-center gap-2 px-4 py-2 border border-border text-sm font-medium rounded-lg hover:bg-muted transition-colors">
                                        <ExternalLink size={14} /> Open in New Tab
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
