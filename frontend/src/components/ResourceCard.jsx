import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const typeColors = {
    'past_exam': 'bg-red-100 text-red-800',
    'notes': 'bg-blue-100 text-blue-800',
    'video': 'bg-purple-100 text-purple-800',
    'image': 'bg-green-100 text-green-800',
    'textbook': 'bg-yellow-100 text-yellow-800'
};

const ResourceCard = ({ resource, personalContext = null }) => {
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

    // Retrieve reviews exclusively when accordion expands
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
            if (userRating === 0) setRatingCount(prev => prev + 1);
            setUserRating(value);
            // Simulate approximate UI growth, actual average is computed backend
            setAvgRating(prev => prev === 0 ? value : (prev * ratingCount + value) / (ratingCount + 1));
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

    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const days = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={`block bg-white border ${isDownloaded ? 'border-gray-200 bg-gray-50' : 'border-gray-100 shadow-sm'} ${isExpanded ? 'shadow-md border-blue-300 ring-2 ring-blue-50' : 'hover:shadow-md hover:border-gray-300'} rounded-lg transition-all duration-300 relative overflow-hidden flex flex-col`}>
            
            {/* Clickable Header Area triggering Expansion */}
            <div className="p-5 cursor-pointer pb-4 transition-colors hover:bg-gray-50/50" onClick={() => setIsExpanded(!isExpanded)}>
                {isDownloaded && <span className="absolute top-2 right-2 text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Downloaded</span>}
                
                <div className="flex justify-between items-start mb-2 pt-1">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide ${typeColors[resource.resource_type] || 'bg-gray-100 text-gray-800'}`}>
                        {resource.resource_type.replace('_', ' ')}
                    </span>
                    
                    <div className="flex space-x-3 text-sm text-gray-500 pr-1">
                        <span className="flex items-center" title="Downloads">
                            <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                            {resource.download_count}
                        </span>
                        
                        <span className="flex items-center" title="Comments">
                            <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path></svg>
                            {resource.reviews_count || 0}
                        </span>

                        {(ratingCount > 0 || userRating > 0) && (
                            <span className="flex items-center text-yellow-600 font-medium" title={`${ratingCount} ratings`}>
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                {avgRating.toFixed(1)} <span className="text-gray-400 font-normal ml-0.5 text-[10px]">({ratingCount})</span>
                            </span>
                        )}
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 leading-tight pr-4">
                    {resource.title}
                </h3>

                <p className="text-sm text-blue-700 font-medium mb-3">
                    [{resource.course_code}] {resource.course_name}
                </p>

                <div className="flex items-center text-[11px] text-gray-500 mb-3 pt-3 border-t border-gray-50">
                    <span className="flex-1 truncate">
                        By <strong>{resource.uploader_name}</strong>
                        {resource.is_verified_contributor && (
                            <svg className="inline w-3 h-3 ml-1 text-blue-500 mb-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        )}
                    </span>
                    <span className="ml-2 whitespace-nowrap">{getRelativeTime(resource.upload_date)}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                    {resource.tags && resource.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded transition">
                            #{tag}
                        </span>
                    ))}
                    {resource.tags && resource.tags.length > 3 && (
                        <span className="inline-block text-gray-400 text-[10px] px-1 py-0.5">+{resource.tags.length - 3}</span>
                    )}
                </div>

                {personalContext && (
                    <div className="mt-3 text-[11px] text-blue-600 bg-blue-50 px-2 py-1.5 rounded flex items-center shadow-sm border border-blue-100">
                        <svg className="w-3.5 h-3.5 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {personalContext}
                    </div>
                )}
            </div>

            {/* EXPANDED INTERACTIVE LAYER */}
            {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 flex-1 flex flex-col p-5 shadow-inner">
                    
                    {/* Rate Resource */}
                    <div className="mb-6 flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-0.5">Your Rating</div>
                            <div className="flex space-x-0.5" onMouseLeave={() => setHoverStar(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        disabled={isRating}
                                        onClick={() => handleRate(star)}
                                        onMouseEnter={() => setHoverStar(star)}
                                        className={`transition cursor-pointer focus:outline-none rounded-full p-1 ${isRating ? 'opacity-50' : 'hover:scale-110 hover:bg-yellow-50'}`}
                                    >
                                        <svg className={`w-5 h-5 ${(hoverStar || userRating) >= star ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="text-right pr-1">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Avg Score</div>
                            <div className="text-2xl font-black text-gray-800 leading-none">{avgRating.toFixed(1)}<span className="text-xs font-medium text-gray-400 ml-0.5">/5</span></div>
                        </div>
                    </div>

                    {/* Download Button Full Width Link if we want to add it natively here */}
                    <div className="mb-6">
                        <Link to={`/resources/${resource.id}`} className="w-full flex justify-center items-center bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 rounded-md text-sm transition shadow-sm">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            View Source Document
                        </Link>
                    </div>

                    {/* Comments Thread */}
                    <div className="flex-1 overflow-visible mb-5">
                        <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center border-b border-gray-200 pb-1.5">
                            Reviews & Comments <span className="ml-1.5 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-[9px]">{reviews.length + (resource.reviews_count - reviews.length > 0 ? (resource.reviews_count - reviews.length) : 0)}</span>
                        </div>
                        
                        {loadingReviews ? (
                            <div className="text-center py-6"><div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div></div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-5 bg-white border border-dashed border-gray-300 rounded text-xs text-gray-400 shadow-sm">
                                Be the first to add a comment!
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                                {reviews.map(r => (
                                    <div key={r.id} className="bg-white p-3 rounded border border-gray-100/50 shadow-sm text-xs relative group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-800">{r.user_email.split('@')[0]}</span>
                                            <span className="text-[9px] text-gray-400">{getRelativeTime(r.created_at)}</span>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed max-w-[95%]">{r.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Post Comment Input */}
                    <form onSubmit={handlePostReview} className="mt-auto relative">
                        <textarea 
                            value={newReview}
                            onChange={(e) => setNewReview(e.target.value)}
                            placeholder="Share your thoughts securely..." 
                            className="w-full text-xs box-border border border-gray-300 rounded-lg p-3 pb-10 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors focus:outline-none resize-none leading-relaxed shadow-inner"
                            rows="2"
                        ></textarea>
                        <button 
                            type="submit" 
                            disabled={submittingReview || !newReview.trim()} 
                            className="absolute right-2 bottom-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-4 py-1.5 rounded-md text-xs transition shadow-sm"
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
