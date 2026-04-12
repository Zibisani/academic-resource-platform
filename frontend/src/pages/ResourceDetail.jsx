import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Star, Download, Calendar, User, FileText, CheckCircle2, MessageSquare, ArrowLeft, Layers, Video, Image as ImageIcon } from "lucide-react";

const typeLabels = {
    'past_exam': 'Past Paper',
    'notes': 'Notes',
    'video': 'Video',
    'image': 'Image',
    'textbook': 'Textbook'
};

const ResourceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api, user } = useAuth();
    
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Rating state
    const [userRating, setUserRating] = useState(0);
    const [avgRating, setAvgRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);
    const [hoverStar, setHoverStar] = useState(0);
    const [isRating, setIsRating] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [newReview, setNewReview] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchResource = async () => {
            try {
                const response = await api.get(`resources/${id}/`);
                const resData = response.data;
                setResource(resData);
                
                // Initialize ratings from the fetched detail data
                setAvgRating(resData.average_rating || 0);
                setRatingCount(resData.rating_count || 0);
                
                // Calculate user rating if exists
                if (user && resData.ratings) {
                    const existingRating = resData.ratings.find(r => r.user_email === user.email);
                    if (existingRating) {
                        setUserRating(existingRating.value);
                    }
                }

                // Initialize reviews
                if (resData.reviews) {
                    // Sorting reviews newest first
                    const sortedReviews = [...resData.reviews].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                    setReviews(sortedReviews);
                }
                
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch resource", error);
                setLoading(false);
            }
        };
        fetchResource();
    }, [id, api, user]);

    const handleRate = async (value) => {
        if (!user) return;
        setIsRating(true);
        try {
            await api.post(`resources/${resource.id}/rate/`, { value });
            let nextAvg = 0;
            if (userRating === 0) {
                // New rating
                nextAvg = avgRating === 0 ? value : ((avgRating * ratingCount) + value) / (ratingCount + 1);
                setRatingCount(prev => prev + 1);
            } else {
                // Changing existing rating
                if (ratingCount <= 1) {
                    nextAvg = value;
                } else {
                    nextAvg = ((avgRating * ratingCount) - userRating + value) / ratingCount;
                }
            }
            setAvgRating(nextAvg);
            setUserRating(value);
        } catch (err) {
            console.error(err);
        }
        setIsRating(false);
    };

    const handlePostReview = async (e) => {
        e.preventDefault();
        if (!newReview.trim()) return;
        setSubmittingReview(true);
        try {
            const res = await api.post(`resources/${resource.id}/reviews/`, { content: newReview });
            setReviews(prev => [res.data, ...prev]);
            setNewReview('');
        } catch (err) {
            console.error(err);
        }
        setSubmittingReview(false);
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await api.delete(`reviews/${reviewId}/`);
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteResource = async () => {
        if (!window.confirm("Are you sure you want to delete this resource? It will be hidden (soft delete) and cannot be restored.")) return;
        try {
            await api.delete(`resources/${id}/`);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownloadClick = async () => {
        try {
            await api.post(`resources/${id}/download/`);
            
            // Re-fetch to update download count visually (optional, mostly for accuracy)
            setResource(prev => ({...prev, download_count: (prev.download_count || 0) + 1}));
            
            const url = resource.file_url || resource.file;
            if (url) {
                window.open(url, '_blank');
            } else if (resource.video_link) {
                window.open(resource.video_link, '_blank');
            }
        } catch (error) {
             console.error("Failed to register download", error);
        }
    }

    const getRelativeTime = (dateString) => {
        if (!dateString) return "Unknown date";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getUploaderName = (email) => {
        if (resource?.uploader_name && resource.uploader_name.trim() !== "Unknown") return resource.uploader_name;
        if (!email) return "Anonymous";
        return email.split("@")[0];
    };

    const renderViewer = () => {
        if (resource.video_link) {
            return (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/5 border border-border flex items-center justify-center">
                     <iframe src={resource.video_link} className="w-full h-full border-0 shadow-inner" allowFullScreen></iframe>
                </div>
            )
        }
        
        const fileUrl = resource.file_url || resource.file;
        if (fileUrl) {
            const isImage = resource.resource_type === 'image' || fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
            
            if (isImage) {
                return (
                    <div className="w-full h-[600px] flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden border border-border">
                        <img src={fileUrl} alt={resource.title} className="max-w-full max-h-full object-contain" />
                    </div>
                )
            } else {
                return (
                    <div className="w-full h-[800px] bg-muted/30 rounded-xl overflow-hidden border border-border">
                        <iframe src={fileUrl} className="w-full h-full border-0"></iframe>
                    </div>
                )
            }
        }
        
        return (
            <div className="p-16 text-center flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>No preview is available for this resource format.</p>
                <button onClick={handleDownloadClick} className="mt-4 text-primary font-medium hover:underline">Download instead</button>
            </div>
        );
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col pt-20 items-center bg-background">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground font-medium">Loading Document...</p>
        </div>
    );
    
    if (!resource) return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Resource not found</h1>
                <Link to="/dashboard" className="text-primary hover:underline">Return to Dashboard</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            {/* Header Area */}
            <div className="border-b border-border bg-card/60 sticky top-0 z-10 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back to Feed
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                                    {typeLabels[resource.resource_type] || resource.resource_type.replace('_', ' ')}
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    {resource.course?.code || "Unknown"}
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
                                {resource.title}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {resource.course?.name}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                                <span className="flex items-center gap-1.5">
                                    <User className="h-4 w-4" />
                                    {getUploaderName(resource.uploader_email)}
                                    {resource.uploader?.is_verified_contributor && <CheckCircle2 className="h-4 w-4 text-success inline" />}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {getRelativeTime(resource.upload_date)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Download className="h-4 w-4" />
                                    {resource.download_count || 0} Downloads
                                </span>
                            </div>
                        </div>
                        
                        <div className="shrink-0 flex items-center justify-end gap-2">
                            {user && resource.uploader_email === user.email && (
                                <button 
                                    onClick={handleDeleteResource}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none border border-destructive text-destructive hover:bg-destructive/10 h-11 px-4 shadow-sm"
                                    title="Delete Resource"
                                >
                                    Delete
                                </button>
                            )}
                            <button 
                                onClick={handleDownloadClick}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none hover:bg-primary/90 h-11 px-6 shadow-sm border border-transparent bg-primary text-primary-foreground"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Source
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content split layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Left Pane: Document Viewer */}
                    <div className="flex-1 w-full flex flex-col space-y-6">
                        <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden p-1">
                            {renderViewer()}
                        </div>
                        
                        {/* Description */}
                        {resource.description && (
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-semibold mb-3 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-primary" />
                                    Description
                                </h3>
                                <div className="text-muted-foreground text-sm leading-relaxed prose dark:prose-invert max-w-none">
                                    {resource.description}
                                </div>
                            </div>
                        )}
                        
                        {/* Tags */}
                        {resource.tags && resource.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {resource.tags.map((tag, i) => (
                                    <span key={i} className="inline-flex items-center rounded-md border border-transparent px-2.5 py-1 text-xs bg-secondary/50 text-secondary-foreground">
                                        #{tag.name || tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Pane: Ratings and Reviews exactly like ResourceCard */}
                    <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
                        
                        {/* Rating Widget */}
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                            <h3 className="font-semibold text-foreground mb-4">Resource Rating</h3>
                            <div className="flex justify-between items-center bg-background p-4 rounded-lg border border-border shadow-sm">
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-0.5">Your Rating</div>
                                    <div className="flex space-x-1" onMouseLeave={() => setHoverStar(0)}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button 
                                                key={star}
                                                disabled={isRating}
                                                onClick={() => handleRate(star)}
                                                onMouseEnter={() => setHoverStar(star)}
                                                className={`transition cursor-pointer focus:outline-none rounded-full p-1.5 ${isRating ? 'opacity-50' : 'hover:scale-110 hover:bg-warning/10'}`}
                                            >
                                                <Star className={`w-6 h-6 ${(hoverStar || userRating) >= star ? 'fill-warning text-warning drop-shadow-sm' : 'text-muted'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right pr-2">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Avg Score</div>
                                    <div className="text-4xl font-black text-foreground leading-none">{avgRating.toFixed(1)}<span className="text-sm font-medium text-muted-foreground ml-1">/5</span></div>
                                    <div className="text-xs text-muted-foreground mt-1">{ratingCount} ratings</div>
                                </div>
                            </div>
                        </div>

                        {/* Comments Thread */}
                        <div className="bg-card border border-border rounded-xl p-0 shadow-sm overflow-hidden flex flex-col" style={{maxHeight: '600px'}}>
                            <div className="p-4 border-b border-border/50 bg-muted/10">
                                <h3 className="font-semibold text-foreground flex items-center">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Discussion
                                    <span className="ml-2 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-bold font-mono">
                                        {reviews.length || 0}
                                    </span>
                                </h3>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                                {loadingReviews ? (
                                    <div className="text-center py-6"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div></div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center py-8 bg-background border border-dashed border-border rounded-lg text-sm text-muted-foreground shadow-sm">
                                        Be the first to add a comment!
                                    </div>
                                ) : (
                                    reviews.map(r => (
                                        <div key={r.id} className="bg-background p-3.5 rounded-lg border border-border shadow-sm text-sm relative group">
                                            <div className="flex justify-between items-start mb-1.5">
                                                <span className="font-bold text-foreground">{r.user_email?.split('@')[0] || "User"}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{getRelativeTime(r.created_at)}</span>
                                                    {user && r.user_email === user.email && (
                                                        <button onClick={() => handleDeleteReview(r.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Comment">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed pr-6">{r.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handlePostReview} className="p-3 border-t border-border/50 bg-muted/10 relative">
                                <textarea 
                                    value={newReview}
                                    onChange={(e) => setNewReview(e.target.value)}
                                    placeholder="Share your thoughts securely..." 
                                    className="w-full text-sm box-border border border-input rounded-md p-3 pb-12 bg-background focus-visible:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none leading-relaxed shadow-sm disabled:opacity-50"
                                    rows="3"
                                ></textarea>
                                <button 
                                    type="submit" 
                                    disabled={submittingReview || !newReview.trim()} 
                                    className="absolute right-6 bottom-6 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium px-4 py-1.5 rounded-md text-xs transition shadow-sm"
                                >
                                    {submittingReview ? 'Posting...' : 'Post Reply'}
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceDetail;
