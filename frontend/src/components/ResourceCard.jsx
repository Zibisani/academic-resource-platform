import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Star, Download, Calendar, User, FileText, CheckCircle2, MessageSquare, Trash2 } from "lucide-react";

const typeLabels = {
    'past_exam': 'Past Paper',
    'notes': 'Notes',
    'video': 'Video',
    'image': 'Image',
    'textbook': 'Textbook'
};

const ResourceCard = ({ resource, personalContext = null, onDelete = null }) => {
    const { api, user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Rating state
    const [userRating, setUserRating] = useState(resource.user_rating || 0);
    const [avgRating, setAvgRating] = useState(resource.average_rating || 0);
    const [ratingCount, setRatingCount] = useState(resource.rating_count || 0);
    const [hoverStar, setHoverStar] = useState(0);
    const [isRating, setIsRating] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [newReview, setNewReview] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const isDownloaded = false; 

    useEffect(() => {
        if (isExpanded && reviews.length === 0 && resource.reviews_count > 0) {
            setLoadingReviews(true);
            api.get(`resources/${resource.id}/reviews/`)
                .then(res => {
                    setReviews(res.data);
                    setLoadingReviews(false);
                })
                .catch(() => setLoadingReviews(false));
        }
    }, [isExpanded, resource.id, resource.reviews_count, reviews.length, api]);

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
            setReviews([res.data, ...reviews]);
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

    const getRelativeTime = (dateString) => {
        if (!dateString) return "Unknown date";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getUploaderName = (email) => {
        if (resource.uploader_name && resource.uploader_name.trim() !== "Unknown") return resource.uploader_name;
        if (!email) return "Anonymous";
        return email.split("@")[0];
    };

    return (
        <div className={`group block h-full bg-card text-card-foreground border transition-all duration-200 overflow-hidden flex flex-col ${isExpanded ? 'shadow-md border-primary ring-1 ring-primary/20' : 'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 border-border/50'} rounded-xl`}>
            
            {/* Clickable Header Area triggering Expansion */}
            <div className="p-4 cursor-pointer pb-4 transition-colors hover:bg-muted/30 flex flex-col gap-3" onClick={() => setIsExpanded(!isExpanded)}>
                {isDownloaded && <span className="absolute top-2 right-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">Downloaded</span>}
                
                {/* Header: Type Badge */}
                <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                        {typeLabels[resource.resource_type] || resource.resource_type.replace('_', ' ')}
                    </span>
                    
                    <div className="flex items-center gap-2">
                        {onDelete && (
                            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 rounded p-1 transition-colors" title="Delete Resource">
                                <Trash2 size={14} />
                            </button>
                        )}
                        <div className="flex items-center gap-0.5">
                            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                            <span className="text-xs font-medium text-muted-foreground ml-1">{avgRating.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {resource.title}
                </h3>

                {/* Course/Module */}
                <p className="text-xs text-muted-foreground line-clamp-1">
                    [{resource.course_code}] {resource.course_name}
                </p>

                {/* Metadata Row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2 border-t border-border/50">
                    <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {getUploaderName(resource.uploader_email)}
                        {resource.is_verified_contributor && <CheckCircle2 className="h-3 w-3 text-success inline" />}
                    </span>
                    <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {resource.download_count || 0}
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                        <Calendar className="h-3 w-3" />
                        {getRelativeTime(resource.upload_date)}
                    </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                    {resource.tags && resource.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="inline-flex items-center rounded-md border border-transparent px-1.5 h-5 text-[10px] bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors font-normal">
                            #{tag}
                        </span>
                    ))}
                    {resource.tags && resource.tags.length > 3 && (
                        <span className="inline-flex items-center rounded-md border border-transparent px-1.5 h-5 text-[10px] bg-secondary/50 text-secondary-foreground">
                            +{resource.tags.length - 3}
                        </span>
                    )}
                </div>

                {personalContext && (
                    <div className="mt-2 text-[11px] text-primary bg-primary/10 px-2 py-1.5 rounded flex items-center border border-primary/20">
                        <Star className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                        {personalContext}
                    </div>
                )}
            </div>

            {/* EXPANDED INTERACTIVE LAYER */}
            {isExpanded && (
                <div className="border-t border-border/50 bg-card flex-1 flex flex-col p-4 shadow-inner">
                    
                    {/* Rate Resource */}
                    <div className="mb-5 flex justify-between items-center bg-background p-3 rounded-lg border border-border shadow-sm">
                        <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-0.5">Your Rating</div>
                            <div className="flex space-x-0.5" onMouseLeave={() => setHoverStar(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        disabled={isRating}
                                        onClick={() => handleRate(star)}
                                        onMouseEnter={() => setHoverStar(star)}
                                        className={`transition cursor-pointer focus:outline-none rounded-full p-1 ${isRating ? 'opacity-50' : 'hover:scale-110 hover:bg-warning/10'}`}
                                    >
                                        <Star className={`w-5 h-5 ${(hoverStar || userRating) >= star ? 'fill-warning text-warning drop-shadow-sm' : 'text-muted'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="text-right pr-1">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Avg Score</div>
                            <div className="text-2xl font-black text-foreground leading-none">{avgRating.toFixed(1)}<span className="text-xs font-medium text-muted-foreground ml-0.5">/5</span></div>
                        </div>
                    </div>

                    <div className="mb-5">
                        <Link to={`/resource/${resource.id}`} className="w-full flex justify-center items-center bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2 rounded-md text-sm transition shadow-sm h-10">
                            <FileText className="w-4 h-4 mr-2" />
                            View Source Document
                        </Link>
                    </div>

                    {/* Comments Thread */}
                    <div className="flex-1 overflow-visible mb-4">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center border-b border-border/50 pb-1.5">
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            Reviews <span className="ml-1.5 bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full text-[9px]">{reviews.length + (resource.reviews_count - reviews.length > 0 ? (resource.reviews_count - reviews.length) : 0)}</span>
                        </div>
                        
                        {loadingReviews ? (
                            <div className="text-center py-6"><div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div></div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-5 bg-background border border-dashed border-border rounded text-xs text-muted-foreground shadow-sm">
                                Be the first to add a comment!
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                                {reviews.map(r => (
                                    <div key={r.id} className="bg-background p-3 rounded-lg border border-border shadow-sm text-xs relative group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-foreground">{r.user_email.split('@')[0]}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-muted-foreground">{getRelativeTime(r.created_at)}</span>
                                                {user && r.user_email === user.email && (
                                                    <button onClick={() => handleDeleteReview(r.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Comment">
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed pr-5">{r.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handlePostReview} className="mt-auto relative">
                        <textarea 
                            value={newReview}
                            onChange={(e) => setNewReview(e.target.value)}
                            placeholder="Share your thoughts securely..." 
                            className="w-full text-xs box-border border border-input rounded-md p-3 pb-10 bg-background focus-visible:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none leading-relaxed shadow-sm disabled:opacity-50"
                            rows="2"
                        ></textarea>
                        <button 
                            type="submit" 
                            disabled={submittingReview || !newReview.trim()} 
                            className="absolute right-2 bottom-2 bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-secondary-foreground font-medium px-4 py-1.5 rounded-md text-xs transition border border-border"
                        >
                            {submittingReview ? '...' : 'Post'}
                        </button>
                    </form>

                </div>
            )}
        </div>
    );
};

export default ResourceCard;
