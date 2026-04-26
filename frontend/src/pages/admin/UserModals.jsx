import React, { useState, useEffect } from 'react';
import { X, Shield, Star, Clock } from 'lucide-react';

export const UserViewModal = ({ user, onClose, api }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchDetails = async () => {
            try {
                const res = await api.get(`admin/users/${user.id}/`);
                setDetails(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [user, api]);

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-bold">User Details</h2>
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><X size={18} /></button>
                </div>
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : details ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                                    {(details.first_name?.[0] || details.email[0]).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        {details.first_name} {details.last_name}
                                        {details.is_verified_contributor && <Shield className="w-4 h-4 text-blue-500" />}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{details.email}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1">Role</p>
                                    <p className="font-semibold capitalize text-sm">{details.role}</p>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                                    <p className={`font-semibold capitalize text-sm ${details.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>{details.status}</p>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1">Year of Study</p>
                                    <p className="font-semibold text-sm">{details.year_of_study || 'N/A'}</p>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1">Programme</p>
                                    <p className="font-semibold text-sm truncate" title={details.programme_name}>{details.programme_name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border">
                                <h4 className="font-semibold mb-3 flex items-center gap-2"><Star size={16}/> Platform Usage</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Uploads:</span>
                                    <span className="font-medium">{details.upload_count}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-2">
                                    <span className="text-muted-foreground">Average Rating of Uploads:</span>
                                    <span className="font-medium">{details.average_rating_of_uploads?.toFixed(1) || '0.0'}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-2">
                                    <span className="text-muted-foreground">Joined:</span>
                                    <span className="font-medium">{new Date(details.date_joined).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-red-500">Failed to load user data.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const UserCreateModal = ({ isOpen, onClose, api, onSuccess }) => {
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', password: '', role: 'student', status: 'active', year_of_study: ''
    });
    
    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.year_of_study) delete payload.year_of_study;
            if (!payload.programme) delete payload.programme;
            
            await api.post('admin/users/', payload);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to create user. Check constraints.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-xl">
            <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-bold">Create User</h2>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">First Name</label>
                            <input type="text" required className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none" onChange={e => setFormData({...formData, first_name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Last Name</label>
                            <input type="text" required className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none" onChange={e => setFormData({...formData, last_name: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Email</label>
                        <input type="email" required className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none" onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Password <span className="text-[10px] uppercase font-normal ml-1 tracking-wider text-muted-foreground/70">(Min 10 chars, strict)</span></label>
                        <input type="password" required className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none" onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Role</label>
                            <select className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none" onChange={e => setFormData({...formData, role: e.target.value})}>
                                <option value="student">Student</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Status</label>
                            <select className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none" onChange={e => setFormData({...formData, status: e.target.value})}>
                                <option value="active">Active</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 flex justify-end gap-3 border-t border-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90">Create User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
