import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Info } from 'lucide-react';

const AdminWeights = () => {
    const { api } = useAuth();
    const [weights, setWeights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingState, setEditingState] = useState({});

    const fetchWeights = async () => {
        setLoading(true);
        try {
            const res = await api.get('admin/weights/');
            setWeights(res.data.results || res.data);
            
            // Initialize edit state
            const editObj = {};
            (res.data.results || res.data).forEach(w => {
                editObj[w.id] = { value: w.value, saving: false, success: false };
            });
            setEditingState(editObj);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeights();
    }, [api]);

    const handleValueChange = (id, val) => {
        setEditingState(prev => ({
            ...prev,
            [id]: { ...prev[id], value: val, success: false }
        }));
    };

    const handleSave = async (id) => {
        const payloadValue = editingState[id].value;
        if (isNaN(payloadValue)) return alert("Invalid number");

        setEditingState(prev => ({ ...prev, [id]: { ...prev[id], saving: true, success: false } }));
        
        try {
            await api.patch(`admin/weights/${id}/`, { value: parseFloat(payloadValue) });
            setEditingState(prev => ({ ...prev, [id]: { ...prev[id], saving: false, success: true } }));
            
            // Re-fetch to get updated block context (timestamp, updated_by)
            fetchWeights();
            
            setTimeout(() => {
                setEditingState(prev => ({ ...prev, [id]: { ...prev[id], success: false } }));
            }, 3000);
        } catch (err) {
            alert('Failed to save weight');
            setEditingState(prev => ({ ...prev, [id]: { ...prev[id], saving: false } }));
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ranking Weights</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure the algorithm multipliers for the feed and trending pages.</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 dark:bg-indigo-900/20 dark:border-indigo-800">
                <div className="flex gap-4">
                    <div className="shrink-0">
                        <Info className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-indigo-800 dark:text-indigo-300 font-semibold mb-1">Ranking Formula Reference</h3>
                        <p className="text-sm text-indigo-700 dark:text-indigo-400/80 font-mono bg-white/50 dark:bg-black/20 p-3 rounded mt-2 border border-indigo-200/50 dark:border-indigo-800/50">
                            Score = (AVG_RATING * RATING_COUNT * <b>rating_weight</b>)<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (DOWNLOADS * <b>download_weight</b>)<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (VIEWS * <b>view_weight</b>)<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (IS_STAFF_PICK ? <b>staff_pick_bonus</b> : 0)<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (UPLOADER_VERIFIED ? <b>verified_contributor_bonus</b> : 0)
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Weight Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Multiplier Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Last Updated</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center p-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div></td></tr>
                        ) : weights.length === 0 ? (
                            <tr><td colSpan="4" className="text-center p-8 text-slate-500">No weights configured in DB.</td></tr>
                        ) : (
                            weights.map(weight => {
                                const editState = editingState[weight.id] || {};
                                const isDirty = parseFloat(editState.value) !== weight.value;

                                return (
                                    <tr key={weight.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                {weight.weight_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input 
                                                type="number"
                                                step="0.01"
                                                value={editState.value ?? ''}
                                                onChange={(e) => handleValueChange(weight.id, e.target.value)}
                                                className="w-32 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell text-sm text-slate-500 dark:text-slate-400">
                                            {weight.updated_at ? new Date(weight.updated_at).toLocaleString() : 'Never'}
                                            <span className="block text-xs mt-0.5">{weight.updated_by_name ? `by ${weight.updated_by_name}` : ''}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center gap-2">
                                                {editState.success && <span className="text-xs text-emerald-600 dark:text-emerald-400 mr-2">Saved!</span>}
                                                <button
                                                    onClick={() => handleSave(weight.id)}
                                                    disabled={!isDirty || editState.saving}
                                                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                                                        !isDirty 
                                                        ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' 
                                                        : editState.saving
                                                        ? 'bg-indigo-300 text-white border-indigo-300 cursor-wait'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'
                                                    }`}
                                                >
                                                    {editState.saving ? 'Saving...' : <><Save size={16} className="mr-1.5" /> Save</>}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminWeights;
