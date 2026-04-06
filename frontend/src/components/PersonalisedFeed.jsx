import React, { useState, useEffect } from 'react';
import ResourceCard from './ResourceCard';

const FeedSection = ({ title, endpoint, api, description, emptyStateComponent = null }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        api.get(`resources/${endpoint}/`)
            .then(res => {
                if (isMounted) {
                    setResources(res.data.results || res.data || []);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(`Failed to load ${endpoint}`, err);
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false; };
    }, [api, endpoint]);

    if (loading) return (
        <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
            <div className="flex space-x-4 overflow-hidden py-2">
                {[1,2,3].map(i => (
                    <div key={i} className="min-w-[280px] h-48 bg-gray-100 animate-pulse rounded-lg flex-shrink-0"></div>
                ))}
            </div>
        </div>
    );

    if (resources.length === 0 && emptyStateComponent) {
        return emptyStateComponent;
    }

    if (resources.length === 0) {
        return (
            <div className="mb-12">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
                    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                </div>
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500 text-sm">
                    No resources currently available to populate this feed. Check back later or upload something!
                </div>
            </div>
        );
    }

    return (
        <div className="mb-12">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
                    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                </div>
                {resources.length >= 8 && <button className="text-sm text-blue-600 font-medium hover:text-blue-800">See more</button>}
            </div>
            
            {/* Horizontal scroll container for the cards */}
            <div className="flex overflow-x-auto pb-6 -mx-4 px-4 snap-x space-x-5" style={{ scrollbarWidth: 'none' }}>
                {resources.map(res => (
                    <div key={res.id} className="min-w-[300px] max-w-[300px] snap-start flex-shrink-0 flex">
                        <div className="w-full">
                            <ResourceCard 
                                resource={res} 
                                personalContext={endpoint === 'recommended' ? `Based on your activity in [${res.course_code}]` : null} 
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PersonalisedFeed = ({ api, user }) => {
    return (
        <div className="py-6 px-4 md:px-8 max-w-5xl mx-auto w-full h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">My Feed</h1>
            <p className="text-gray-500 mb-10 text-lg">Personalized to {user?.faculty ? 'your enrolled courses' : 'the system'}.</p>

            <FeedSection 
                title="Trending in Your Courses" 
                endpoint="trending" 
                api={api} 
                description="The most engaged resources over the past 7 days."
            />
            
            <FeedSection 
                title="Recommended for You" 
                endpoint="recommended" 
                api={api} 
                description="Tailored specifically to your behavioral activity."
            />

            <FeedSection 
                title="Top Rated in Your Courses" 
                endpoint="top_rated" 
                api={api} 
                description="The highest quality trusted resources based on aggregate peer reviews."
            />

            <FeedSection 
                title="New in Your Courses" 
                endpoint="recent" 
                api={api} 
                description="Recently uploaded and fresh materials."
            />

            <FeedSection 
                title="Staff Picks (Verified)" 
                endpoint="staff_picks" 
                api={api} 
                description="Quality uploads directly from officially verified contributors."
            />
        </div>
    );
};

export default PersonalisedFeed;
