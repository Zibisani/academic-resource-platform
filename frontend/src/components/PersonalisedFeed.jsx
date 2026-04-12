import React, { useState, useEffect } from 'react';
import ResourceCard from './ResourceCard';
import { ArrowUpRight, Clock, Star, Sparkles, Medal } from 'lucide-react';

const FeedSection = ({ title, icon, resources, colorClass }) => {
    return (
        <section className="mb-10 last:mb-0">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center tracking-tight">
                    <span className={`p-1.5 rounded-md mr-2.5 shadow-sm border border-border bg-background ${colorClass}`}>
                        {icon}
                    </span>
                    {title}
                </h2>
                <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4">
                    View All
                </button>
            </div>
            
            {(!resources || resources.length === 0) ? (
                <div className="bg-card text-card-foreground border border-dashed border-border rounded-xl p-8 text-center shadow-sm">
                    <p className="text-sm text-muted-foreground">No resources available in this section yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    {resources.map(res => (
                        <div key={res.id} className="h-full">
                            <ResourceCard resource={res} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

const PersonalisedFeed = ({ api, user, searchParams, clearSearch }) => {
    const [feeds, setFeeds] = useState({
        trending: [],
        topRated: [],
        recent: [],
        recommended: [],
        staffPicks: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchFeeds = async () => {
            try {
                const [trending, topRated, recent, recommended, staffPicks] = await Promise.all([
                    api.get('resources/trending/').catch(() => ({data: []})),
                    api.get('resources/top_rated/').catch(() => ({data: []})),
                    api.get('resources/recent/').catch(() => ({data: []})),
                    api.get('resources/recommended/').catch(() => ({data: []})),
                    api.get('resources/staff_picks/').catch(() => ({data: []}))
                ]);
                
                if (isMounted) {
                    setFeeds({
                        trending: trending.data.results || trending.data || [],
                        topRated: topRated.data.results || topRated.data || [],
                        recent: recent.data.results || recent.data || [],
                        recommended: recommended.data.results || recommended.data || [],
                        staffPicks: staffPicks.data.results || staffPicks.data || []
                    });
                    setLoading(false);
                }
            } catch (err) {
                console.error("Feed error", err);
                if (isMounted) setLoading(false);
            }
        };
        fetchFeeds();
        return () => { isMounted = false; };
    }, [api]);

    const [searchResults, setSearchResults] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (!searchParams) {
            setSearchResults(null);
            return;
        }
        
        let isActive = true;
        setSearchLoading(true);

        const params = new URLSearchParams();
        if (searchParams.query) params.append('search', searchParams.query);
        if (searchParams.courseId) params.append('course_id', searchParams.courseId);

        api.get(`resources/?${params.toString()}`)
            .then(res => {
                if (isActive) {
                    setSearchResults(res.data.results || res.data || []);
                    setSearchLoading(false);
                }
            })
            .catch(err => {
                console.error("Search failed", err);
                if (isActive) setSearchLoading(false);
            });

        return () => { isActive = false; };
    }, [searchParams, api]);

    if (loading) {
        return (
            <div className="space-y-10">
                {[1, 2].map(section => (
                    <div key={section}>
                        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[1, 2, 3].map(card => (
                                <div key={card} className="h-40 bg-muted/50 rounded-xl border border-border shadow-sm animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (searchParams) {
        return (
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between mb-2">
                    <h2 className="text-xl font-bold">
                        Results for: <span className="text-primary italic font-normal">{searchParams.query ? `"${searchParams.query}"` : searchParams.courseName}</span>
                    </h2>
                    <button onClick={clearSearch} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border border-border shadow-sm rounded-md hover:bg-muted/50 transition">
                        Clear Search
                    </button>
                </div>
                
                {searchLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {[1, 2, 3].map(card => (
                            <div key={card} className="h-40 bg-muted/50 rounded-xl border border-border shadow-sm animate-pulse"></div>
                        ))}
                    </div>
                ) : searchResults && searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {searchResults.map(res => (
                            <div key={res.id} className="h-full">
                                <ResourceCard resource={res} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-border shadow-sm rounded-xl p-12 text-center">
                        <p className="text-muted-foreground">No resources matched your search criteria.</p>
                        <button onClick={clearSearch} className="mt-4 text-primary text-sm hover:underline font-medium">Return to Dashboard Feed</button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2 pb-8">
            <FeedSection 
                title="Staff Picks" 
                icon={<Medal className="w-4 h-4 text-primary" />} 
                resources={feeds.staffPicks} 
                colorClass="ring-1 ring-primary/20"
            />
            <FeedSection 
                title="Trending in your Courses" 
                icon={<ArrowUpRight className="w-4 h-4 text-warning" />} 
                resources={feeds.trending} 
                colorClass="ring-1 ring-warning/20"
            />
            <FeedSection 
                title="Recommended for You" 
                icon={<Sparkles className="w-4 h-4 text-success" />} 
                resources={feeds.recommended} 
                colorClass="ring-1 ring-success/20"
            />
            <FeedSection 
                title="Top Rated Materials" 
                icon={<Star className="w-4 h-4 text-warning fill-warning/20" />} 
                resources={feeds.topRated} 
                colorClass=""
            />
            <FeedSection 
                title="Recently Added" 
                icon={<Clock className="w-4 h-4 text-destructive" />} 
                resources={feeds.recent} 
                colorClass="ring-1 ring-destructive/20"
            />
        </div>
    );
};

export default PersonalisedFeed;
