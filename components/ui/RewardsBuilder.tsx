
import React from 'react';
import { RewardSet, PlayerResources, PlayerStats } from '../../types';
import { DollarSign, Star, Users, Award, Brain, Smile, Activity, Heart, Package, X, Lightbulb } from 'lucide-react';

interface Props {
    rewards: RewardSet;
    onChange: (rewards: RewardSet) => void;
    availableItems?: { id: string, name: string }[];
}

export const RewardsBuilder: React.FC<Props> = ({ rewards, onChange, availableItems = [] }) => {
    
    const handleChange = (key: keyof (PlayerResources & PlayerStats), value: string) => {
        const num = parseFloat(value) || 0;
        const newRewards = { ...rewards };
        if (num === 0) {
            delete (newRewards as any)[key];
        } else {
            (newRewards as any)[key] = num;
        }
        onChange(newRewards);
    };

    const handleAddItem = (itemId: string) => {
        if (!itemId) return;
        const currentItems = rewards.itemIds || [];
        if (!currentItems.includes(itemId)) {
            onChange({ ...rewards, itemIds: [...currentItems, itemId] });
        }
    };

    const handleRemoveItem = (itemId: string) => {
        const currentItems = rewards.itemIds || [];
        onChange({ ...rewards, itemIds: currentItems.filter(id => id !== itemId) });
    };

    const getValue = (key: keyof (PlayerResources & PlayerStats)) => (rewards as any)[key] || '';

    // Suggestions Logic
    const [suggInput, setSuggInput] = React.useState('');
    const handleAddSuggestion = () => {
        if (suggInput.trim()) {
            onChange({
                ...rewards,
                newSuggestions: [...(rewards.newSuggestions || []), suggInput.trim()]
            });
            setSuggInput('');
        }
    };
    const handleRemoveSuggestion = (idx: number) => {
        onChange({
            ...rewards,
            newSuggestions: (rewards.newSuggestions || []).filter((_, i) => i !== idx)
        });
    };

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Award size={14} /> Rewards Configuration
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
                {/* Resources */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Resources</label>
                    <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-green-400" />
                        <input placeholder="Money" type="number" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white" value={getValue('money')} onChange={e => handleChange('money', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Star size={14} className="text-yellow-400" />
                        <input placeholder="Fame" type="number" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white" value={getValue('fame')} onChange={e => handleChange('fame', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-blue-400" />
                        <input placeholder="Opinion" type="number" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white" value={getValue('publicOpinion')} onChange={e => handleChange('publicOpinion', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Award size={14} className="text-purple-400" />
                        <input placeholder="Mask (Repair/Dmg)" type="number" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white" value={getValue('mask')} onChange={e => handleChange('mask', e.target.value)} />
                    </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Attribute XP</label>
                    <div className="flex items-center gap-2">
                        <Brain size={14} className="text-blue-300" />
                        <input placeholder="Smarts" type="number" step="0.05" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white" value={getValue('smarts')} onChange={e => handleChange('smarts', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Smile size={14} className="text-pink-300" />
                        <input placeholder="Charm" type="number" step="0.05" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white" value={getValue('charm')} onChange={e => handleChange('charm', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-green-300" />
                        <input placeholder="Coordination" type="number" step="0.05" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white" value={getValue('coordination')} onChange={e => handleChange('coordination', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Heart size={14} className="text-red-300" />
                        <input placeholder="Will" type="number" step="0.05" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white" value={getValue('will')} onChange={e => handleChange('will', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="border-t border-slate-800 pt-4">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Item Rewards</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {rewards.itemIds?.map(id => {
                        const item = availableItems.find(i => i.id === id);
                        return (
                            <div key={id} className="bg-slate-950 border border-slate-700 rounded px-2 py-1 flex items-center gap-2 text-sm text-white">
                                <Package size={12} className="text-amber-500" />
                                <span>{item ? item.name : id}</span>
                                <button onClick={() => handleRemoveItem(id)} className="text-slate-500 hover:text-red-400">
                                    <X size={12} />
                                </button>
                            </div>
                        )
                    })}
                    {(!rewards.itemIds || rewards.itemIds.length === 0) && <span className="text-xs text-slate-600 italic">No items added.</span>}
                </div>
                
                <select 
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                    value=""
                    onChange={(e) => handleAddItem(e.target.value)}
                >
                    <option value="">+ Add Item Reward...</option>
                    {availableItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
            </div>

            {/* Suggestions */}
            <div className="border-t border-slate-800 pt-4">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    <Lightbulb size={12}/> Task Suggestions
                </label>
                <div className="space-y-2 mb-2">
                    {rewards.newSuggestions?.map((s, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-700 text-xs text-white">
                            <span>{s}</span>
                            <button onClick={() => handleRemoveSuggestion(idx)} className="text-slate-500 hover:text-red-400"><X size={12}/></button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                        placeholder="Add suggestion for future task..."
                        value={suggInput}
                        onChange={e => setSuggInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddSuggestion()}
                    />
                    <button onClick={handleAddSuggestion} className="bg-slate-800 hover:bg-slate-700 px-2 rounded text-slate-300">+</button>
                </div>
            </div>
        </div>
    );
};
