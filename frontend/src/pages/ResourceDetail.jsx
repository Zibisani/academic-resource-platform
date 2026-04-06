import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResourceDetail = () => {
    const { id } = useParams();
    const { api, user } = useAuth();
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState('');
    const [submitStatus, setSubmitStatus] = useState(null);

    useEffect(() => {
        const fetchResource = async () => {
            try {
                const response = await api.get(`resources/${id}/`);
                setResource(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch resource", error);
                setLoading(false);
            }
        };
        fetchResource();
    }, [id, api]);

    const handleRatingSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`resources/${id}/rate/`, { score: rating, review_text: review });
            setSubmitStatus({ type: 'success', message: 'Review submitted successfully!' });
            
            // Refresh resource
            const response = await api.get(`resources/${id}/`);
            setResource(response.data);
            setReview('');
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to submit review.';
            setSubmitStatus({ type: 'error', message: msg });
        }
    };

    const handleDownload = async () => {
        try {
            await api.post(`resources/${id}/download/`);
            if (resource.file) {
                 window.open(resource.file, '_blank');
            } else if (resource.video_link) {
                 window.open(resource.video_link, '_blank');
            }
        } catch (error) {
             console.error("Failed to register download", error);
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!resource) return <div className="min-h-screen flex items-center justify-center">Resource not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">
                    &larr; Back to Dashboard
                </Link>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{resource.title}</h1>
                                <p className="text-sm text-gray-500">
                                    Uploaded by <span className="font-medium text-gray-700">{resource.uploader_email}</span> on {new Date(resource.upload_date).toLocaleDateString()}
                                </p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200 uppercase tracking-wide">
                                {resource.resource_type}
                            </span>
                        </div>

                        <div className="prose max-w-none text-gray-700 mb-8 border-l-4 border-blue-200 pl-4 py-1">
                            {resource.description}
                        </div>

                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={handleDownload}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Access Resource
                            </button>
                            
                            <div className="text-sm text-gray-500 flex flex-col justify-center h-full">
                                <span className="font-semibold text-gray-900">Score: {resource.cached_score.toFixed(2)}</span>
                                <span>{resource.ratings?.length || 0} Ratings</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Reviews & Ratings</h2>
                    
                    {/* Submit Review */}
                    <form onSubmit={handleRatingSubmit} className="mb-10 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Leave a Review</h3>
                        {submitStatus && (
                            <div className={`mb-4 p-3 rounded text-sm ${submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {submitStatus.message}
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                            <select 
                                value={rating} 
                                onChange={(e) => setRating(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                            >
                                {[5,4,3,2,1].map(num => (
                                    <option key={num} value={num}>{num} Stars</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                            <textarea
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                rows="3"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                placeholder="What did you think of this resource?"
                            ></textarea>
                        </div>
                        <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            Submit Review
                        </button>
                    </form>

                    {/* Review List */}
                    <div className="space-y-6">
                        {resource.ratings && resource.ratings.length > 0 ? (
                            resource.ratings.map((rev) => (
                                <div key={rev.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                    <div className="flex items-center mb-2">
                                        <div className="text-yellow-400 font-bold mr-2 text-lg">
                                            {'★'.repeat(rev.score)}{'☆'.repeat(5-rev.score)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{rev.user_email}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            {new Date(rev.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md border border-gray-100">
                                        {rev.review_text || "No written review provided."}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-sm text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">
                                No reviews yet. Be the first to share your opinion!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceDetail;
