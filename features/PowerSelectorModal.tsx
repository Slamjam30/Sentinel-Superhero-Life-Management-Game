
import React, { useState } from 'react';
import { Power } from '../types';
import { Button } from '../components/ui/Button';
import { Zap, X, Search } from 'lucide-react';

interface PowerSelectorModalProps {
    availablePowers: Power[];
    onSelect: (power: Power) => void;
    onClose: () => void;
}

export const PowerSelectorModal: React.FC<PowerSelectorModalProps> = ({ availablePowers, onSelect, onClose }) => {
    const [search, setSearch] = useState('');

    const filtered = availablePowers.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] animate-in zoom-in-95">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-xl">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Zap className="text-amber-500" size={20} /> Select Power
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-800 bg-slate-900">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            placeholder="Search power templates..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
                    {filtered.map(power => (
                        <div key={power.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-amber-500/50 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-white text-base">{power.name}</h4>
                                    <span className="text-[10px] uppercase font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                        {power.tier || 'STREET'}
                                    </span>
                                </div>
                                <Button size="sm" onClick={() => onSelect(power)}>Select</Button>
                            </div>
                            <p className="text-xs text-slate-400 mb-2 line-clamp-2">{power.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {power.abilities.map(ab => (
                                    <span key={ab} className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-500 border border-slate-800">
                                        {ab}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center text-slate-500 italic py-8">
                            No powers found matching "{search}".
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
